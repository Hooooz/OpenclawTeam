import type {
  AgentRecord,
  CreateAgentInput,
  CreateScheduleInput,
  CreateSkillInput,
  DashboardSnapshot,
  FocusItem,
  RunRecord,
  ScheduleRecord,
  SchedulerStatus,
  ServerInfo,
  SkillRecord,
  StatItem,
  TriggerRunInput
} from "@openclaw/shared";

export type DataSource = "live" | "mock";

export type ProvenanceRecord = {
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
} & ProvenanceRecord;

export type ControlCenterServiceHealth = {
  name: string;
  status: "healthy" | "degraded" | "down";
  lastHeartbeat: string;
} & ProvenanceRecord;

export type ControlCenterRiskItem = {
  id: string;
  level: "high" | "medium" | "low";
  message: string;
  time: string;
} & ProvenanceRecord;

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
} & ProvenanceRecord;

export type ControlCenterAgentDetail = ControlCenterAgentListItem & {
  description: string;
  owner: string;
  createdAt: string;
  workCreed: string;
  systemPrompt: string;
  behaviorRules: string[];
  outputStyle: string;
  skills: Array<{ id: string; name: string; category: string; status: string } & ProvenanceRecord>;
  knowledgeSources: Array<{ id: string; name: string; type: string; lastSync: string } & ProvenanceRecord>;
  schedules: Array<{ id: string; name: string; cron: string; nextRun: string; enabled: boolean } & ProvenanceRecord>;
  recentRuns: Array<{
    id: string;
    taskName: string;
    status: ControlCenterRunStatus;
    time: string;
    duration: string;
  } & ProvenanceRecord>;
  auditLog: Array<{ id: string; user: string; action: string; time: string; detail: string } & ProvenanceRecord>;
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
} & ProvenanceRecord;

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
  } & ProvenanceRecord>;
  skillCalls: Array<{
    id: string;
    skillName: string;
    result: string;
    duration: string;
    input: string;
    output: string;
  } & ProvenanceRecord>;
  logs: Array<{ time: string; level: string; message: string }>;
  audit: Array<{ user: string; action: string; time: string } & ProvenanceRecord>;
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
} & ProvenanceRecord;

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
  } & ProvenanceRecord>;
  runs: Array<{
    id: string;
    taskName: string;
    agentName: string;
    status: ControlCenterRunStatus;
    startTime: string;
    duration: string;
    memorySummary?: string;
  } & ProvenanceRecord>;
  schedules: Array<{
    id: string;
    planName: string;
    agentName: string;
    cron: string;
    nextRun: string;
    lastStatus: ControlCenterRunStatus;
    consecutiveSuccess: number;
  } & ProvenanceRecord>;
  generatedAt: string;
};

export type ControlCenterSettings = {
  deployInfo: {
    host: string;
    os: string;
    runtime: string;
    repo: string;
    lastDeploy: string;
    version: string;
    ports: Array<{ service: string; port: number; protocol: string } & ProvenanceRecord>;
  } & ProvenanceRecord;
  services: ControlCenterServiceHealth[];
  systemConfigs: Array<{
    key: string;
    label: string;
    value: string;
    editable: boolean;
    category: string;
  } & ProvenanceRecord>;
};

const defaultServerInfo: ServerInfo = {
  host: "192.168.31.189",
  os: "Windows 11 Pro",
  containerRuntime: "Docker 29.2.0 / Compose v5.0.2",
  repository: "https://github.com/Hooooz/OpenclawTeam.git"
};

const defaultSchedulerStatus: SchedulerStatus = {
  taskName: "OpenclawScheduleSweep",
  endpoint: "http://localhost:3001/api/schedules/run-due",
  lastHeartbeatAt: null,
  lastOutcome: "never",
  lastMessage: "调度守护状态暂不可用。"
};

const configuredApiBaseUrl =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE_URL?.trim() || "";

