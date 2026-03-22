param(
  [string]$InstallDir = "C:\OpenclawTeam"
)

$ErrorActionPreference = "Stop"

Set-Location $InstallDir

$runtimeDir = Join-Path $InstallDir ".runtime"
$logDir = Join-Path $InstallDir "logs"
$apiTaskName = "OpenclawControlApi"
$webTaskName = "OpenclawAdminWeb"
$scheduleSweepTaskName = "OpenclawScheduleSweep"
$windowsScriptDir = Join-Path $InstallDir "infra\scripts\windows"

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

function Stop-PortProcess {
  param([int]$Port)

  $lines = netstat -ano | Select-String ":$Port"
  foreach ($line in $lines) {
    $parts = ($line.ToString() -split "\s+") | Where-Object { $_ }
    $pidValue = $parts[-1]
    if ($pidValue -match "^\d+$") {
      try {
        Stop-Process -Id ([int]$pidValue) -Force -ErrorAction Stop
      } catch {
      }
    }
  }
}

function Invoke-ScheduledTaskCommand {
  param([string[]]$Arguments)

  & schtasks.exe @Arguments | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "schtasks failed: $($Arguments -join ' ')"
  }
}

function Remove-ManagedTask {
  param([string]$TaskName)

  & schtasks.exe /End /TN $TaskName | Out-Null
  & schtasks.exe /Delete /TN $TaskName /F | Out-Null
}

function Register-ManagedTask {
  param(
    [string]$TaskName,
    [string]$TaskCommand,
    [string]$Schedule = "ONSTART",
    [string]$Modifier
  )

  Remove-ManagedTask $TaskName
  $arguments = @(
    "/Create",
    "/TN",
    $TaskName,
    "/SC",
    $Schedule,
    "/RU",
    "SYSTEM",
    "/RL",
    "HIGHEST",
    "/TR",
    $TaskCommand,
    "/F"
  )

  if ($Modifier) {
    $arguments += @("/MO", $Modifier)
  }

  Invoke-ScheduledTaskCommand $arguments

  if ($Schedule -eq "ONSTART") {
    Invoke-ScheduledTaskCommand @("/Run", "/TN", $TaskName)
  }
}

Stop-ManagedProcess (Join-Path $runtimeDir "control-api.pid")
Stop-ManagedProcess (Join-Path $runtimeDir "admin-web.pid")
Stop-PortProcess 3001
Stop-PortProcess 3000

npm install
npm run build

$apiLaunchScript = Join-Path $windowsScriptDir "start-control-api.ps1"
$webLaunchScript = Join-Path $windowsScriptDir "start-admin-web.ps1"
$scheduleSweepScript = Join-Path $windowsScriptDir "start-schedule-sweep.ps1"

$apiTaskCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""$apiLaunchScript"""
$webTaskCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""$webLaunchScript"""
$scheduleSweepCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""$scheduleSweepScript"""

Register-ManagedTask -TaskName $apiTaskName -TaskCommand $apiTaskCommand
Register-ManagedTask -TaskName $webTaskName -TaskCommand $webTaskCommand
Register-ManagedTask -TaskName $scheduleSweepTaskName -TaskCommand $scheduleSweepCommand -Schedule "MINUTE" -Modifier "5"

$apiTaskName | Set-Content (Join-Path $runtimeDir "control-api.task")
$webTaskName | Set-Content (Join-Path $runtimeDir "admin-web.task")
$scheduleSweepTaskName | Set-Content (Join-Path $runtimeDir "schedule-sweep.task")

Start-Sleep -Seconds 8

Write-Output "Control API task: $apiTaskName"
Write-Output "Admin Web task: $webTaskName"
Write-Output "Schedule sweep task: $scheduleSweepTaskName"

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
