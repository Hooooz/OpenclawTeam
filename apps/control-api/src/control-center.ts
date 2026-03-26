import { access, readFile, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getDashboardSnapshot } from "./store.js";
import { readCollectorReports, upsertCollectorReport, type CollectorNodeReport } from "./collector-store.js";

type LegacyFallback = Awaited<ReturnType<typeof getDashboardSnapshot>>;

type OpenClawConfig = {
  meta?: {
    lastTouchedVersion?: string;
    lastTouchedAt?: string;
  };
  agents?: {
    defaults?: {
      model?: {
        primary?: string;
      };
      workspace?: string;
      maxConcurrent?: number;
      subagents?: {
        maxConcurrent?: number;
      };
    };
    list?: Array<{
      id?: string;
    }>;
  };
  tools?: {
    web?: {
      search?: { enabled?: boolean };
      fetch?: { enabled?: boolean };
    };
  };
  gateway?: {
    port?: number;
    bind?: string;
    mode?: string;
  };
};

type OpenClawStatus = {
  os: string;
  gateway: string;
  gatewayService: string;
  nodeService: string;
  agents: string;
  sessions: string;
  securitySummary: string;
  risks: Array<{ level: "high" | "medium" | "low"; message: string }>;
};

type SessionSkill = {
  name?: string;
  description?: string;
  source?: string;
};

type SessionRecord = {
  sessionId?: string;
  updatedAt?: number;
  chatType?: string;
  abortedLastRun?: boolean;
  origin?: {
    label?: string;
    provider?: string;
    surface?: string;
    chatType?: string;
  };
  sessionFile?: string;
  modelProvider?: string;
  model?: string;
  skillsSnapshot?: {
    skills?: Array<{ name?: string }>;
    resolvedSkills?: SessionSkill[];
  };
  systemPromptReport?: {
    workspaceDir?: string;
  };
};

type SessionStore = Record<string, SessionRecord>;

type SessionFileSummary = {
  firstTimestamp: Date | null;
  lastTimestamp: Date | null;
  firstUserText: string;
  lastAssistantText: string;
  totalMessages: number;
  logLines: Array<{ time: string; level: string; message: string }>;
};

type DataSource = "live" | "mock";

type Provenance = {
  dataSource: DataSource;
  dataSourceNote?: string;
  mockFields?: string[];
};

export type ControlCenterMetricItem = {
  label: string;
  value: number;
  unit?: string;
  change: number;
  danger?: boolean;
} & Provenance;

export type ControlCenterServiceHealth = {
  name: string;
  status: "healthy" | "degraded" | "down";
  lastHeartbeat: string;
} & Provenance;

export type ControlCenterRiskItem = {
  id: string;
  level: "high" | "medium" | "low";
  message: string;
  time: string;
} & Provenance;

export type ControlCenterAgentStatus = "running" | "idle" | "paused" | "error";
export type ControlCenterRunStatus = "success" | "running" | "failed" | "cancelled";
export type ControlCenterTriggerSource = "manual" | "timed-task" | "template" | "chat";

export type ControlCenterMachineInfo = {
  id: string;
  name: string;
  host: string;
  runtime: string;
  status: "healthy" | "degraded" | "down";
} & Provenance;

export type ControlCenterAgentChannel = {
  id: string;
  openclawAgentId: string;
  name: string;
  platform: string;
  channelType: "私聊" | "群聊" | "系统";
  status: ControlCenterAgentStatus;
  sessionCount: number;
  lastActive: string;
  lastMessage: string;
  successRate: number;
  model: string;
  alertCount: number;
} & Provenance;

export type ControlCenterAgentListItem = {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar: string;
  motto: string;
  role: string;
  status: ControlCenterAgentStatus;
  model: string;
  skillCount: number;
  knowledgeCount: number;
  lastRunTime: string;
  lastRunStatus: ControlCenterRunStatus | null;
  successRate: number;
  group: string;
  communicationStyle: string;
  specialties: string[];
  machine: ControlCenterMachineInfo;
  channelCount: number;
  openclawCount: number;
} & Provenance;

export type ControlCenterAgentDetail = ControlCenterAgentListItem & {
  description: string;
  owner: string;
  createdAt: string;
  workCreed: string;
  systemPrompt: string;
  behaviorRules: string[];
  outputStyle: string;
  machine: ControlCenterMachineInfo;
  channels: ControlCenterAgentChannel[];
  skills: Array<{ id: string; name: string; category: string; status: string } & Provenance>;
  knowledgeSources: Array<{ id: string; name: string; type: string; lastSync: string } & Provenance>;
  schedules: Array<{ id: string; name: string; cron: string; nextRun: string; enabled: boolean } & Provenance>;
  recentRuns: Array<{
    id: string;
    taskName: string;
    status: ControlCenterRunStatus;
    time: string;
    duration: string;
  } & Provenance>;
  auditLog: Array<{ id: string; user: string; action: string; time: string; detail: string } & Provenance>;
};

export type ControlCenterRunListItem = {
  id: string;
  runId: string;
  agentName: string;
  agentPosition: string;
  agentId: string;
  channelId: string;
  channelName: string;
  channelType: "私聊" | "群聊" | "系统";
  triggerSource: ControlCenterTriggerSource;
  startTime: string;
  duration: string;
  status: ControlCenterRunStatus;
  outputSummary: string;
  traceId: string;
  taskName: string;
  conversationTopic: string;
  memorySummary: string;
  versionDiff: string;
  sourcePlatform: string;
} & Provenance;

export type ControlCenterRunDetail = ControlCenterRunListItem & {
  triggeredBy: string;
  endTime: string;
  inputParams: Record<string, string>;
  outputResult: string;
  errorMessage: string | null;
  steps: Array<{
    id: string;
    name: string;
    status: string;
    startTime: string;
    duration: string;
    detail: string;
  }> &
    Provenance[];
  skillCalls: Array<{
    id: string;
    skillName: string;
    result: string;
    duration: string;
    input: string;
    output: string;
  }> &
    Provenance[];
  logs: Array<{ time: string; level: string; message: string }>;
  audit: Array<{ user: string; action: string; time: string } & Provenance>;
};

export type ControlCenterScheduleListItem = {
  id: string;
  name: string;
  agentName: string;
  agentId: string;
  cron: string;
  frequency: string;
  status: "active" | "paused" | "error";
  nextRun: string;
  lastRunResult: ControlCenterRunStatus | null;
  lastRunTime: string;
  consecutiveSuccess: number;
  totalRuns: number;
  failedRuns: number;
} & Provenance;

export type ControlCenterDeployInfo = {
  host: string;
  os: string;
  runtime: string;
  repo: string;
  lastDeploy: string;
  version: string;
  ports: Array<{ service: string; port: number; protocol: string } & Provenance>;
} & Provenance;

export type ControlCenterSystemConfig = {
  key: string;
  label: string;
  value: string;
  editable: boolean;
  category: string;
} & Provenance;

export type ControlCenterSettings = {
  deployInfo: ControlCenterDeployInfo;
  services: ControlCenterServiceHealth[];
  systemConfigs: ControlCenterSystemConfig[];
  nodes: ControlCenterNodeInfo[];
};

export type ControlCenterNodeInfo = {
  id: string;
  name: string;
  host: string;
  status: "healthy" | "degraded" | "down";
  lastCollectedAt: string;
  agentCount: number;
  runCount: number;
} & Provenance;

export type ControlCenterDashboard = {
  metrics: ControlCenterMetricItem[];
  services: ControlCenterServiceHealth[];
  risks: ControlCenterRiskItem[];
  agents: Array<{
    id: string;
    name: string;
    position: string;
    avatar: string;
    status: ControlCenterAgentStatus;
    skillCount: number;
    lastRun: string;
    successRate: number;
  } & Provenance>;
  runs: Array<{
    id: string;
    taskName: string;
    agentName: string;
    status: ControlCenterRunStatus;
    startTime: string;
    duration: string;
    memorySummary?: string;
  } & Provenance>;
  schedules: Array<{
    id: string;
    planName: string;
    agentName: string;
    cron: string;
    nextRun: string;
    lastStatus: ControlCenterRunStatus;
    consecutiveSuccess: number;
  } & Provenance>;
  generatedAt: string;
};

type ControlCenterServiceOptions = {
  openclawHome?: string;
  controlPlaneProvider?: () => Promise<LegacyFallback>;
  now?: () => Date;
  collectorStorePath?: string;
  includeCollectorReports?: boolean;
  sourceMode?: "local" | "hybrid" | "collector";
};

