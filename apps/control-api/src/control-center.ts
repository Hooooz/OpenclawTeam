import { access, readFile, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getDashboardSnapshot } from "./store.js";

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
} & Provenance;

export type ControlCenterAgentDetail = ControlCenterAgentListItem & {
  description: string;
  owner: string;
  createdAt: string;
  workCreed: string;
  systemPrompt: string;
  behaviorRules: string[];
  outputStyle: string;
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
};

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
};

function defaultOpenClawHome() {
  return process.env.OPENCLAW_HOME?.trim()
    ? path.resolve(process.env.OPENCLAW_HOME)
    : path.resolve(os.homedir(), ".openclaw");
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
    memoryConnected
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

function buildAgentListItem(context: LiveAgentContext): ControlCenterAgentListItem {
  return {
    id: context.agentId,
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
    dataSource: "live",
    mockFields: context.mockFields
  };
}

async function buildLiveRuns(contexts: LiveAgentContext[], openclawHome: string, now: Date) {
  const runs: ControlCenterRunListItem[] = [];

  for (const context of contexts) {
    for (const [, sessionRecord] of context.sessionEntries) {
      const sessionFilePath = path.join(
        openclawHome,
        "agents",
        context.agentId,
        "sessions",
        `${sessionRecord.sessionId || "session"}.jsonl`
      );
      const summary = await readSessionFileSummary(sessionFilePath);
      const startTime = summary.firstTimestamp || (sessionRecord.updatedAt ? new Date(sessionRecord.updatedAt) : null);
      const endTime = summary.lastTimestamp || (sessionRecord.updatedAt ? new Date(sessionRecord.updatedAt) : startTime);
      const status = deriveRunStatus(sessionRecord, now);
      const topic = cleanConversationText(summary.firstUserText || `${context.displayName} 对话线程`, 60);
      const outputSummary = cleanConversationText(
        summary.lastAssistantText || "最近一轮输出还未沉淀到可读摘要。",
        80
      );

      runs.push({
        id: sessionRecord.sessionId || `${context.agentId}-${Math.random().toString(36).slice(2, 8)}`,
        runId: (sessionRecord.sessionId || "session").toUpperCase(),
        agentName: context.displayName,
        agentPosition: context.position,
        agentId: context.agentId,
        triggerSource: deriveTriggerSource(sessionRecord),
        startTime: formatDateTime(startTime),
        duration: formatDuration(startTime, endTime),
        status,
        outputSummary,
        traceId: `trace-${sessionRecord.sessionId || context.agentId}`,
        taskName: `${mapSurfaceLabel(sessionRecord.origin?.surface)}对话处理`,
        conversationTopic: topic,
        memorySummary: context.memoryConnected ? "已连接 OpenClaw memory" : "未接入独立记忆库",
        versionDiff: "—",
        sourcePlatform: mapSurfaceLabel(sessionRecord.origin?.surface),
        dataSource: "live"
      });
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
    systemConfigs
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

  async function loadContext() {
    const now = nowProvider();
    const [{ config, status }, fallback] = await Promise.all([
      loadOpenClawSnapshot(openclawHome),
      controlPlaneProvider()
    ]);
    const liveAgents = await loadLiveAgents(openclawHome, config, now);
    return {
      now,
      config,
      status,
      fallback,
      liveAgents
    };
  }

  return {
    async listAgents(): Promise<ControlCenterAgentListItem[]> {
      const { liveAgents } = await loadContext();
      return liveAgents.map((agent) => buildAgentListItem(agent));
    },

    async getAgentDetail(agentId: string): Promise<ControlCenterAgentDetail | null> {
      const { liveAgents, fallback } = await loadContext();
      const context = liveAgents.find((agent) => agent.agentId === agentId);

      if (!context) {
        return null;
      }

      const schedules = (await this.listSchedules()).filter((schedule) => schedule.agentId === agentId);
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
        skills: context.resolvedSkills.map((skill, index) => ({
          id: `${agentId}-skill-${index + 1}`,
          name: skill.name || `Skill ${index + 1}`,
          category: skill.source || "live",
          status: "active",
          dataSource: "live"
        })),
        knowledgeSources: [
          ...(context.memoryConnected
            ? [
                {
                  id: `${agentId}-memory`,
                  name: `${agentId}.sqlite`,
                  type: "memory",
                  lastSync: context.lastRunTime,
                  dataSource: "live" as const
                }
              ]
            : []),
          ...context.workspaceFiles.map((file) => ({
            id: `${agentId}-${file.name}`,
            name: file.name,
            type: "workspace",
            lastSync: file.modifiedAt,
            dataSource: "live" as const
          }))
        ],
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
      const { liveAgents, fallback, now } = await loadContext();
      const liveRuns = await buildLiveRuns(liveAgents, openclawHome, now);
      const fallbackRuns = buildFallbackRuns(fallback);
      return [...liveRuns, ...fallbackRuns].sort((left, right) => right.startTime.localeCompare(left.startTime));
    },

    async getRunDetail(runId: string): Promise<ControlCenterRunDetail | null> {
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
      const { fallback } = await loadContext();
      const jobs = await readJsonFile<{ version?: number; jobs?: unknown[] }>(
        path.join(openclawHome, "cron", "jobs.json"),
        { jobs: [] }
      );

      if (!Array.isArray(jobs.jobs) || jobs.jobs.length === 0) {
        return buildFallbackSchedules(fallback);
      }

      return jobs.jobs.map((job, index) => {
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
    },

    async getSettings(): Promise<ControlCenterSettings> {
      const { config, status, fallback } = await loadContext();
      return buildSettings(config, status, fallback);
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
            value: 1,
            change: 0,
            dataSource: "mock",
            dataSourceNote: "当前仍为单机部署"
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
    }
  };
}
