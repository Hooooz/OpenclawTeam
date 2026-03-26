import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

type ControlPlaneFallback = {
  schedules: Array<{
    id: string;
    name: string;
    agentId: string;
    agentName: string;
    cron: string;
    nextRunAt: string;
    status: "active" | "paused";
    summary: string;
  }>;
  runs: Array<{
    id: string;
    agentName: string;
    triggerType: "manual" | "schedule";
    status: "success" | "failed" | "running";
    summary: string;
    startedAt: string;
    traceId: string;
  }>;
  skills: Array<{ id: string; name: string }>;
  server: {
    host: string;
    os: string;
    containerRuntime: string;
    repository: string;
  };
  scheduler: {
    taskName: string;
    endpoint: string;
    lastHeartbeatAt: string | null;
    lastOutcome: "success" | "failed" | "never";
    lastMessage: string;
  };
};

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function writeText(filePath: string, value: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, "utf8");
}

async function loadControlCenterModule() {
  const moduleUrl = `${pathToFileURL(path.resolve("src/control-center.ts")).href}?t=${Date.now()}-${Math.random()}`;
  return import(moduleUrl);
}

async function createFixture() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "openclaw-control-center-"));
  const openclawHome = path.join(tempDir, ".openclaw");

  await writeJson(path.join(openclawHome, "openclaw.json"), {
    meta: {
      lastTouchedVersion: "2026.3.13",
      lastTouchedAt: "2026-03-21T03:02:55.387Z"
    },
    agents: {
      defaults: {
        model: {
          primary: "openai-codex/gpt-5.3-codex"
        },
        workspace: "C:\\Users\\Administrator\\.openclaw\\workspace"
      },
      list: [{ id: "main" }, { id: "wecom-dm-huangchuhao" }, { id: "wecom-group-demo-01" }]
    },
    gateway: {
      port: 18789,
      bind: "loopback"
    },
    tools: {
      web: {
        search: { enabled: false },
        fetch: { enabled: true }
      }
    }
  });

  await writeText(
    path.join(openclawHome, "maintenance", "openclaw-status.txt"),
    [
      "OpenClaw status",
      "",
      "Overview",
      "| OS              | windows 10.0.26200 (x64) · node 24.14.0 |",
      "| Gateway         | local · ws://127.0.0.1:18789 (local loopback) · reachable |",
      "| Gateway service | Scheduled Task installed · registered · healthy |",
      "| Node service    | Scheduled Task installed · registered · healthy |",
      "| Agents          | 2 · 2 bootstrap files present · sessions 2 · default main active 2h ago |",
      "| Sessions        | 2 active · default gpt-5.3-codex (200k ctx) · 2 stores |",
      "",
      "Security audit",
      "Summary: 1 critical · 1 warn · 0 info",
      "  CRITICAL Enterprise WeChat DMs are open",
      "  WARN Reverse proxy headers are not trusted"
    ].join("\n")
  );

  await writeJson(path.join(openclawHome, "cron", "jobs.json"), {
    version: 1,
    jobs: []
  });

  await writeText(path.join(openclawHome, "memory", "wecom-dm-huangchuhao.sqlite"), "");

  await writeJson(path.join(openclawHome, "agents", "wecom-dm-huangchuhao", "sessions", "sessions.json"), {
    "agent:wecom-dm-huangchuhao:dm:huangchuhao": {
      sessionId: "session-hch-1",
      updatedAt: Date.parse("2026-03-23T02:15:00.000Z"),
      chatType: "direct",
      abortedLastRun: false,
      origin: {
        label: "HuangChuHao",
        provider: "wecom",
        surface: "wecom",
        chatType: "direct"
      },
      sessionFile:
        "C:\\Users\\Administrator\\.openclaw\\agents\\wecom-dm-huangchuhao\\sessions\\session-hch-1.jsonl",
      modelProvider: "openai-codex",
      model: "gpt-5.3-codex",
      skillsSnapshot: {
        skills: [{ name: "feishu-doc" }, { name: "coding-agent" }],
        resolvedSkills: [
          {
            name: "feishu-doc",
            description: "Feishu document operations",
            source: "live"
          },
          {
            name: "coding-agent",
            description: "Delegate coding tasks",
            source: "live"
          }
        ]
      },
      systemPromptReport: {
        workspaceDir: "C:\\Users\\Administrator\\.openclaw\\workspace-wecom-dm-huangchuhao"
      }
    },
    "agent:wecom-dm-huangchuhao:main": {
      sessionId: "session-hch-main",
      updatedAt: Date.parse("2026-03-23T02:18:00.000Z"),
      chatType: "direct",
      abortedLastRun: false,
      sessionFile:
        "C:\\Users\\Administrator\\.openclaw\\agents\\wecom-dm-huangchuhao\\sessions\\session-hch-main.jsonl",
      modelProvider: "openai-codex",
      model: "gpt-5.3-codex",
      skillsSnapshot: {
        skills: [{ name: "feishu-doc" }, { name: "coding-agent" }],
        resolvedSkills: [
          {
            name: "feishu-doc",
            description: "Feishu document operations",
            source: "live"
          },
          {
            name: "coding-agent",
            description: "Delegate coding tasks",
            source: "live"
          }
        ]
      },
      systemPromptReport: {
        workspaceDir: "C:\\Users\\Administrator\\.openclaw\\workspace-wecom-dm-huangchuhao"
      }
    }
  });

  await writeText(
    path.join(openclawHome, "agents", "wecom-dm-huangchuhao", "sessions", "session-hch-1.jsonl"),
    [
      JSON.stringify({
        type: "session",
        id: "session-hch-1",
        timestamp: "2026-03-23T02:00:00.000Z"
      }),
      JSON.stringify({
        type: "message",
        timestamp: "2026-03-23T02:01:00.000Z",
        message: {
          role: "user",
          content: [{ type: "text", text: "请帮我整理今天的待办，并按优先级排序。" }]
        }
      }),
      JSON.stringify({
        type: "message",
        timestamp: "2026-03-23T02:14:00.000Z",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "已整理 3 项待办，最高优先级是今天的接口联调和部署验证。" }]
        }
      })
    ].join("\n")
  );

  await writeText(
    path.join(openclawHome, "agents", "wecom-dm-huangchuhao", "sessions", "session-hch-main.jsonl"),
    [
      JSON.stringify({
        type: "session",
        id: "session-hch-main",
        timestamp: "2026-03-23T02:16:00.000Z"
      }),
      JSON.stringify({
        type: "message",
        timestamp: "2026-03-23T02:16:30.000Z",
        message: {
          role: "user",
          content: [{ type: "text", text: "把今天的重点同步成主控线程摘要。" }]
        }
      }),
      JSON.stringify({
        type: "message",
        timestamp: "2026-03-23T02:18:00.000Z",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "已汇总主控线程摘要，包含联调、验收和部署三项重点。" }]
        }
      })
    ].join("\n")
  );

  await writeText(
    path.join(openclawHome, "workspace-wecom-dm-huangchuhao", "AGENTS.md"),
    "# AGENTS\n你是黄楚浩的企业微信数字助理，负责整理工作请求、安排优先级并沉淀行动项。"
  );

  await writeJson(path.join(openclawHome, "agents", "wecom-group-demo-01", "sessions", "sessions.json"), {
    "agent:wecom-group-demo-01:group:project": {
      sessionId: "session-group-1",
      updatedAt: Date.parse("2026-03-23T02:10:00.000Z"),
      chatType: "group",
      abortedLastRun: false,
      origin: {
        label: "Project Group",
        provider: "wecom",
        surface: "wecom",
        chatType: "group"
      },
      sessionFile:
        "C:\\Users\\Administrator\\.openclaw\\agents\\wecom-group-demo-01\\sessions\\session-group-1.jsonl",
      modelProvider: "openai-codex",
      model: "gpt-5.3-codex",
      skillsSnapshot: {
        skills: [{ name: "feishu-doc" }],
        resolvedSkills: [
          {
            name: "feishu-doc",
            description: "Feishu document operations",
            source: "live"
          }
        ]
      },
      systemPromptReport: {
        workspaceDir: "C:\\Users\\Administrator\\.openclaw\\workspace-wecom-dm-huangchuhao"
      }
    }
  });

  await writeText(
    path.join(openclawHome, "agents", "wecom-group-demo-01", "sessions", "session-group-1.jsonl"),
    [
      JSON.stringify({
        type: "session",
        id: "session-group-1",
        timestamp: "2026-03-23T02:05:00.000Z"
      }),
      JSON.stringify({
        type: "message",
        timestamp: "2026-03-23T02:06:00.000Z",
        message: {
          role: "user",
          content: [{ type: "text", text: "群里同步一下今天的排期进展。" }]
        }
      }),
      JSON.stringify({
        type: "message",
        timestamp: "2026-03-23T02:10:00.000Z",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "已同步今日排期：接口联调、页面验收、部署复核。" }]
        }
      })
    ].join("\n")
  );

  const fallback: ControlPlaneFallback = {
    schedules: [
      {
        id: "schedule-fallback-1",
        name: "晨间运营播报",
        agentId: "agent-ops-daily",
        agentName: "运营日报助手",
        cron: "0 9 * * *",
        nextRunAt: "2026-03-23 09:00",
        status: "active",
        summary: "来自现有控制面的保留任务。"
      }
    ],
    runs: [
      {
        id: "run-fallback-1",
        agentName: "运营日报助手",
        triggerType: "schedule",
        status: "failed",
        summary: "fallback run",
        startedAt: "2026-03-22 10:00",
        traceId: "trace-fallback-1"
      }
    ],
    skills: [
      { id: "skill-docx", name: "docx" },
      { id: "skill-browser", name: "agent-browser" }
    ],
    server: {
      host: "192.168.31.189",
      os: "Windows 11 Pro",
      containerRuntime: "Node 24 / Docker 29",
      repository: "https://github.com/Hooooz/OpenclawTeam.git"
    },
    scheduler: {
      taskName: "OpenclawScheduleSweep",
      endpoint: "http://localhost:3201/api/schedules/run-due",
      lastHeartbeatAt: "2026-03-23 10:20",
      lastOutcome: "success",
      lastMessage: "ok"
    }
  };

  return { tempDir, openclawHome, fallback };
}

