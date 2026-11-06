# Publishes Nihongo Dojo to GitHub Pages (first run) or uploads the latest changes (later runs).
# Run by double-clicking publish-to-github.bat
$repo = 'nihongo-dojo'
Set-Location -LiteralPath $PSScriptRoot
Start-Transcript -Path (Join-Path $PSScriptRoot 'publish-log.txt') -Force | Out-Null

function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}
function Need($cmd, $wingetId, $label) {
  if (Get-Command $cmd -ErrorAction SilentlyContinue) { return $true }
  Write-Host "$label is not installed on this computer." -ForegroundColor Yellow
  $a = Read-Host "Install $label now with winget? (Y/N)"
  if ($a -notmatch '^[Yy]') { Write-Host "Cannot continue without $label."; return $false }
  winget install --id $wingetId -e --source winget
  Refresh-Path
  if (Get-Command $cmd -ErrorAction SilentlyContinue) { return $true }
  Write-Host "$label was installed, but this window can't see it yet. Close this window and double-click the file again." -ForegroundColor Yellow
  return $false
}
function Done($code) { Stop-Transcript | Out-Null; Read-Host 'Press Enter to close'; exit $code }

Write-Host '== 1/5  Checking tools ==' -ForegroundColor Cyan
if (-not (Need 'git' 'Git.Git' 'Git')) { Done 1 }
if (-not (Need 'gh' 'GitHub.cli' 'GitHub CLI')) { Done 1 }
git --version | Out-Host; gh --version | Select-Object -First 1 | Out-Host

Write-Host '== 2/5  Signing in to GitHub ==' -ForegroundColor Cyan
gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'A browser window will open. Enter the one-time code shown below at https://github.com/login/device and approve (Claude can do this for you).' -ForegroundColor Yellow
  '' | gh auth login --hostname github.com --git-protocol https --web
  if ($LASTEXITCODE -ne 0) { Write-Host 'Sign-in failed.' -ForegroundColor Red; Done 1 }
}
gh auth setup-git | Out-Null
$owner = gh api user --jq .login
$uid = gh api user --jq .id
Write-Host "Signed in as $owner"

Write-Host '== 3/5  Preparing the files ==' -ForegroundColor Cyan
if (-not (Test-Path '.git')) { git init -b main | Out-Null }
if (-not (git config user.name)) { git config user.name $owner }
if (-not (git config user.email)) { git config user.email "$uid+$owner@users.noreply.github.com" }
git add -A
git commit -m "Update Nihongo Dojo ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))" | Out-Null
git log --oneline -1 | Out-Host

Write-Host '== 4/5  Uploading to GitHub ==' -ForegroundColor Cyan
gh repo view "$owner/$repo" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  gh repo create $repo --public --description 'Nihongo Dojo - interactive Japanese learning site (Hebrew UI)' --source . --remote origin --push 2>&1 | Out-Host
} else {
  if (-not (git remote 2>$null | Select-String -SimpleMatch 'origin')) { git remote add origin "https://github.com/$owner/$repo.git" }
  git push -u origin main 2>&1 | Out-Host
}
if ($LASTEXITCODE -ne 0) { Write-Host 'Upload failed.' -ForegroundColor Red; Done 1 }

Write-Host '== 5/5  Turning on GitHub Pages ==' -ForegroundColor Cyan
gh api "repos/$owner/$repo/pages" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  gh api -X POST "repos/$owner/$repo/pages" -f 'source[branch]=main' -f 'source[path]=/' 2>&1 | Out-Host
}
$url = "https://$owner.github.io/$repo/"
Write-Host 'Waiting for the site to be built (up to 3 minutes)...'
for ($i = 0; $i -lt 36; $i++) {
  Start-Sleep -Seconds 5
  $st = gh api "repos/$owner/$repo/pages" --jq .status 2>$null
  if ($st -eq 'built') { break }
}
Write-Host ''
Write-Host "DONE. Your site: $url" -ForegroundColor Green
Write-Host '(If the page is not ready yet, wait a minute and refresh.)'
Start-Process $url
Done 0
