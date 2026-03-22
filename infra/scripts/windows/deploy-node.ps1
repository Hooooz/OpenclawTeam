param(
  [string]$InstallDir = "C:\OpenclawTeam"
)

$ErrorActionPreference = "Stop"

Set-Location $InstallDir

$runtimeDir = Join-Path $InstallDir ".runtime"
$logDir = Join-Path $InstallDir "logs"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Stop-ManagedProcess {
  param([string]$PidFile)

  if (Test-Path $PidFile) {
    $pidValue = Get-Content $PidFile | Select-Object -First 1
    if ($pidValue) {
      try {
        Stop-Process -Id ([int]$pidValue) -Force -ErrorAction Stop
      } catch {
      }
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  }
}

Stop-ManagedProcess (Join-Path $runtimeDir "control-api.pid")
Stop-ManagedProcess (Join-Path $runtimeDir "admin-web.pid")

npm install
npm run build

$apiCommand = "Set-Location '$InstallDir'; `$env:PORT='3001'; node apps/control-api/dist/index.js *> '$logDir\control-api.log'"
$apiProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", "-Command", $apiCommand -PassThru -WindowStyle Hidden
$apiProcess.Id | Set-Content (Join-Path $runtimeDir "control-api.pid")

$webCommand = "Set-Location '$InstallDir'; npm run preview --workspace @openclaw/admin-web *> '$logDir\admin-web.log'"
$webProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", "-Command", $webCommand -PassThru -WindowStyle Hidden
$webProcess.Id | Set-Content (Join-Path $runtimeDir "admin-web.pid")

Start-Sleep -Seconds 8

Write-Output "Control API PID: $($apiProcess.Id)"
Write-Output "Admin Web PID: $($webProcess.Id)"

try {
  $apiHealth = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3001/health" -TimeoutSec 5
  Write-Output "API health: $($apiHealth.StatusCode)"
} catch {
  Write-Warning "API health check failed. Review logs\control-api.log"
}

try {
  $webHealth = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000" -TimeoutSec 5
  Write-Output "Web health: $($webHealth.StatusCode)"
} catch {
  Write-Warning "Web health check failed. Review logs\admin-web.log"
}
