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
  startManualRun,
  updateScheduleStatus,
  updateAgentSkillBindings
} from "./store.js";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3001);

const app = Fastify({
  logger: true
});

await app.register(cors, {
  origin: true
});

app.get("/health", async () => ({
  ok: true,
  service: "control-api"
}));

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
    !body?.nextRunAt?.trim() ||
    !body?.summary?.trim()
  ) {
    return reply.status(400).send({
      ok: false,
      message: "name, agentId, cron, nextRunAt, and summary are required"
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
