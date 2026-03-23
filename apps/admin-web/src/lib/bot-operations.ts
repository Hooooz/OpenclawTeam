import type {
  AgentDetail,
  MetricItem,
  Provenance,
  RunListItem,
  ServiceHealth,
  SettingsData,
} from "./control-center-api";

type BotQuickLink = {
  label: string;
  desc: string;
  to: string;
};

type BotMemoryItem = {
  time: string;
  summary: string;
} & Provenance;

export type BotOverviewData = {
  metrics: MetricItem[];
  quickLinks: BotQuickLink[];
  recentRuns: AgentDetail["recentRuns"];
  recentMemory: BotMemoryItem[];
};

export type BotModelRecord = {
  id: string;
  name: string;
  provider: string;
  role: string;
  status: "healthy" | "degraded" | "down";
  lastTest: string;
  latency: string;
} & Provenance;

export type BotPlatformRecord = {
  id: string;
  name: string;
  status: "connected" | "disconnected";
  lastMsg: string;
  sessions: number;
} & Provenance;

export type BotModelData = {
  models: BotModelRecord[];
  platforms: BotPlatformRecord[];
};

export type BotSessionRecord = {
  id: string;
  sessionId: string;
  type: string;
  platform: string;
  lastActive: string;
  messageCount: number;
  tokenUsage: number;
  status: "active" | "completed";
  risk: boolean;
  topic: string;
  memorySummary: string;
} & Provenance;

export type BotStatsData = {
  summaryMetrics: MetricItem[];
  sessionTrend: Array<{ day: string; count: number } & Provenance>;
  platformDistribution: Array<{ platform: string; pct: number; count: number } & Provenance>;
  failureTrend: Array<{ day: string; rate: number } & Provenance>;
};

export type BotAlertRecord = {
  id: string;
  type: "active" | "recovered";
  severity: "high" | "medium" | "low";
  message: string;
  time: string;
  source: string;
  recoveredAt?: string;
} & Provenance;

export type BotGatewayCheck = {
  name: string;
  status: "pass" | "warn" | "fail";
  latency: string;
  lastCheck: string;
} & Provenance;

export type BotPlatformCheck = {
  platform: string;
  status: "pass" | "fail";
  lastMsg: string;
} & Provenance;

export type BotAlertsData = {
  metrics: MetricItem[];
  alerts: BotAlertRecord[];
  gatewayChecks: BotGatewayCheck[];
  platformChecks: BotPlatformCheck[];
};

function durationToSeconds(input: string) {
  const minuteMatch = input.match(/(\d+)m/);
  const secondMatch = input.match(/(\d+)s/);
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const seconds = secondMatch ? Number(secondMatch[1]) : 0;
  return minutes * 60 + seconds;
}

function toTokenEstimate(run: RunListItem) {
  const fromSummary = run.outputSummary.length * 6;
  const fromTopic = run.conversationTopic.length * 4;
  const fromDuration = Math.max(durationToSeconds(run.duration), 1) * 80;
  return fromSummary + fromTopic + fromDuration;
}

function toProviderLabel(model: string) {
  if (model.includes("gpt")) {
    return "OpenAI Codex";
  }

  if (model.includes("claude")) {
    return "Anthropic";
  }

  return "Unknown";
}

