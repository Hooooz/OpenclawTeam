import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Database, Download, HardDrive, TerminalSquare, ChevronDown, ChevronRight, Clock, Activity } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { Button } from "@/components/ui/button";
import {
  collectMockNotes,
  fetchControlCenterNodeManagement,
  fetchControlCenterNodeDetail,
  toMockProvenance,
  type NodeManagementData,
  type NodeDetailData,
} from "@/lib/control-center-api";

const fallbackNodeManagement: NodeManagementData = {
  nodes: [
    {
      id: "mock-node-1",
      name: "演示节点",
      host: "127.0.0.1",
      status: "healthy",
      lastCollectedAt: "2026-03-26 18:00",
      agentCount: 1,
      runCount: 3,
      ...toMockProvenance("节点管理接口当前使用演示数据，仅保留 1 条样例。"),
    },
  ],
  registration: {
    managerUrl: "http://127.0.0.1:3201",
    collectorTokenHint: "open...ctor",
    storage: {
      controlPlaneDataFile: "./data/control-plane.json",
      schedulerHeartbeatFile: "./data/schedule-sweep-heartbeat.json",
      collectorReportsFile: "./.runtime/collector-reports.json",
    },
    installers: [
      {
        platform: "macos",
        label: "macOS 采集器注册脚本",
        filename: "register-openclaw-node-macos.sh",
        shell: "bash",
        script: "#!/usr/bin/env bash\n# mock script",
        notes: ["当前为演示脚本，仅保留 1 条样例。"],
      },
    ],
  },
};

const fallbackNodeDetail: NodeDetailData = {
  node: { id: "mock-node-1", name: "演示节点", host: "127.0.0.1" },
  latestReport: {
    collectedAt: "2026-03-26 18:00:00",
    agentCount: 1,
    runCount: 3,
    scheduleCount: 2,
    agents: [],
    runs: [],
    schedules: [],
  },
  recentReports: [
    { collectedAt: "2026-03-26 18:00:00", agentCount: 1, runCount: 3, scheduleCount: 2 },
    { collectedAt: "2026-03-26 17:45:00", agentCount: 1, runCount: 2, scheduleCount: 2 },
    { collectedAt: "2026-03-26 17:30:00", agentCount: 1, runCount: 2, scheduleCount: 2 },
  ],
};