export function resolveApiBaseUrl(
  configuredBaseUrl = configuredApiBaseUrl,
  locationLike: Pick<Location, "protocol" | "hostname"> | null =
    typeof window === "undefined" ? null : window.location
) {
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (!locationLike) {
    return "http://localhost:3001";
  }

  const protocol = locationLike.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${locationLike.hostname}:3001`;
}

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asObject<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  return value && typeof value === "object" ? ({ ...fallback, ...(value as Partial<T>) } as T) : fallback;
}

export function normalizeDashboardSnapshot(
  payload: Partial<DashboardSnapshot>
): DashboardSnapshot {
  return {
    stats: asArray<StatItem>(payload.stats),
    focus: asArray<FocusItem>(payload.focus),
    agents: asArray<AgentRecord>(payload.agents),
    skills: asArray<SkillRecord>(payload.skills),
    schedules: asArray<ScheduleRecord>(payload.schedules),
    runs: asArray<RunRecord>(payload.runs),
    server: payload.server || defaultServerInfo,
    scheduler: {
      ...defaultSchedulerStatus,
      ...(payload.scheduler || {})
    }
  };
}

const API_BASE_URL = resolveApiBaseUrl();

type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

async function fetchJson<T>(pathname: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${pathname}`);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T> | T;
  if (payload && typeof payload === "object" && "ok" in payload && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const payload = await fetchJson<Partial<DashboardSnapshot>>("/api/dashboard");
  return normalizeDashboardSnapshot(payload);
}

export function normalizeControlCenterAgentList(payload: unknown): ControlCenterAgentListItem[] {
  return asArray<ControlCenterAgentListItem>(payload).map((item) =>
    asObject(item, {
      id: "",
      name: "",
      position: "",
      department: "",
      avatar: "?",
      motto: "",
      role: "",
      status: "idle",
      model: "",
      skillCount: 0,
      knowledgeCount: 0,
      lastRunTime: "—",
      lastRunStatus: null,
      successRate: 0,
      group: "",
      communicationStyle: "",
      specialties: [],
      dataSource: "mock",
      mockFields: []
    })
  );
}

export function normalizeControlCenterRunList(payload: unknown): ControlCenterRunListItem[] {
  return asArray<ControlCenterRunListItem>(payload).map((item) =>
    asObject(item, {
      id: "",
      runId: "",
      agentName: "",
      agentPosition: "",
      agentId: "",
      triggerSource: "manual",
      startTime: "—",
      duration: "—",
      status: "running",
      outputSummary: "",
      traceId: "",
      taskName: "",
      conversationTopic: "",
      memorySummary: "",
      versionDiff: "—",
      sourcePlatform: "系统",
      dataSource: "mock"
    })
  );
}

function normalizeControlCenterRunDetail(payload: unknown): ControlCenterRunDetail {
  return asObject(payload, {
    id: "",
    runId: "",
    agentName: "",
    agentPosition: "",
    agentId: "",
    triggerSource: "manual",
    startTime: "—",
    duration: "—",
    status: "running",
    outputSummary: "",
    traceId: "",
    taskName: "",
    conversationTopic: "",
    memorySummary: "",
    versionDiff: "—",
    sourcePlatform: "系统",
    dataSource: "mock",
    triggeredBy: "系统",
    endTime: "—",
    inputParams: {},
    outputResult: "",
    errorMessage: null,
    steps: [],
    skillCalls: [],
    logs: [],
    audit: []
  });
}

function normalizeControlCenterAgentDetail(payload: unknown): ControlCenterAgentDetail {
  return asObject(payload, {
    id: "",
    name: "",
    position: "",
    department: "",
    avatar: "?",
    motto: "",
    role: "",
    status: "idle",
    model: "",
    skillCount: 0,
    knowledgeCount: 0,
    lastRunTime: "—",
    lastRunStatus: null,
    successRate: 0,
    group: "",
    communicationStyle: "",
    specialties: [],
    dataSource: "mock",
    mockFields: [],
    description: "",
    owner: "",
    createdAt: "—",
    workCreed: "",
    systemPrompt: "",
    behaviorRules: [],
    outputStyle: "",
    skills: [],
    knowledgeSources: [],
    schedules: [],
    recentRuns: [],
    auditLog: []
  });
}

