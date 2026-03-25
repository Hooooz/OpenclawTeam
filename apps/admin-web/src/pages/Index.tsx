import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, CalendarPlus, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MockDataNotice } from "@/components/MockDataNotice";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RiskAlertList } from "@/components/dashboard/RiskAlertList";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SystemHealthCard } from "@/components/dashboard/SystemHealthCard";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  collectMockNotes,
  fetchControlCenterDashboard,
  fetchControlCenterRuns,
  takeMockItems,
  type DashboardData,
  type RunListItem,
  withMockProvenance,
} from "@/lib/control-center-api";
import { buildWorkbenchData } from "@/lib/dashboard-workbench";
import {
  mockAgents,
  mockMetrics,
  mockRisks,
  mockRuns,
  mockSchedules,
  mockServices,
} from "@/data/mock-dashboard";
import { mockRunList } from "@/data/mock-runs";

const fallbackDashboard: DashboardData = {
  metrics: withMockProvenance(takeMockItems(mockMetrics), "控制台指标当前使用演示数据，仅保留 1 条样例"),
  services: withMockProvenance(takeMockItems(mockServices), "服务健康卡片当前使用演示数据，仅保留 1 条样例"),
  risks: withMockProvenance(takeMockItems(mockRisks), "风险提示当前使用演示数据，仅保留 1 条样例"),
  agents: withMockProvenance(takeMockItems(mockAgents), "重点数字员工当前使用演示数据，仅保留 1 条样例"),
  runs: withMockProvenance(takeMockItems(mockRuns), "最近对话与工作记录当前使用演示数据，仅保留 1 条样例"),
  schedules: withMockProvenance(takeMockItems(mockSchedules), "定时任务守护状态当前使用演示数据，仅保留 1 条样例"),
  generatedAt: "MOCK",
};

