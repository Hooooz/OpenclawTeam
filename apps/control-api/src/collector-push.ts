import os from "node:os";
import { createControlCenterService } from "./control-center.js";

const managerUrl = process.env.COLLECTOR_MANAGER_URL?.trim();
const collectorToken = process.env.COLLECTOR_SHARED_TOKEN?.trim() || "openclaw-collector";

if (!managerUrl) {
  throw new Error("COLLECTOR_MANAGER_URL is required");
}

const service = createControlCenterService({
  includeCollectorReports: false,
  sourceMode: "local"
});

const nodeId = process.env.COLLECTOR_NODE_ID?.trim() || os.hostname().toLowerCase().replace(/[^a-z0-9]+/g, "-");
const nodeName = process.env.COLLECTOR_NODE_NAME?.trim() || os.hostname();
const nodeHost = process.env.COLLECTOR_NODE_HOST?.trim() || os.hostname();

const report = await service.buildCollectorReport({
  id: nodeId,
  name: nodeName,
  host: nodeHost
});

const response = await fetch(`${managerUrl.replace(/\/$/, "")}/api/control-center/collector-reports`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-collector-token": collectorToken
  },
  body: JSON.stringify(report)
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`collector push failed with ${response.status}: ${body}`);
}

console.log(`collector push ok: ${nodeName} -> ${managerUrl}`);
