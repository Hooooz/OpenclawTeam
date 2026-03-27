import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

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
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "openclaw-collector-integration-"));
  const openclawHome = path.join(tempDir, ".openclaw");
  const collectorStorePath = path.join(tempDir, ".runtime", "collector-reports.json");
  const nodeMetadataStorePath = path.join(tempDir, ".runtime", "node-metadata.json");

  await writeJson(path.join(openclawHome, "openclaw.json"), {
    meta: {
      lastTouchedVersion: "2026.3.26",
      lastTouchedAt: "2026-03-26T03:00:00.000Z",
    },
    agents: {
      defaults: {
        model: { primary: "openai/gpt-5.4-mini" },
      },
      list: [{ id: "wecom-dm-huangchuhao" }],
    },
    gateway: {
      port: 18789,
      bind: "loopback",
    },
  });

  await writeText(
    path.join(openclawHome, "maintenance", "openclaw-status.txt"),
    [
      "OpenClaw status",
      "| OS              | macos 15.3 (arm64) · node 24.10.0 |",
      "| Gateway         | local · ws://127.0.0.1:18789 (local loopback) · reachable |",
      "| Gateway service | local process · healthy |",
      "| Node service    | local process · healthy |",
      "| Agents          | 1 · default active |",
      "| Sessions        | 1 active · 1 stores |",
      "Summary: 0 critical · 0 warn · 0 info",
    ].join("\n"),
  );

  await writeText(path.join(openclawHome, "memory", "wecom-dm-huangchuhao.sqlite"), "");
  await writeJson(path.join(openclawHome, "cron", "jobs.json"), { jobs: [] });
  await writeJson(path.join(openclawHome, "agents", "wecom-dm-huangchuhao", "sessions", "sessions.json"), {
    "agent:wecom-dm-huangchuhao:dm:self": {
      sessionId: "local-session-1",
      updatedAt: Date.parse("2026-03-26T02:00:00.000Z"),
      chatType: "direct",
      abortedLastRun: false,
      origin: {
        label: "Local Boss",
        provider: "wecom",
        surface: "wecom",
        chatType: "direct",
      },
      modelProvider: "openai",
      model: "gpt-5.4-mini",
      sessionFile: "local-session-1.jsonl",
      skillsSnapshot: {
        skills: [{ name: "docx" }],
        resolvedSkills: [{ name: "docx", description: "Doc operations", source: "live" }],
      },
      systemPromptReport: {
        workspaceDir: path.join(openclawHome, "workspace-wecom-dm-huangchuhao"),
      },
    },
  });
  await writeText(
    path.join(openclawHome, "agents", "wecom-dm-huangchuhao", "sessions", "local-session-1.jsonl"),
    [
      JSON.stringify({ type: "session", id: "local-session-1", timestamp: "2026-03-26T01:59:00.000Z" }),
      JSON.stringify({
        type: "message",
        timestamp: "2026-03-26T02:00:00.000Z",
        message: {
          role: "user",
          content: [{ type: "text", text: "整理本机今日任务" }],
        },
      }),
      JSON.stringify({
        type: "message",
        timestamp: "2026-03-26T02:00:20.000Z",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "已整理本机任务摘要。" }],
        },
      }),
    ].join("\n"),
  );
  await writeText(
    path.join(openclawHome, "workspace-wecom-dm-huangchuhao", "AGENTS.md"),
    "# AGENTS\n你是本机数字员工。"
  );

  await writeJson(collectorStorePath, [
    {
      node: {
        id: "server-node",
        name: "远端服务器",
        host: "100.80.81.15",
      },
      collectedAt: "2026-03-26 10:00",
      agents: [
        {
          id: "employee-huangchuhao",
          name: "Server Huangchuhao",
          position: "企业微信专属助理",
          department: "企业微信私聊",
          avatar: "H",
          motto: "把零散工作请求整理成可执行动作。",
          role: "远端节点数字员工",
          status: "running",
          model: "gpt-5.4",
          skillCount: 3,
          knowledgeCount: 1,
          lastRunTime: "刚刚",
          lastRunStatus: "success",
          successRate: 100,
          group: "企业微信",
          communicationStyle: "务实跟进",
          specialties: ["任务拆解"],
          machine: {
            id: "machine-server",
            name: "100.80.81.15",
            host: "100.80.81.15",
            runtime: "Windows 11 / OpenClaw",
            status: "healthy",
            dataSource: "live",
          },
          channelCount: 2,
          openclawCount: 1,
          dataSource: "live",
        },
      ],
      agentDetails: [],
      runs: [],
      runDetails: [],
      schedules: [],
      settings: {
        deployInfo: {
          host: "100.80.81.15",
          os: "Windows 11",
          runtime: "OpenClaw local gateway",
          repo: "https://github.com/Hooooz/OpenclawTeam.git",
          lastDeploy: "2026-03-26 10:00",
          version: "2026.3.26",
          ports: [],
          dataSource: "live",
        },
        services: [],
        systemConfigs: [],
        nodes: [],
      },
    },
  ]);

  const fallback = {
    schedules: [],
    runs: [],
    skills: [{ id: "skill-docx", name: "docx" }],
    server: {
      host: "localhost",
      os: "macOS",
      containerRuntime: "Node 24",
      repository: "https://github.com/Hooooz/OpenclawTeam.git",
    },
    scheduler: {
      taskName: "OpenclawScheduleSweep",
      endpoint: "http://localhost:3201/api/schedules/run-due",
      lastHeartbeatAt: null,
      lastOutcome: "never" as const,
      lastMessage: "never",
    },
  };

  return { tempDir, openclawHome, collectorStorePath, nodeMetadataStorePath, fallback };
}

