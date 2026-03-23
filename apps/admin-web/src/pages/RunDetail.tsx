import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Brain, GitCompare, RotateCcw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockRunDetail } from "@/data/mock-runs";
import { cn } from "@/lib/utils";
import {
  collectMockNotes,
  fetchControlCenterRunDetail,
  toMockProvenance,
  withMockProvenance,
  type RunDetail as RunDetailRecord,
} from "@/lib/control-center-api";

const triggerLabel: Record<string, string> = {
  manual: "手动",
  "timed-task": "定时任务",
  template: "模板",
  chat: "对话",
};

const logLevelStyle: Record<string, string> = {
  info: "text-[hsl(var(--status-info))]",
  warn: "text-[hsl(var(--status-warning))]",
  error: "text-[hsl(var(--status-danger))]",
};

function buildFallbackRun(runId: string): RunDetailRecord {
  return {
    ...mockRunDetail,
    id: runId,
    outputSummary: mockRunDetail.outputResult || "—",
    sourcePlatform: "系统",
    ...toMockProvenance("运行详情接口暂不可用，当前展示演示记录。"),
    steps: withMockProvenance(mockRunDetail.steps, "执行步骤当前使用演示数据"),
    skillCalls: withMockProvenance(mockRunDetail.skillCalls, "Skill 调用当前使用演示数据"),
    audit: withMockProvenance(mockRunDetail.audit, "审计信息当前使用演示数据"),
  };
}

export default function RunDetail() {
  const { id } = useParams<{ id: string }>();
  const runId = id || mockRunDetail.id;
  const runQuery = useQuery({
    queryKey: ["control-center", "run", runId],
    queryFn: () => fetchControlCenterRunDetail(runId),
    enabled: Boolean(runId),
  });

  const run = runQuery.data ?? buildFallbackRun(runId);
  const mockNotes = [
    ...collectMockNotes([run]),
    ...collectMockNotes(run.steps),
    ...collectMockNotes(run.skillCalls),
    ...collectMockNotes(run.audit),
  ];

  if (runQuery.isError) {
    mockNotes.unshift("运行详情接口访问失败，当前页面已回退到演示数据。");
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-5 p-6">
        <div>
          <Link
            to="/runs"
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回对话与工作记录
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground">{run.taskName}</h1>
              <StatusBadge variant={run.status} />
              <DataSourceBadge item={run} />
            </div>
            {run.status === "failed" ? (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                重试
              </Button>
            ) : null}
          </div>
        </div>

        <MockDataNotice notes={[...new Set(mockNotes)]} />

        <div className="grid grid-cols-6 gap-3">
          {[
            { label: "Run ID", value: run.runId },
            { label: "数字员工", value: `${run.agentName} · ${run.agentPosition}` },
            { label: "触发方式", value: triggerLabel[run.triggerSource] },
            { label: "开始时间", value: run.startTime },
            { label: "耗时", value: run.duration },
            { label: "Trace ID", value: run.traceId },
          ].map((item) => (
            <div key={item.label} className="rounded-md border bg-card p-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 font-mono text-sm font-medium text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        {run.errorMessage ? (
          <div className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">错误信息</p>
              <p className="mt-0.5 text-sm text-destructive/80">{run.errorMessage}</p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Brain className="h-4 w-4" />
              记忆更新摘要
            </h3>
            <p className="text-sm text-muted-foreground">{run.memorySummary}</p>
          </div>
          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <GitCompare className="h-4 w-4" />
              版本差异
            </h3>
            <p className="font-mono text-sm text-muted-foreground">{run.versionDiff}</p>
          </div>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-medium">输入参数</h3>
          <div className="space-y-1 rounded-md bg-muted p-3">
            {Object.entries(run.inputParams).map(([key, value]) => (
              <div key={key} className="flex gap-3 text-sm">
                <span className="min-w-[150px] font-mono text-muted-foreground">{key}:</span>
                <span className="text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium">执行步骤</h3>
          <div className="space-y-0">
            {run.steps.map((step, index) => (
              <div key={step.id} className="relative flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-3 w-3 shrink-0 rounded-full border-2",
                      step.status === "success"
                        ? "border-[hsl(var(--status-success))] bg-[hsl(var(--status-success))]"
                        : step.status === "failed"
                          ? "border-[hsl(var(--status-danger))] bg-[hsl(var(--status-danger))]"
                          : step.status === "cancelled"
                            ? "border-muted-foreground/30 bg-muted"
                            : "border-[hsl(var(--status-info))] bg-[hsl(var(--status-info))]",
                    )}
                  />
                  {index < run.steps.length - 1 ? <div className="min-h-[28px] w-px flex-1 bg-border" /> : null}
                </div>
                <div className="-mt-0.5 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{step.name}</span>
                    <StatusBadge variant={step.status as any} />
                    <DataSourceBadge item={step} className="px-1.5 py-0 text-[9px]" />
                    <span className="text-xs tabular-nums text-muted-foreground">{step.startTime}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">({step.duration})</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-medium">Skill 调用记录</h3>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Skill</TableHead>
                <TableHead className="text-xs">结果</TableHead>
                <TableHead className="text-xs">耗时</TableHead>
                <TableHead className="text-xs">输入</TableHead>
                <TableHead className="text-xs">输出</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.skillCalls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span>{call.skillName}</span>
                      <DataSourceBadge item={call} className="px-1.5 py-0 text-[9px]" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={call.result as any} />
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{call.duration}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                    {call.input}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                    {call.output}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-medium">关键日志</h3>
          <div className="space-y-1 rounded-md bg-muted p-3 font-mono text-xs">
            {run.logs.map((log, index) => (
              <div key={`${log.time}-${index}`} className="flex gap-3">
                <span className="shrink-0 tabular-nums text-muted-foreground">{log.time}</span>
                <span className={cn("w-12 shrink-0 font-semibold uppercase", logLevelStyle[log.level])}>
                  {log.level}
                </span>
                <span className="text-foreground">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-medium">审计信息</h3>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">操作人</TableHead>
                <TableHead className="text-xs">动作</TableHead>
                <TableHead className="text-xs">时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.audit.map((entry, index) => (
                <TableRow key={`${entry.user}-${index}`}>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <span>{entry.user}</span>
                      <DataSourceBadge item={entry} className="px-1.5 py-0 text-[9px]" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.action}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{entry.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
