param(
  [string]$InstallDir = "C:\OpenclawTeam"
)

$ErrorActionPreference = "Stop"

$defaultNpmCmd = "C:\Program Files\nodejs\npm.cmd"
$npmCmd = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) {
  (Get-Command npm.cmd).Source
} else {
  $defaultNpmCmd
}

$logDir = Join-Path $InstallDir "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Set-Location $InstallDir

& $npmCmd "run" "preview" "--workspace" "@openclaw/admin-web" *> (Join-Path $logDir "admin-web.log")
