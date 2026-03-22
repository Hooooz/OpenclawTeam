import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  createDashboardSnapshot,
  seedAgents,
  seedRuns,
  seedServerInfo,
  seedSkills
} from "@openclaw/shared";

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

app.get("/api/dashboard", async () => createDashboardSnapshot());
app.get("/api/agents", async () => seedAgents);
app.get("/api/skills", async () => seedSkills);
app.get("/api/runs", async () => seedRuns);
app.get("/api/server", async () => seedServerInfo);

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
