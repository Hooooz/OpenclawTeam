import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function loadModule() {
  const moduleUrl = `${pathToFileURL(path.resolve("src/collector-store.ts")).href}?t=${Date.now()}-${Math.random()}`;
  return import(moduleUrl);
}

async function loadControlCenterModule() {
  const moduleUrl = `${pathToFileURL(path.resolve("src/control-center.ts")).href}?t=${Date.now()}-${Math.random()}`;
  return import(moduleUrl);
}

test("upsertNodeMetadata persists and replaces aliases by nodeId", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "openclaw-node-metadata-"));
  const storePath = path.join(tempDir, "node-metadata.json");

  try {
    const { readNodeMetadata, upsertNodeMetadata } = await loadModule();

    await upsertNodeMetadata(storePath, {
      nodeId: "server-node",
      alias: "虾一号机",
      updatedAt: "2026-03-27 10:00",
    });

    await upsertNodeMetadata(storePath, {
      nodeId: "server-node",
      alias: "虾主机",
      updatedAt: "2026-03-27 10:05",
    });

    const records = await readNodeMetadata(storePath);
    assert.equal(records.length, 1);
    assert.equal(records[0]?.nodeId, "server-node");
    assert.equal(records[0]?.alias, "虾主机");
    assert.equal(records[0]?.updatedAt, "2026-03-27 10:05");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("upsertCollectorReport keeps bounded history per node", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "openclaw-collector-history-"));
  const storePath = path.join(tempDir, "collector-reports.json");

  try {
    const { readCollectorReports, upsertCollectorReport } = await loadModule();

    await upsertCollectorReport(storePath, {
      node: { id: "server-node", name: "Server", host: "10.0.0.1" },
      collectedAt: "2026-03-27 10:00:00",
    });
    await upsertCollectorReport(storePath, {
      node: { id: "server-node", name: "Server", host: "10.0.0.1" },
      collectedAt: "2026-03-27 10:05:00",
    });
    await upsertCollectorReport(storePath, {
      node: { id: "other-node", name: "Other", host: "10.0.0.2" },
      collectedAt: "2026-03-27 10:06:00",
    });

    const reports = await readCollectorReports(storePath);
    assert.equal(reports.length, 3);
    assert.deepEqual(
      reports.map((report) => `${report.node.id}:${report.collectedAt}`),
      [
        "other-node:2026-03-27 10:06:00",
        "server-node:2026-03-27 10:05:00",
        "server-node:2026-03-27 10:00:00",
      ],
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("collector public node ids round-trip raw ids without slug collisions", async () => {
  const { resolveCollectorNodeId, toCollectorPublicNodeId } = await loadControlCenterModule();

  const dotted = toCollectorPublicNodeId("server.node");
  const dashed = toCollectorPublicNodeId("server-node");

  assert.notEqual(dotted, dashed);
  assert.equal(resolveCollectorNodeId(dotted), "server.node");
  assert.equal(resolveCollectorNodeId(dashed), "server-node");
});
