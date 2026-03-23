import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeControlCenterAgentList,
  normalizeControlCenterRunList,
  normalizeDashboardSnapshot,
  resolveApiBaseUrl
} from "./api";

test("resolveApiBaseUrl falls back to current host instead of localhost", () => {
  const baseUrl = resolveApiBaseUrl("", {
    protocol: "http:",
    hostname: "192.168.31.189"
  });

  assert.equal(baseUrl, "http://192.168.31.189:3001");
});

test("normalizeDashboardSnapshot fills scheduler defaults when missing", () => {
  const snapshot = normalizeDashboardSnapshot({
    stats: [],
    focus: [],
    agents: [],
    skills: [],
    schedules: [],
    runs: [],
    server: {
      host: "192.168.31.189",
      os: "Windows 11 Pro",
      containerRuntime: "Docker 29.2.0 / Compose v5.0.2",
      repository: "https://github.com/Hooooz/OpenclawTeam.git"
    }
  });

  assert.equal(snapshot.scheduler.lastOutcome, "never");
  assert.equal(snapshot.scheduler.taskName, "OpenclawScheduleSweep");
});

test("normalizeControlCenterAgentList keeps provenance fields for live and mock attributes", () => {
  const agents = normalizeControlCenterAgentList([
    {
      id: "wecom-dm-huangchuhao",
      name: "Huangchuhao",
      position: "企业微信专属助理",
      department: "企业微信私聊",
      avatar: "H",
      motto: "把零散工作请求整理成可执行动作。",
      role: "负责接收请求并推进执行。",
      status: "idle",
      model: "gpt-5.3-codex",
      skillCount: 10,
      knowledgeCount: 1,
      lastRunTime: "18 小时前",
      lastRunStatus: "success",
      successRate: 100,
      group: "企业微信",
      communicationStyle: "务实跟进",
      specialties: ["feishu doc"],
      dataSource: "live",
      mockFields: ["position", "motto"]
    }
  ]);

  assert.equal(agents[0]?.dataSource, "live");
  assert.deepEqual(agents[0]?.mockFields, ["position", "motto"]);
});

test("normalizeControlCenterRunList keeps mixed live and mock records", () => {
  const runs = normalizeControlCenterRunList([
    {
      id: "run-live-1",
      runId: "RUN-LIVE-1",
      agentName: "Huangchuhao",
      agentPosition: "企业微信专属助理",
      agentId: "wecom-dm-huangchuhao",
      triggerSource: "chat",
      startTime: "2026-03-23 12:00",
      duration: "2m 10s",
      status: "success",
      outputSummary: "已整理 3 项待办。",
      traceId: "trace-live-1",
      taskName: "企业微信对话处理",
      conversationTopic: "整理今天的待办",
      memorySummary: "已连接 OpenClaw memory",
      versionDiff: "—",
      sourcePlatform: "企业微信",
      dataSource: "live"
    },
    {
      id: "run-mock-1",
      runId: "RUN-MOCK-1",
      agentName: "运营日报助手",
      agentPosition: "控制面存量任务",
      agentId: "agent-ops-daily",
      triggerSource: "timed-task",
      startTime: "2026-03-23 09:00",
      duration: "—",
      status: "running",
      outputSummary: "等待执行器接管。",
      traceId: "trace-mock-1",
      taskName: "存量计划执行",
      conversationTopic: "来自既有控制面的任务记录",
      memorySummary: "mock control-plane record",
      versionDiff: "—",
      sourcePlatform: "控制面",
      dataSource: "mock",
      dataSourceNote: "来自既有 control-plane 存量记录"
    }
  ]);

  assert.equal(runs.length, 2);
  assert.equal(runs[0]?.dataSource, "live");
  assert.equal(runs[1]?.dataSource, "mock");
  assert.match(runs[1]?.dataSourceNote || "", /control-plane/i);
});
