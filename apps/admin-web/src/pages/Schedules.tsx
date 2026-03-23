import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Eye, Filter, Pause, Play, Plus, Search } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockScheduleList } from "@/data/mock-schedules";
import {
  collectMockNotes,
  fetchControlCenterSchedules,
  toMockProvenance,
  withMockProvenance,
  type ScheduleListItem,
} from "@/lib/control-center-api";

const scheduleStatusMap: Record<string, { variant: "running" | "paused" | "error"; label: string }> = {
  active: { variant: "running", label: "启用" },
  paused: { variant: "paused", label: "暂停" },
  error: { variant: "error", label: "异常" },
};

const fallbackSchedules = withMockProvenance(
  mockScheduleList,
  "定时任务列表接口暂不可用，当前展示演示任务数据。",
) as ScheduleListItem[];

export default function Schedules() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const schedulesQuery = useQuery({
    queryKey: ["control-center", "schedules"],
    queryFn: fetchControlCenterSchedules,
  });

  const schedules = schedulesQuery.data ?? fallbackSchedules;
  const filtered = schedules.filter((schedule) => {
    if (statusFilter !== "all" && schedule.status !== statusFilter) {
      return false;
    }

    if (search && !schedule.name.includes(search) && !schedule.agentName.includes(search)) {
      return false;
    }

    return true;
  });

  const total = schedules.length;
  const active = schedules.filter((schedule) => schedule.status === "active").length;
  const errorCount = schedules.filter((schedule) => schedule.status === "error").length;
  const heartbeatState = schedulesQuery.data
    ? { label: "已连接 Control Center", provenance: undefined }
    : { label: "演示模式", provenance: toMockProvenance("当前定时任务守护状态仍使用演示数据。") };
  const mockNotes = [
    ...collectMockNotes(schedules),
    ...collectMockNotes(heartbeatState.provenance ? [heartbeatState.provenance] : []),
  ];

  if (schedulesQuery.isError) {
    mockNotes.unshift("定时任务接口访问失败，当前页面已回退到演示数据。");
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">定时任务</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">管理所有定时任务和自动触发计划</p>
          </div>
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            创建定时任务
          </Button>
        </div>

        <MockDataNotice notes={[...new Set(mockNotes)]} />

        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="任务总数" value={total} change={0} dataSource="live" />
          <MetricCard label="启用中" value={active} change={0} dataSource="live" />
          <MetricCard
            label="异常任务"
            value={errorCount}
            change={errorCount > 0 ? errorCount : 0}
            danger={errorCount > 0}
            dataSource="live"
          />
          <div className="flex items-center gap-3 rounded-md border bg-card p-3 shadow-sm">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">任务守护</p>
              <div className="flex items-center gap-2">
                <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-success))]" />
                  {heartbeatState.label}
                </p>
                <DataSourceBadge item={heartbeatState.provenance} className="px-1.5 py-0 text-[9px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索任务或数字员工…"
              className="h-9 pl-9 text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[130px] text-sm">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="paused">暂停</SelectItem>
              <SelectItem value="error">异常</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-md border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">任务名称</TableHead>
                <TableHead className="text-xs">关联数字员工</TableHead>
                <TableHead className="text-xs">Cron</TableHead>
                <TableHead className="text-xs">频率</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs">下次执行</TableHead>
                <TableHead className="text-xs">最近结果</TableHead>
                <TableHead className="text-right text-xs">连续成功</TableHead>
                <TableHead className="text-center text-xs">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((schedule) => {
                const scheduleStatus = scheduleStatusMap[schedule.status];
                return (
                  <TableRow key={schedule.id}>
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <span>{schedule.name}</span>
                        <DataSourceBadge item={schedule} className="px-1.5 py-0 text-[9px]" />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{schedule.agentName}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{schedule.cron}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{schedule.frequency}</TableCell>
                    <TableCell>
                      <StatusBadge variant={scheduleStatus.variant} label={scheduleStatus.label} />
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {schedule.nextRun}
                    </TableCell>
                    <TableCell>
                      {schedule.lastRunResult ? (
                        <StatusBadge variant={schedule.lastRunResult} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {schedule.consecutiveSuccess}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          {schedule.status === "paused" ? (
                            <Play className="h-3.5 w-3.5" />
                          ) : (
                            <Pause className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