function normalizeControlCenterSchedules(payload: unknown): ControlCenterScheduleListItem[] {
  return asArray<ControlCenterScheduleListItem>(payload).map((item) =>
    asObject(item, {
      id: "",
      name: "",
      agentName: "",
      agentId: "",
      cron: "",
      frequency: "",
      status: "paused",
      nextRun: "—",
      lastRunResult: null,
      lastRunTime: "—",
      consecutiveSuccess: 0,
      totalRuns: 0,
      failedRuns: 0,
      dataSource: "mock"
    })
  );
}

function normalizeControlCenterDashboard(payload: unknown): ControlCenterDashboard {
  return asObject(payload, {
    metrics: [],
    services: [],
    risks: [],
    agents: [],
    runs: [],
    schedules: [],
    generatedAt: "—"
  });
}

function normalizeControlCenterSettings(payload: unknown): ControlCenterSettings {
  return asObject(payload, {
    deployInfo: {
      host: "192.168.31.189",
      os: "unknown",
      runtime: "unknown",
      repo: "unknown",
      lastDeploy: "—",
      version: "unknown",
      ports: [],
      dataSource: "mock"
    },
    services: [],
    systemConfigs: []
  });
}

export async function fetchControlCenterDashboard() {
  return normalizeControlCenterDashboard(await fetchJson("/api/control-center/dashboard"));
}

export async function fetchControlCenterAgents() {
  return normalizeControlCenterAgentList(await fetchJson("/api/control-center/agents"));
}

export async function fetchControlCenterAgentDetail(agentId: string) {
  return normalizeControlCenterAgentDetail(
    await fetchJson(`/api/control-center/agents/${agentId}`)
  );
}

export async function fetchControlCenterRuns() {
  return normalizeControlCenterRunList(await fetchJson("/api/control-center/runs"));
}

export async function fetchControlCenterRunDetail(runId: string) {
  return normalizeControlCenterRunDetail(await fetchJson(`/api/control-center/runs/${runId}`));
}

export async function fetchControlCenterSchedules() {
  return normalizeControlCenterSchedules(await fetchJson("/api/control-center/schedules"));
}

export async function fetchControlCenterSettings() {
  return normalizeControlCenterSettings(await fetchJson("/api/control-center/settings"));
}

export async function createAgent(input: CreateAgentInput) {
  const response = await fetch(`${API_BASE_URL}/api/agents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Create agent failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function createSkill(input: CreateSkillInput) {
  const response = await fetch(`${API_BASE_URL}/api/skills`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Create skill failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function createSchedule(input: CreateScheduleInput) {
  const response = await fetch(`${API_BASE_URL}/api/schedules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Create schedule failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function updateScheduleStatus(
  scheduleId: string,
  status: "active" | "paused"
) {
  const response = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    throw new Error(`Update schedule status failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function triggerScheduleRun(scheduleId: string) {
  const response = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}/trigger`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Trigger schedule run failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function updateRunStatus(
  runId: string,
  status: "success" | "failed",
  summary: string
) {
  const response = await fetch(`${API_BASE_URL}/api/runs/${runId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status, summary })
  });

  if (!response.ok) {
    throw new Error(`Update run status failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function runDueSchedules() {
  const response = await fetch(`${API_BASE_URL}/api/schedules/run-due`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    throw new Error(`Run due schedules failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function updateAgentSkillBindings(agentId: string, skillIds: string[]) {
  const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/skills`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ skillIds })
  });

  if (!response.ok) {
    throw new Error(`Update agent skills failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function triggerRun(input: TriggerRunInput) {
  const response = await fetch(`${API_BASE_URL}/api/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Trigger run failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}
