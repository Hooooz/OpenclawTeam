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

export type NodeMetadataRecord = {
  nodeId: string;
  alias?: string;
  updatedAt: string;
};

const MAX_REPORT_HISTORY_PER_NODE = 20;

function getCollectedAtTime(report: CollectorNodeReport) {
  const parsed = new Date(String(report.collectedAt || "").replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export function getCollectorReportsStorePath(cwd = process.cwd()) {
  return process.env.CONTROL_CENTER_COLLECTOR_STORE?.trim()
    ? path.resolve(process.env.CONTROL_CENTER_COLLECTOR_STORE)
    : path.resolve(cwd, ".runtime", "collector-reports.json");
}

export function getNodeMetadataStorePath(cwd = process.cwd()) {
  return process.env.CONTROL_CENTER_NODE_METADATA_STORE?.trim()
    ? path.resolve(process.env.CONTROL_CENTER_NODE_METADATA_STORE)
    : path.resolve(cwd, ".runtime", "node-metadata.json");
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
  const next = [...existing, report].sort((a, b) => getCollectedAtTime(b) - getCollectedAtTime(a));
  const kept: CollectorNodeReport[] = [];
  const counts = new Map<string, number>();

  for (const item of next) {
    const nodeId = item.node?.id;
    if (!nodeId) {
      continue;
    }

    const seen = counts.get(nodeId) || 0;
    if (seen >= MAX_REPORT_HISTORY_PER_NODE) {
      continue;
    }

    kept.push(item);
    counts.set(nodeId, seen + 1);
  }

  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(kept, null, 2), "utf8");
  return kept;
}

export async function readNodeMetadata(storePath: string): Promise<NodeMetadataRecord[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
    return Array.isArray(parsed) ? (parsed as NodeMetadataRecord[]) : [];
  } catch {
    return [];
  }
}

export async function upsertNodeMetadata(storePath: string, record: NodeMetadataRecord) {
  const existing = await readNodeMetadata(storePath);
  const next = existing.filter((item) => item.nodeId !== record.nodeId);
  next.push(record);
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(next, null, 2), "utf8");
  return next;
}