async function createSingleWorkspaceFixture() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "openclaw-control-center-single-"));
  const openclawHome = path.join(tempDir, ".openclaw");
  const workspaceDir = path.join(tempDir, "clawd");

  await writeJson(path.join(openclawHome, "openclaw.json"), {
    meta: {
      lastTouchedVersion: "2026.3.26",
      lastTouchedAt: "2026-03-26T03:02:55.387Z"
    },
    agents: {
      defaults: {
        model: {
          primary: "openai-codex/gpt-5.4"
        },
        workspace: workspaceDir
      }
    },
    gateway: {
      port: 18789,
      bind: "loopback"
    }
  });

  await writeText(
    path.join(openclawHome, "maintenance", "openclaw-status.txt"),
    [
      "OpenClaw status",
      "| OS              | macos 15.3 (arm64) · node 24.10.0 |",
      "| Gateway         | local · ws://127.0.0.1:18789 (local loopback) · reachable |",
      "| Gateway service | local process · healthy |",
      "| Node service    | local process · healthy |",
      "| Agents          | 1 · default main active |",
      "| Sessions        | 0 active · 1 stores |",
      "Summary: 0 critical · 0 warn · 0 info"
    ].join("\n")
  );

  await writeText(path.join(openclawHome, "memory", "main.sqlite"), "");
  await writeJson(path.join(openclawHome, "cron", "jobs.json"), {
    version: 1,
    jobs: []
  });

  await writeText(
    path.join(workspaceDir, "IDENTITY.md"),
    ["# IDENTITY.md - Who Am I?", "", "- **Name:** 洞察", "- **Creature:** AI 创意合作伙伴"].join("\n")
  );
  await writeText(path.join(workspaceDir, "USER.md"), ["# USER.md", "", "- **Name:** Howie"].join("\n"));
  await writeText(path.join(workspaceDir, "SOUL.md"), "# SOUL\n- 主动梳理信息。");
  await writeText(path.join(workspaceDir, "AGENTS.md"), "# AGENTS\n你是 Howie 的 AI 产品搭档。");

  const fallback: ControlPlaneFallback = {
    schedules: [],
    runs: [],
    skills: [],
    server: {
      host: "localhost",
      os: "macOS",
      containerRuntime: "Node 24",
      repository: "https://github.com/Hooooz/OpenclawTeam.git"
    },
    scheduler: {
      taskName: "OpenclawScheduleSweep",
      endpoint: "http://localhost:3201/api/schedules/run-due",
      lastHeartbeatAt: null,
      lastOutcome: "never",
      lastMessage: "never"
    }
  };

  return { tempDir, openclawHome, fallback };
}

