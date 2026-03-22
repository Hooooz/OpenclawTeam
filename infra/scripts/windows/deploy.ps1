param(
  [string]$Branch = "main",
  [string]$RepoUrl = "https://github.com/Hooooz/OpenclawTeam.git",
  [string]$InstallDir = "C:\OpenclawTeam"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $InstallDir)) {
  git clone --branch $Branch $RepoUrl $InstallDir
} else {
  Set-Location $InstallDir
  git fetch origin $Branch
  git checkout $Branch
  git pull --ff-only origin $Branch
}

Set-Location $InstallDir

if ((-not (Test-Path ".env")) -and (Test-Path ".env.example")) {
  Copy-Item ".env.example" ".env"
}

docker compose -f .\infra\compose\docker-compose.yml up --build -d
docker compose -f .\infra\compose\docker-compose.yml ps
