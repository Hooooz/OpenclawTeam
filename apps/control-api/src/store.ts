import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createAgentRecord,
  seedAgents,
  seedRuns,
  seedServerInfo,
  seedSkills,
  type AgentRecord,
  type CreateAgentInput,
  type DashboardSnapshot,
  type RunRecord,
  type ServerInfo,
  type SkillRecord
} from "@openclaw/shared";

type ControlPlaneStore = {
  agents: AgentRecord[];
  skills: SkillRecord[];
  runs: RunRecord[];
  server: ServerInfo;
};

const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "control-plane.json");

const defaultStore: ControlPlaneStore = {
  agents: seedAgents,
  skills: seedSkills,
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

async function readStore(): Promise<ControlPlaneStore> {
  await ensureStoreFile();
  const raw = await readFile(dataFile, "utf8");
  return JSON.parse(raw) as ControlPlaneStore;
}

async function writeStore(store: ControlPlaneStore) {
  await writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const store = await readStore();

  return {
    stats: [
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
        label: "近 24h Runs",
        value: String(store.runs.length),
        detail: "含成功、失败与运行中任务"
      },
      {
        label: "部署主机",
        value: "1",
        detail: "Windows 单机部署基线已确认"
      }
    ],
    focus: [
      {
        title: "后台对象管理",
        detail: "先把 Agent、Skill、Run Record 三个对象做成可见可管。"
      },
      {
        title: "执行闭环",
        detail: "从手动运行到错误回执先跑通，再扩调度和知识。"
      },
      {
        title: "Windows 部署基线",
        detail: "围绕 Docker Compose 形成首个稳定部署包。"
      }
    ],
    agents: store.agents,
    skills: store.skills,
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