test("listAgents collapses machine-level OpenClaw suites into one business employee", async () => {
  const { tempDir, openclawHome, fallback } = await createFixture();

  try {
    const { createControlCenterService } = await loadControlCenterModule();
    const service = createControlCenterService({
      openclawHome,
      controlPlaneProvider: async () => fallback,
      now: () => new Date("2026-03-23T02:20:00.000Z")
    });

    const agents = await service.listAgents();
    const liveAgent = agents.find((item: { id: string }) => item.id === "employee-huangchuhao");

    assert.ok(liveAgent);
    assert.equal(liveAgent.dataSource, "live");
    assert.equal(liveAgent.skillCount, 2);
    assert.equal(liveAgent.knowledgeCount, 1);
    assert.equal(liveAgent.status, "running");
    assert.equal(liveAgent.channelCount, 3);
    assert.equal(liveAgent.openclawCount, 1);
    assert.equal(liveAgent.machine.name, "192.168.31.189");
    assert.match(liveAgent.role, /企业微信|工作请求/);
    assert.ok(Array.isArray(liveAgent.mockFields));
    assert.ok(liveAgent.mockFields.includes("position"));
    assert.ok(liveAgent.mockFields.includes("motto"));
    assert.equal(agents.length, 1);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("listAgents discovers a single-workspace OpenClaw without agents.list", async () => {
  const { tempDir, openclawHome, fallback } = await createSingleWorkspaceFixture();

  try {
    const { createControlCenterService } = await loadControlCenterModule();
    const service = createControlCenterService({
      openclawHome,
      controlPlaneProvider: async () => fallback,
      now: () => new Date("2026-03-26T10:00:00.000Z")
    });

    const agents = await service.listAgents();
    const detail = await service.getAgentDetail(agents[0]!.id);

    assert.equal(agents.length, 1);
    assert.equal(agents[0]?.name, "洞察");
    assert.equal(agents[0]?.machine.host, "localhost");
    assert.equal(agents[0]?.openclawCount, 1);
    assert.equal(agents[0]?.channelCount, 0);
    assert.equal(detail?.name, "洞察");
    assert.equal(detail?.channelCount, 0);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("getAgentDetail returns all live channels nested under one employee", async () => {
  const { tempDir, openclawHome, fallback } = await createFixture();

  try {
    const { createControlCenterService } = await loadControlCenterModule();
    const service = createControlCenterService({
      openclawHome,
      controlPlaneProvider: async () => fallback,
      now: () => new Date("2026-03-23T02:20:00.000Z")
    });

    const agent = await service.getAgentDetail("employee-huangchuhao");

    assert.ok(agent);
    assert.equal(agent.id, "employee-huangchuhao");
    assert.equal(agent.channels.length, 3);
    assert.equal(agent.channelCount, 3);
    assert.equal(agent.channels[0]?.platform, "企业微信");
    assert.equal(agent.channels[0]?.channelType, "私聊");
    assert.equal(agent.channels[1]?.channelType, "群聊");
    assert.equal(agent.channels[1]?.platform, "企业微信");
    assert.match(agent.channels[1]?.name || "", /Project Group/);
    assert.equal(agent.channels[2]?.channelType, "系统");
    assert.match(agent.channels[2]?.name || "", /主控|主线程/);
    assert.equal(agent.machine.host, "192.168.31.189");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("listRuns turns live session history into conversation work records", async () => {
  const { tempDir, openclawHome, fallback } = await createFixture();

  try {
    const { createControlCenterService } = await loadControlCenterModule();
    const service = createControlCenterService({
      openclawHome,
      controlPlaneProvider: async () => fallback,
      now: () => new Date("2026-03-23T02:20:00.000Z")
    });

    const runs = await service.listRuns();
    const run = runs.find(
      (item: { agentId: string; triggerSource: string; channelType: string }) =>
        item.agentId === "employee-huangchuhao" && item.triggerSource === "chat" && item.channelType === "私聊"
    );

    assert.ok(run);
    assert.equal(run.dataSource, "live");
    assert.equal(run.agentId, "employee-huangchuhao");
    assert.equal(run.triggerSource, "chat");
    assert.equal(run.sourcePlatform, "企业微信");
    assert.match(run.conversationTopic, /整理今天的待办/);
    assert.match(run.outputSummary, /已整理 3 项待办/);
    assert.equal(run.status, "running");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("listSchedules keeps fallback task data when OpenClaw cron jobs are empty and marks it as mock", async () => {
  const { tempDir, openclawHome, fallback } = await createFixture();

  try {
    const { createControlCenterService } = await loadControlCenterModule();
    const service = createControlCenterService({
      openclawHome,
      controlPlaneProvider: async () => fallback,
      now: () => new Date("2026-03-23T02:20:00.000Z")
    });

    const schedules = await service.listSchedules();

    assert.equal(schedules.length, 1);
    assert.equal(schedules[0]?.id, "schedule-fallback-1");
    assert.equal(schedules[0]?.dataSource, "mock");
    assert.match(schedules[0]?.dataSourceNote || "", /OpenClaw.*cron/i);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
