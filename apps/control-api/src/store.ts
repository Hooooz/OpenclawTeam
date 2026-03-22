import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createAgentRecord,
  createRunRecord,
  createScheduleRecord,
  createSkillRecord,
  seedAgents,
  seedRuns,
  seedSchedules,
  seedServerInfo,
  seedSkills,
  type AgentRecord,
  type CreateAgentInput,
  type CreateScheduleInput,
  type CreateSkillInput,
  type DashboardSnapshot,
  type FocusItem,
  type RunRecord,
  type ScheduleRecord,
  type StartRunResult,
  type ServerInfo,
  type SkillRecord,
  type StatItem
} from "@openclaw/shared";

type ControlPlaneStore = {
  agents: AgentRecord[];
  skills: SkillRecord[];
  schedules: ScheduleRecord[];
  runs: RunRecord[];
  server: ServerInfo;
};

const dataDir = process.env.CONTROL_PLANE_DATA_DIR?.trim()
  ? path.resolve(process.env.CONTROL_PLANE_DATA_DIR)
  : path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "control-plane.json");

const defaultStore: ControlPlaneStore = {
  agents: seedAgents,
  skills: seedSkills,
  schedules: seedSchedules,
  runs: seedRuns,
  server: seedServerInfo
};

async function ensureStoreFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

function normalizeAgents(agents: AgentRecord[]): AgentRecord[] {
  const seedSkillMap = new Map(seedAgents.map((agent) => [agent.id, agent.skillIds]));

  return agents.map((agent) => {
    const fallbackSkillIds = seedSkillMap.get(agent.id) || [];
    const skillIds =
      Array.isArray(agent.skillIds) && agent.skillIds.length > 0
        ? agent.skillIds
        : fallbackSkillIds;

    return {
      ...agent,
      skillIds,
      skillCount: skillIds.length
    };
  });
}

function normalizeRuns(runs: RunRecord[]): RunRecord[] {
  const seenRunIds = new Map<string, number>();
  const seenTraceIds = new Map<string, number>();

  return runs.map((run) => {
    const nextRunCount = (seenRunIds.get(run.id) || 0) + 1;
    const nextTraceCount = (seenTraceIds.get(run.traceId) || 0) + 1;

    seenRunIds.set(run.id, nextRunCount);
    seenTraceIds.set(run.traceId, nextTraceCount);

    return {
      ...run,
      id: nextRunCount === 1 ? run.id : `${run.id}-${nextRunCount}`,
      traceId: nextTraceCount === 1 ? run.traceId : `${run.traceId}-${nextTraceCount}`
    };
  });
}

async function readStore(): Promise<ControlPlaneStore> {
  await ensureStoreFile();
  const raw = await readFile(dataFile, "utf8");
  const store = JSON.parse(raw) as ControlPlaneStore;

  store.agents = normalizeAgents(store.agents);
  store.runs = normalizeRuns(store.runs);
  store.schedules = Array.isArray(store.schedules) ? store.schedules : seedSchedules;

  return store;
}

async function writeStore(store: ControlPlaneStore) {
  store.agents = normalizeAgents(store.agents);
  store.runs = normalizeRuns(store.runs);
  await writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
}

function buildStats(store: ControlPlaneStore): StatItem[] {
  return [
    {
      label: "数字员工",
      value: String(store.agents.length),
      detail: "当前已登记的可管理对象"
    },
    {
      label: "Skills",
      value: String(store.skills.length),
      detail: "已纳入控制面的能力单元"
    },
    {
      label: "调度计划",
      value: String(store.schedules.length),
      detail: "已配置的手动/定时执行入口"
    },
    {
      label: "近 24h Runs",
      value: String(store.runs.length),
      detail: "含成功、失败与运行中任务"
    },
    {
      label: "部署主机",
      value: "1",
      detail: "Windows 单机部署基线已确认"
    }
  ];
}

function buildFocus(): FocusItem[] {
  return [
    {
      title: "后台对象管理",
      detail: "先把 Agent、Skill、Run Record 三个对象做成可见可管。"
    },
    {
      title: "执行闭环",
      detail: "从手动运行到调度计划先跑通，再扩执行器和知识。"
    },
    {
      title: "Windows 部署基线",
      detail: "围绕 Docker Compose 形成首个稳定部署包。"
    }
  ];
}