type LiveAgentContext = {
  agentId: string;
  displayName: string;
  displayNameMock: boolean;
  position: string;
  department: string;
  group: string;
  avatar: string;
  motto: string;
  communicationStyle: string;
  role: string;
  description: string;
  workCreed: string;
  status: ControlCenterAgentStatus;
  model: string;
  skillCount: number;
  knowledgeCount: number;
  lastRunTime: string;
  lastRunStatus: ControlCenterRunStatus | null;
  successRate: number;
  specialties: string[];
  mockFields: string[];
  createdAt: string;
  owner: string;
  outputStyle: string;
  behaviorRules: string[];
  systemPrompt: string;
  resolvedSkills: SessionSkill[];
  workspaceFiles: Array<{ name: string; path: string; modifiedAt: string }>;
  sessionEntries: Array<[string, SessionRecord]>;
  memoryConnected: boolean;
  workspaceKey: string;
  latestSurface: string;
  latestChatType: "私聊" | "群聊" | "系统";
  latestOriginLabel: string;
};

type LiveEmployeeContext = {
  employeeId: string;
  displayName: string;
  position: string;
  department: string;
  group: string;
  avatar: string;
  motto: string;
  communicationStyle: string;
  role: string;
  description: string;
  workCreed: string;
  status: ControlCenterAgentStatus;
  model: string;
  skillCount: number;
  knowledgeCount: number;
  lastRunTime: string;
  lastRunStatus: ControlCenterRunStatus | null;
  successRate: number;
  specialties: string[];
  mockFields: string[];
  createdAt: string;
  owner: string;
  outputStyle: string;
  behaviorRules: string[];
  systemPrompt: string;
  resolvedSkills: SessionSkill[];
  workspaceFiles: Array<{ name: string; path: string; modifiedAt: string }>;
  memoryConnected: boolean;
  machine: ControlCenterMachineInfo;
  channels: Array<LiveAgentContext>;
};

function defaultOpenClawHome() {
  return process.env.OPENCLAW_HOME?.trim()
    ? path.resolve(process.env.OPENCLAW_HOME)
    : path.resolve(os.homedir(), ".openclaw");
}

function defaultCollectorStorePath() {
  return process.env.CONTROL_CENTER_COLLECTOR_STORE?.trim()
    ? path.resolve(process.env.CONTROL_CENTER_COLLECTOR_STORE)
    : path.resolve(process.cwd(), ".runtime", "collector-reports.json");
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, "")) as T;
  } catch {
    return fallback;
  }
}

async function readTextFile(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function formatDateTime(input: Date | string | number | null | undefined) {
  if (!input) {
    return "—";
  }

  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function formatRelativeTime(input: Date | number | string | null | undefined, now: Date) {
  if (!input) {
    return "—";
  }

  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60_000) {
    return "刚刚";
  }

  const diffMinutes = Math.round(diffMs / 60_000);
  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }

  return formatDateTime(date);
}

