import Fastify from "fastify";
import cors from "@fastify/cors";
import type { CreateAgentInput } from "@openclaw/shared";
import {
  createAgent,
  getDashboardSnapshot,
  getServerInfo,
  listAgents,
  listRuns,
  listSkills
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
