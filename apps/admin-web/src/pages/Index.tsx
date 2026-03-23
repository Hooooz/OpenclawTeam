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
  takeMockItems,
  type DashboardData,
  withMockProvenance,
} from "@/lib/control-center-api";
import {
  mockAgents,
  mockMetrics,
  mockRisks,
  mockRuns,
  mockSchedules,
  mockServices,
} from "@/data/mock-dashboard";

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

  const dashboard = dashboardQuery.data ?? fallbackDashboard;
  const mockNotes = [
    ...collectMockNotes(dashboard.metrics),
    ...collectMockNotes(dashboard.services),
    ...collectMockNotes(dashboard.risks),
    ...collectMockNotes(dashboard.agents),
    ...collectMockNotes(dashboard.runs),
    ...collectMockNotes(dashboard.schedules),
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
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">任务名称</TableHead>
                    <TableHead className="text-xs">数字员工</TableHead>
                    <TableHead className="text-xs">状态</TableHead>
                    <TableHead className="text-xs">开始时间</TableHead>
                    <TableHead className="text-xs text-right">耗时</TableHead>
                    <TableHead className="text-xs">记忆更新</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <span>{run.taskName}</span>
                          <DataSourceBadge item={run} className="px-1.5 py-0 text-[9px]" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{run.agentName}</TableCell>
                      <TableCell>
                        <StatusBadge variant={run.status} />
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {run.startTime}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {run.duration}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                        {run.memorySummary || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
