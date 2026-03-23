export type DataSource = "live" | "mock";

export type Provenance = {
  dataSource?: DataSource;
  dataSourceNote?: string;
  mockFields?: string[];
};

type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

export type MetricItem = {
  label: string;
  value: number;
  unit?: string;
  change: number;
  danger?: boolean;
} & Provenance;

export type ServiceHealth = {
  name: string;
  status: "healthy" | "degraded" | "down";
  lastHeartbeat: string;
} & Provenance;

export type RiskItem = {
  id: string;
  level: "high" | "medium" | "low";
  message: string;
  time: string;
} & Provenance;

export type AgentStatus = "running" | "idle" | "paused" | "error";
export type RunStatus = "success" | "running" | "failed" | "cancelled";
export type TriggerSource = "manual" | "timed-task" | "template" | "chat";

export type DashboardAgentSummary = {
  id: string;
  name: string;
  position: string;
  avatar: string;
  status: AgentStatus;
  skillCount: number;
  lastRun: string;
  successRate: number;
} & Provenance;

export type DashboardRunRecord = {
  id: string;
  taskName: string;
  agentName: string;
  status: RunStatus;
  startTime: string;
  duration: string;
  memorySummary?: string;
} & Provenance;

export type DashboardScheduleItem = {
  id: string;
  planName: string;
  agentName: string;
  cron: string;
  nextRun: string;
  lastStatus: RunStatus;
  consecutiveSuccess: number;
} & Provenance;

export type DashboardData = {
  metrics: MetricItem[];
  services: ServiceHealth[];
  risks: RiskItem[];
  agents: DashboardAgentSummary[];
  runs: DashboardRunRecord[];
  schedules: DashboardScheduleItem[];
  generatedAt: string;
};

export type AgentListItem = {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar: string;
  motto: string;
  role: string;
  status: AgentStatus;
  model: string;
  skillCount: number;
  knowledgeCount: number;
  lastRunTime: string;
  lastRunStatus: RunStatus | null;
  successRate: number;
  group: string;
  communicationStyle: string;
  specialties: string[];
} & Provenance;

export type AgentDetail = AgentListItem & {
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
  recentRuns: Array<{ id: string; taskName: string; status: RunStatus; time: string; duration: string } & Provenance>;
  auditLog: Array<{ id: string; user: string; action: string; time: string; detail: string } & Provenance>;
};

export type RunListItem = {
  id: string;
  runId: string;
  agentName: string;
  agentPosition: string;
  agentId: string;
  triggerSource: TriggerSource;
  startTime: string;
  duration: string;
  status: RunStatus;
  outputSummary: string;
  traceId: string;
  taskName: string;
  conversationTopic: string;
  memorySummary: string;
  versionDiff: string;
  sourcePlatform: string;
} & Provenance;

export type RunDetail = RunListItem & {
  triggeredBy: string;
  endTime: string;
  inputParams: Record<string, string>;
  outputResult: string;
  errorMessage: string | null;
  steps: Array<{ id: string; name: string; status: string; startTime: string; duration: string; detail: string } & Provenance>;
  skillCalls: Array<{ id: string; skillName: string; result: string; duration: string; input: string; output: string } & Provenance>;
  logs: Array<{ time: string; level: string; message: string }>;
  audit: Array<{ user: string; action: string; time: string } & Provenance>;
};

export type ScheduleListItem = {
  id: string;
  name: string;
  agentName: string;
  agentId: string;
  cron: string;
  frequency: string;
  status: "active" | "paused" | "error";
  nextRun: string;
  lastRunResult: RunStatus | null;
  lastRunTime: string;
  consecutiveSuccess: number;
  totalRuns: number;
  failedRuns: number;
} & Provenance;

export type DeployInfo = {
  host: string;
  os: string;
  runtime: string;
  repo: string;
  lastDeploy: string;
  version: string;
  ports: Array<{ service: string; port: number; protocol: string } & Provenance>;
} & Provenance;

export type SystemConfig = {
  key: string;
  label: string;
  value: string;
  editable: boolean;
  category: string;
} & Provenance;

export type SettingsData = {
  deployInfo: DeployInfo;
  services: ServiceHealth[];
  systemConfigs: SystemConfig[];
};

function getControlCenterBaseUrl() {
  const envUrl = import.meta.env.VITE_CONTROL_CENTER_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3201/api/control-center`;
  }

  return "http://127.0.0.1:3201/api/control-center";
}

async function fetchEnvelope<T>(pathname: string) {
  const response = await fetch(`${getControlCenterBaseUrl()}${pathname}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!payload.ok) {
    throw new Error(payload.message || "Control center API returned an error");
  }

  return payload.data;
}

export function toMockProvenance(dataSourceNote: string, mockFields: string[] = []): Provenance {
  return {
    dataSource: "mock",
    dataSourceNote,
    mockFields,
  };
}

export function withMockProvenance<T extends object>(
  items: T[],
  dataSourceNote: string,
  mockFields: string[] = [],
): Array<T & Provenance> {
  return items.map((item) => ({
    ...item,
    ...toMockProvenance(dataSourceNote, mockFields),
  }));
}

export function takeMockItems<T>(items: T[], count = 1) {
  return items.slice(0, Math.max(count, 0));
}

export function collectMockNotes(items: Array<Partial<Provenance> | null | undefined>) {
  return [...new Set(items.map((item) => item?.dataSourceNote?.trim()).filter(Boolean) as string[])];
}

export async function fetchControlCenterDashboard() {
  return fetchEnvelope<DashboardData>("/dashboard");
}

export async function fetchControlCenterAgents() {
  return fetchEnvelope<AgentListItem[]>("/agents");
}

export async function fetchControlCenterAgentDetail(agentId: string) {
  return fetchEnvelope<AgentDetail>(`/agents/${encodeURIComponent(agentId)}`);
}

export async function fetchControlCenterRuns() {
  return fetchEnvelope<RunListItem[]>("/runs");
}

export async function fetchControlCenterRunDetail(runId: string) {
  return fetchEnvelope<RunDetail>(`/runs/${encodeURIComponent(runId)}`);
}

export async function fetchControlCenterSchedules() {
  return fetchEnvelope<ScheduleListItem[]>("/schedules");
}

export async function fetchControlCenterSettings() {
  return fetchEnvelope<SettingsData>("/settings");
}
