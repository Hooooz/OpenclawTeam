import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useParams
} from "react-router-dom";
import type {
  ControlCenterAgentDetail,
  ControlCenterAgentListItem,
  ControlCenterDashboard,
  ControlCenterRunDetail,
  ControlCenterRunListItem,
  ControlCenterSettings,
  ControlCenterTriggerSource,
  ControlCenterRunStatus,
  ControlCenterAgentStatus,
  DataSource,
  ProvenanceRecord
} from "./api";
import {
  fetchControlCenterAgentDetail,
  fetchControlCenterAgents,
  fetchControlCenterDashboard,
  fetchControlCenterRunDetail,
  fetchControlCenterRuns,
  fetchControlCenterSettings
} from "./api";

type LoadState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string };

const navItems = [
  { to: "/", label: "控制台" },
  { to: "/agents", label: "数字员工" },
  { to: "/runs", label: "对话与工作记录" },
  { to: "/settings", label: "系统设置" }
];

function useRemoteResource<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<LoadState<T>>({ status: "loading" });
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    loader()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "ready", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown request error"
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [...deps, reloadVersion]);

  return {
    state,
    reload: () => setReloadVersion((value) => value + 1)
  };
}

function SourceChip({
  dataSource,
  dataSourceNote
}: {
  dataSource: DataSource;
  dataSourceNote?: string;
}) {
  return (
    <span
      className={dataSource === "live" ? "badge badge-live" : "badge badge-outline"}
      title={dataSourceNote || ""}
    >
      {dataSource === "live" ? "LIVE" : "MOCK"}
    </span>
  );
}

function StatusPill({
  status
}: {
  status: ControlCenterAgentStatus | ControlCenterRunStatus | "healthy" | "degraded" | "down" | "active" | "paused" | "error";
}) {
  const danger =
    status === "failed" || status === "error" || status === "down";
  const outline = status === "paused" || status === "idle" || status === "degraded";

  return (
    <span
      className={`badge ${danger ? "badge-danger" : ""} ${outline ? "badge-outline" : ""}`}
    >
      {status}
    </span>
  );
}

function ProvenanceNote({ record }: { record: ProvenanceRecord }) {
  if (record.dataSource !== "mock" && (!record.mockFields || record.mockFields.length === 0)) {
    return null;
  }

  return (
    <div className="provenance-note">
      <SourceChip dataSource={record.dataSource} dataSourceNote={record.dataSourceNote} />
      {record.mockFields && record.mockFields.length > 0 ? (
        <span>模拟字段：{record.mockFields.join(", ")}</span>
      ) : (
        <span>{record.dataSourceNote || "该条记录包含保留演示数据。"}</span>
      )}
    </div>
  );
}

function PageState<T>({
  state,
  title,
  children,
  onReload
}: {
  state: LoadState<T>;
  title: string;
  children: (data: T) => React.ReactNode;
  onReload: () => void;
}) {
  if (state.status === "loading") {
    return (
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Loading</p>
            <h3>{title}</h3>
          </div>
        </div>
        <p className="muted">正在读取控制面数据...</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="panel panel-danger">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Error</p>
            <h3>{title}</h3>
          </div>
          <button className="secondary-button" onClick={onReload} type="button">
            重试
          </button>
        </div>
        <p>{state.message}</p>
      </section>
    );
  }

  return <>{children(state.data)}</>;
}

function triggerLabel(value: ControlCenterTriggerSource) {
  switch (value) {
    case "chat":
      return "对话";
    case "timed-task":
      return "定时任务";
    case "template":
      return "模板";
    default:
      return "手动";
  }
}

