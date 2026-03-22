import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

test("createSchedule persists a schedule with the bound agent name", async () => {
  const { tempDir, store } = await loadStoreWithTempDir();

  try {
    const beforeSchedules = await store.listSchedules();
    const schedule = await store.createSchedule({
      name: "晚间文档补全",
      agentId: "agent-doc-backfill",
      cron: "30 20 * * *",
      nextRunAt: "2026-03-22 20:30",
      summary: "晚上统一补齐文档缺口。",
      status: "paused"
    });

    assert.equal(schedule.agentName, "文档补全助手");
    assert.equal(schedule.status, "paused");

    const afterSchedules = await store.listSchedules();
    assert.equal(afterSchedules.length, beforeSchedules.length + 1);
    assert.equal(afterSchedules[0]?.id, schedule.id);

    const stored = JSON.parse(
      await readFile(path.join(tempDir, "control-plane.json"), "utf8")
    ) as { schedules: Array<{ id: string; agentName: string }> };

    assert.equal(stored.schedules[0]?.id, schedule.id);
    assert.equal(stored.schedules[0]?.agentName, "文档补全助手");
  } finally {
    delete process.env.CONTROL_PLANE_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("updateScheduleStatus changes only the target schedule status", async () => {
  const { tempDir, store } = await loadStoreWithTempDir();

  try {
    const updated = await store.updateScheduleStatus("schedule-ops-daily-0900", "paused");

    assert.equal(updated?.status, "paused");

    const schedules = await store.listSchedules();
    const target = schedules.find((item: { id: string }) => item.id === "schedule-ops-daily-0900");
    const untouched = schedules.find(
      (item: { id: string }) => item.id === "schedule-skill-audit-1400"
    );

    assert.equal(target?.status, "paused");
    assert.equal(untouched?.status, "active");
  } finally {
    delete process.env.CONTROL_PLANE_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("triggerScheduleRun creates a schedule-triggered run for an active schedule", async () => {
  const { tempDir, store } = await loadStoreWithTempDir();

  try {
    const beforeRuns = await store.listRuns();
    const result = await store.triggerScheduleRun("schedule-ops-daily-0900");

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.run.agentName, "运营日报助手");
    assert.equal(result.run.triggerType, "schedule");
    assert.match(result.run.summary, /运营日报晨间执行/);

    const afterRuns = await store.listRuns();
    assert.equal(afterRuns.length, beforeRuns.length + 1);
    assert.equal(afterRuns[0]?.id, result.run.id);
  } finally {
    delete process.env.CONTROL_PLANE_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("triggerScheduleRun rejects a paused schedule", async () => {
  const { tempDir, store } = await loadStoreWithTempDir();

  try {
    await store.updateScheduleStatus("schedule-ops-daily-0900", "paused");
    const beforeRuns = await store.listRuns();
    const result = await store.triggerScheduleRun("schedule-ops-daily-0900");

    assert.deepEqual(result, {
      ok: false,
      code: "SCHEDULE_PAUSED",
      message: "Schedule is paused"
    });

    const afterRuns = await store.listRuns();
    assert.equal(afterRuns.length, beforeRuns.length);
  } finally {
    delete process.env.CONTROL_PLANE_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("updateRunStatus updates the target run status and summary", async () => {
  const { tempDir, store } = await loadStoreWithTempDir();

  try {
    const updated = await store.updateRunStatus("run-20260322-002", "success", "巡检完成。");

    assert.equal(updated?.status, "success");
    assert.equal(updated?.summary, "巡检完成。");

    const runs = await store.listRuns();
    const target = runs.find((item: { id: string }) => item.id === "run-20260322-002");
    const untouched = runs.find((item: { id: string }) => item.id === "run-20260322-003");

    assert.equal(target?.status, "success");
    assert.equal(target?.summary, "巡检完成。");
    assert.equal(untouched?.status, "failed");
  } finally {
    delete process.env.CONTROL_PLANE_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("runDueSchedules creates runs for due active schedules and advances nextRunAt", async () => {
  const { tempDir, store } = await loadStoreWithTempDir();

  try {
    const result = await store.runDueSchedules("2026-03-23 10:00");

    assert.equal(result.runs.length, 1);
    assert.equal(result.runs[0]?.triggerType, "schedule");
    assert.equal(result.runs[0]?.agentName, "运营日报助手");

    const schedules = await store.listSchedules();
    const dueSchedule = schedules.find(
      (item: { id: string }) => item.id === "schedule-ops-daily-0900"
    );
    const notDueSchedule = schedules.find(
      (item: { id: string }) => item.id === "schedule-skill-audit-1400"
    );

    assert.equal(dueSchedule?.nextRunAt, "2026-03-24 09:00");
    assert.equal(notDueSchedule?.nextRunAt, "2026-03-23 14:00");
  } finally {
    delete process.env.CONTROL_PLANE_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("runDueSchedules generates unique run ids for a batch", async () => {
  const { tempDir, store } = await loadStoreWithTempDir();

  try {
    const created = await store.runDueSchedules("2026-03-24 10:00");
    const ids = created.runs.map((run: { id: string }) => run.id);

    assert.equal(created.runs.length, 2);
    assert.equal(new Set(ids).size, ids.length);
  } finally {
    delete process.env.CONTROL_PLANE_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("runDueSchedules ignores paused schedules even if due", async () => {
  const { tempDir, store } = await loadStoreWithTempDir();

  try {
    await store.updateScheduleStatus("schedule-ops-daily-0900", "paused");
    const beforeRuns = await store.listRuns();
    const result = await store.runDueSchedules("2026-03-23 10:00");

    assert.equal(result.runs.length, 0);

    const afterRuns = await store.listRuns();
    assert.equal(afterRuns.length, beforeRuns.length);
  } finally {
    delete process.env.CONTROL_PLANE_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("listRuns normalizes duplicate persisted run ids", async () => {
  const { tempDir, store } = await loadStoreWithTempDir();

  try {
    await store.listRuns();

    const persisted = JSON.parse(
      await readFile(path.join(tempDir, "control-plane.json"), "utf8")
    ) as {
      agents: unknown[];
      skills: unknown[];
      schedules: unknown[];
      runs: Array<{ id: string; traceId: string }>;
      server: unknown;
    };

    persisted.runs = [
      {
        ...persisted.runs[0],
        id: "run-dup",
        traceId: "trace-dup"
      },
      {
        ...persisted.runs[1],
        id: "run-dup",
        traceId: "trace-dup"
      }
    ];

    await writeFile(
      path.join(tempDir, "control-plane.json"),
      JSON.stringify(persisted, null, 2),
      "utf8"
    );

    const runs = await store.listRuns();

    assert.equal(runs.length, 2);
    assert.equal(runs[0]?.id, "run-dup");
    assert.equal(runs[1]?.id, "run-dup-2");
    assert.equal(runs[1]?.traceId, "trace-dup-2");
  } finally {
    delete process.env.CONTROL_PLANE_DATA_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
});