test("collector mode serves reported remote nodes without local direct data", async () => {
  const { tempDir, openclawHome, collectorStorePath, fallback } = await createFixture();

  try {
    const { createControlCenterService } = await loadControlCenterModule();
    const service = createControlCenterService({
      openclawHome,
      collectorStorePath,
      sourceMode: "collector",
      controlPlaneProvider: async () => fallback,
      now: () => new Date("2026-03-26T10:00:00.000Z"),
    });

    const agents = await service.listAgents();
    const settings = await service.getSettings();

    assert.equal(agents.length, 1);
    assert.match(agents[0]?.id || "", /^collector-server-node__/);
    assert.equal(agents[0]?.machine.host, "100.80.81.15");
    assert.equal(settings.nodes.length, 1);
    assert.equal(settings.nodes[0]?.host, "100.80.81.15");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("hybrid mode merges local and collector nodes into the same management backend", async () => {
  const { tempDir, openclawHome, collectorStorePath, fallback } = await createFixture();

  try {
    const { createControlCenterService } = await loadControlCenterModule();
    const service = createControlCenterService({
      openclawHome,
      collectorStorePath,
      sourceMode: "hybrid",
      controlPlaneProvider: async () => fallback,
      now: () => new Date("2026-03-26T10:00:00.000Z"),
    });

    const agents = await service.listAgents();
    const settings = await service.getSettings();

    assert.equal(agents.length, 2);
    assert.ok(agents.some((agent: { machine: { host: string } }) => agent.machine.host === "100.80.81.15"));
    assert.ok(agents.some((agent: { machine: { host: string } }) => agent.machine.host === "localhost"));
    assert.equal(settings.nodes.length, 2);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("buildCollectorReport rewrites live machine info to the reporting node", async () => {
  const { tempDir, openclawHome, collectorStorePath, fallback } = await createFixture();

  try {
    const { createControlCenterService } = await loadControlCenterModule();
    const service = createControlCenterService({
      openclawHome,
      collectorStorePath,
      sourceMode: "local",
      controlPlaneProvider: async () => fallback,
      now: () => new Date("2026-03-26T10:00:00.000Z"),
    });

    const report = await service.buildCollectorReport({
      id: "local-macbook",
      name: "本机 MacBook",
      host: "local-macbook",
    });

    assert.equal(report.agents.length, 1);
    assert.equal(report.agents[0]?.machine.host, "local-macbook");
    assert.equal(report.agentDetails[0]?.machine.host, "local-macbook");
    assert.equal(report.settings.deployInfo.host, "local-macbook");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("collector aliases override node and machine display names", async () => {
  const { tempDir, openclawHome, collectorStorePath, nodeMetadataStorePath, fallback } = await createFixture();

  try {
    await writeJson(nodeMetadataStorePath, [
      {
        nodeId: "server-node",
        alias: "虾远端一号机",
        updatedAt: "2026-03-26 11:00",
      },
    ]);

    const { createControlCenterService } = await loadControlCenterModule();
    const service = createControlCenterService({
      openclawHome,
      collectorStorePath,
      nodeMetadataStorePath,
      sourceMode: "collector",
      controlPlaneProvider: async () => fallback,
      now: () => new Date("2026-03-26T10:00:00.000Z"),
    });

    const agents = await service.listAgents();
    const settings = await service.getSettings();

    assert.equal(settings.nodes[0]?.name, "虾远端一号机");
    assert.equal(settings.nodes[0]?.originalName, "远端服务器");
    assert.equal(agents[0]?.machine.name, "虾远端一号机");
    assert.equal(agents[0]?.machine.originalName, "100.80.81.15");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