export function App() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">OpenClaw Control Center</p>
          <h1>数字员工管理后台</h1>
          <p className="muted">
            把服务器上的 OpenClaw 会话、数字员工和工作记录收敛成一个可运营的企业控制面。
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
          <p className="sidebar-label">当前目标</p>
          <strong>192.168.31.189</strong>
          <p className="muted">Administrator/.openclaw live runtime</p>
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/console" element={<DashboardPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/:agentId" element={<AgentDetailPage />} />
          <Route path="/runs" element={<RunsPage />} />
          <Route path="/runs/:runId" element={<RunDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function DashboardPage() {
  const { state, reload } = useRemoteResource(fetchControlCenterDashboard, []);

  return (
    <PageState onReload={reload} state={state} title="控制台总览">
      {(data) => (
        <div className="page-grid">
          <section className="hero">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Enterprise View</p>
                <h2>控制面已经接入服务器上的真实 OpenClaw 数据</h2>
                <p className="muted">
                  当前重点是把数字员工、对话与工作记录、系统状态作为一条完整浏览链路跑通。
                </p>
              </div>
              <button className="secondary-button" onClick={reload} type="button">
                刷新数据
              </button>
            </div>
          </section>

          <section className="stat-grid">
            {data.metrics.map((metric) => (
              <article className="stat-card" key={metric.label}>
                <div className="mini-card-top">
                  <p className="stat-label">{metric.label}</p>
                  <SourceChip
                    dataSource={metric.dataSource}
                    dataSourceNote={metric.dataSourceNote}
                  />
                </div>
                <strong className="stat-value">{metric.value}</strong>
                <p className="muted">
                  变化值 {metric.change}
                  {metric.danger ? " · 需要关注" : ""}
                </p>
              </article>
            ))}
          </section>

          <section className="dashboard-two-column">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Health</p>
                  <h3>系统服务状态</h3>
                </div>
              </div>
              <div className="list-stack">
                {data.services.map((service) => (
                  <div className="list-row" key={service.name}>
                    <div>
                      <strong>{service.name}</strong>
                      <p className="muted">{service.lastHeartbeat}</p>
                    </div>
                    <div className="inline-meta">
                      <SourceChip
                        dataSource={service.dataSource}
                        dataSourceNote={service.dataSourceNote}
                      />
                      <StatusPill status={service.status} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Risk</p>
                  <h3>安全与运行风险</h3>
                </div>
              </div>
              <div className="list-stack">
                {data.risks.map((risk) => (
                  <div className="risk-item" key={risk.id}>
                    <div className="mini-card-top">
                      <strong>{risk.message}</strong>
                      <StatusPill status={risk.level === "high" ? "failed" : "degraded"} />
                    </div>
                    <div className="inline-meta">
                      <span className="muted">{risk.time}</span>
                      <SourceChip
                        dataSource={risk.dataSource}
                        dataSourceNote={risk.dataSourceNote}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="dashboard-two-column">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Employees</p>
                  <h3>重点数字员工</h3>
                </div>
                <Link className="text-link" to="/agents">
                  查看全部
                </Link>
              </div>
              <div className="list-stack">
                {data.agents.map((agent) => (
                  <Link className="list-row list-link" key={agent.id} to={`/agents/${agent.id}`}>
                    <div className="list-identity">
                      <span className="avatar-badge">{agent.avatar}</span>
                      <div>
                        <strong>{agent.name}</strong>
                        <p className="muted">
                          {agent.position} · 最近 {agent.lastRun}
                        </p>
                      </div>
                    </div>
                    <div className="inline-meta">
                      <SourceChip
                        dataSource={agent.dataSource}
                        dataSourceNote={agent.dataSourceNote}
                      />
                      <StatusPill status={agent.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Runs</p>
                  <h3>最近对话与工作记录</h3>
                </div>
                <Link className="text-link" to="/runs">
                  查看全部
                </Link>
              </div>
              <div className="list-stack">
                {data.runs.map((run) => (
                  <Link className="list-row list-link" key={run.id} to={`/runs/${run.id}`}>
                    <div>
                      <strong>{run.taskName}</strong>
                      <p className="muted">
                        {run.agentName} · {run.startTime} · {run.duration}
                      </p>
                      <p className="small-note">{run.memorySummary || "无记忆更新摘要"}</p>
                    </div>
                    <div className="inline-meta">
                      <SourceChip
                        dataSource={run.dataSource}
                        dataSourceNote={run.dataSourceNote}
                      />
                      <StatusPill status={run.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Schedules</p>
                <h3>定时任务视图</h3>
              </div>
            </div>
            <div className="list-stack">
              {data.schedules.map((schedule) => (
                <div className="list-row" key={schedule.id}>
                  <div>
                    <strong>{schedule.planName}</strong>
                    <p className="muted">
                      {schedule.agentName} · {schedule.cron} · 下次 {schedule.nextRun}
                    </p>
                  </div>
                  <div className="inline-meta">
                    <SourceChip
                      dataSource={schedule.dataSource}
                      dataSourceNote={schedule.dataSourceNote}
                    />
                    <StatusPill status={schedule.lastStatus} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </PageState>
  );
}

function AgentsPage() {
  const { state, reload } = useRemoteResource(fetchControlCenterAgents, []);
  const [search, setSearch] = useState("");

  return (
    <PageState onReload={reload} state={state} title="数字员工">
      {(agents) => {
        const filtered = agents.filter((agent) => {
          const query = search.trim();
          if (!query) {
            return true;
          }

          return [agent.name, agent.position, agent.department, agent.role, agent.group]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase());
        });

        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Employees</p>
                <h3>数字员工列表</h3>
                <p className="muted">当前共 {agents.length} 位数字员工，已接入服务器运行时。</p>
              </div>
              <button className="secondary-button" onClick={reload} type="button">
                刷新列表
              </button>
            </div>

            <div className="toolbar">
              <input
                className="search-input"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索姓名、职位、部门或职责"
                value={search}
              />
            </div>

            <div className="data-table">
              <div className="data-table-head">
                <span>员工</span>
                <span>定位</span>
                <span>模型 / 能力</span>
                <span>最近状态</span>
                <span>来源</span>
              </div>
              {filtered.map((agent) => (
                <Link className="data-table-row" key={agent.id} to={`/agents/${agent.id}`}>
                  <div className="list-identity">
                    <span className="avatar-badge">{agent.avatar}</span>
                    <div>
                      <strong>{agent.name}</strong>
                      <p className="muted">
                        {agent.position} · {agent.department}
                      </p>
                    </div>
                  </div>
                  <div>
                    <strong>{agent.motto}</strong>
                    <p className="muted">{agent.role}</p>
                  </div>
                  <div>
                    <p>{agent.model}</p>
                    <p className="muted">
                      {agent.skillCount} skills · {agent.knowledgeCount} knowledge
                    </p>
                  </div>
                  <div className="stack-right">
                    <StatusPill status={agent.status} />
                    <span className="muted">
                      {agent.lastRunTime}
                      {agent.lastRunStatus ? ` · ${agent.lastRunStatus}` : ""}
                    </span>
                  </div>
                  <div className="stack-right">
                    <SourceChip
                      dataSource={agent.dataSource}
                      dataSourceNote={agent.dataSourceNote}
                    />
                    <span className="muted">{agent.group}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      }}
    </PageState>
  );
}

function AgentDetailPage() {
  const params = useParams();
  const agentId = params.agentId || "";
  const { state, reload } = useRemoteResource(
    () => fetchControlCenterAgentDetail(agentId),
    [agentId]
  );

  return (
    <PageState onReload={reload} state={state} title="数字员工详情">
      {(agent) => (
        <div className="page-grid">
          <section className="panel">
            <div className="panel-header">
              <div className="header-identity">
                <span className="hero-avatar">{agent.avatar}</span>
                <div>
                  <p className="eyebrow">Employee Profile</p>
                  <h3>{agent.name}</h3>
                  <p className="muted">
                    {agent.position} · {agent.department}
                  </p>
                  <p className="quote-line">“{agent.motto}”</p>
                </div>
              </div>
              <div className="inline-meta">
                <SourceChip
                  dataSource={agent.dataSource}
                  dataSourceNote={agent.dataSourceNote}
                />
                <StatusPill status={agent.status} />
              </div>
            </div>
            <p className="lead-text">{agent.description}</p>
            <ProvenanceNote record={agent} />
          </section>

          <section className="stat-grid">
            {[
              { label: "职责定位", value: agent.role },
              { label: "负责人", value: agent.owner },
              { label: "模型", value: agent.model },
              { label: "成功率", value: `${agent.successRate}%` },
              { label: "最近工作", value: agent.lastRunTime },
              { label: "创建时间", value: agent.createdAt }
            ].map((item) => (
              <article className="stat-card" key={item.label}>
                <p className="stat-label">{item.label}</p>
                <strong className="detail-stat">{item.value}</strong>
              </article>
            ))}
          </section>

          <section className="dashboard-two-column">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Persona</p>
                  <h3>个性化信息</h3>
                </div>
              </div>
              <div className="list-stack">
                <div className="list-row">
                  <strong>沟通风格</strong>
                  <span>{agent.communicationStyle}</span>
                </div>
                <div className="list-row">
                  <strong>工作信条</strong>
                  <span>{agent.workCreed}</span>
                </div>
                <div className="tag-cloud">
                  {agent.specialties.map((item) => (
                    <span className="tag-chip" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Prompt</p>
                  <h3>系统提示与行为规则</h3>
                </div>
              </div>
              <pre className="code-block">{agent.systemPrompt}</pre>
              <ul className="rule-list">
                {agent.behaviorRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="dashboard-two-column">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Knowledge</p>
                  <h3>知识与记忆</h3>
                </div>
              </div>
              <div className="list-stack">
                {agent.knowledgeSources.map((source) => (
                  <div className="list-row" key={source.id}>
                    <div>
                      <strong>{source.name}</strong>
                      <p className="muted">
                        {source.type} · 最近同步 {source.lastSync}
                      </p>
                    </div>
                    <SourceChip
                      dataSource={source.dataSource}
                      dataSourceNote={source.dataSourceNote}
                    />
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Skills</p>
                  <h3>能力绑定</h3>
                </div>
              </div>
              <div className="list-stack">
                {agent.skills.map((skill) => (
                  <div className="list-row" key={skill.id}>
                    <div>
                      <strong>{skill.name}</strong>
                      <p className="muted">{skill.category}</p>
                    </div>
                    <div className="inline-meta">
                      <SourceChip
                        dataSource={skill.dataSource}
                        dataSourceNote={skill.dataSourceNote}
                      />
                      <StatusPill status={skill.status === "active" ? "healthy" : "paused"} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="dashboard-two-column">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Schedules</p>
                  <h3>定时任务</h3>
                </div>
              </div>
              <div className="list-stack">
                {agent.schedules.map((schedule) => (
                  <div className="list-row" key={schedule.id}>
                    <div>
                      <strong>{schedule.name}</strong>
                      <p className="muted">
                        {schedule.cron} · 下次 {schedule.nextRun}
                      </p>
                    </div>
                    <div className="inline-meta">
                      <SourceChip
                        dataSource={schedule.dataSource}
                        dataSourceNote={schedule.dataSourceNote}
                      />
                      <StatusPill status={schedule.enabled ? "active" : "paused"} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Runs</p>
                  <h3>最近工作记录</h3>
                </div>
              </div>
              <div className="list-stack">
                {agent.recentRuns.map((run) => (
                  <Link className="list-row list-link" key={run.id} to={`/runs/${run.id}`}>
                    <div>
                      <strong>{run.taskName}</strong>
                      <p className="muted">
                        {run.time} · {run.duration}
                      </p>
                    </div>
                    <div className="inline-meta">
                      <SourceChip
                        dataSource={run.dataSource}
                        dataSourceNote={run.dataSourceNote}
                      />
                      <StatusPill status={run.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Audit</p>
                <h3>审计与变更</h3>
              </div>
            </div>
            <div className="list-stack">
              {agent.auditLog.map((item) => (
                <div className="list-row" key={item.id}>
                  <div>
                    <strong>
                      {item.user} · {item.action}
                    </strong>
                    <p className="muted">
                      {item.time} · {item.detail}
                    </p>
                  </div>
                  <SourceChip
                    dataSource={item.dataSource}
                    dataSourceNote={item.dataSourceNote}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </PageState>
  );
}

function RunsPage() {
  const { state, reload } = useRemoteResource(fetchControlCenterRuns, []);
  const [search, setSearch] = useState("");

  return (
    <PageState onReload={reload} state={state} title="对话与工作记录">
      {(runs) => {
        const filtered = runs.filter((run) => {
          const query = search.trim();
          if (!query) {
            return true;
          }

          return [run.agentName, run.taskName, run.conversationTopic, run.sourcePlatform, run.runId]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase());
        });

        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Runs</p>
                <h3>对话与工作记录</h3>
                <p className="muted">当前展示 live session 与保留 mock 任务两类记录。</p>
              </div>
              <button className="secondary-button" onClick={reload} type="button">
                刷新记录
              </button>
            </div>

            <div className="toolbar">
              <input
                className="search-input"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索员工、任务、对话主题或来源平台"
                value={search}
              />
            </div>

            <div className="data-table">
              <div className="data-table-head">
                <span>记录</span>
                <span>数字员工</span>
                <span>对话主题</span>
                <span>工作摘要</span>
                <span>状态 / 来源</span>
              </div>
              {filtered.map((run) => (
                <Link className="data-table-row" key={run.id} to={`/runs/${run.id}`}>
                  <div>
                    <strong>{run.runId}</strong>
                    <p className="muted">
                      {run.taskName} · {run.startTime} · {run.duration}
                    </p>
                  </div>
                  <div>
                    <strong>{run.agentName}</strong>
                    <p className="muted">{run.agentPosition}</p>
                  </div>
                  <div>
                    <strong>{run.conversationTopic}</strong>
                    <p className="muted">
                      {run.sourcePlatform} · {triggerLabel(run.triggerSource)}
                    </p>
                  </div>
                  <div>
                    <strong>{run.outputSummary}</strong>
                    <p className="muted">{run.memorySummary}</p>
                  </div>
                  <div className="stack-right">
                    <StatusPill status={run.status} />
                    <SourceChip
                      dataSource={run.dataSource}
                      dataSourceNote={run.dataSourceNote}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      }}
    </PageState>
  );
}

function RunDetailPage() {
  const params = useParams();
  const runId = params.runId || "";
  const { state, reload } = useRemoteResource(
    () => fetchControlCenterRunDetail(runId),
    [runId]
  );

  return (
    <PageState onReload={reload} state={state} title="工作记录详情">
      {(run) => (
        <div className="page-grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Run Detail</p>
                <h3>{run.taskName}</h3>
                <p className="muted">
                  {run.agentName} · {run.agentPosition}
                </p>
              </div>
              <div className="inline-meta">
                <SourceChip
                  dataSource={run.dataSource}
                  dataSourceNote={run.dataSourceNote}
                />
                <StatusPill status={run.status} />
              </div>
            </div>
            <p className="lead-text">{run.outputSummary}</p>
            <ProvenanceNote record={run} />
          </section>

          <section className="stat-grid">
            {[
              { label: "Run ID", value: run.runId },
              { label: "Trace ID", value: run.traceId },
              { label: "触发方式", value: triggerLabel(run.triggerSource) },
              { label: "来源平台", value: run.sourcePlatform },
              { label: "开始时间", value: run.startTime },
              { label: "结束时间", value: run.endTime }
            ].map((item) => (
              <article className="stat-card" key={item.label}>
                <p className="stat-label">{item.label}</p>
                <strong className="detail-stat">{item.value}</strong>
              </article>
            ))}
          </section>

          <section className="dashboard-two-column">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Conversation</p>
                  <h3>对话上下文</h3>
                </div>
              </div>
              <div className="list-stack">
                <div className="list-row">
                  <strong>对话主题</strong>
                  <span>{run.conversationTopic}</span>
                </div>
                <div className="list-row">
                  <strong>记忆更新</strong>
                  <span>{run.memorySummary}</span>
                </div>
                <div className="list-row">
                  <strong>版本对比</strong>
                  <span>{run.versionDiff}</span>
                </div>
                <div className="list-row">
                  <strong>触发人</strong>
                  <span>{run.triggeredBy}</span>
                </div>
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Output</p>
                  <h3>输入与输出</h3>
                </div>
              </div>
              <pre className="code-block">{JSON.stringify(run.inputParams, null, 2)}</pre>
              <pre className="code-block">{run.outputResult || "暂无完整输出"}</pre>
              {run.errorMessage && <p className="error-text">{run.errorMessage}</p>}
            </article>
          </section>

          <section className="dashboard-two-column">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Steps</p>
                  <h3>执行步骤</h3>
                </div>
              </div>
              <div className="list-stack">
                {run.steps.map((step) => (
                  <div className="list-row" key={step.id}>
                    <div>
                      <strong>{step.name}</strong>
                      <p className="muted">
                        {step.startTime} · {step.duration} · {step.detail}
                      </p>
                    </div>
                    <div className="inline-meta">
                      <SourceChip
                        dataSource={step.dataSource}
                        dataSourceNote={step.dataSourceNote}
                      />
                      <StatusPill status={step.status as ControlCenterRunStatus} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Skills</p>
                  <h3>技能调用</h3>
                </div>
              </div>
              <div className="list-stack">
                {run.skillCalls.map((call) => (
                  <div className="list-row" key={call.id}>
                    <div>
                      <strong>{call.skillName}</strong>
                      <p className="muted">
                        {call.duration} · input: {call.input}
                      </p>
                      <p className="small-note">{call.output}</p>
                    </div>
                    <div className="inline-meta">
                      <SourceChip
                        dataSource={call.dataSource}
                        dataSourceNote={call.dataSourceNote}
                      />
                      <StatusPill status={call.result as ControlCenterRunStatus} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="dashboard-two-column">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Logs</p>
                  <h3>执行日志</h3>
                </div>
              </div>
              <div className="log-list">
                {run.logs.map((item, index) => (
                  <div className="log-item" key={`${item.time}-${index}`}>
                    <span>{item.time}</span>
                    <strong>{item.level}</strong>
                    <p>{item.message}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Audit</p>
                  <h3>审计记录</h3>
                </div>
              </div>
              <div className="list-stack">
                {run.audit.map((item, index) => (
                  <div className="list-row" key={`${item.user}-${index}`}>
                    <div>
                      <strong>{item.user}</strong>
                      <p className="muted">
                        {item.action} · {item.time}
                      </p>
                    </div>
                    <SourceChip
                      dataSource={item.dataSource}
                      dataSourceNote={item.dataSourceNote}
                    />
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      )}
    </PageState>
  );
}

function SettingsPage() {
  const { state, reload } = useRemoteResource(fetchControlCenterSettings, []);

  return (
    <PageState onReload={reload} state={state} title="系统设置">
      {(settings) => (
        <div className="page-grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Deploy</p>
                <h3>部署与运行状态</h3>
              </div>
              <button className="secondary-button" onClick={reload} type="button">
                刷新状态
              </button>
            </div>
            <div className="deploy-grid">
              {[
                { label: "主机地址", value: settings.deployInfo.host },
                { label: "操作系统", value: settings.deployInfo.os },
                { label: "运行环境", value: settings.deployInfo.runtime },
                { label: "仓库地址", value: settings.deployInfo.repo },
                { label: "最近部署", value: settings.deployInfo.lastDeploy },
                { label: "版本号", value: settings.deployInfo.version }
              ].map((item) => (
                <article className="mini-card" key={item.label}>
                  <div className="mini-card-top">
                    <strong>{item.label}</strong>
                    <SourceChip
                      dataSource={settings.deployInfo.dataSource}
                      dataSourceNote={settings.deployInfo.dataSourceNote}
                    />
                  </div>
                  <p className="muted">{item.value}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-two-column">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Ports</p>
                  <h3>运行端口</h3>
                </div>
              </div>
              <div className="list-stack">
                {settings.deployInfo.ports.map((port) => (
                  <div className="list-row" key={`${port.service}-${port.port}`}>
                    <div>
                      <strong>{port.service}</strong>
                      <p className="muted">
                        {port.protocol}:{port.port}
                      </p>
                    </div>
                    <SourceChip
                      dataSource={port.dataSource}
                      dataSourceNote={port.dataSourceNote}
                    />
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Services</p>
                  <h3>服务状态</h3>
                </div>
              </div>
              <div className="list-stack">
                {settings.services.map((service) => (
                  <div className="list-row" key={service.name}>
                    <div>
                      <strong>{service.name}</strong>
                      <p className="muted">{service.lastHeartbeat}</p>
                    </div>
                    <div className="inline-meta">
                      <SourceChip
                        dataSource={service.dataSource}
                        dataSourceNote={service.dataSourceNote}
                      />
                      <StatusPill status={service.status} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Configs</p>
                <h3>系统配置</h3>
              </div>
            </div>
            <div className="data-table">
              <div className="data-table-head">
                <span>键</span>
                <span>名称</span>
                <span>值</span>
                <span>分类</span>
                <span>来源</span>
              </div>
              {settings.systemConfigs.map((config) => (
                <div className="data-table-row" key={config.key}>
                  <div>
                    <strong>{config.key}</strong>
                  </div>
                  <div>{config.label}</div>
                  <div>{config.value}</div>
                  <div>{config.category}</div>
                  <div className="stack-right">
                    <SourceChip
                      dataSource={config.dataSource}
                      dataSourceNote={config.dataSourceNote}
                    />
                    <span className="muted">{config.editable ? "editable" : "readonly"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </PageState>
  );
}
