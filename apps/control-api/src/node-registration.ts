import { getCollectorReportsStorePath } from "./collector-store.js";
import { getControlPlaneStorageInfo } from "./store.js";

export type RegistrationPlatform = "macos" | "linux" | "windows";

export type NodeRegistrationInstaller = {
  platform: RegistrationPlatform;
  label: string;
  filename: string;
  shell: "bash" | "powershell";
  script: string;
  notes: string[];
  cronExpression?: string;
  hasCronSetup?: boolean;
};

export type NodeRegistrationBundle = {
  managerUrl: string;
  collectorTokenHint: string;
  storage: {
    controlPlaneDataFile: string;
    schedulerHeartbeatFile: string;
    collectorReportsFile: string;
  };
  installers: NodeRegistrationInstaller[];
};

type BundleOptions = {
  managerUrl: string;
  collectorToken: string;
  storage?: {
    controlPlaneDataFile: string;
    schedulerHeartbeatFile: string;
    collectorReportsFile: string;
  };
};

function maskToken(token: string) {
  if (token.length <= 8) {
    return token;
  }

  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

function buildUnixScript(platformLabel: string, managerUrl: string, collectorToken: string, cronMinutes = 15) {
  const cronExpr = `*/${cronMinutes} * * * *`;
  const pushScriptContent = [
    `#!/usr/bin/env bash`,
    `set -euo pipefail`,
    ``,
    `SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"`,
    `cd "$SCRIPT_DIR/../.."`,
    ``,
    `export COLLECTOR_MANAGER_URL="${managerUrl}"`,
    `export COLLECTOR_SHARED_TOKEN="${collectorToken}"`,
    `export COLLECTOR_NODE_ID`,
    `export COLLECTOR_NODE_NAME`,
    `export COLLECTOR_NODE_HOST`,
    `export OPENCLAW_HOME`,
    ``,
    `npm run collector:push --workspace @openclaw/control-api`,
  ].join("\n");

  const scriptLines = [
    `#!/usr/bin/env bash`,
    `set -euo pipefail`,
    ``,
    `MANAGER_URL="${managerUrl}"`,
    `COLLECTOR_SHARED_TOKEN="${collectorToken}"`,
    `COLLECTOR_NODE_ID="$(hostname | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-')"`,
    `COLLECTOR_NODE_NAME="$(hostname)"`,
    `COLLECTOR_NODE_HOST="$(hostname)"`,
    `OPENCLAW_HOME="$HOME/.openclaw"`,
    `INSTALL_DIR="$HOME/OpenclawTeam"`,
    `CRON_EXPR="${cronExpr}"`,
    `CRON_MARKER="# openclaw-collector-push"`,
    ``,
    `log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }`,
    ``,
    `if ! command -v git >/dev/null 2>&1; then`,
    `  echo "git is required" >&2`,
    `  exit 1`,
    `fi`,
    ``,
    `if ! command -v node >/dev/null 2>&1; then`,
    `  echo "node is required" >&2`,
    `  exit 1`,
    `fi`,
    ``,
    `if [ ! -d "$INSTALL_DIR/.git" ]; then`,
    `  log "Cloning OpenclawTeam repository..."`,
    `  git clone https://github.com/Hooooz/OpenclawTeam.git "$INSTALL_DIR"`,
    `else`,
    `  log "Updating OpenclawTeam repository..."`,
    `  git -C "$INSTALL_DIR" pull --ff-only`,
    `fi`,
    ``,
    `cd "$INSTALL_DIR"`,
    `npm install`,
    ``,
    `PUSH_SCRIPT="$(mktemp /tmp/openclaw-collector-push-XXXXXX.sh)"`,
    `cat > "$PUSH_SCRIPT" << 'PUSHEOF'`,
    pushScriptContent,
    `PUSHEOF`,
    ``,
    `chmod +x "$PUSH_SCRIPT"`,
    ``,
    `log "Running initial push..."`,
    `COLLECTOR_MANAGER_URL="$MANAGER_URL" \\`,
    `COLLECTOR_SHARED_TOKEN="$COLLECTOR_SHARED_TOKEN" \\`,
    `COLLECTOR_NODE_ID="$COLLECTOR_NODE_ID" \\`,
    `COLLECTOR_NODE_NAME="$COLLECTOR_NODE_NAME" \\`,
    `COLLECTOR_NODE_HOST="$COLLECTOR_NODE_HOST" \\`,
    `OPENCLAW_HOME="$OPENCLAW_HOME" \\`,
    `npm run collector:push --workspace @openclaw/control-api`,
    ``,
    `EXISTING_CRON="$(crontab -l 2>/dev/null | grep "$CRON_MARKER" || true)"`,
    `if [ -n "$EXISTING_CRON" ]; then`,
    `  log "Removing existing OpenClaw cron job..."`,
    `  crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | crontab -`,
    `fi`,
    ``,
    `log "Installing cron job: $CRON_EXPR $PUSH_SCRIPT"`,
    `( crontab -l 2>/dev/null; echo "$CRON_EXPR $PUSH_SCRIPT $CRON_MARKER" ) | crontab -`,
    ``,
    `log "${platformLabel} collector registration completed."`,
    `log "Crontab installed: will push every ${cronMinutes} minutes."`,
    `log "View crontab: crontab -l"`,
    `log "Remove cron: crontab -e (delete the openclaw line) or crontab -r"`,
  ];

  return scriptLines.join("\n");
}

function buildWindowsScript(managerUrl: string, collectorToken: string) {
  return `param(
  [string]$InstallDir = "$env:USERPROFILE\\OpenclawTeam",
  [string]$OpenClawHome = "$env:USERPROFILE\\.openclaw"
)

$ErrorActionPreference = "Stop"
$env:COLLECTOR_MANAGER_URL = "${managerUrl}"
$env:COLLECTOR_SHARED_TOKEN = "${collectorToken}"
$env:COLLECTOR_NODE_ID = ($env:COMPUTERNAME.ToLower() -replace '[^a-z0-9]+', '-')
$env:COLLECTOR_NODE_NAME = $env:COMPUTERNAME
$env:COLLECTOR_NODE_HOST = $env:COMPUTERNAME
$env:OPENCLAW_HOME = $OpenClawHome

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git is required"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "node is required"
}

if (-not (Test-Path (Join-Path $InstallDir ".git"))) {
  git clone https://github.com/Hooooz/OpenclawTeam.git $InstallDir
} else {
  git -C $InstallDir pull --ff-only
}

Set-Location $InstallDir
npm install
npm run collector:push --workspace @openclaw/control-api
Write-Output "Windows collector registration completed."
`;
}

export function buildNodeRegistrationBundle(options: BundleOptions): NodeRegistrationBundle {
  const storage =
    options.storage || {
      ...getControlPlaneStorageInfo(),
      collectorReportsFile: getCollectorReportsStorePath()
    };

  return {
    managerUrl: options.managerUrl,
    collectorTokenHint: maskToken(options.collectorToken),
    storage,
    installers: [
      {
        platform: "macos",
        label: "macOS 采集器注册脚本",
        filename: "register-openclaw-node-macos.sh",
        shell: "bash",
        script: buildUnixScript("macOS", options.managerUrl, options.collectorToken),
        notes: [
          "适用于已安装 git、node、npm 的 macOS 机器。",
          "默认从 $HOME/.openclaw 读取本机 OpenClaw。"
        ]
      },
      {
        platform: "linux",
        label: "Linux 采集器注册脚本",
        filename: "register-openclaw-node-linux.sh",
        shell: "bash",
        script: buildUnixScript("Linux", options.managerUrl, options.collectorToken),
        notes: [
          "适用于已安装 git、node、npm 的 Linux 机器。",
          "默认从 $HOME/.openclaw 读取本机 OpenClaw。"
        ]
      },
      {
        platform: "windows",
        label: "Windows 采集器注册脚本",
        filename: "Register-OpenClawNode.ps1",
        shell: "powershell",
        script: buildWindowsScript(options.managerUrl, options.collectorToken),
        notes: [
          "适用于已安装 git、node、npm 的 Windows 机器。",
          "默认从 %USERPROFILE%\\.openclaw 读取本机 OpenClaw。"
        ]
      }
    ]
  };
}
