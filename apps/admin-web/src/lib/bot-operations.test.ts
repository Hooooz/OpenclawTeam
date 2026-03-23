import { describe, expect, it } from "vitest";
import type { AgentDetail, RunListItem, SettingsData } from "./control-center-api";
import {
  buildBotAlertsData,
  buildBotModelData,
  buildBotOverviewData,
  buildBotSessionsData,
  buildBotStatsData,
} from "./bot-operations";

const agent: AgentDetail = {
  id: "wecom-dm-huangchuhao",
  name: "Huangchuhao",
  position: "企业微信专属助理",
  department: "企业微信私聊",
  avatar: "H",
  motto: "把零散工作请求整理成可执行动作。",
  role: "企业微信私聊场景下的数字员工，负责接收请求、梳理上下文并推动执行。",
  status: "idle",
  model: "gpt-5.3-codex",
  skillCount: 10,
  knowledgeCount: 1,
  lastRunTime: "20 小时前",
  lastRunStatus: "success",
  successRate: 100,
  group: "企业微信",
  communicationStyle: "务实跟进",
  specialties: ["feishu doc", "feishu drive"],
  description: "对接老板私聊工作请求。",
  owner: "Administrator",
  createdAt: "2026-03-21 11:02",
  workCreed: "让请求先被梳理清楚，再交给系统继续推进。",
  systemPrompt: "You are a wecom DM operator.",
  behaviorRules: ["先确认上下文", "输出下一步"],
  outputStyle: "简洁执行摘要",
  skills: [{ id: "skill-1", name: "feishu doc", category: "live", status: "active", dataSource: "live" }],
  knowledgeSources: [{ id: "k-1", name: "wecom-dm-huangchuhao.sqlite", type: "memory", lastSync: "刚刚", dataSource: "live" }],
  schedules: [],
  recentRuns: [],
  auditLog: [],
  dataSource: "live",
};

const runs: RunListItem[] = [
  {
    id: "run-1",
    runId: "run-1",
    agentName: "Huangchuhao",
    agentPosition: "企业微信专属助理",
    agentId: "wecom-dm-huangchuhao",
    triggerSource: "chat",
    startTime: "2026-03-23 09:00",
    duration: "2s",
    status: "success",
    outputSummary: "OK",
    traceId: "trace-1",
    taskName: "系统对话处理",
    conversationTopic: "老板晨会提醒",
    memorySummary: "新增偏好 1 条",
    versionDiff: "—",
    sourcePlatform: "企业微信",
    dataSource: "live",
  },
  {
    id: "run-2",
    runId: "run-2",
    agentName: "Huangchuhao",
    agentPosition: "企业微信专属助理",
    agentId: "wecom-dm-huangchuhao",
    triggerSource: "manual",
    startTime: "2026-03-23 09:05",
    duration: "5s",
    status: "failed",
    outputSummary: "超时",
    traceId: "trace-2",
    taskName: "系统对话处理",
    conversationTopic: "老板行程同步",
    memorySummary: "未接入独立记忆库",
    versionDiff: "—",
    sourcePlatform: "系统",
    dataSource: "mock",
    dataSourceNote: "来自既有 control-plane 存量记录",
  },
];

const settings: SettingsData = {
  deployInfo: {
    host: "192.168.31.189",
    os: "windows",
    runtime: "OpenClaw local gateway + node",
    repo: "repo",
    lastDeploy: "2026-03-23 13:00",
    version: "2026.3.13",
    ports: [
      { service: "Admin Web", port: 3200, protocol: "HTTP", dataSource: "mock" },
      { service: "Control API", port: 3201, protocol: "HTTP", dataSource: "mock" },
      { service: "OpenClaw Gateway", port: 18789, protocol: "HTTP", dataSource: "live" },
    ],
    dataSource: "live",
  },
  services: [
    { name: "Control API", status: "healthy", lastHeartbeat: "刚刚", dataSource: "mock" },
    { name: "OpenClaw Gateway", status: "down", lastHeartbeat: "unreachable", dataSource: "live" },
    { name: "Scheduler", status: "healthy", lastHeartbeat: "3 分钟前", dataSource: "mock", dataSourceNote: "来自现有 control-plane 调度守护心跳" },
  ],
  systemConfigs: [
    { key: "agent_default_model", label: "默认模型", value: "openai-codex/gpt-5.3-codex", editable: false, category: "AI", dataSource: "live" },
  ],
};

describe("bot-operations adapters", () => {
  it("builds bot overview data from live agent, runs, and settings", () => {
    const overview = buildBotOverviewData(agent, runs, settings);

    expect(overview.metrics.find((item) => item.label === "今日会话数")?.value).toBe(2);
    expect(overview.recentMemory[0]?.summary).toContain("新增偏好");
    expect(overview.quickLinks[0]?.to).toBe(`/agents/${agent.id}/bot/model`);
  });

  it("builds model and platform data with explicit provenance", () => {
    const modelData = buildBotModelData(agent, runs, settings);

    expect(modelData.models[0]?.provider).toBe("OpenAI Codex");
    expect(modelData.platforms.some((item) => item.name === "企业微信")).toBe(true);
    expect(modelData.platforms.find((item) => item.name === "系统")?.dataSource).toBe("mock");
  });

  it("builds session, stats, and alerts summaries from mixed live/mock runs", () => {
    const sessions = buildBotSessionsData(agent, runs);
    const stats = buildBotStatsData(agent, runs);
    const alerts = buildBotAlertsData(agent, runs, settings);

    expect(sessions[0]?.topic).toBe("老板行程同步");
    expect(stats.summaryMetrics.find((item) => item.label === "今日 Token")?.value).toBeGreaterThan(0);
    expect(alerts.gatewayChecks.find((item) => item.name === "OpenClaw Gateway")?.status).toBe("fail");
    expect(alerts.alerts.some((item) => item.type === "active")).toBe(true);
  });
});
