import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import type { AgentRecord, DashboardSnapshot, RunRecord, SkillRecord } from "@openclaw/shared";
import { fetchDashboardSnapshot } from "./api";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: DashboardSnapshot }
  | { status: "error"; message: string };

const navItems = [
  { to: "/", label: "控制台" },
  { to: "/agents", label: "数字员工" },
  { to: "/skills", label: "Skills" },
  { to: "/runs", label: "运行记录" },
  { to: "/deploy", label: "部署基线" }
];

export function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetchDashboardSnapshot()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "ready", data });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState({ status: "error", message: error.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
          <p className="muted">Windows 11 + Docker Compose</p>
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
            <Route path="/agents" element={<AgentsPage agents={state.data.agents} />} />
            <Route path="/skills" element={<SkillsPage skills={state.data.skills} />} />
            <Route path="/runs" element={<RunsPage runs={state.data.runs} />} />
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
          当前骨架聚焦 5 条线：对象管理、任务执行、调度、日志审计、服务器部署。
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

function AgentsPage({ agents }: { agents: AgentRecord[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Registry</p>
          <h3>数字员工</h3>
        </div>
        <span className="badge">{agents.length} 个对象</span>
      </div>
      <div className="table">
        <div className="table-head">
          <span>名称</span>
          <span>状态</span>
          <span>模型</span>
          <span>Skills</span>
          <span>说明</span>
        </div>
        {agents.map((agent) => (
          <div className="table-row" key={agent.id}>
            <span>{agent.name}</span>
            <span>{agent.status}</span>
            <span>{agent.model}</span>
            <span>{agent.skillCount}</span>
            <span>{agent.summary}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkillsPage({ skills }: { skills: SkillRecord[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Capability</p>
          <h3>Skills</h3>
        </div>
        <span className="badge">{skills.length} 个能力</span>
      </div>
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

function RunsPage({ runs }: { runs: RunRecord[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Runtime</p>
          <h3>运行记录</h3>
        </div>
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
