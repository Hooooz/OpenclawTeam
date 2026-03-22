param(
  [string]$InstallDir = "C:\OpenclawTeam"
)

$ErrorActionPreference = "Stop"

$logDir = Join-Path $InstallDir "logs"
$dataDir = Join-Path $InstallDir "data"
$heartbeatFile = Join-Path $dataDir "schedule-sweep-heartbeat.json"
$endpoint = "http://localhost:3001/api/schedules/run-due"
$taskName = "OpenclawScheduleSweep"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

function Write-Heartbeat {
  param(
    [string]$Outcome,
    [string]$Message
  )

  $payload = [pscustomobject]@{
    taskName = $taskName
    endpoint = $endpoint
    lastHeartbeatAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    lastOutcome = $Outcome
    lastMessage = $Message
  } | ConvertTo-Json -Compress

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($heartbeatFile, $payload, $utf8NoBom)
}

$body = "{}"
$headers = @{
  "Content-Type" = "application/json"
}

try {
  $response = Invoke-RestMethod `
    -Method Post `
    -Uri $endpoint `
    -Headers $headers `
    -Body $body

  $line = "[{0}] sweep ok: {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), ($response | ConvertTo-Json -Compress)
  Write-Heartbeat -Outcome "success" -Message ($response | ConvertTo-Json -Compress)
  Add-Content -Path (Join-Path $logDir "schedule-sweep.log") -Value $line
} catch {
  $line = "[{0}] sweep failed: {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $_
  Write-Heartbeat -Outcome "failed" -Message $_.Exception.Message
  Add-Content -Path (Join-Path $logDir "schedule-sweep.log") -Value $line
  throw
}
