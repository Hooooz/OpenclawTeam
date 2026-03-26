import Fastify from "fastify";
import cors from "@fastify/cors";
import type {
  CreateAgentInput,
  CreateScheduleInput,
  CreateSkillInput,
  TriggerRunInput
} from "@openclaw/shared";
import {
  createAgent,
  createSchedule,
  createSkill,
  getDashboardSnapshot,
  getServerInfo,
  listAgents,
  listRuns,
  listSchedules,
  listSkills,
  runDueSchedules,
  startManualRun,
  triggerScheduleRun,
  updateRunStatus,
  updateScheduleStatus,
  updateAgentSkillBindings
} from "./store.js";
import { createControlCenterService } from "./control-center.js";
import type { CollectorNodeReport } from "./collector-store.js";
import { buildNodeRegistrationBundle } from "./node-registration.js";
import { readCollectorReports, getCollectorReportsStorePath } from "./collector-store.js";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3201);

const app = Fastify({
  logger: true
});
const controlCenter = createControlCenterService();

await app.register(cors, {
  origin: true
});

app.get("/health", async () => ({
  ok: true,
  service: "control-api"
}));

app.get("/api/control-center/dashboard", async () => ({
  ok: true,
  data: await controlCenter.getDashboard()
}));
app.get("/api/control-center/agents", async () => ({
  ok: true,
  data: await controlCenter.listAgents()
}));
app.get<{ Params: { agentId: string } }>("/api/control-center/agents/:agentId", async (request, reply) => {
  const agent = await controlCenter.getAgentDetail(request.params.agentId);

  if (!agent) {
    return reply.status(404).send({
      ok: false,
      message: "Agent not found"
    });
  }

  return {
    ok: true,
    data: agent
  };
});
app.get("/api/control-center/runs", async () => ({
  ok: true,
  data: await controlCenter.listRuns()
}));
app.get<{ Params: { runId: string } }>("/api/control-center/runs/:runId", async (request, reply) => {
  const run = await controlCenter.getRunDetail(request.params.runId);

  if (!run) {
    return reply.status(404).send({
      ok: false,
      message: "Run not found"
    });
  }

  return {
    ok: true,
    data: run
  };
});
app.get("/api/control-center/schedules", async () => ({
  ok: true,
  data: await controlCenter.listSchedules()
}));
app.get("/api/control-center/settings", async () => ({
  ok: true,
  data: await controlCenter.getSettings()
}));
app.get("/api/control-center/node-management", async (request) => {
  const publicUrl = process.env.CONTROL_CENTER_PUBLIC_URL?.trim();
  const managerUrl =
    publicUrl?.replace(/\/$/, "") ||
    `${request.protocol}://${String(request.headers.host || `127.0.0.1:${port}`)}`.replace(/\/$/, "");
  const settings = await controlCenter.getSettings();
  const collectorToken = process.env.COLLECTOR_SHARED_TOKEN?.trim() || "openclaw-collector";

  return {
    ok: true,
    data: {
      nodes: settings.nodes,
      registration: buildNodeRegistrationBundle({
        managerUrl,
        collectorToken
      })
    }
  };
});
app.get<{ Params: { nodeId: string } }>("/api/control-center/nodes/:nodeId", async (request, reply) => {
  const storePath = getCollectorReportsStorePath();
  const reports = await readCollectorReports(storePath);
  const nodeReport = reports.find((r) => r.node.id === request.params.nodeId);

  if (!nodeReport) {
    return reply.status(404).send({
      ok: false,
      message: "Node not found"
    });
  }

  const recentReports = reports
    .filter((r) => r.node.id === request.params.nodeId)
    .sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime())
    .slice(0, 10)
    .map((r) => ({
      collectedAt: r.collectedAt,
      agentCount: r.agents?.length || 0,
      runCount: r.runs?.length || 0,
      scheduleCount: r.schedules?.length || 0
    }));

  return {
    ok: true,
    data: {
      node: nodeReport.node,
      latestReport: {
        collectedAt: nodeReport.collectedAt,
        agentCount: nodeReport.agents?.length || 0,
        runCount: nodeReport.runs?.length || 0,
        scheduleCount: nodeReport.schedules?.length || 0,
        agents: nodeReport.agents || [],
        runs: nodeReport.runs?.slice(0, 5) || [],
        schedules: nodeReport.schedules || []
      },
      recentReports
    }
  };
});
app.post<{ Body: CollectorNodeReport }>("/api/control-center/collector-reports", async (request, reply) => {
  const expectedToken = process.env.COLLECTOR_SHARED_TOKEN?.trim() || "openclaw-collector";
  const providedToken = String(request.headers["x-collector-token"] || "");

  if (providedToken !== expectedToken) {
    return reply.status(401).send({
      ok: false,
      message: "collector token invalid"
    });
  }

  const report = request.body;

  if (!report?.node?.id || !report?.node?.name || !report?.node?.host) {
    return reply.status(400).send({
      ok: false,
      message: "node.id, node.name, and node.host are required"
    });
  }

  await controlCenter.ingestCollectorReport(report);

  return reply.status(202).send({
    ok: true
  });
});

