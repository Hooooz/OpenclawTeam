import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import type {
  AgentRecord,
  CreateAgentInput,
  CreateScheduleInput,
  CreateSkillInput,
  DashboardSnapshot,
  RunRecord,
  ScheduleRecord,
  SkillRecord
} from "@openclaw/shared";
import {
  createAgent as createAgentRequest,
  createSchedule as createScheduleRequest,
  createSkill as createSkillRequest,
  fetchDashboardSnapshot,
  triggerRun as triggerRunRequest,
  updateScheduleStatus as updateScheduleStatusRequest,
  updateAgentSkillBindings as updateAgentSkillBindingsRequest
} from "./api";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: DashboardSnapshot }
  | { status: "error"; message: string };

const navItems = [
  { to: "/", label: "控制台" },
  { to: "/agents", label: "数字员工" },
  { to: "/skills", label: "Skills" },
  { to: "/schedules", label: "调度计划" },
  { to: "/runs", label: "运行记录" },
  { to: "/deploy", label: "部署基线" }
];

export function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  async function loadSnapshot() {
    try {
      const data = await fetchDashboardSnapshot();
      setState({ status: "ready", data });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown dashboard loading error";
      setState({ status: "error", message });
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetchDashboardSnapshot()
      .then((data) => !cancelled && setState({ status: "ready", data }))
      .catch(
        (error: Error) => !cancelled && setState({ status: "error", message: error.message })
      );

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateAgent(input: CreateAgentInput) {
    await createAgentRequest(input);
    await loadSnapshot();
  }

  async function handleCreateSkill(input: CreateSkillInput) {
    await createSkillRequest(input);
    await loadSnapshot();
  }

  async function handleCreateSchedule(input: CreateScheduleInput) {
    await createScheduleRequest(input);
    await loadSnapshot();
  }

  async function handleUpdateScheduleStatus(
    scheduleId: string,
    status: "active" | "paused"
  ) {
    await updateScheduleStatusRequest(scheduleId, status);
    await loadSnapshot();
  }

  async function handleUpdateAgentSkills(agentId: string, skillIds: string[]) {
    await updateAgentSkillBindingsRequest(agentId, skillIds);
    await loadSnapshot();
  }

  async function handleTriggerRun(agentId: string) {
    await triggerRunRequest({ agentId });
    await loadSnapshot();
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">OpenClawTeam</p>
          <h1>数字员工管理后台</h1>
          <p className="muted">
            内部控制面，统一管理 Agent、Skills、调度和执行审计。
          </p>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="sidebar-label">部署目标</p>
          <strong>192.168.31.189</strong>
          <p className="muted">Windows 11 + Docker / Node fallback</p>
        </div>
      </aside>

      <main className="main">
        {state.status === "loading" && (
          <div className="panel">
            <p className="muted">正在加载控制面快照...</p>
          </div>
        )}

        {state.status === "error" && (
          <div className="panel panel-danger">
            <h2>控制面 API 不可用</h2>
            <p>{state.message}</p>
          </div>
        )}

        {state.status === "ready" && (
          <Routes>
            <Route path="/" element={<DashboardPage snapshot={state.data} />} />
            <Route
              path="/agents"
              element={
                <AgentsPage
                  agents={state.data.agents}
                  skills={state.data.skills}
                  onCreateAgent={handleCreateAgent}
                  onUpdateAgentSkills={handleUpdateAgentSkills}
                />
              }
            />
            <Route
              path="/skills"
              element={
                <SkillsPage
                  skills={state.data.skills}
                  onCreateSkill={handleCreateSkill}
                />
              }
            />
            <Route
              path="/schedules"
              element={
                <SchedulesPage
                  agents={state.data.agents}
                  onCreateSchedule={handleCreateSchedule}
                  onUpdateScheduleStatus={handleUpdateScheduleStatus}
                  schedules={state.data.schedules}
                />
              }
            />
            <Route
              path="/runs"
              element={
                <RunsPage
                  agents={state.data.agents}
                  onTriggerRun={handleTriggerRun}
                  runs={state.data.runs}
                />
              }
            />
            <Route path="/deploy" element={<DeployPage snapshot={state.data} />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

function DashboardPage({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <div className="page-grid">
      <section className="hero">
        <p className="eyebrow">Control Plane</p>
        <h2>把 OpenClaw 收敛成一个能运营的内部系统</h2>
        <p className="muted">
          当前主线已经进入可写阶段：数字员工、Skills 与绑定关系都可以进后台。
          当前开始补执行入口，手动运行和调度计划都已经进入控制面。
        </p>
      </section>

      <section className="stat-grid">
        {snapshot.stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <p className="stat-label">{stat.label}</p>
            <strong className="stat-value">{stat.value}</strong>
            <p className="muted">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Focus</p>
            <h3>当前实施重点</h3>
          </div>
        </div>
        <ul className="focus-list">
          {snapshot.focus.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SchedulesPage({
  agents,
  onCreateSchedule,
  onUpdateScheduleStatus,
  schedules
}: {
  agents: AgentRecord[];
  onCreateSchedule: (input: CreateScheduleInput) => Promise<void>;
  onUpdateScheduleStatus: (
    scheduleId: string,
    status: "active" | "paused"
  ) => Promise<void>;
  schedules: ScheduleRecord[];
}) {
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState(agents[0]?.id || "");
  const [cron, setCron] = useState("0 9 * * *");
  const [nextRunAt, setNextRunAt] = useState("2026-03-23 09:00");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [submitting, setSubmitting] = useState(false);
  const [savingScheduleId, setSavingScheduleId] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onCreateSchedule({ name, agentId, cron, nextRunAt, summary, status });
      setName("");
      setCron("0 9 * * *");
      setNextRunAt("2026-03-23 09:00");
      setSummary("");
      setStatus("active");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(schedule: ScheduleRecord) {
    setSavingScheduleId(schedule.id);

    try {
      await onUpdateScheduleStatus(
        schedule.id,
        schedule.status === "active" ? "paused" : "active"
      );
    } finally {
      setSavingScheduleId(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Schedule</p>
          <h3>调度计划</h3>
        </div>
        <span className="badge">{schedules.length} 条计划</span>
      </div>

      <form className="schedule-form" onSubmit={handleSubmit}>
        <input
          placeholder="计划名称"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <select value={agentId} onChange={(event) => setAgentId(event.target.value)}>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Cron 表达式"
          required
          value={cron}
          onChange={(event) => setCron(event.target.value)}
        />
        <input
          placeholder="下次执行时间"
          required
          value={nextRunAt}
          onChange={(event) => setNextRunAt(event.target.value)}
        />
        <input
          placeholder="摘要"
          required
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "active" | "paused")}
        >
          <option value="active">active</option>
          <option value="paused">paused</option>
        </select>
        <button disabled={submitting || agents.length === 0} type="submit">
          {submitting ? "创建中..." : "创建计划"}
        </button>
      </form>

      <div className="card-grid">
        {schedules.map((schedule) => (
          <article className="mini-card" key={schedule.id}>
            <div className="mini-card-top">
              <strong>{schedule.name}</strong>
              <span
                className={`badge ${schedule.status === "paused" ? "badge-outline" : ""}`}
              >
                {schedule.status}
              </span>
            </div>
            <p className="muted">{schedule.summary}</p>
            <div className="mini-card-meta">
              <span>{schedule.agentName}</span>
              <span>{schedule.cron}</span>
              <span>{schedule.nextRunAt}</span>
            </div>
            <button
              disabled={savingScheduleId === schedule.id}
              onClick={() => void handleToggle(schedule)}
              type="button"
            >
              {savingScheduleId === schedule.id
                ? "保存中..."
                : schedule.status === "active"
                  ? "暂停计划"
                  : "启用计划"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AgentsPage({
  agents,
  skills,
  onCreateAgent,
  onUpdateAgentSkills
}: {
  agents: AgentRecord[];
  skills: SkillRecord[];
  onCreateAgent: (input: CreateAgentInput) => Promise<void>;
  onUpdateAgentSkills: (agentId: string, skillIds: string[]) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [model, setModel] = useState("gpt-5.4-mini");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [submitting, setSubmitting] = useState(false);
  const [savingAgentId, setSavingAgentId] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onCreateAgent({ name, model, summary, status });
      setName("");
      setModel("gpt-5.4-mini");
      setSummary("");
      setStatus("active");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleSkill(agent: AgentRecord, skillId: string) {
    const nextSkillIds = agent.skillIds.includes(skillId)
      ? agent.skillIds.filter((id) => id !== skillId)
      : [...agent.skillIds, skillId];

    setSavingAgentId(agent.id);

    try {
      await onUpdateAgentSkills(agent.id, nextSkillIds);
    } finally {
      setSavingAgentId(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Registry</p>
          <h3>数字员工</h3>
        </div>
        <span className="badge">{agents.length} 个对象</span>
      </div>

      <form className="agent-form" onSubmit={handleSubmit}>
        <input
          placeholder="数字员工名称"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          placeholder="模型"
          required
          value={model}
          onChange={(event) => setModel(event.target.value)}
        />
        <input
          placeholder="职责摘要"
          required
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "active" | "paused")}
        >
          <option value="active">active</option>
          <option value="paused">paused</option>
        </select>
        <button disabled={submitting} type="submit">
          {submitting ? "创建中..." : "创建 Agent"}
        </button>
      </form>

      <div className="table">
        <div className="table-head">
          <span>名称</span>
          <span>状态</span>
          <span>模型</span>
          <span>Skills</span>
          <span>说明</span>
        </div>
        {agents.map((agent) => (
          <div className="agent-record" key={agent.id}>
            <div className="table-row">
              <span>{agent.name}</span>
              <span>{agent.status}</span>
              <span>{agent.model}</span>
              <span>{agent.skillCount}</span>
              <span>{agent.summary}</span>
            </div>
            <div className="binding-box">
              <div className="binding-header">
                <strong>绑定 Skills</strong>
                {savingAgentId === agent.id && <span className="muted">保存中...</span>}
              </div>
              <div className="skill-chip-grid">
                {skills.map((skill) => {
                  const checked = agent.skillIds.includes(skill.id);
                  return (
                    <label
                      className={checked ? "skill-chip skill-chip-active" : "skill-chip"}
                      key={`${agent.id}-${skill.id}`}
                    >
                      <input
                        checked={checked}
                        onChange={() => void handleToggleSkill(agent, skill.id)}
                        type="checkbox"
                      />
                      <span>{skill.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkillsPage({
  skills,
  onCreateSkill
}: {
  skills: SkillRecord[];
  onCreateSkill: (input: CreateSkillInput) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("custom");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "draft">("draft");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onCreateSkill({ name, category, version, description, status });
      setName("");
      setCategory("custom");
      setVersion("1.0.0");
      setDescription("");
      setStatus("draft");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Capability</p>
          <h3>Skills</h3>
        </div>
        <span className="badge">{skills.length} 个能力</span>
      </div>

      <form className="skill-form" onSubmit={handleSubmit}>
        <input
          placeholder="Skill 名称"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          placeholder="分类"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
        <input
          placeholder="版本"
          required
          value={version}
          onChange={(event) => setVersion(event.target.value)}
        />
        <input
          placeholder="描述"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "active" | "draft")}
        >
          <option value="draft">draft</option>
          <option value="active">active</option>
        </select>
        <button disabled={submitting} type="submit">
          {submitting ? "创建中..." : "创建 Skill"}
        </button>
      </form>

      <div className="card-grid">
        {skills.map((skill) => (
          <article className="mini-card" key={skill.id}>
            <div className="mini-card-top">
              <strong>{skill.name}</strong>
              <span className="badge badge-outline">{skill.category}</span>
            </div>
            <p className="muted">{skill.description}</p>
            <div className="mini-card-meta">
              <span>版本 {skill.version}</span>
              <span>{skill.status}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RunsPage({
  agents,
  onTriggerRun,
  runs
}: {
  agents: AgentRecord[];
  onTriggerRun: (agentId: string) => Promise<void>;
  runs: RunRecord[];
}) {
  const [triggeringAgentId, setTriggeringAgentId] = useState<string | null>(null);

  async function handleTrigger(agentId: string) {
    setTriggeringAgentId(agentId);

    try {
      await onTriggerRun(agentId);
    } finally {
      setTriggeringAgentId(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Runtime</p>
          <h3>运行记录</h3>
        </div>
      </div>
      <div className="card-grid">
        {agents.map((agent) => (
          <article className="mini-card" key={agent.id}>
            <div className="mini-card-top">
              <strong>{agent.name}</strong>
              <span className="badge badge-outline">{agent.status}</span>
            </div>
            <p className="muted">{agent.summary}</p>
            <div className="mini-card-meta">
              <span>{agent.model}</span>
              <span>{agent.skillCount} skills</span>
            </div>
            <button
              disabled={agent.status !== "active" || triggeringAgentId === agent.id}
              onClick={() => void handleTrigger(agent.id)}
              type="button"
            >
              {triggeringAgentId === agent.id ? "触发中..." : "手动触发"}
            </button>
          </article>
        ))}
      </div>
      <div className="timeline">
        {runs.map((run) => (
          <article className="timeline-item" key={run.id}>
            <div className="timeline-mark" />
            <div className="timeline-content">
              <div className="timeline-header">
                <strong>{run.agentName}</strong>
                <span className={`badge ${run.status === "failed" ? "badge-danger" : ""}`}>
                  {run.status}
                </span>
              </div>
              <p>{run.summary}</p>
              <div className="mini-card-meta">
                <span>{run.triggerType}</span>
                <span>{run.startedAt}</span>
                <span>{run.traceId}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DeployPage({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Deploy</p>
          <h3>部署基线</h3>
        </div>
      </div>
      <div className="deploy-grid">
        <article className="mini-card">
          <strong>目标主机</strong>
          <p className="muted">{snapshot.server.host}</p>
        </article>
        <article className="mini-card">
          <strong>操作系统</strong>
          <p className="muted">{snapshot.server.os}</p>
        </article>
        <article className="mini-card">
          <strong>容器运行时</strong>
          <p className="muted">{snapshot.server.containerRuntime}</p>
        </article>
        <article className="mini-card">
          <strong>GitHub 仓库</strong>
          <p className="muted">{snapshot.server.repository}</p>
        </article>
      </div>
    </section>
  );
}