export default function Nodes() {
  const [selectedPlatform, setSelectedPlatform] = useState<"macos" | "linux" | "windows">("macos");
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const nodeManagementQuery = useQuery({
    queryKey: ["control-center", "node-management"],
    queryFn: fetchControlCenterNodeManagement,
  });

  const nodeDetailQuery = useQuery({
    queryKey: ["control-center", "node", expandedNodeId],
    queryFn: () => fetchControlCenterNodeDetail(expandedNodeId!),
    enabled: !!expandedNodeId,
  });

  const data = nodeManagementQuery.data ?? fallbackNodeManagement;
  const nodeDetail = nodeDetailQuery.data ?? fallbackNodeDetail;
  const mockNotes = [
    ...collectMockNotes(data.nodes),
    ...collectMockNotes([{ dataSourceNote: data.nodes.length === 0 ? "当前暂无采集节点。" : undefined }]),
  ];

  if (nodeManagementQuery.isError) {
    mockNotes.unshift("节点管理接口访问失败，当前页面已回退到演示数据。");
  }

  const selectedInstaller =
    data.registration.installers.find((item) => item.platform === selectedPlatform) ||
    data.registration.installers[0];

  const statusTone = useMemo(
    () => ({
      healthy: "text-[hsl(var(--status-success))]",
      degraded: "text-[hsl(var(--status-warning))]",
      down: "text-[hsl(var(--status-danger))]",
    }),
    [],
  );

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // noop
    }
  };

  const toggleNodeDetail = (nodeId: string) => {
    setExpandedNodeId(expandedNodeId === nodeId ? null : nodeId);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">节点管理</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            统一查看采集节点状态，并为第三台、第四台机器生成一键注册脚本。
          </p>
        </div>

        <MockDataNotice notes={[...new Set(mockNotes.filter(Boolean))]} />

        <div className="grid grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="rounded-md border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-medium">
                <HardDrive className="h-4 w-4" />
                已接入节点
              </h3>
              <span className="text-xs text-muted-foreground">Manager: {data.registration.managerUrl}</span>
            </div>
            <div className="space-y-2">
              {data.nodes.map((node) => (
                <div
                  key={node.id}
                  className="rounded-md border border-border/60 bg-muted/40 px-3 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 hover:opacity-80"
                      onClick={() => toggleNodeDetail(node.id)}
                    >
                      {expandedNodeId === node.id ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-foreground">{node.name}</span>
                      <DataSourceBadge item={node} className="px-1.5 py-0 text-[9px]" />
                    </button>
                    <span className={`text-xs font-medium ${statusTone[node.status]}`}>{node.status}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <span>Host: {node.host}</span>
                    <span>员工 {node.agentCount}</span>
                    <span>记录 {node.runCount}</span>
                    <span>最近采集 {node.lastCollectedAt}</span>
                  </div>

                  {expandedNodeId === node.id && (
                    <div className="mt-3 rounded-md border border-border/40 bg-background/60 p-3">
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        最近采集日志
                      </div>
                      {nodeDetailQuery.isLoading ? (
                        <div className="text-xs text-muted-foreground">加载中...</div>
                      ) : (
                        <div className="space-y-1.5">
                          {nodeDetailQuery.data?.recentReports.map((report, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded bg-muted/50 px-2 py-1.5 text-xs"
                            >
                              <span className="font-mono text-muted-foreground">{report.collectedAt}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-foreground">员工 {report.agentCount}</span>
                                <span className="text-foreground">记录 {report.runCount}</span>
                                <span className="text-foreground">调度 {report.scheduleCount}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
              <Database className="h-4 w-4" />
              后端存储位置
            </h3>
            <div className="space-y-3 text-sm">
              {[
                { label: "控制面存量数据", value: data.registration.storage.controlPlaneDataFile },
                { label: "调度心跳", value: data.registration.storage.schedulerHeartbeatFile },
                { label: "采集器节点汇总", value: data.registration.storage.collectorReportsFile },
              ].map((item) => (
                <div key={item.label} className="rounded-md bg-muted px-3 py-2">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="mt-1 break-all font-mono text-[11px] text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-medium">
                <TerminalSquare className="h-4 w-4" />
                采集器安装包 / 一键注册
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                共享 token: <span className="font-mono">{data.registration.collectorTokenHint}</span>
                {"  "}&bull;{"  "}
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  自动定时上报间隔: 15 分钟
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(["macos", "linux", "windows"] as const).map((platform) => (
                <Button
                  key={platform}
                  type="button"
                  variant={selectedPlatform === platform ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform)}
                >
                  {platform}
                </Button>
              ))}
            </div>
          </div>

          {selectedInstaller ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{selectedInstaller.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{selectedInstaller.filename}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => copyText(selectedInstaller.script)}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    复制脚本
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyText(selectedInstaller.filename)}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    复制文件名
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-[0.7fr_1.3fr] gap-4">
                <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                  <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">说明</div>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {selectedInstaller.notes.map((note) => (
                      <li key={note} className="rounded-md bg-muted/70 px-3 py-2">
                        {note}
                      </li>
                    ))}
                    <li className="rounded-md bg-muted/70 px-3 py-2">
                      自动安装 cron 任务，每 15 分钟定时上报数据
                    </li>
                  </ul>
                </div>

                <div className="rounded-md border border-border/60 bg-[#0f172a] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-slate-400">
                      {selectedInstaller.shell}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-slate-300 hover:bg-slate-800 hover:text-white"
                      onClick={() => copyText(selectedInstaller.script)}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      复制
                    </Button>
                  </div>
                  <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-100">
                    {selectedInstaller.script}
                  </pre>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}