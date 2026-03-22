import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function loadStoreWithTempDir() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "openclaw-control-api-"));
  process.env.CONTROL_PLANE_DATA_DIR = tempDir;

  const storeModuleUrl = `${pathToFileURL(path.resolve("src/store.ts")).href}?t=${Date.now()}-${Math.random()}`;
  const store = await import(storeModuleUrl);

  return {
    tempDir,
    store
  };
}

test("startManualRun creates a running record for an active agent and persists it", async () => {
  const { tempDir, store } = await loadStoreWithTempDir();

  try {
    const beforeRuns = await store.listRuns();
    const result = await store.startManualRun("agent-ops-daily");

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.run.agentName, "运营日报助手");
    assert.equal(result.run.triggerType, "manual");
    assert.equal(result.run.status, "running");

    const afterRuns = await store.listRuns();
    assert.equal(afterRuns.length, beforeRuns.length + 1);
    assert.equal(afterRuns[0]?.id, result.run.id);

    const stored = JSON.parse(
      await readFile(path.join(tempDir, "control-plane.json"), "utf8")
    ) as { runs: Array<{ id: string }> };

    assert.equal(stored.runs[0]?.id, result.run.id);
  } finally {
    delete process.env.CONTROL_PLANE_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("startManualRun rejects a paused agent without creating a run", async () => {
  const { tempDir, store } = await loadStoreWithTempDir();

  try {
    const beforeRuns = await store.listRuns();
    const result = await store.startManualRun("agent-doc-backfill");

    assert.deepEqual(result, {
      ok: false,
      code: "AGENT_PAUSED",
      message: "Agent is paused"
    });

    const afterRuns = await store.listRuns();
    assert.equal(afterRuns.length, beforeRuns.length);
  } finally {
    delete process.env.CONTROL_PLANE_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
});
