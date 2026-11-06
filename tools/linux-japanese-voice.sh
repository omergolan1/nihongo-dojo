#!/usr/bin/env bash
# ------------------------------------------------------------------
#  Nihongo Dojo – Japanese voice for Firefox on Linux (MX / Debian / Ubuntu)
#
#  Firefox on Linux speaks through "speech-dispatcher", which by default
#  uses eSpeak. eSpeak can't read kana – it just says "Japanese letter".
#  This script installs the Open JTalk Japanese voice and makes it the
#  speech-dispatcher voice for your user, so the app speaks real Japanese.
#
#  Run:     bash tools/linux-japanese-voice.sh
#  Undo:    bash tools/linux-japanese-voice.sh --undo
# ------------------------------------------------------------------
set -e

CONF_DIR="$HOME/.config/speech-dispatcher"
MOD_CONF="$CONF_DIR/modules/openjtalk-generic.conf"
MAIN_CONF="$CONF_DIR/speechd.conf"
MARK="# >>> nihongo-dojo japanese voice >>>"

restart_speechd() {
  # speech-dispatcher is started on demand by Firefox; stop it so the new settings load
  for p in $(pidof speech-dispatcher sd_generic sd_espeak-ng sd_espeak 2>/dev/null); do
    [ "$(stat -c %U /proc/$p 2>/dev/null)" = "$USER" ] && kill "$p" 2>/dev/null || true
  done
  sleep 1
}

if [ "$1" = "--undo" ]; then
  rm -f "$MOD_CONF"
  if [ -f "$MAIN_CONF.before-nihongo" ]; then mv -f "$MAIN_CONF.before-nihongo" "$MAIN_CONF"
  elif grep -q "$MARK" "$MAIN_CONF" 2>/dev/null; then rm -f "$MAIN_CONF"; fi
  restart_speechd
  echo "✔ Removed. Close Firefox completely and open it again."
  exit 0
fi

if [ "$(id -u)" = "0" ]; then
  echo "Run this as your normal user (not with sudo) – it will ask for the password when needed."
  exit 1
fi

echo "== 1/4  Installing packages (password may be requested) =="
sudo apt-get update
sudo apt-get install -y speech-dispatcher open-jtalk open-jtalk-mecab-naist-jdic \
  hts-voice-nitech-jp-atr503-m001 pulseaudio-utils

echo "== 2/4  Locating dictionary and voice =="
DIC=""
for d in /var/lib/mecab/dic/open-jtalk/naist-jdic /usr/share/open_jtalk/dic /usr/local/share/open_jtalk/dic; do
  [ -f "$d/sys.dic" ] && DIC="$d" && break
done
[ -z "$DIC" ] && DIC="$(dirname "$(dpkg -L open-jtalk-mecab-naist-jdic 2>/dev/null | grep '/sys.dic$' | head -1)")"
VOICE="$(ls /usr/share/hts-voice/nitech-jp-atr503-m001/*.htsvoice 2>/dev/null | head -1)"
[ -z "$VOICE" ] && VOICE="$(dpkg -L hts-voice-nitech-jp-atr503-m001 2>/dev/null | grep '\.htsvoice$' | head -1)"
if [ ! -f "$DIC/sys.dic" ] || [ ! -f "$VOICE" ]; then
  echo "✘ Could not find the Open JTalk dictionary or voice file."; exit 1
fi
echo "   dictionary: $DIC"
echo "   voice:      $VOICE"

echo "== 3/4  Configuring speech-dispatcher for user $USER =="
mkdir -p "$CONF_DIR/modules"
WAV="\${XDG_RUNTIME_DIR:-/tmp}/sd-openjtalk-\$\$.wav"
cat > "$MOD_CONF" <<EOF
# Japanese voice (Open JTalk) for Speech Dispatcher via the generic module.
# Created by Nihongo Dojo – tools/linux-japanese-voice.sh
GenericExecuteSynth \\
"f=$WAV; printf %s \\'\$DATA\\' | open_jtalk -x $DIC -m $VOICE -r \$RATE -ow \$f && \$PLAY_COMMAND \$f; rm -f \$f"
GenericCmdDependency "open_jtalk"
GenericLanguage "ja" "ja" "utf-8"
GenericLanguage "en" "en" "utf-8"
GenericRateAdd 1
GenericRateMultiply 0.006
GenericRateForceInteger 0
AddVoice "ja" "MALE1" "Japanese (Open JTalk)"
DefaultVoice "Japanese (Open JTalk)"
EOF

if [ -f "$MAIN_CONF" ] && ! grep -q "$MARK" "$MAIN_CONF"; then
  cp -f "$MAIN_CONF" "$MAIN_CONF.before-nihongo"
  BASE="$MAIN_CONF.before-nihongo"
elif [ -f "$MAIN_CONF.before-nihongo" ]; then
  BASE="$MAIN_CONF.before-nihongo"
else
  BASE=/etc/speech-dispatcher/speechd.conf
fi
{
  # keep the system settings, but drop lines we redefine
  grep -vE '^[[:space:]]*(AddModule|DefaultModule|LanguageDefaultModule|DefaultLanguage)[[:space:]]' "$BASE" 2>/dev/null || true
  echo ""
  echo "$MARK"
  echo 'AddModule "openjtalk-generic" "sd_generic" "openjtalk-generic.conf"'
  echo 'AddModule "espeak-ng" "sd_espeak-ng" "espeak-ng.conf"'
  echo 'DefaultModule openjtalk-generic'
  echo 'LanguageDefaultModule "ja" "openjtalk-generic"'
  echo 'DefaultLanguage "ja"'
  echo "# <<< nihongo-dojo japanese voice <<<"
} > "$MAIN_CONF.tmp"
mv -f "$MAIN_CONF.tmp" "$MAIN_CONF"
restart_speechd

echo "== 4/4  Test – you should hear こんにちは =="
spd-say -w -l ja "こんにちは、日本語の勉強をしましょう" || true

echo ""
echo "✔ Done. Close Firefox COMPLETELY (all windows) and open it again."
echo "  In the app: Progress & Settings → Japanese voice → \"Japanese (Open JTalk)\" (or Auto)."
echo "  To undo:  bash tools/linux-japanese-voice.sh --undo"