function formatDuration(start: Date | null, end: Date | null) {
  if (!start || !end) {
    return "—";
  }

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const totalSeconds = Math.round(diffMs / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function capitalizeWord(value: string) {
  return value ? `${value[0]!.toUpperCase()}${value.slice(1)}` : value;
}

function humanizeDmName(agentId: string) {
  const token = agentId.replace(/^wecom-dm-/, "");
  return capitalizeWord(token);
}

function humanizeGroupName(agentId: string) {
  return `群聊协作 ${agentId.slice(-6)}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "") || "employee";
}

function deriveChannelType(record: SessionRecord | undefined, agentId: string): "私聊" | "群聊" | "系统" {
  if (record?.origin?.chatType === "group" || agentId.startsWith("wecom-group-")) {
    return "群聊";
  }

  if (record?.origin?.chatType === "direct" || agentId.startsWith("wecom-dm-")) {
    return "私聊";
  }

  return "系统";
}

function deriveSessionChannelType(
  sessionKey: string,
  record: SessionRecord | undefined,
  agentId: string
): "私聊" | "群聊" | "系统" {
  if (sessionKey.endsWith(":main")) {
    return "系统";
  }

  return deriveChannelType(record, agentId);
}

function deriveAgentIdentity(agentId: string) {
  if (agentId === "main" || agentId === "codex") {
    return {
      displayName: agentId === "codex" ? "Codex 主控单元" : "OpenClaw 主控单元",
      displayNameMock: true,
      position: "系统协调员",
      department: "控制面",
      group: "系统",
      motto: "先判断边界，再推动执行闭环。",
      communicationStyle: "直接清晰"
    };
  }

  if (agentId.startsWith("wecom-dm-")) {
    return {
      displayName: humanizeDmName(agentId),
      displayNameMock: false,
      position: "企业微信专属助理",
      department: "企业微信私聊",
      group: "企业微信",
      motto: "把零散工作请求整理成可执行动作。",
      communicationStyle: "务实跟进"
    };
  }

  if (agentId.startsWith("wecom-group-")) {
    return {
      displayName: humanizeGroupName(agentId),
      displayNameMock: true,
      position: "群聊协作专员",
      department: "企业微信群",
      group: "企业微信",
      motto: "在多人协作里快速给出下一步。",
      communicationStyle: "群内协同"
    };
  }

  return {
    displayName: capitalizeWord(agentId.replace(/[-_]+/g, " ")),
    displayNameMock: true,
    position: "数字员工",
    department: "OpenClaw",
    group: "未分类",
    motto: "用结构化执行让复杂工作可追踪。",
    communicationStyle: "稳定执行"
  };
}

function toAvatar(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return "?";
  }

  const first = Array.from(trimmed)[0];
  return first ? first.toUpperCase() : "?";
}

function cleanConversationText(value: string, limit = 80) {
  const normalized = value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tail = normalized.includes("] ") ? normalized.slice(normalized.lastIndexOf("] ") + 2) : normalized;
  return tail.length > limit ? `${tail.slice(0, limit - 1)}…` : tail;
}

function extractTextFromMessageContent(content: unknown) {
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }

      const record = item as { type?: string; text?: string };
      return record.type === "text" && typeof record.text === "string" ? record.text : "";
    })
    .filter(Boolean)
    .join("\n");
}

function parseStatusLine(raw: string, key: string) {
  const pattern = new RegExp(`\\|\\s*${key}\\s*\\|\\s*(.*?)\\s*\\|`);
  return raw.match(pattern)?.[1]?.trim() || "";
}

function parseOpenClawStatus(raw: string): OpenClawStatus {
  const summaryLine = raw.match(/Summary:\s*(.+)/)?.[1]?.trim() || "未读取到安全审计摘要";
  const risks = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("CRITICAL") || line.startsWith("WARN"))
    .slice(0, 6)
    .map((line, index) => ({
      level: (line.startsWith("CRITICAL") ? "high" : "medium") as "high" | "medium" | "low",
      message: line.replace(/^(CRITICAL|WARN)\s+/, ""),
      time: `风险 ${index + 1}`
    }));

  return {
    os: parseStatusLine(raw, "OS"),
    gateway: parseStatusLine(raw, "Gateway"),
    gatewayService: parseStatusLine(raw, "Gateway service"),
    nodeService: parseStatusLine(raw, "Node service"),
    agents: parseStatusLine(raw, "Agents"),
    sessions: parseStatusLine(raw, "Sessions"),
    securitySummary: summaryLine,
    risks
  };
}

async function readSessionFileSummary(filePath: string): Promise<SessionFileSummary> {
  const fallback: SessionFileSummary = {
    firstTimestamp: null,
    lastTimestamp: null,
    firstUserText: "",
    lastAssistantText: "",
    totalMessages: 0,
    logLines: []
  };

  try {
    const raw = await readFile(filePath, "utf8");
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const entries = lines.flatMap((line) => {
      try {
        return [JSON.parse(line) as Record<string, unknown>];
      } catch {
        return [];
      }
    });

    let firstTimestamp: Date | null = null;
    let lastTimestamp: Date | null = null;
    let firstUserText = "";
    let lastAssistantText = "";
    const logLines: Array<{ time: string; level: string; message: string }> = [];

    for (const entry of entries) {
      const timestamp = typeof entry.timestamp === "string" ? new Date(entry.timestamp) : null;

      if (timestamp && !Number.isNaN(timestamp.getTime())) {
        if (!firstTimestamp || timestamp.getTime() < firstTimestamp.getTime()) {
          firstTimestamp = timestamp;
        }
        if (!lastTimestamp || timestamp.getTime() > lastTimestamp.getTime()) {
          lastTimestamp = timestamp;
        }
      }

      if (entry.type !== "message") {
        continue;
      }

      const message = entry.message as
        | {
            role?: string;
            content?: unknown[];
          }
        | undefined;

      const text = cleanConversationText(extractTextFromMessageContent(message?.content), 160);

      if (message?.role === "user" && !firstUserText && text) {
        firstUserText = text;
      }

      if (message?.role === "assistant" && text) {
        lastAssistantText = text;
      }

      if (text) {
        logLines.push({
          time: formatDateTime(timestamp),
          level: message?.role === "assistant" ? "info" : "debug",
          message: text
        });
      }
    }

    return {
      firstTimestamp,
      lastTimestamp,
      firstUserText,
      lastAssistantText,
      totalMessages: entries.filter((entry) => entry.type === "message").length,
      logLines: logLines.slice(-6)
    };
  } catch {
    return fallback;
  }
}

function mapSurfaceLabel(surface?: string) {
  if (surface === "wecom") {
    return "企业微信";
  }

  if (surface === "feishu") {
    return "飞书";
  }

  return "系统";
}

function deriveTriggerSource(record: SessionRecord): ControlCenterTriggerSource {
  if (record.origin?.surface === "wecom" || record.origin?.surface === "feishu") {
    return "chat";
  }

  return "manual";
}

function deriveRunStatus(record: SessionRecord, now: Date): ControlCenterRunStatus {
  if (record.abortedLastRun) {
    return "failed";
  }

  if (typeof record.updatedAt === "number") {
    const ageMinutes = (now.getTime() - record.updatedAt) / 60_000;
    if (ageMinutes <= 30) {
      return "running";
    }
  }

  return "success";
}

function deriveAgentStatus(
  latestUpdatedAt: number | undefined,
  recentRunStatus: ControlCenterRunStatus | null,
  now: Date
): ControlCenterAgentStatus {
  if (recentRunStatus === "failed") {
    return "error";
  }

  if (!latestUpdatedAt) {
    return "paused";
  }

  const ageMinutes = (now.getTime() - latestUpdatedAt) / 60_000;
  if (ageMinutes <= 30) {
    return "running";
  }

  if (ageMinutes <= 24 * 60) {
    return "idle";
  }

  return "paused";
}

function parseBehaviorRules(soulContent: string) {
  const lines = soulContent.split(/\r?\n/).map((line) => line.trim());
  const start = lines.findIndex((line) => line === "## Boundaries");
  if (start < 0) {
    return ["对外动作前先确认边界。", "不要把未完成内容直接发到消息面。"];
  }

  return lines
    .slice(start + 1)
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean)
    .slice(0, 4);
}

function summarizeWorkspaceRole(agentsContent: string, identity: ReturnType<typeof deriveAgentIdentity>) {
  const body = agentsContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .join(" ");

  const role = cleanConversationText(body, 120);

  return role || `${identity.department}场景下的数字员工，负责接收请求、梳理上下文并推动执行。`;
}

function getPathCandidates(openclawHome: string, agentId: string, workspaceDir?: string) {
  const rootDir = path.dirname(openclawHome);
  const workspaceBase = workspaceDir ? path.win32.basename(workspaceDir) : "";

  return {
    workspace: [
      workspaceBase ? path.join(rootDir, workspaceBase) : "",
      path.join(rootDir, `workspace-${agentId}`),
      agentId === "main" ? path.join(rootDir, "workspace") : ""
    ].filter(Boolean),
    memory: [path.join(openclawHome, "memory", `${agentId}.sqlite`)]
  };
}

function toWorkspaceKey(agentId: string, workspaceCandidates: string[]) {
  const candidate = workspaceCandidates[0] || agentId;
  return path.normalize(candidate).toLowerCase();
}

async function readWorkspaceFiles(workspaceCandidates: string[]) {
  const fileNames = ["AGENTS.md", "IDENTITY.md", "SOUL.md", "USER.md", "BOOTSTRAP.md", "HEARTBEAT.md"];
  const found = [];

  for (const dir of workspaceCandidates) {
    if (!(await fileExists(dir))) {
      continue;
    }

    for (const fileName of fileNames) {
      const filePath = path.join(dir, fileName);
      if (!(await fileExists(filePath))) {
        continue;
      }

      const fileStat = await stat(filePath);
      found.push({
        name: fileName,
        path: filePath,
        modifiedAt: formatDateTime(fileStat.mtime)
      });
    }

    if (found.length > 0) {
      return found;
    }
  }

  return found;
}

async function readAgentSessionStore(openclawHome: string, agentId: string) {
  return readJsonFile<SessionStore>(
    path.join(openclawHome, "agents", agentId, "sessions", "sessions.json"),
    {}
  );
}

async function buildLiveAgentContext(
  openclawHome: string,
  agentId: string,
  config: OpenClawConfig,
  now: Date
): Promise<LiveAgentContext> {
  const identity = deriveAgentIdentity(agentId);
  const sessionStore = await readAgentSessionStore(openclawHome, agentId);
  const sessionEntries = Object.entries(sessionStore).sort(
    (left, right) => (right[1].updatedAt || 0) - (left[1].updatedAt || 0)
  );
  const latestSession = sessionEntries[0]?.[1];
  const latestRunStatus = latestSession ? deriveRunStatus(latestSession, now) : null;
  const pathCandidates = getPathCandidates(
    openclawHome,
    agentId,
    latestSession?.systemPromptReport?.workspaceDir
  );
  const workspaceFiles = await readWorkspaceFiles(pathCandidates.workspace);
  const agentsFile = workspaceFiles.find((item) => item.name === "AGENTS.md")?.path || "";
  const soulFile = workspaceFiles.find((item) => item.name === "SOUL.md")?.path || "";
  const agentsContent = agentsFile ? await readTextFile(agentsFile) : "";
  const soulContent = soulFile ? await readTextFile(soulFile) : "";
  const memoryConnected = await fileExists(pathCandidates.memory[0]!);
  const resolvedSkills = latestSession?.skillsSnapshot?.resolvedSkills || [];
  const skillNames = (
    latestSession?.skillsSnapshot?.skills?.map((skill) => skill.name || "").filter(Boolean) || []
  ).slice(0, 4);
  const completedStatuses = sessionEntries
    .map(([, record]) => deriveRunStatus(record, now))
    .filter((status) => status !== "running");
  const successCount = completedStatuses.filter((status) => status === "success").length;
  const successRate =
    completedStatuses.length === 0
      ? latestRunStatus === "failed"
        ? 0
        : 100
      : Math.round((successCount / completedStatuses.length) * 1000) / 10;
  const role = summarizeWorkspaceRole(agentsContent, identity);
  const description = role;
  const mockFields = [
    identity.displayNameMock ? "name" : "",
    "position",
    "department",
    "motto",
    "owner"
  ].filter(Boolean);

  return {
    agentId,
    displayName: identity.displayName,
    displayNameMock: identity.displayNameMock,
    position: identity.position,
    department: identity.department,
    group: identity.group,
    avatar: toAvatar(identity.displayName),
    motto: identity.motto,
    communicationStyle: identity.communicationStyle,
    role,
    description,
    workCreed:
      role.length > 40 ? role.slice(0, 40) : "让请求先被梳理清楚，再交给系统继续推进。",
    status: deriveAgentStatus(latestSession?.updatedAt, latestRunStatus, now),
    model: latestSession?.model || config.agents?.defaults?.model?.primary || "unknown",
    skillCount: latestSession?.skillsSnapshot?.skills?.length || 0,
    knowledgeCount: memoryConnected ? 1 : 0,
    lastRunTime: latestSession?.updatedAt ? formatRelativeTime(latestSession.updatedAt, now) : "—",
    lastRunStatus: latestRunStatus,
    successRate,
    specialties:
      skillNames.length > 0 ? skillNames.map((name) => name.replace(/-/g, " ")) : ["消息协同", "上下文整理"],
    mockFields,
    createdAt:
      workspaceFiles[0]?.modifiedAt || formatDateTime(config.meta?.lastTouchedAt || new Date(0).toISOString()),
    owner: "Administrator",
    outputStyle: "OpenClaw 会话输出",
    behaviorRules: parseBehaviorRules(soulContent),
    systemPrompt: agentsContent || "当前 workspace 中未找到 AGENTS.md，暂以默认 OpenClaw 约束运行。",
    resolvedSkills,
    workspaceFiles,
    sessionEntries,
    memoryConnected,
    workspaceKey: toWorkspaceKey(agentId, pathCandidates.workspace),
    latestSurface: mapSurfaceLabel(latestSession?.origin?.surface),
    latestChatType: deriveChannelType(latestSession, agentId),
    latestOriginLabel: latestSession?.origin?.label?.trim() || identity.displayName
  };
}

async function loadLiveAgents(openclawHome: string, config: OpenClawConfig, now: Date) {
  const agentIds = (config.agents?.list || [])
    .map((item) => item.id?.trim())
    .filter((item): item is string => Boolean(item));

  return Promise.all(agentIds.map((agentId) => buildLiveAgentContext(openclawHome, agentId, config, now)));
}

async function defaultControlPlaneProvider() {
  return getDashboardSnapshot();
}

function buildMachineInfo(fallback: LegacyFallback): ControlCenterMachineInfo {
  return {
    id: `machine-${slugify(fallback.server.host)}`,
    name: fallback.server.host,
    host: fallback.server.host,
    runtime: fallback.server.containerRuntime,
    status: "healthy",
    dataSource: "live"
  };
}

function toEmployeeId(context: LiveAgentContext) {
  return `employee-${slugify(context.displayName)}`;
}

function statusRank(status: ControlCenterAgentStatus) {
  if (status === "error") return 4;
  if (status === "running") return 3;
  if (status === "idle") return 2;
  return 1;
}

function latestContextTimestamp(context: LiveAgentContext) {
  return Math.max(0, ...context.sessionEntries.map(([, record]) => record.updatedAt || 0));
}

function compareContextsForEmployee(left: LiveAgentContext, right: LiveAgentContext) {
  if (left.displayNameMock !== right.displayNameMock) {
    return left.displayNameMock ? 1 : -1;
  }

  if (left.memoryConnected !== right.memoryConnected) {
    return left.memoryConnected ? -1 : 1;
  }

  const typeDiff = sessionChannelPriority(right.latestChatType) - sessionChannelPriority(left.latestChatType);
  if (typeDiff !== 0) {
    return typeDiff;
  }

  const sessionDiff = right.sessionEntries.length - left.sessionEntries.length;
  if (sessionDiff !== 0) {
    return sessionDiff;
  }

  return latestContextTimestamp(right) - latestContextTimestamp(left);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildEmployeeContext(contexts: LiveAgentContext[], fallback: LegacyFallback): LiveEmployeeContext {
  const primary = [...contexts].sort(compareContextsForEmployee)[0];
  if (!primary) {
    throw new Error("Cannot build employee context from empty OpenClaw contexts.");
  }

  const latestContext = [...contexts].sort(
    (left, right) => latestContextTimestamp(right) - latestContextTimestamp(left)
  )[0] || primary;
  const totalSessionCount = Math.max(
    contexts.reduce((sum, context) => sum + Math.max(context.sessionEntries.length, 1), 0),
    1
  );
  const weightedSuccessRate =
    contexts.reduce((sum, context) => sum + context.successRate * Math.max(context.sessionEntries.length, 1), 0) /
    totalSessionCount;
  const mergedWorkspaceFiles = Array.from(
    new Map(
      contexts
        .flatMap((context) => context.workspaceFiles)
        .map((file) => [file.path, file] as const)
    ).values()
  ).sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt));

  return {
    employeeId: toEmployeeId(primary),
    displayName: primary.displayName,
    position: primary.position,
    department: primary.department,
    group: primary.group,
    avatar: primary.avatar,
    motto: primary.motto,
    communicationStyle: primary.communicationStyle,
    role: primary.role,
    description: primary.description,
    workCreed: primary.workCreed,
    status: [...contexts]
      .sort((left, right) => statusRank(right.status) - statusRank(left.status))[0]
      ?.status || primary.status,
    model: primary.model,
    skillCount: uniqueValues(
      contexts.flatMap((context) => context.resolvedSkills.map((skill) => skill.name || ""))
    ).length,
    knowledgeCount: contexts.some((context) => context.memoryConnected) ? 1 : 0,
    lastRunTime: latestContext.lastRunTime,
    lastRunStatus: latestContext.lastRunStatus,
    successRate: Math.round(weightedSuccessRate * 10) / 10,
    specialties: uniqueValues(contexts.flatMap((context) => context.specialties)).slice(0, 6),
    mockFields: uniqueValues(contexts.flatMap((context) => context.mockFields)),
    createdAt: mergedWorkspaceFiles[0]?.modifiedAt || primary.createdAt,
    owner: primary.owner,
    outputStyle: primary.outputStyle,
    behaviorRules: uniqueValues(contexts.flatMap((context) => context.behaviorRules)).slice(0, 8),
    systemPrompt: primary.systemPrompt,
    resolvedSkills: Array.from(
      new Map(
        contexts
          .flatMap((context) => context.resolvedSkills)
          .map((skill) => [skill.name || `${skill.source || "skill"}-unknown`, skill] as const)
      ).values()
    ),
    workspaceFiles: mergedWorkspaceFiles,
    memoryConnected: contexts.some((context) => context.memoryConnected),
    machine: buildMachineInfo(fallback),
    channels: contexts
  };
}

function buildAgentListItem(context: LiveEmployeeContext): ControlCenterAgentListItem {
  return {
    id: context.employeeId,
    name: context.displayName,
    position: context.position,
    department: context.department,
    avatar: context.avatar,
    motto: context.motto,
    role: context.role,
    status: context.status,
    model: context.model,
    skillCount: context.skillCount,
    knowledgeCount: context.knowledgeCount,
    lastRunTime: context.lastRunTime,
    lastRunStatus: context.lastRunStatus,
    successRate: context.successRate,
    group: context.group,
    communicationStyle: context.communicationStyle,
    specialties: context.specialties,
    machine: context.machine,
    channelCount: Math.max(
      context.channels.reduce((sum, channel) => sum + channel.sessionEntries.length, 0),
      1
    ),
    openclawCount: 1,
    dataSource: "live",
    mockFields: context.mockFields
  };
}

function sessionChannelPriority(channelType: "私聊" | "群聊" | "系统") {
  if (channelType === "私聊") return 3;
  if (channelType === "群聊") return 2;
  return 1;
}

function toChannelId(agentId: string, sessionKey: string) {
  return `channel-${slugify(`${agentId}-${sessionKey}`)}`;
}

function deriveChannelName(agent: LiveAgentContext, sessionKey: string, record: SessionRecord) {
  const channelType = deriveChannelType(record, agent.agentId);
  if (record.origin?.label?.trim()) {
    return cleanConversationText(record.origin.label.trim(), 48);
  }

  if (sessionKey.endsWith(":main")) {
    return "主控线程";
  }

  if (channelType === "私聊") {
    return `${agent.displayName} 私聊入口`;
  }

  if (channelType === "群聊") {
    return `${agent.displayName} 群聊入口`;
  }

  return `${agent.displayName} 系统入口`;
}

function deriveChannelPlatform(agent: LiveAgentContext, sessionKey: string, record: SessionRecord) {
  if (record.origin?.surface) {
    return mapSurfaceLabel(record.origin.surface);
  }

  if (sessionKey.endsWith(":main")) {
    return "系统";
  }

  if (agent.agentId.startsWith("wecom-")) {
    return "企业微信";
  }

  return "系统";
}

async function buildDetailChannels(
  employee: LiveEmployeeContext,
  openclawHome: string,
  now: Date
): Promise<ControlCenterAgentChannel[]> {
  const channels = await Promise.all(
    employee.channels.flatMap((context) =>
      context.sessionEntries.map(async ([sessionKey, record]) => {
      const sessionFilePath = path.join(
        openclawHome,
        "agents",
        context.agentId,
        "sessions",
        `${record.sessionId || "session"}.jsonl`
      );
      const summary = await readSessionFileSummary(sessionFilePath);
      const channelType = deriveSessionChannelType(sessionKey, record, context.agentId);
      const platform = deriveChannelPlatform(context, sessionKey, record);
      const status = deriveAgentStatus(record.updatedAt, deriveRunStatus(record, now), now);

      return {
        id: toChannelId(context.agentId, sessionKey),
        openclawAgentId: context.agentId,
        name: deriveChannelName(context, sessionKey, record),
        platform,
        channelType,
        status,
        sessionCount: 1,
        lastActive: record.updatedAt ? formatRelativeTime(record.updatedAt, now) : "—",
        lastMessage:
          cleanConversationText(summary.lastAssistantText || summary.firstUserText || context.role, 96) || context.role,
        successRate: deriveRunStatus(record, now) === "failed" ? 0 : 100,
        model: record.model || context.model,
        alertCount: deriveRunStatus(record, now) === "failed" ? 1 : 0,
        dataSource: "live" as const,
        mockFields: context.mockFields
      };
      })
    )
  );

  return channels.sort((left, right) => {
    const priorityDiff = sessionChannelPriority(right.channelType) - sessionChannelPriority(left.channelType);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return right.lastActive.localeCompare(left.lastActive);
  });
}

async function buildLiveRuns(employees: LiveEmployeeContext[], openclawHome: string, now: Date) {
  const runs: ControlCenterRunListItem[] = [];

  for (const employee of employees) {
    for (const context of employee.channels) {
      for (const [sessionKey, sessionRecord] of context.sessionEntries) {
        const sessionFilePath = path.join(
          openclawHome,
          "agents",
          context.agentId,
          "sessions",
          `${sessionRecord.sessionId || "session"}.jsonl`
        );
        const summary = await readSessionFileSummary(sessionFilePath);
        const startTime =
          summary.firstTimestamp || (sessionRecord.updatedAt ? new Date(sessionRecord.updatedAt) : null);
        const endTime =
          summary.lastTimestamp || (sessionRecord.updatedAt ? new Date(sessionRecord.updatedAt) : startTime);
        const status = deriveRunStatus(sessionRecord, now);
        const topic = cleanConversationText(summary.firstUserText || `${context.displayName} 对话线程`, 60);
        const outputSummary = cleanConversationText(
          summary.lastAssistantText || "最近一轮输出还未沉淀到可读摘要。",
          80
        );
        const channelType = deriveSessionChannelType(sessionKey, sessionRecord, context.agentId);
        const platform = deriveChannelPlatform(context, sessionKey, sessionRecord);

        runs.push({
          id: sessionRecord.sessionId || `${context.agentId}-${Math.random().toString(36).slice(2, 8)}`,
          runId: (sessionRecord.sessionId || "session").toUpperCase(),
          agentName: employee.displayName,
          agentPosition: employee.position,
          agentId: employee.employeeId,
          channelId: toChannelId(context.agentId, sessionKey),
          channelName: deriveChannelName(context, sessionKey, sessionRecord),
          channelType,
          triggerSource: deriveTriggerSource(sessionRecord),
          startTime: formatDateTime(startTime),
          duration: formatDuration(startTime, endTime),
          status,
          outputSummary,
          traceId: `trace-${sessionRecord.sessionId || context.agentId}`,
          taskName: `${platform}对话处理`,
          conversationTopic: topic,
          memorySummary: context.memoryConnected ? "已连接 OpenClaw memory" : "未接入独立记忆库",
          versionDiff: "—",
          sourcePlatform: platform,
          dataSource: "live"
        });
      }
    }
  }

  return runs.sort((left, right) => right.startTime.localeCompare(left.startTime));
}

function mapFallbackRunStatus(
  status: "success" | "failed" | "running"
): ControlCenterRunStatus {
  return status;
}

function buildFallbackRuns(snapshot: LegacyFallback): ControlCenterRunListItem[] {
  return snapshot.runs.map((run) => ({
    id: run.id,
    runId: run.id.toUpperCase(),
    agentName: run.agentName,
    agentPosition: "控制面存量任务",
    agentId: run.agentName,
    channelId: "mock-channel",
    channelName: "控制面示例通道",
    channelType: "系统",
    triggerSource: run.triggerType === "schedule" ? "timed-task" : "manual",
    startTime: run.startedAt,
    duration: "—",
    status: mapFallbackRunStatus(run.status),
    outputSummary: run.summary,
    traceId: run.traceId,
    taskName: run.summary,
    conversationTopic: "来自既有控制面的任务记录",
    memorySummary: "mock control-plane record",
    versionDiff: "—",
    sourcePlatform: "控制面",
    dataSource: "mock",
    dataSourceNote: "来自既有 control-plane 存量记录"
  }));
}

function humanizeCron(cron: string) {
  if (/^\*\/(\d+) \* \* \* \*$/.test(cron)) {
    return `每${cron.match(/^\*\/(\d+)/)?.[1]}分钟`;
  }

  if (/^0 \*\/(\d+) \* \* \*$/.test(cron)) {
    return `每${cron.match(/^0 \*\/(\d+)/)?.[1]}小时`;
  }

  if (/^0 \d+ \* \* \*$/.test(cron)) {
    return "每日";
  }

  if (/^0 \d+ \* \* 1-5$/.test(cron)) {
    return "工作日";
  }

  if (/^0 \d+ \* \* \d$/.test(cron)) {
    return "每周";
  }

  return "Cron 任务";
}

function buildFallbackSchedules(snapshot: LegacyFallback): ControlCenterScheduleListItem[] {
  return snapshot.schedules.map((schedule) => {
    const relatedRuns = snapshot.runs.filter(
      (run) => run.triggerType === "schedule" && run.agentName === schedule.agentName
    );
    const failedRuns = relatedRuns.filter((run) => run.status === "failed").length;
    const lastRun = relatedRuns[0];

    return {
      id: schedule.id,
      name: schedule.name,
      agentName: schedule.agentName,
      agentId: schedule.agentId,
      cron: schedule.cron,
      frequency: humanizeCron(schedule.cron),
      status: schedule.status === "paused" ? "paused" : failedRuns > 0 ? "error" : "active",
      nextRun: schedule.nextRunAt,
      lastRunResult: lastRun ? mapFallbackRunStatus(lastRun.status) : null,
      lastRunTime: lastRun?.startedAt || "—",
      consecutiveSuccess: failedRuns > 0 ? 0 : relatedRuns.length,
      totalRuns: relatedRuns.length,
      failedRuns,
      dataSource: "mock",
      dataSourceNote: "OpenClaw 当前没有 cron 任务，保留既有 control-plane mock 数据"
    };
  });
}

function mapServiceStatus(value: string): "healthy" | "degraded" | "down" {
  const normalized = value.toLowerCase();

  if (normalized.includes("healthy") || normalized.includes("registered")) {
    return "healthy";
  }

  if (normalized.includes("unreachable") || normalized.includes("not installed")) {
    return "down";
  }

  return "degraded";
}

function buildServices(status: OpenClawStatus, fallback: LegacyFallback, now: Date): ControlCenterServiceHealth[] {
  const schedulerAge = fallback.scheduler.lastHeartbeatAt
    ? formatRelativeTime(fallback.scheduler.lastHeartbeatAt, now)
    : "尚未收到心跳";

  return [
    {
      name: "Control API",
      status: "healthy",
      lastHeartbeat: "刚刚",
      dataSource: "mock",
      dataSourceNote: "来自当前控制面服务进程"
    },
    {
      name: "OpenClaw Gateway",
      status: mapServiceStatus(status.gateway),
      lastHeartbeat: status.gateway || "未读取",
      dataSource: "live"
    },
    {
      name: "OpenClaw Node Service",
      status: mapServiceStatus(status.nodeService),
      lastHeartbeat: status.nodeService || "未读取",
      dataSource: "live"
    },
    {
      name: "Scheduler",
      status:
        fallback.scheduler.lastOutcome === "success"
          ? "healthy"
          : fallback.scheduler.lastOutcome === "failed"
            ? "degraded"
            : "down",
      lastHeartbeat: schedulerAge,
      dataSource: "mock",
      dataSourceNote: "来自现有 control-plane 调度守护心跳"
    }
  ];
}

function buildSettings(config: OpenClawConfig, status: OpenClawStatus, fallback: LegacyFallback): ControlCenterSettings {
  const deployInfo: ControlCenterDeployInfo = {
    host: fallback.server.host,
    os: status.os || fallback.server.os,
    runtime: `OpenClaw local gateway + ${status.os.split("·")[1]?.trim() || fallback.server.containerRuntime}`,
    repo: fallback.server.repository,
    lastDeploy: formatDateTime(config.meta?.lastTouchedAt || "—"),
    version: config.meta?.lastTouchedVersion || "unknown",
    ports: [
      { service: "Admin Web", port: 3200, protocol: "HTTP", dataSource: "mock" },
      { service: "Control API", port: 3201, protocol: "HTTP", dataSource: "mock" },
      {
        service: "OpenClaw Gateway",
        port: config.gateway?.port || 18789,
        protocol: "HTTP",
        dataSource: "live"
      }
    ],
    dataSource: "live",
    dataSourceNote: "部署信息以服务器上的 OpenClaw 配置为主，控制面端口来自当前项目"
  };

  const systemConfigs: ControlCenterSystemConfig[] = [
    {
      key: "agent_default_model",
      label: "默认模型",
      value: config.agents?.defaults?.model?.primary || "unknown",
      editable: false,
      category: "AI",
      dataSource: "live"
    },
    {
      key: "agent_max_concurrent",
      label: "Agent 最大并发数",
      value: String(config.agents?.defaults?.maxConcurrent || 0),
      editable: false,
      category: "运行",
      dataSource: "live"
    },
    {
      key: "subagent_max_concurrent",
      label: "子 Agent 最大并发数",
      value: String(config.agents?.defaults?.subagents?.maxConcurrent || 0),
      editable: false,
      category: "运行",
      dataSource: "live"
    },
    {
      key: "gateway_bind",
      label: "Gateway 绑定方式",
      value: config.gateway?.bind || "unknown",
      editable: false,
      category: "系统",
      dataSource: "live"
    },
    {
      key: "web_fetch_enabled",
      label: "Web Fetch",
      value: config.tools?.web?.fetch?.enabled ? "enabled" : "disabled",
      editable: false,
      category: "工具",
      dataSource: "live"
    },
    {
      key: "web_search_enabled",
      label: "Web Search",
      value: config.tools?.web?.search?.enabled ? "enabled" : "disabled",
      editable: false,
      category: "工具",
      dataSource: "live"
    },
    {
      key: "task_timeout",
      label: "任务超时时间 (秒)",
      value: "300",
      editable: true,
      category: "运行",
      dataSource: "mock",
      dataSourceNote: "当前 OpenClaw 运行时未暴露统一任务超时配置"
    }
  ];

  return {
    deployInfo,
    services: buildServices(status, fallback, new Date()),
    systemConfigs,
    nodes: []
  };
}

function prefixCollectorId(nodeId: string, value: string) {
  return `collector-${slugify(nodeId)}__${value}`;
}

function appendCollectorNote(note: string | undefined, nodeName: string) {
  const prefix = `来自采集器节点 ${nodeName}`;
  return note ? `${prefix} · ${note}` : prefix;
}

function normalizeCollectorMachine(
  machine: Partial<ControlCenterMachineInfo> | undefined,
  report: CollectorNodeReport
): ControlCenterMachineInfo {
  return {
    id: prefixCollectorId(report.node.id, machine?.id || report.node.id),
    name: machine?.name || report.node.name,
    host: machine?.host || report.node.host,
    runtime: machine?.runtime || report.node.host,
    status: machine?.status || "healthy",
    dataSource: machine?.dataSource || "live",
    dataSourceNote: appendCollectorNote(machine?.dataSourceNote, report.node.name)
  };
}

function normalizeCollectorNodes(reports: CollectorNodeReport[], now: Date): ControlCenterNodeInfo[] {
  return reports.map((report) => {
    const collectedAt = report.collectedAt || "—";
    const collectedDate = new Date(collectedAt.replace(" ", "T"));
    const diffMinutes = Number.isNaN(collectedDate.getTime())
      ? Number.POSITIVE_INFINITY
      : Math.max(0, Math.round((now.getTime() - collectedDate.getTime()) / 60_000));
    const status = diffMinutes <= 15 ? "healthy" : diffMinutes <= 60 ? "degraded" : "down";

    return {
      id: prefixCollectorId(report.node.id, "node"),
      name: report.node.name,
      host: report.node.host,
      status,
      lastCollectedAt: collectedAt,
      agentCount: Array.isArray(report.agents) ? report.agents.length : 0,
      runCount: Array.isArray(report.runs) ? report.runs.length : 0,
      dataSource: "live",
      dataSourceNote: appendCollectorNote(undefined, report.node.name)
    };
  });
}

function normalizeCollectorAgent(
  raw: unknown,
  report: CollectorNodeReport
): ControlCenterAgentListItem | null {
  const agent = raw as Partial<ControlCenterAgentListItem> | null;
  if (!agent?.id || !agent.name) {
    return null;
  }

  return {
    id: prefixCollectorId(report.node.id, agent.id),
    name: agent.name,
    position: agent.position || "数字员工",
    department: agent.department || "OpenClaw",
    avatar: agent.avatar || "O",
    motto: agent.motto || "通过采集器接入的远端数字员工。",
    role: agent.role || "远端节点数字员工",
    status: agent.status || "idle",
    model: agent.model || "unknown",
    skillCount: agent.skillCount || 0,
    knowledgeCount: agent.knowledgeCount || 0,
    lastRunTime: agent.lastRunTime || "—",
    lastRunStatus: agent.lastRunStatus || null,
    successRate: agent.successRate || 0,
    group: agent.group || "远端节点",
    communicationStyle: agent.communicationStyle || "稳定执行",
    specialties: Array.isArray(agent.specialties) ? agent.specialties : [],
    machine: normalizeCollectorMachine(agent.machine, report),
    channelCount: agent.channelCount || 0,
    openclawCount: agent.openclawCount || 1,
    dataSource: agent.dataSource || "live",
    dataSourceNote: appendCollectorNote(agent.dataSourceNote, report.node.name),
    mockFields: agent.mockFields
  };
}

function normalizeCollectorRun(
  raw: unknown,
  report: CollectorNodeReport
): ControlCenterRunListItem | null {
  const run = raw as Partial<ControlCenterRunListItem> | null;
  if (!run?.id || !run.agentId) {
    return null;
  }

  return {
    id: prefixCollectorId(report.node.id, run.id),
    runId: run.runId || String(run.id).toUpperCase(),
    agentName: run.agentName || report.node.name,
    agentPosition: run.agentPosition || "数字员工",
    agentId: prefixCollectorId(report.node.id, run.agentId),
    channelId: prefixCollectorId(report.node.id, run.channelId || "channel"),
    channelName: run.channelName || "远端通道",
    channelType: run.channelType || "系统",
    triggerSource: run.triggerSource || "manual",
    startTime: run.startTime || "—",
    duration: run.duration || "—",
    status: run.status || "running",
    outputSummary: run.outputSummary || "—",
    traceId: prefixCollectorId(report.node.id, run.traceId || run.id),
    taskName: run.taskName || "远端任务",
    conversationTopic: run.conversationTopic || run.taskName || "远端会话",
    memorySummary: run.memorySummary || "—",
    versionDiff: run.versionDiff || "—",
    sourcePlatform: run.sourcePlatform || "系统",
    dataSource: run.dataSource || "live",
    dataSourceNote: appendCollectorNote(run.dataSourceNote, report.node.name),
    mockFields: run.mockFields
  };
}

function normalizeCollectorSchedule(
  raw: unknown,
  report: CollectorNodeReport
): ControlCenterScheduleListItem | null {
  const schedule = raw as Partial<ControlCenterScheduleListItem> | null;
  if (!schedule?.id) {
    return null;
  }

  return {
    id: prefixCollectorId(report.node.id, schedule.id),
    name: schedule.name || "远端定时任务",
    agentName: schedule.agentName || report.node.name,
    agentId: prefixCollectorId(report.node.id, schedule.agentId || "agent"),
    cron: schedule.cron || "* * * * *",
    frequency: schedule.frequency || "Cron 任务",
    status: schedule.status || "active",
    nextRun: schedule.nextRun || "—",
    lastRunResult: schedule.lastRunResult || null,
    lastRunTime: schedule.lastRunTime || "—",
    consecutiveSuccess: schedule.consecutiveSuccess || 0,
    totalRuns: schedule.totalRuns || 0,
    failedRuns: schedule.failedRuns || 0,
    dataSource: schedule.dataSource || "live",
    dataSourceNote: appendCollectorNote(schedule.dataSourceNote, report.node.name),
    mockFields: schedule.mockFields
  };
}

function normalizeCollectorAgentDetail(
  raw: unknown,
  report: CollectorNodeReport
): ControlCenterAgentDetail | null {
  const detail = raw as Partial<ControlCenterAgentDetail> | null;
  const base = normalizeCollectorAgent(raw, report);
  if (!base) {
    return null;
  }

  return {
    ...base,
    description: detail?.description || base.role,
    owner: detail?.owner || "Collector",
    createdAt: detail?.createdAt || report.collectedAt,
    workCreed: detail?.workCreed || "通过采集器同步远端 OpenClaw 状态。",
    systemPrompt: detail?.systemPrompt || "远端采集节点未上报系统提示词。",
    behaviorRules: Array.isArray(detail?.behaviorRules) ? detail.behaviorRules : [],
    outputStyle: detail?.outputStyle || "远端采集输出",
    channels: (detail?.channels || []).map((channel) => ({
      ...channel,
      id: prefixCollectorId(report.node.id, channel.id),
      dataSourceNote: appendCollectorNote(channel.dataSourceNote, report.node.name)
    })),
    skills: (detail?.skills || []).map((skill) => ({
      ...skill,
      id: prefixCollectorId(report.node.id, skill.id),
      dataSourceNote: appendCollectorNote(skill.dataSourceNote, report.node.name)
    })),
    knowledgeSources: (detail?.knowledgeSources || []).map((knowledge) => ({
      ...knowledge,
      id: prefixCollectorId(report.node.id, knowledge.id),
      dataSourceNote: appendCollectorNote(knowledge.dataSourceNote, report.node.name)
    })),
    schedules: (detail?.schedules || []).map((schedule) => ({
      ...schedule,
      id: prefixCollectorId(report.node.id, schedule.id),
      dataSourceNote: appendCollectorNote(schedule.dataSourceNote, report.node.name)
    })),
    recentRuns: (detail?.recentRuns || []).map((run) => ({
      ...run,
      id: prefixCollectorId(report.node.id, run.id),
      dataSourceNote: appendCollectorNote(run.dataSourceNote, report.node.name)
    })),
    auditLog: (detail?.auditLog || []).map((log) => ({
      ...log,
      id: prefixCollectorId(report.node.id, log.id),
      dataSourceNote: appendCollectorNote(log.dataSourceNote, report.node.name)
    }))
  };
}

function normalizeCollectorRunDetail(
  raw: unknown,
  report: CollectorNodeReport
): ControlCenterRunDetail | null {
  const detail = raw as Partial<ControlCenterRunDetail> | null;
  const rawSteps = (detail?.steps || []) as Array<
    Partial<ControlCenterRunDetail["steps"][number]>
  >;
  const rawSkillCalls = (detail?.skillCalls || []) as Array<
    Partial<ControlCenterRunDetail["skillCalls"][number]>
  >;
  const base = normalizeCollectorRun(raw, report);
  if (!base) {
    return null;
  }

  return {
    ...base,
    triggeredBy: detail?.triggeredBy || base.sourcePlatform,
    endTime: detail?.endTime || base.startTime,
    inputParams: detail?.inputParams || {},
    outputResult: detail?.outputResult || base.outputSummary,
    errorMessage: detail?.errorMessage || null,
    steps: rawSteps.map((step) => ({
      ...step,
      id: prefixCollectorId(report.node.id, step.id || "step"),
      name: step.name || "collector-step",
      status: step.status || "success",
      startTime: step.startTime || base.startTime,
      duration: step.duration || "—",
      detail: step.detail || "远端节点步骤",
      dataSource: step.dataSource || "live",
      dataSourceNote: appendCollectorNote(step.dataSourceNote, report.node.name)
    })),
    skillCalls: rawSkillCalls.map((skill) => ({
      ...skill,
      id: prefixCollectorId(report.node.id, skill.id || "skill"),
      skillName: skill.skillName || "collector-skill",
      result: skill.result || "success",
      duration: skill.duration || "—",
      input: skill.input || "",
      output: skill.output || "",
      dataSource: skill.dataSource || "live",
      dataSourceNote: appendCollectorNote(skill.dataSourceNote, report.node.name)
    })),
    logs: detail?.logs || [],
    audit: (detail?.audit || []).map((entry) => ({
      ...entry,
      dataSourceNote: appendCollectorNote(entry.dataSourceNote, report.node.name)
    }))
  };
}

function buildCollectorAggregation(reports: CollectorNodeReport[], now: Date) {
  return {
    nodes: normalizeCollectorNodes(reports, now),
    agents: reports.flatMap((report) => (report.agents || []).map((item) => normalizeCollectorAgent(item, report)).filter(Boolean) as ControlCenterAgentListItem[]),
    agentDetails: reports.flatMap((report) => (report.agentDetails || []).map((item) => normalizeCollectorAgentDetail(item, report)).filter(Boolean) as ControlCenterAgentDetail[]),
    runs: reports.flatMap((report) => (report.runs || []).map((item) => normalizeCollectorRun(item, report)).filter(Boolean) as ControlCenterRunListItem[]),
    runDetails: reports.flatMap((report) => (report.runDetails || []).map((item) => normalizeCollectorRunDetail(item, report)).filter(Boolean) as ControlCenterRunDetail[]),
    schedules: reports.flatMap((report) => (report.schedules || []).map((item) => normalizeCollectorSchedule(item, report)).filter(Boolean) as ControlCenterScheduleListItem[])
  };
}

async function loadOpenClawSnapshot(openclawHome: string) {
  const [config, rawStatus] = await Promise.all([
    readJsonFile<OpenClawConfig>(path.join(openclawHome, "openclaw.json"), {}),
    readTextFile(path.join(openclawHome, "maintenance", "openclaw-status.txt"))
  ]);

  return {
    config,
    status: parseOpenClawStatus(rawStatus)
  };
}

export function createControlCenterService(options: ControlCenterServiceOptions = {}) {
  const openclawHome = options.openclawHome ? path.resolve(options.openclawHome) : defaultOpenClawHome();
  const controlPlaneProvider = options.controlPlaneProvider || defaultControlPlaneProvider;
  const nowProvider = options.now || (() => new Date());
  const collectorStorePath = options.collectorStorePath
    ? path.resolve(options.collectorStorePath)
    : defaultCollectorStorePath();
  const includeCollectorReports = options.includeCollectorReports ?? true;
  const sourceMode = options.sourceMode || ((process.env.CONTROL_CENTER_SOURCE_MODE as "local" | "hybrid" | "collector" | undefined) ?? "local");

  async function loadContext() {
    const now = nowProvider();
    const [{ config, status }, fallback] = await Promise.all([
      loadOpenClawSnapshot(openclawHome),
      controlPlaneProvider()
    ]);
    const localEnabled = sourceMode !== "collector";
    const collectorEnabled = includeCollectorReports && sourceMode !== "local";
    const liveAgents = localEnabled ? await loadLiveAgents(openclawHome, config, now) : [];
    const liveEmployees = liveAgents.length > 0 ? [buildEmployeeContext(liveAgents, fallback)] : [];
    const collectorReports = collectorEnabled ? await readCollectorReports(collectorStorePath) : [];
    const collectors = buildCollectorAggregation(collectorReports, now);
    return {
      now,
      config,
      status,
      fallback,
      liveAgents,
      liveEmployees,
      collectors
    };
  }

  return {
    async listAgents(): Promise<ControlCenterAgentListItem[]> {
      const { liveEmployees, collectors } = await loadContext();
      return [...liveEmployees.map((agent) => buildAgentListItem(agent)), ...collectors.agents];
    },

    async getAgentDetail(agentId: string): Promise<ControlCenterAgentDetail | null> {
      const { liveEmployees, fallback, collectors } = await loadContext();
      const context = liveEmployees.find((agent) => agent.employeeId === agentId);

      if (!context) {
        return collectors.agentDetails.find((detail) => detail.id === agentId) || null;
      }

      const primaryAgent = context.channels[0]!;
      const detailChannels = await buildDetailChannels(context, openclawHome, nowProvider());
      const relatedAgentIds = new Set([agentId, ...context.channels.map((channel) => channel.agentId)]);
      const schedules = (await this.listSchedules()).filter(
        (schedule) => relatedAgentIds.has(schedule.agentId)
      );
      const runs = (await this.listRuns()).filter((run) => run.agentId === agentId).slice(0, 5);

      return {
        ...buildAgentListItem(context),
        description: context.description,
        owner: context.owner,
        createdAt: context.createdAt,
        workCreed: context.workCreed,
        systemPrompt: context.systemPrompt,
        behaviorRules: context.behaviorRules,
        outputStyle: context.outputStyle,
        machine: context.machine,
        channels: detailChannels,
        skills: context.resolvedSkills.map((skill, index) => ({
          id: `${agentId}-skill-${index + 1}`,
          name: skill.name || `Skill ${index + 1}`,
          category: skill.source || "live",
          status: "active",
          dataSource: "live"
        })),
        knowledgeSources: Array.from(
          new Map(
            [
              ...context.channels.flatMap((channel) =>
                channel.memoryConnected
                  ? [
                      {
                        id: `${agentId}-${channel.agentId}-memory`,
                        name: `${channel.agentId}.sqlite`,
                        type: "memory",
                        lastSync: context.lastRunTime,
                        dataSource: "live" as const
                      }
                    ]
                  : []
              ),
              ...context.workspaceFiles.map((file) => ({
                id: `${agentId}-${file.name}`,
                name: file.name,
                type: "workspace",
                lastSync: file.modifiedAt,
                dataSource: "live" as const
              }))
            ].map((item) => [item.id, item] as const)
          ).values()
        ),
        schedules: schedules.map((schedule) => ({
          id: schedule.id,
          name: schedule.name,
          cron: schedule.cron,
          nextRun: schedule.nextRun,
          enabled: schedule.status === "active",
          dataSource: schedule.dataSource,
          dataSourceNote: schedule.dataSourceNote
        })),
        recentRuns: runs.map((run) => ({
          id: run.id,
          taskName: run.taskName,
          status: run.status,
          time: run.startTime,
          duration: run.duration,
          dataSource: run.dataSource,
          dataSourceNote: run.dataSourceNote
        })),
        auditLog: [
          {
            id: `${agentId}-audit-session`,
            user: "OpenClaw",
            action: "更新最近会话",
            time: context.lastRunTime,
            detail: `最近会话状态：${context.lastRunStatus || "unknown"}`,
            dataSource: "live"
          },
          {
            id: `${agentId}-audit-fallback`,
            user: "Control Plane",
            action: "保留历史配置",
            time: fallback.server.host,
            detail: "部分档案字段仍来自控制面 mock/fallback 兼容层",
            dataSource: "mock",
            dataSourceNote: "员工档案字段尚未全部沉淀到 OpenClaw runtime"
          }
        ]
      };
    },

    async listRuns(): Promise<ControlCenterRunListItem[]> {
      const { liveEmployees, fallback, now, collectors } = await loadContext();
      const liveRuns = await buildLiveRuns(liveEmployees, openclawHome, now);
      const fallbackRuns = buildFallbackRuns(fallback);
      return [...liveRuns, ...collectors.runs, ...fallbackRuns].sort((left, right) => right.startTime.localeCompare(left.startTime));
    },

    async getRunDetail(runId: string): Promise<ControlCenterRunDetail | null> {
      const { collectors } = await loadContext();
      const collectorRun = collectors.runDetails.find((item) => item.id === runId);
      if (collectorRun) {
        return collectorRun;
      }

      const runs = await this.listRuns();
      const run = runs.find((item) => item.id === runId);

      if (!run) {
        return null;
      }

      return {
        ...run,
        triggeredBy: run.triggerSource === "chat" ? run.sourcePlatform : "控制台",
        endTime: run.startTime,
        inputParams: {
          agentId: run.agentId,
          sourcePlatform: run.sourcePlatform,
          triggerSource: run.triggerSource
        },
        outputResult: run.outputSummary,
        errorMessage: run.status === "failed" ? "最近一轮执行被标记为失败，请结合 OpenClaw 日志继续排查。" : null,
        memorySummary: run.memorySummary,
        versionDiff: run.versionDiff,
        steps: [
          {
            id: `${run.id}-step-1`,
            name: "接收会话上下文",
            status: "success",
            startTime: run.startTime,
            duration: "1s",
            detail: "已从 OpenClaw session store 读取上下文。",
            dataSource: run.dataSource,
            dataSourceNote: run.dataSourceNote
          },
          {
            id: `${run.id}-step-2`,
            name: "生成工作摘要",
            status: run.status,
            startTime: run.startTime,
            duration: run.duration,
            detail: run.outputSummary,
            dataSource: run.dataSource,
            dataSourceNote: run.dataSourceNote
          }
        ],
        skillCalls: [
          {
            id: `${run.id}-skill-1`,
            skillName: "session-history",
            result: "success",
            duration: "1s",
            input: run.conversationTopic,
            output: run.outputSummary,
            dataSource: run.dataSource,
            dataSourceNote: run.dataSourceNote
          }
        ],
        logs: [
          {
            time: run.startTime,
            level: "info",
            message: `记录来源：${run.dataSource === "live" ? "OpenClaw session" : "control-plane fallback"}`
          }
        ],
        audit: [
          {
            user: "Control Center",
            action: "读取记录",
            time: formatDateTime(new Date()),
            dataSource: run.dataSource,
            dataSourceNote: run.dataSourceNote
          }
        ]
      };
    },

    async listSchedules(): Promise<ControlCenterScheduleListItem[]> {
      const { fallback, collectors } = await loadContext();
      const jobs = await readJsonFile<{ version?: number; jobs?: unknown[] }>(
        path.join(openclawHome, "cron", "jobs.json"),
        { jobs: [] }
      );

      if (!Array.isArray(jobs.jobs) || jobs.jobs.length === 0) {
        return [...collectors.schedules, ...buildFallbackSchedules(fallback)];
      }

      const localSchedules: ControlCenterScheduleListItem[] = jobs.jobs.map((job, index) => {
        const record = job as Record<string, unknown>;
        const cron = String(record.cron || record.expression || record.schedule || "* * * * *");
        const enabled = record.enabled !== false && record.status !== "paused";
        const lastResult =
          record.lastOutcome === "failed"
            ? "failed"
            : record.lastOutcome === "running"
              ? "running"
              : record.lastOutcome === "cancelled"
                ? "cancelled"
                : "success";

        return {
          id: String(record.id || `job-${index + 1}`),
          name: String(record.name || record.title || `OpenClaw Job ${index + 1}`),
          agentName: String(record.agentName || record.agentId || "OpenClaw Agent"),
          agentId: String(record.agentId || record.agentName || "unknown"),
          cron,
          frequency: humanizeCron(cron),
          status: enabled ? (lastResult === "failed" ? "error" : "active") : "paused",
          nextRun: String(record.nextRunAt || record.nextRun || "—"),
          lastRunResult: lastResult,
          lastRunTime: String(record.lastRunAt || record.lastRun || "—"),
          consecutiveSuccess: Number(record.consecutiveSuccess || 0),
          totalRuns: Number(record.totalRuns || 0),
          failedRuns: Number(record.failedRuns || 0),
          dataSource: "live"
        };
      });

      return [...localSchedules, ...collectors.schedules];
    },

    async getSettings(): Promise<ControlCenterSettings> {
      const { config, status, fallback, collectors } = await loadContext();
      const settings = buildSettings(config, status, fallback);
      const localNode: ControlCenterNodeInfo = {
        id: prefixCollectorId("local-node", "node"),
        name: settings.deployInfo.host,
        host: settings.deployInfo.host,
        status: "healthy",
        lastCollectedAt: formatDateTime(nowProvider()),
        agentCount: sourceMode === "collector" ? 0 : 1,
        runCount: 0,
        dataSource: sourceMode === "collector" ? "mock" : "live",
        dataSourceNote: sourceMode === "collector" ? "当前节点以采集器模式运行，本地直读结果不计入展示。" : undefined
      };

      return {
        ...settings,
        nodes: sourceMode === "collector" ? collectors.nodes : [localNode, ...collectors.nodes]
      };
    },

    async getDashboard(): Promise<ControlCenterDashboard> {
      const { fallback, status } = await loadContext();
      const [agents, runs, schedules] = await Promise.all([
        this.listAgents(),
        this.listRuns(),
        this.listSchedules()
      ]);

      const services = buildServices(status, fallback, nowProvider());
      const liveSkillNames = new Set<string>();
      agents.forEach((agent) => {
        agent.specialties.forEach((skill) => liveSkillNames.add(skill));
      });

      const failedRuns = runs.filter((run) => run.status === "failed").length;
      const runningRuns = runs.filter((run) => run.status === "running").length;
      const enabledSchedules = schedules.filter((schedule) => schedule.status === "active").length;

      return {
        metrics: [
          {
            label: "数字员工",
            value: agents.length,
            change: 0,
            dataSource: "live"
          },
          {
            label: "Skills 总数",
            value: Math.max(liveSkillNames.size, fallback.skills.length),
            change: 0,
            dataSource: liveSkillNames.size > 0 ? "live" : "mock"
          },
          {
            label: "启用定时任务",
            value: enabledSchedules,
            change: 0,
            dataSource: schedules.some((schedule) => schedule.dataSource === "live") ? "live" : "mock"
          },
          {
            label: "运行中任务",
            value: runningRuns,
            change: 0,
            dataSource: runs.some((run) => run.dataSource === "live") ? "live" : "mock"
          },
          {
            label: "失败任务",
            value: failedRuns,
            change: 0,
            danger: failedRuns > 0,
            dataSource: runs.some((run) => run.dataSource === "live") ? "live" : "mock"
          },
          {
            label: "部署主机",
            value: Math.max(new Set(agents.map((agent) => agent.machine.host)).size, 1),
            change: 0,
            dataSource: agents.length > 0 ? "live" : "mock",
            dataSourceNote: agents.length > 0 ? undefined : "当前仍为单机部署"
          }
        ],
        services,
        risks: status.risks.map((risk, index) => ({
          id: `risk-${index + 1}`,
          level: risk.level,
          message: risk.message,
          time: status.securitySummary,
          dataSource: "live"
        })),
        agents: agents.slice(0, 6).map((agent) => ({
          id: agent.id,
          name: agent.name,
          position: agent.position,
          avatar: agent.avatar,
          status: agent.status,
          skillCount: agent.skillCount,
          lastRun: agent.lastRunTime,
          successRate: agent.successRate,
          dataSource: agent.dataSource,
          dataSourceNote: agent.dataSourceNote,
          mockFields: agent.mockFields
        })),
        runs: runs.slice(0, 8).map((run) => ({
          id: run.id,
          taskName: run.taskName,
          agentName: run.agentName,
          status: run.status,
          startTime: run.startTime,
          duration: run.duration,
          memorySummary: run.memorySummary,
          dataSource: run.dataSource,
          dataSourceNote: run.dataSourceNote
        })),
        schedules: schedules.slice(0, 8).map((schedule) => ({
          id: schedule.id,
          planName: schedule.name,
          agentName: schedule.agentName,
          cron: schedule.cron,
          nextRun: schedule.nextRun,
          lastStatus: schedule.lastRunResult || "success",
          consecutiveSuccess: schedule.consecutiveSuccess,
          dataSource: schedule.dataSource,
          dataSourceNote: schedule.dataSourceNote
        })),
        generatedAt: formatDateTime(nowProvider())
      };
    },

    async buildCollectorReport(node?: { id?: string; name?: string; host?: string }) {
      const localService = createControlCenterService({
        openclawHome,
        controlPlaneProvider,
        now: nowProvider,
        collectorStorePath,
        includeCollectorReports: false,
        sourceMode: "local"
      });
      const [agents, runs, schedules, settings] = await Promise.all([
        localService.listAgents(),
        localService.listRuns(),
        localService.listSchedules(),
        localService.getSettings()
      ]);
      const agentDetails = (await Promise.all(agents.map((agent) => localService.getAgentDetail(agent.id)))).filter(
        Boolean
      ) as ControlCenterAgentDetail[];
      const runDetails = (await Promise.all(runs.map((run) => localService.getRunDetail(run.id)))).filter(
        Boolean
      ) as ControlCenterRunDetail[];

      return {
        node: {
          id: node?.id || slugify(os.hostname()),
          name: node?.name || os.hostname(),
          host: node?.host || os.hostname()
        },
        collectedAt: formatDateTime(nowProvider()),
        agents,
        agentDetails,
        runs,
        runDetails,
        schedules,
        settings
      };
    },

    async ingestCollectorReport(report: CollectorNodeReport) {
      return upsertCollectorReport(collectorStorePath, report);
    }
  };
}