app.get("/api/dashboard", async () => getDashboardSnapshot());
app.get("/api/agents", async () => listAgents());
app.get("/api/skills", async () => listSkills());
app.get("/api/schedules", async () => listSchedules());
app.get("/api/runs", async () => listRuns());
app.get("/api/server", async () => getServerInfo());

app.post<{ Body: CreateAgentInput }>("/api/agents", async (request, reply) => {
  const body = request.body;

  if (!body?.name?.trim() || !body?.model?.trim() || !body?.summary?.trim()) {
    return reply.status(400).send({
      ok: false,
      message: "name, model, and summary are required"
    });
  }

  const agent = await createAgent(body);

  return reply.status(201).send({
    ok: true,
    agent
  });
});

app.patch<{ Params: { agentId: string }; Body: { skillIds: string[] } }>(
  "/api/agents/:agentId/skills",
  async (request, reply) => {
    const { agentId } = request.params;
    const skillIds = Array.isArray(request.body?.skillIds) ? request.body.skillIds : [];
    const agent = await updateAgentSkillBindings(agentId, skillIds);

    if (!agent) {
      return reply.status(404).send({
        ok: false,
        message: "Agent not found"
      });
    }

    return reply.send({
      ok: true,
      agent
    });
  }
);

app.post<{ Body: CreateSkillInput }>("/api/skills", async (request, reply) => {
  const body = request.body;

  if (
    !body?.name?.trim() ||
    !body?.category?.trim() ||
    !body?.version?.trim() ||
    !body?.description?.trim()
  ) {
    return reply.status(400).send({
      ok: false,
      message: "name, category, version, and description are required"
    });
  }

  const skill = await createSkill(body);

  return reply.status(201).send({
    ok: true,
    skill
  });
});

app.post<{ Body: CreateScheduleInput }>("/api/schedules", async (request, reply) => {
  const body = request.body;

  if (
    !body?.name?.trim() ||
    !body?.agentId?.trim() ||
    !body?.cron?.trim() ||
    !body?.summary?.trim()
  ) {
    return reply.status(400).send({
      ok: false,
      message: "name, agentId, cron, and summary are required"
    });
  }

  const schedule = await createSchedule(body);

  if (!schedule) {
    return reply.status(404).send({
      ok: false,
      message: "Agent not found"
    });
  }

  return reply.status(201).send({
    ok: true,
    schedule
  });
});

app.patch<{ Params: { scheduleId: string }; Body: { status: "active" | "paused" } }>(
  "/api/schedules/:scheduleId/status",
  async (request, reply) => {
    const { scheduleId } = request.params;
    const status = request.body?.status;

    if (status !== "active" && status !== "paused") {
      return reply.status(400).send({
        ok: false,
        message: "status must be active or paused"
      });
    }

    const schedule = await updateScheduleStatus(scheduleId, status);

    if (!schedule) {
      return reply.status(404).send({
        ok: false,
        message: "Schedule not found"
      });
    }

    return reply.send({
      ok: true,
      schedule
    });
  }
);

app.post<{ Params: { scheduleId: string } }>(
  "/api/schedules/:scheduleId/trigger",
  async (request, reply) => {
    const { scheduleId } = request.params;
    const result = await triggerScheduleRun(scheduleId);

    if (!result.ok) {
      const statusCode =
        result.code === "SCHEDULE_NOT_FOUND" || result.code === "AGENT_NOT_FOUND"
          ? 404
          : 409;

      return reply.status(statusCode).send(result);
    }

    return reply.status(201).send(result);
  }
);

app.post<{ Body: { now?: string } }>("/api/schedules/run-due", async (request, reply) => {
  const result = await runDueSchedules(request.body?.now);

  return reply.send({
    ok: true,
    runs: result.runs
  });
});

app.post<{ Body: TriggerRunInput }>("/api/runs", async (request, reply) => {
  const agentId = request.body?.agentId?.trim();

  if (!agentId) {
    return reply.status(400).send({
      ok: false,
      message: "agentId is required"
    });
  }

  const result = await startManualRun(agentId);

  if (!result.ok) {
    const statusCode = result.code === "AGENT_NOT_FOUND" ? 404 : 409;
    return reply.status(statusCode).send(result);
  }

  return reply.status(201).send(result);
});

app.patch<{
  Params: { runId: string };
  Body: { status: "success" | "failed"; summary?: string };
}>("/api/runs/:runId", async (request, reply) => {
  const { runId } = request.params;
  const status = request.body?.status;
  const summary = request.body?.summary || "";

  if (status !== "success" && status !== "failed") {
    return reply.status(400).send({
      ok: false,
      message: "status must be success or failed"
    });
  }

  const run = await updateRunStatus(runId, status, summary);

  if (!run) {
    return reply.status(404).send({
      ok: false,
      message: "Run not found"
    });
  }

  return reply.send({
    ok: true,
    run
  });
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  void reply.status(500).send({
    ok: false,
    message: "Unexpected control-plane error"
  });
});

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
