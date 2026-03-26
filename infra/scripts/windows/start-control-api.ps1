param(
  [string]$InstallDir = "C:\OpenclawTeam",
  [string]$OpenClawHome = "C:\Users\Administrator\.openclaw"
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
$env:PORT = "3201"
$env:OPENCLAW_HOME = $OpenClawHome
$env:CONTROL_CENTER_SOURCE_MODE = "collector"

& $nodeExe "apps/control-api/dist/index.js" *> (Join-Path $logDir "control-api.log")
