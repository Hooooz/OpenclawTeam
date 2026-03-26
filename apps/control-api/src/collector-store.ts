import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type CollectorNodeReport = {
  node: {
    id: string;
    name: string;
    host: string;
  };
  collectedAt: string;
  agents?: unknown[];
  agentDetails?: unknown[];
  runs?: unknown[];
  runDetails?: unknown[];
  schedules?: unknown[];
  settings?: unknown;
};

export function getCollectorReportsStorePath(cwd = process.cwd()) {
  return process.env.CONTROL_CENTER_COLLECTOR_STORE?.trim()
    ? path.resolve(process.env.CONTROL_CENTER_COLLECTOR_STORE)
    : path.resolve(cwd, ".runtime", "collector-reports.json");
}

export async function readCollectorReports(storePath: string): Promise<CollectorNodeReport[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
    return Array.isArray(parsed) ? (parsed as CollectorNodeReport[]) : [];
  } catch {
    return [];
  }
}

export async function upsertCollectorReport(storePath: string, report: CollectorNodeReport) {
  const existing = await readCollectorReports(storePath);
  const next = existing.filter((item) => item.node?.id !== report.node?.id);
  next.push(report);
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(next, null, 2), "utf8");
  return next;
}