function parseScheduleDateTime(value: string) {
  const normalized = value.trim().replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatScheduleDateTime(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const store = await readStore();

  return {
    stats: buildStats(store),
    focus: buildFocus(),
    agents: store.agents,
    skills: store.skills,
    schedules: store.schedules,
    runs: store.runs,
    server: store.server
  };
}

export async function listAgents() {
  return (await readStore()).agents;
}

export async function listSkills() {
  return (await readStore()).skills;
}

export async function listSchedules() {
  return (await readStore()).schedules;
}

export async function listRuns() {
  return (await readStore()).runs;
}

export async function getServerInfo() {
  return (await readStore()).server;
}

export async function createAgent(input: CreateAgentInput) {
  const store = await readStore();
  const agent = createAgentRecord(input);

  store.agents = [agent, ...store.agents];
  await writeStore(store);

  return agent;
}

export async function createSkill(input: CreateSkillInput) {
  const store = await readStore();
  const skill = createSkillRecord(input);

  store.skills = [skill, ...store.skills];
  await writeStore(store);

  return skill;
}

export async function createSchedule(input: CreateScheduleInput) {
  const store = await readStore();
  const agent = store.agents.find((item) => item.id === input.agentId);

  if (!agent) {
    return null;
  }

  const schedule = createScheduleRecord({
    ...input,
    agentName: agent.name
  });

  store.schedules = [schedule, ...store.schedules];
  await writeStore(store);

  return schedule;
}

export async function updateScheduleStatus(
  scheduleId: string,
  status: "active" | "paused"
) {
  const store = await readStore();
  const schedule = store.schedules.find((item) => item.id === scheduleId);

  if (!schedule) {
    return null;
  }

  schedule.status = status;
  await writeStore(store);

  return schedule;
}

export async function updateAgentSkillBindings(agentId: string, skillIds: string[]) {
  const store = await readStore();
  const agent = store.agents.find((item) => item.id === agentId);

  if (!agent) {
    return null;
  }

  const validSkillIds = skillIds.filter((skillId) =>
    store.skills.some((skill) => skill.id === skillId)
  );

  agent.skillIds = Array.from(new Set(validSkillIds));
  agent.skillCount = agent.skillIds.length;

  await writeStore(store);

  return agent;
}

function createRunningRun(agentName: string, triggerType: "manual" | "schedule", summary: string) {
  return createRunRecord({
    agentName,
    triggerType,
    status: "running",
    summary
  });
}

export async function startManualRun(agentId: string): Promise<StartRunResult> {
  const store = await readStore();
  const agent = store.agents.find((item) => item.id === agentId);

  if (!agent) {
    return {
      ok: false,
      code: "AGENT_NOT_FOUND",
      message: "Agent not found"
    };
  }

  if (agent.status === "paused") {
    return {
      ok: false,
      code: "AGENT_PAUSED",
      message: "Agent is paused"
    };
  }

  const run = createRunningRun(agent.name, "manual", "已从控制台手动触发，等待执行器接管。");

  store.runs = [run, ...store.runs];
  await writeStore(store);

  return {
    ok: true,
    run
  };
}

export async function triggerScheduleRun(scheduleId: string): Promise<StartRunResult> {
  const store = await readStore();
  const schedule = store.schedules.find((item) => item.id === scheduleId);

  if (!schedule) {
    return {
      ok: false,
      code: "SCHEDULE_NOT_FOUND",
      message: "Schedule not found"
    };
  }

  if (schedule.status === "paused") {
    return {
      ok: false,
      code: "SCHEDULE_PAUSED",
      message: "Schedule is paused"
    };
  }

  const agent = store.agents.find((item) => item.id === schedule.agentId);

  if (!agent) {
    return {
      ok: false,
      code: "AGENT_NOT_FOUND",
      message: "Agent not found"
    };
  }

  if (agent.status === "paused") {
    return {
      ok: false,
      code: "AGENT_PAUSED",
      message: "Agent is paused"
    };
  }

  const run = createRunningRun(
    agent.name,
    "schedule",
    `已由调度计划「${schedule.name}」触发，等待执行器接管。`
  );

  store.runs = [run, ...store.runs];
  await writeStore(store);

  return {
    ok: true,
    run
  };
}

export async function updateRunStatus(
  runId: string,
  status: "success" | "failed",
  summary: string
) {
  const store = await readStore();
  const run = store.runs.find((item) => item.id === runId);

  if (!run) {
    return null;
  }

  run.status = status;
  run.summary = summary.trim() || run.summary;

  await writeStore(store);

  return run;
}

export async function runDueSchedules(now = formatScheduleDateTime(new Date())) {
  const store = await readStore();
  const nowDate = parseScheduleDateTime(now);

  if (!nowDate) {
    return { runs: [] as RunRecord[] };
  }

  const runs: RunRecord[] = [];

  for (const schedule of store.schedules) {
    if (schedule.status !== "active") {
      continue;
    }

    const dueAt = parseScheduleDateTime(schedule.nextRunAt);
    if (!dueAt || dueAt > nowDate) {
      continue;
    }

    const agent = store.agents.find((item) => item.id === schedule.agentId);
    if (!agent || agent.status === "paused") {
      continue;
    }

    const run = createRunningRun(
      agent.name,
      "schedule",
      `已由到期计划「${schedule.name}」批量触发，等待执行器接管。`
    );

    runs.push(run);
    schedule.nextRunAt = formatScheduleDateTime(
      new Date(dueAt.getTime() + 24 * 60 * 60 * 1000)
    );
  }

  if (runs.length > 0) {
    store.runs = [...runs, ...store.runs];
    await writeStore(store);
  }

  return { runs };
}
