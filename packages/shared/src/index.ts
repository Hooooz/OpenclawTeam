export type AgentRecord = {
  id: string;
  name: string;
  status: "active" | "paused";
  model: string;
  skillCount: number;
  skillIds: string[];
  summary: string;
};

export type CreateAgentInput = {
  name: string;
  model: string;
  summary: string;
  status?: "active" | "paused";
};

export type SkillRecord = {
  id: string;
  name: string;
  category: string;
  version: string;
  status: "active" | "draft";
  description: string;
};

export type CreateSkillInput = {
  name: string;
  category: string;
  version: string;
  description: string;
  status?: "active" | "draft";
};

export type TriggerRunInput = {
  agentId: string;
};

export type RunRecord = {
  id: string;
  agentName: string;
  triggerType: "manual" | "schedule";
  status: "success" | "failed" | "running";
  summary: string;
  startedAt: string;
  traceId: string;
};

export type StartRunResult =
  | {
      ok: true;
      run: RunRecord;
    }
  | {
      ok: false;
      code: "AGENT_NOT_FOUND" | "AGENT_PAUSED";
      message: string;
    };

export type FocusItem = {
  title: string;
  detail: string;
};

export type StatItem = {
  label: string;
  value: string;
  detail: string;
};

export type ServerInfo = {
  host: string;
  os: string;
  containerRuntime: string;
  repository: string;
};

export type DashboardSnapshot = {
  stats: StatItem[];
  focus: FocusItem[];
  agents: AgentRecord[];
  skills: SkillRecord[];
  runs: RunRecord[];
  server: ServerInfo;
};

export const seedSkills: SkillRecord[] = [
  {
    id: "skill-docx",
    name: "docx",
    category: "document",
    version: "1.0.0",
    status: "active",
    description: "处理专业文档的创建、编辑和结构化输出。"
  },
  {
    id: "skill-xlsx",
    name: "xlsx",
    category: "spreadsheet",
    version: "1.0.0",
    status: "active",
    description: "用于表格分析、结构化数据写回和批量更新。"
  },
  {
    id: "skill-browser",
    name: "agent-browser",
    category: "browser",
    version: "1.0.0",
    status: "active",
    description: "用于网页登录、测试和流程自动化。"
  },
  {
    id: "skill-research",
    name: "research",
    category: "analysis",
    version: "1.0.0",
    status: "draft",
    description: "多来源检索和带引用研究输出。"
  }
];

export const seedAgents: AgentRecord[] = [
  {
    id: "agent-ops-daily",
    name: "运营日报助手",
    status: "active",
    model: "gpt-5.4-mini",
    skillCount: 4,
    skillIds: ["skill-docx", "skill-xlsx", "skill-browser", "skill-research"],
    summary: "定时汇总内部素材并生成日报。"
  },
  {
    id: "agent-skill-audit",
    name: "Skill 巡检助手",
    status: "active",
    model: "gpt-5.4",
    skillCount: 3,
    skillIds: ["skill-browser", "skill-research", "skill-docx"],
    summary: "检查技能调用状态和最近失败记录。"
  },
  {
    id: "agent-doc-backfill",
    name: "文档补全助手",
    status: "paused",
    model: "gpt-5.4-mini",
    skillCount: 2,
    skillIds: ["skill-docx", "skill-xlsx"],
    summary: "辅助维护项目文档和待办清单。"
  }
];

export const seedRuns: RunRecord[] = [
  {
    id: "run-20260322-001",
    agentName: "运营日报助手",
    triggerType: "schedule",
    status: "success",
    summary: "日报生成完成，已写入内部工作区。",
    startedAt: "2026-03-22 10:00",
    traceId: "trace-ops-1000"
  },
  {
    id: "run-20260322-002",
    agentName: "Skill 巡检助手",
    triggerType: "manual",
    status: "running",
    summary: "正在检查最近 24 小时失败调用。",
    startedAt: "2026-03-22 14:12",
    traceId: "trace-skill-1412"
  },
  {
    id: "run-20260322-003",
    agentName: "文档补全助手",
    triggerType: "manual",
    status: "failed",
    summary: "知识源未绑定，任务中止。",
    startedAt: "2026-03-22 13:48",
    traceId: "trace-doc-1348"
  }
];

export const seedServerInfo: ServerInfo = {
  host: "192.168.31.189",
  os: "Windows 11 Pro",
  containerRuntime: "Docker 29.2.0 / Compose v5.0.2",
  repository: "https://github.com/Hooooz/OpenclawTeam.git"
};

export function createAgentRecord(input: CreateAgentInput): AgentRecord {
  const slug = input.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    id: `agent-${slug || Date.now()}`,
    name: input.name.trim(),
    status: input.status || "active",
    model: input.model.trim(),
    skillCount: 0,
    skillIds: [],
    summary: input.summary.trim()
  };
}

export function createSkillRecord(input: CreateSkillInput): SkillRecord {
  const slug = input.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    id: `skill-${slug || Date.now()}`,
    name: input.name.trim(),
    category: input.category.trim(),
    version: input.version.trim(),
    status: input.status || "draft",
    description: input.description.trim()
  };
}

export function createRunRecord(input: {
  agentName: string;
  triggerType: "manual" | "schedule";
  status?: "success" | "failed" | "running";
  summary: string;
}) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const startedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  return {
    id: `run-${timestamp}`,
    agentName: input.agentName,
    triggerType: input.triggerType,
    status: input.status || "running",
    summary: input.summary,
    startedAt,
    traceId: `trace-${timestamp.toLowerCase()}`
  } satisfies RunRecord;
}