function getDayLabel(startTime: string) {
  const date = new Date(startTime.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return startTime.slice(5, 10) || "未知";
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function topRuns(agent: AgentDetail, runs: RunListItem[]) {
  if (agent.recentRuns.length > 0) {
    return agent.recentRuns;
  }

  return runs
    .filter((run) => run.agentId === agent.id)
    .slice(0, 5)
    .map((run) => ({
      id: run.id,
      taskName: run.taskName,
      status: run.status,
      time: run.startTime,
      duration: run.duration,
      dataSource: run.dataSource,
      dataSourceNote: run.dataSourceNote,
    }));
}

function filterAgentRuns(agent: AgentDetail, runs: RunListItem[]) {
  return runs.filter((run) => run.agentId === agent.id).sort((left, right) => right.startTime.localeCompare(left.startTime));
}

function hasMeaningfulMemoryUpdate(summary: string) {
  const value = summary.trim();

  if (!value || value === "—") {
    return false;
  }

  return !["无更新", "无新增记忆", "未接入独立记忆库"].includes(value);
}

export function buildBotOverviewData(agent: AgentDetail, runs: RunListItem[], settings: SettingsData): BotOverviewData {
  const agentRuns = filterAgentRuns(agent, runs);
  const todayToken = agentRuns.reduce((total, run) => total + toTokenEstimate(run), 0);
  const activeAlerts = buildBotAlertsData(agent, runs, settings).alerts.filter((item) => item.type === "active").length;
  const gateway = settings.services.find((service) => service.name.includes("Gateway"));
  const gatewayScore = gateway?.status === "healthy" ? 100 : gateway?.status === "degraded" ? 85 : 40;
  const averageSeconds =
    agentRuns.length > 0
      ? agentRuns.reduce((total, run) => total + durationToSeconds(run.duration), 0) / agentRuns.length
      : 0;
  const memorySource = agentRuns.filter((run) => hasMeaningfulMemoryUpdate(run.memorySummary));
  const recentMemoryRuns = (memorySource.length > 0 ? memorySource : agentRuns).slice(0, 5);

  return {
    metrics: [
      { label: "Gateway 健康", value: gatewayScore, unit: "%", change: 0, danger: gatewayScore < 60, dataSource: gateway?.dataSource ?? "mock", dataSourceNote: gateway?.dataSourceNote },
      { label: "今日会话数", value: agentRuns.length, change: 0, dataSource: "live" },
      { label: "今日 Token", value: todayToken, change: 0, dataSource: "mock", dataSourceNote: "Token 消耗当前按运行记录估算" },
      { label: "平均响应", value: Number(averageSeconds.toFixed(1)), unit: "s", change: 0, dataSource: "mock", dataSourceNote: "平均响应时间当前按运行耗时估算" },
      { label: "今日失败", value: agentRuns.filter((run) => run.status === "failed").length, change: 0, danger: agentRuns.some((run) => run.status === "failed"), dataSource: "live" },
      { label: "活跃告警", value: activeAlerts, change: 0, danger: activeAlerts > 0, dataSource: activeAlerts > 0 ? "live" : "mock", dataSourceNote: activeAlerts > 0 ? undefined : "当前告警主要由服务状态和失败记录推导" },
    ],
    quickLinks: [
      { label: "模型与平台", desc: "查看模型、Provider 和连通性", to: `/agents/${agent.id}/bot/model` },
      { label: "Session 管理", desc: "查看会话、平台和异常", to: `/agents/${agent.id}/bot/sessions` },
      { label: "消息统计", desc: "Token 消耗、响应时间与趋势", to: `/agents/${agent.id}/bot/stats` },
      { label: "告警与健康", desc: "活跃告警和 Gateway 状态", to: `/agents/${agent.id}/bot/alerts` },
    ],
    recentRuns: topRuns(agent, runs),
    recentMemory: recentMemoryRuns.map((run) => ({
      time: run.startTime,
      summary: run.memorySummary || "无更新",
      dataSource: run.dataSource,
      dataSourceNote: run.dataSourceNote,
    })),
  };
}

export function buildBotModelData(agent: AgentDetail, runs: RunListItem[], settings: SettingsData): BotModelData {
  const latestRun = filterAgentRuns(agent, runs)[0];
  const gateway = settings.services.find((service) => service.name.includes("Gateway"));
  const platforms = new Map<string, BotPlatformRecord>();

  filterAgentRuns(agent, runs).forEach((run) => {
    const key = run.sourcePlatform || "系统";
    const existing = platforms.get(key);
    if (existing) {
      existing.sessions += 1;
      if (run.startTime > existing.lastMsg) {
        existing.lastMsg = run.startTime;
      }
      if (run.dataSource === "mock") {
        existing.dataSource = "mock";
        existing.dataSourceNote = run.dataSourceNote;
      }
      return;
    }

    platforms.set(key, {
      id: `${agent.id}-${key}`,
      name: key,
      status: key === "系统" ? "connected" : "connected",
      lastMsg: run.startTime,
      sessions: 1,
      dataSource: run.dataSource,
      dataSourceNote: run.dataSourceNote,
    });
  });

  if (platforms.size === 0) {
    platforms.set("系统", {
      id: `${agent.id}-system`,
      name: "系统",
      status: "disconnected",
      lastMsg: "—",
      sessions: 0,
      dataSource: "mock",
      dataSourceNote: "当前平台分布未从 OpenClaw runtime 单独沉淀",
    });
  }

  return {
    models: [
      {
        id: `${agent.id}-primary-model`,
        name: agent.model,
        provider: toProviderLabel(agent.model),
        role: "主模型",
        status: gateway?.status === "healthy" ? "healthy" : gateway?.status === "degraded" ? "degraded" : "down",
        lastTest: gateway?.lastHeartbeat || agent.lastRunTime,
        latency: latestRun ? `${Math.max(durationToSeconds(latestRun.duration), 1)}s` : "—",
        dataSource: "live",
      },
    ],
    platforms: Array.from(platforms.values()),
  };
}

export function buildBotSessionsData(agent: AgentDetail, runs: RunListItem[]): BotSessionRecord[] {
  return filterAgentRuns(agent, runs).map((run) => ({
    id: run.id,
    sessionId: run.runId,
    type: run.triggerSource === "chat" ? "对话" : run.triggerSource === "timed-task" ? "定时任务" : run.triggerSource === "manual" ? "手动" : "模板",
    platform: run.sourcePlatform || "系统",
    lastActive: run.startTime,
    messageCount: Math.max(Math.round(toTokenEstimate(run) / 120), 1),
    tokenUsage: toTokenEstimate(run),
    status: run.status === "running" ? "active" : "completed",
    risk: run.status === "failed",
    topic: run.conversationTopic || run.taskName,
    memorySummary: run.memorySummary || "无更新",
    dataSource: run.dataSource,
    dataSourceNote: run.dataSourceNote,
  }));
}

export function buildBotStatsData(agent: AgentDetail, runs: RunListItem[]): BotStatsData {
  const agentRuns = filterAgentRuns(agent, runs);
  const sessions = buildBotSessionsData(agent, runs);
  const tokenTotal = sessions.reduce((total, session) => total + session.tokenUsage, 0);
  const failureCount = sessions.filter((session) => session.risk).length;
  const platformGroups = new Map<string, number>();
  const dayGroups = new Map<string, { count: number; failures: number; dataSource: Provenance["dataSource"] }>();
  const averageSeconds =
    agentRuns.length > 0
      ? agentRuns.reduce((total, run) => total + durationToSeconds(run.duration), 0) / agentRuns.length
      : 0;

  sessions.forEach((session) => {
    platformGroups.set(session.platform, (platformGroups.get(session.platform) || 0) + 1);
    const day = getDayLabel(session.lastActive);
    const current = dayGroups.get(day) || { count: 0, failures: 0, dataSource: session.dataSource };
    current.count += 1;
    current.failures += session.risk ? 1 : 0;
    current.dataSource = current.dataSource === "mock" || session.dataSource === "mock" ? "mock" : "live";
    dayGroups.set(day, current);
  });

  return {
    summaryMetrics: [
      { label: "今日 Token", value: tokenTotal, change: 0, dataSource: "mock", dataSourceNote: "Token 消耗当前按运行记录估算" },
      { label: "本周 Token", value: tokenTotal, change: 0, dataSource: "mock", dataSourceNote: "当前仅基于已读取运行记录聚合" },
      { label: "本月 Token", value: tokenTotal, change: 0, dataSource: "mock", dataSourceNote: "当前仅基于已读取运行记录聚合" },
      {
        label: "平均响应时间",
        value: Number(averageSeconds.toFixed(1)),
        unit: "s",
        change: 0,
        dataSource: "mock",
        dataSourceNote: "平均响应时间当前按运行耗时估算",
      },
    ],
    sessionTrend: Array.from(dayGroups.entries()).map(([day, value]) => ({
      day,
      count: value.count,
      dataSource: value.dataSource,
    })),
    platformDistribution: Array.from(platformGroups.entries()).map(([platform, count]) => ({
      platform,
      count,
      pct: sessions.length > 0 ? Math.round((count / sessions.length) * 100) : 0,
      dataSource: platform === "系统" ? "mock" : "live",
      dataSourceNote: platform === "系统" ? "系统来源会话当前来自控制面兼容记录" : undefined,
    })),
    failureTrend: Array.from(dayGroups.entries()).map(([day, value]) => ({
      day,
      rate: value.count > 0 ? Number(((value.failures / value.count) * 100).toFixed(1)) : 0,
      dataSource: value.dataSource,
    })),
  };
}

export function buildBotAlertsData(agent: AgentDetail, runs: RunListItem[], settings: SettingsData): BotAlertsData {
  const agentRuns = filterAgentRuns(agent, runs);
  const activeAlerts: BotAlertRecord[] = [];

  agentRuns
    .filter((run) => run.status === "failed")
    .slice(0, 3)
    .forEach((run) => {
      activeAlerts.push({
        id: `run-${run.id}`,
        type: "active",
        severity: "high",
        message: `${run.taskName} 执行失败：${run.outputSummary}`,
        time: run.startTime,
        source: "运行记录",
        dataSource: run.dataSource,
        dataSourceNote: run.dataSourceNote,
      });
    });

  settings.services
    .filter((service) => service.status !== "healthy")
    .forEach((service) => {
      activeAlerts.push({
        id: `service-${service.name}`,
        type: "active",
        severity: service.status === "down" ? "high" : "medium",
        message: `${service.name} 当前状态为 ${service.status}`,
        time: service.lastHeartbeat,
        source: "服务健康",
        dataSource: service.dataSource,
        dataSourceNote: service.dataSourceNote,
      });
    });

  return {
    metrics: [
      { label: "健康分", value: Math.max(100 - activeAlerts.length * 20, 20), unit: "分", change: 0, danger: activeAlerts.length > 0, dataSource: "mock", dataSourceNote: "健康分当前由服务状态与失败记录推导" },
      { label: "活跃告警", value: activeAlerts.length, change: 0, danger: activeAlerts.length > 0, dataSource: activeAlerts.some((item) => item.dataSource === "live") ? "live" : "mock" },
      { label: "已恢复告警", value: 0, change: 0, dataSource: "mock", dataSourceNote: "恢复告警当前未单独持久化" },
      { label: "24h 风险事件", value: activeAlerts.length, change: 0, danger: activeAlerts.length > 0, dataSource: activeAlerts.some((item) => item.dataSource === "live") ? "live" : "mock" },
    ],
    alerts: activeAlerts,
    gatewayChecks: settings.services.map((service) => ({
      name: service.name,
      status: service.status === "healthy" ? "pass" : service.status === "degraded" ? "warn" : "fail",
      latency: "—",
      lastCheck: service.lastHeartbeat,
      dataSource: service.dataSource,
      dataSourceNote: service.dataSourceNote,
    })),
    platformChecks: Array.from(
      new Map(
        agentRuns.map((run) => [
          run.sourcePlatform || "系统",
          {
            platform: run.sourcePlatform || "系统",
            status: run.status === "failed" ? ("fail" as const) : ("pass" as const),
            lastMsg: run.startTime,
            dataSource: run.dataSource,
            dataSourceNote: run.dataSourceNote,
          },
        ]),
      ).values(),
    ),
  };
}