export default function Index() {
  const dashboardQuery = useQuery({
    queryKey: ["control-center", "dashboard"],
    queryFn: fetchControlCenterDashboard,
  });
  const runsQuery = useQuery({
    queryKey: ["control-center", "runs"],
    queryFn: fetchControlCenterRuns,
  });

  const dashboard = dashboardQuery.data ?? fallbackDashboard;
  const runs = runsQuery.data ?? withMockProvenance(takeMockItems(mockRunList, 1), "工作记录接口暂不可用，当前展示 1 条演示记录。");
  const workbench = useMemo(
    () => buildWorkbenchData(runs as RunListItem[], new Date()),
    [runs],
  );
  const mockNotes = [
    ...collectMockNotes(dashboard.metrics),
    ...collectMockNotes(dashboard.services),
    ...collectMockNotes(dashboard.risks),
    ...collectMockNotes(dashboard.agents),
    ...collectMockNotes(dashboard.runs),
    ...collectMockNotes(dashboard.schedules),
    ...collectMockNotes(runs),
    ...collectMockNotes([
      workbench.today.files,
      workbench.today.savings,
      ...workbench.feed,
      ...workbench.weekly,
    ]),
  ];

  const uniqueMockNotes = [...new Set(mockNotes)];

  if (dashboardQuery.isError) {
    uniqueMockNotes.unshift("Control Center 接口暂时不可用，当前页面已回退到演示数据。");
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">控制台总览</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              最后刷新：{dashboardQuery.data?.generatedAt ?? "演示数据"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => void dashboardQuery.refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" asChild>
              <Link to="/agents">
                <Plus className="h-3.5 w-3.5" />
                新建数字员工
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
              <Link to="/schedules">
                <CalendarPlus className="h-3.5 w-3.5" />
                创建定时任务
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/5"
              asChild
            >
              <Link to="/runs">
                <AlertCircle className="h-3.5 w-3.5" />
                查看失败记录
              </Link>
            </Button>
          </div>
        </div>

        <MockDataNotice notes={uniqueMockNotes} />

        <div className="grid grid-cols-6 gap-3">
          {dashboard.metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <div className="rounded-md border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-foreground">数字员工核心看板</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  聚合今天的任务产出、文件交付和节约成本，作为数字员工控制台的第一优先指标。
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Weekly cockpit
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[workbench.today.tasks, workbench.today.files, workbench.today.savings].map((item) => (
                <div key={item.label} className="rounded-md border bg-background/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <DataSourceBadge item={item} className="px-1.5 py-0 text-[9px]" />
                  </div>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                    {item.value}
                    {item.unit ? <span className="ml-1 text-sm font-medium text-muted-foreground">{item.unit}</span> : null}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">每周数据看板</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">最近 7 天的任务、文件与节约金额走势。</p>
              </div>
            </div>

            <div className="space-y-3">
              {workbench.weekly.map((day) => {
                const barHeight = Math.max(day.tasks * 18 + day.files * 10, 10);
                return (
                  <div key={day.dateKey} className="grid grid-cols-[56px_1fr_88px] items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{day.dayLabel}</p>
                      <p className="text-[10px] text-muted-foreground">{day.dateKey.slice(5)}</p>
                    </div>
                    <div className="rounded-md bg-muted/80 px-3 py-2">
                      <div className="flex items-end gap-2">
                        <div
                          className="w-4 rounded-sm bg-primary/80"
                          style={{ height: `${barHeight}px` }}
                        />
                        <div className="grid flex-1 grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <span>任务 {day.tasks}</span>
                          <span>文件 {day.files}</span>
                          <span>节约 ¥{day.savings}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <DataSourceBadge item={day} className="px-1.5 py-0 text-[9px]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2">
            <SystemHealthCard services={dashboard.services} />
          </div>
          <div className="col-span-3">
            <RiskAlertList risks={dashboard.risks} />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">重点数字员工</h3>
              <Button
                variant="link"
                size="sm"
                className="h-auto gap-1 p-0 text-xs text-muted-foreground"
                asChild
              >
                <Link to="/agents">
                  查看全部
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="space-y-2">
              {dashboard.agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>

          <div className="col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">最近对话与工作记录</h3>
              <Button
                variant="link"
                size="sm"
                className="h-auto gap-1 p-0 text-xs text-muted-foreground"
                asChild
              >
                <Link to="/runs">
                  查看全部
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="overflow-hidden rounded-md border bg-card shadow-sm">
              <div className="grid grid-cols-[88px_1fr] border-b bg-muted/40 px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>Live</span>
                <span>实时工作流</span>
              </div>
              <div className="dashboard-feed-mask h-[360px] overflow-hidden">
                <div className="dashboard-feed-track">
                  {[...workbench.feed, ...workbench.feed].map((run, index) => (
                    <div
                      key={`${run.id}-${index}`}
                      className="grid grid-cols-[88px_1fr] gap-3 border-b px-4 py-3 last:border-b-0"
                    >
                      <div className="space-y-1">
                        <StatusBadge variant={run.status} />
                        <p className="text-[11px] tabular-nums text-muted-foreground">{run.time}</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{run.title}</p>
                          <DataSourceBadge item={run} className="px-1.5 py-0 text-[9px]" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {run.agentName} · {run.channelName} · {run.channelType}
                        </p>
                        <p className="text-sm text-muted-foreground">{run.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">定时任务守护状态</h3>
            <Button
              variant="link"
              size="sm"
              className="h-auto gap-1 p-0 text-xs text-muted-foreground"
              asChild
            >
              <Link to="/schedules">
                查看全部
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-md border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">任务名称</TableHead>
                  <TableHead className="text-xs">关联数字员工</TableHead>
                  <TableHead className="text-xs">Cron</TableHead>
                  <TableHead className="text-xs">下次执行</TableHead>
                  <TableHead className="text-xs">最近状态</TableHead>
                  <TableHead className="text-xs text-right">连续成功</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <span>{schedule.planName}</span>
                        <DataSourceBadge item={schedule} className="px-1.5 py-0 text-[9px]" />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {schedule.agentName}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {schedule.cron}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {schedule.nextRun}
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={schedule.lastStatus} />
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {schedule.consecutiveSuccess}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
