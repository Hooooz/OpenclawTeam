import { describe, expect, it } from "vitest";
import type { RunListItem } from "./control-center-api";
import { buildWorkbenchData } from "./dashboard-workbench";

const runs: RunListItem[] = [
  {
    id: "run-1",
    runId: "RUN-1",
    agentName: "Huangchuhao",
    agentPosition: "企业微信专属助理",
    agentId: "employee-huangchuhao",
    channelId: "channel-1",
    channelName: "老板私聊",
    channelType: "私聊",
    triggerSource: "chat",
    startTime: "2026-03-25 09:00",
    duration: "3m 20s",
    status: "success",
    outputSummary: "已整理飞书文档并输出会议纪要。",
    traceId: "trace-1",
    taskName: "文档整理",
    conversationTopic: "整理今天的会议纪要文档",
    memorySummary: "新增偏好 1 条",
    versionDiff: "—",
    sourcePlatform: "企业微信",
    dataSource: "live",
  },
  {
    id: "run-2",
    runId: "RUN-2",
    agentName: "Huangchuhao",
    agentPosition: "企业微信专属助理",
    agentId: "employee-huangchuhao",
    channelId: "channel-2",
    channelName: "群聊协作",
    channelType: "群聊",
    triggerSource: "chat",
    startTime: "2026-03-25 11:30",
    duration: "1m 10s",
    status: "success",
    outputSummary: "已完成任务拆解，并同步到群内。",
    traceId: "trace-2",
    taskName: "任务拆解",
    conversationTopic: "给今天的开发任务排优先级",
    memorySummary: "—",
    versionDiff: "—",
    sourcePlatform: "企业微信",
    dataSource: "live",
  },
  {
    id: "run-3",
    runId: "RUN-3",
    agentName: "Huangchuhao",
    agentPosition: "企业微信专属助理",
    agentId: "employee-huangchuhao",
    channelId: "channel-3",
    channelName: "主控线程",
    channelType: "系统",
    triggerSource: "manual",
    startTime: "2026-03-24 15:00",
    duration: "55s",
    status: "failed",
    outputSummary: "任务失败，等待人工复核。",
    traceId: "trace-3",
    taskName: "部署复核",
    conversationTopic: "复核部署状态",
    memorySummary: "—",
    versionDiff: "—",
    sourcePlatform: "系统",
    dataSource: "live",
  },
];

describe("dashboard-workbench", () => {
  it("builds today metrics and weekly aggregation from live runs", () => {
    const data = buildWorkbenchData(runs, new Date("2026-03-25T12:00:00+08:00"));

    expect(data.today.tasks.value).toBe(2);
    expect(data.today.files.value).toBe(1);
    expect(data.today.savings.value).toBeGreaterThan(0);
    expect(data.weekly).toHaveLength(7);
    expect(data.weekly[data.weekly.length - 1]?.tasks).toBe(2);
    expect(data.weekly[data.weekly.length - 1]?.files).toBe(1);
  });

  it("sorts feed items newest first and preserves channel context", () => {
    const data = buildWorkbenchData(runs, new Date("2026-03-25T12:00:00+08:00"));

    expect(data.feed).toHaveLength(3);
    expect(data.feed[0]?.id).toBe("run-2");
    expect(data.feed[0]?.channelName).toBe("群聊协作");
    expect(data.feed[2]?.status).toBe("failed");
  });
});
