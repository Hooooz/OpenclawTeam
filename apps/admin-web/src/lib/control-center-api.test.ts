import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collectMockNotes,
  fetchControlCenterAgentDetail,
  fetchControlCenterDashboard,
  toMockProvenance,
} from "./control-center-api";

describe("control-center-api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unwraps dashboard envelopes and preserves live/mock provenance", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            generatedAt: "2026-03-23 10:00",
            metrics: [{ label: "数字员工", value: 7, change: 0, dataSource: "live" }],
            services: [{ name: "Scheduler", status: "healthy", lastHeartbeat: "刚刚", dataSource: "live" }],
            risks: [{ id: "risk-1", level: "medium", message: "存在 1 个异常项", time: "刚刚", dataSource: "live" }],
            agents: [{ id: "wecom-dm-huangchuhao", name: "黄初号", position: "创始人助理", avatar: "黄", status: "running", skillCount: 8, lastRun: "刚刚", successRate: 98, dataSource: "live" }],
            runs: [{ id: "run-1", taskName: "晨间复盘", agentName: "黄初号", status: "success", startTime: "09:58", duration: "42s", memorySummary: "新增偏好 1 条", dataSource: "live" }],
            schedules: [{ id: "schedule-1", planName: "库存日报", agentName: "黄初号", cron: "0 9 * * *", nextRun: "2026-03-24 09:00", lastStatus: "success", consecutiveSuccess: 3, dataSource: "mock", dataSourceNote: "当前定时任务仍使用演示数据" }],
          },
        }),
      })),
    );

    const dashboard = await fetchControlCenterDashboard();

    expect(dashboard.metrics[0]?.value).toBe(7);
    expect(dashboard.agents[0]?.name).toBe("黄初号");
    expect(dashboard.schedules[0]?.dataSource).toBe("mock");
    expect(collectMockNotes(dashboard.schedules)).toEqual(["当前定时任务仍使用演示数据"]);
  });

  it("unwraps agent detail and keeps nested mock notes visible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            id: "employee-huangchuhao",
            name: "黄初号",
            position: "创始人助理",
            department: "总经办",
            avatar: "黄",
            motto: "先判断边界，再推动执行闭环。",
            role: "负责老板私聊工作编排与任务分发",
            status: "running",
            model: "gpt-5.4",
            skillCount: 8,
            knowledgeCount: 2,
            lastRunTime: "刚刚",
            lastRunStatus: "success",
            successRate: 98,
            group: "企业微信",
            communicationStyle: "直接清晰",
            specialties: ["任务拆解", "优先级判断"],
            machine: {
              id: "machine-192-168-31-189",
              name: "192.168.31.189",
              host: "192.168.31.189",
              runtime: "Windows 11 / OpenClaw Local",
              status: "healthy",
              dataSource: "live",
            },
            channelCount: 2,
            openclawCount: 1,
            description: "对接老板私聊里的真实工作请求。",
            owner: "黄初豪",
            createdAt: "2026-03-20",
            workCreed: "把复杂事项拆到可以推进。",
            systemPrompt: "你是创始人助理。",
            behaviorRules: ["先收集上下文", "不确定就标出风险"],
            outputStyle: "简洁执行摘要",
            channels: [
              {
                id: "channel-wecom-dm-huangchuhao",
                openclawAgentId: "wecom-dm-huangchuhao",
                name: "老板私聊",
                platform: "企业微信",
                channelType: "私聊",
                status: "running",
                sessionCount: 12,
                lastActive: "刚刚",
                lastMessage: "已整理今日工作优先级。",
                successRate: 98,
                model: "gpt-5.4",
                alertCount: 0,
                dataSource: "live",
              },
            ],
            skills: [{ id: "skill-1", name: "wecom", category: "integration", status: "active", dataSource: "live" }],
            knowledgeSources: [{ id: "knowledge-1", name: "老板偏好", type: "memory", lastSync: "刚刚", dataSource: "mock", dataSourceNote: "知识摘要仍使用演示聚合" }],
            schedules: [],
            recentRuns: [],
            auditLog: [],
            dataSource: "live",
          },
        }),
      })),
    );

    const agent = await fetchControlCenterAgentDetail("employee-huangchuhao");

    expect(agent.name).toBe("黄初号");
    expect(agent.channelCount).toBe(2);
    expect(agent.channels[0]?.channelType).toBe("私聊");
    expect(collectMockNotes(agent.knowledgeSources)).toEqual(["知识摘要仍使用演示聚合"]);
  });

  it("adds explicit mock provenance to fallback records", () => {
    expect(toMockProvenance("技能详情仍使用演示数据", ["status"])).toEqual({
      dataSource: "mock",
      dataSourceNote: "技能详情仍使用演示数据",
      mockFields: ["status"],
    });
  });
});
