param(
  [string]$InstallDir = "C:\OpenclawTeam"
)

$ErrorActionPreference = "Stop"

$defaultNodeExe = "C:\Program Files\nodejs\node.exe"
$nodeExe = if (Get-Command node -ErrorAction SilentlyContinue) {
  (Get-Command node).Source
} else {
  $defaultNodeExe
}

$logDir = Join-Path $InstallDir "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Set-Location $InstallDir
$env:PORT = "3001"

& $nodeExe "apps/control-api/dist/index.js" *> (Join-Path $logDir "control-api.log")
