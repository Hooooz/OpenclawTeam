import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Filter, GitCompare, RotateCcw, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockRunList } from "@/data/mock-runs";
import {
  collectMockNotes,
  fetchControlCenterRuns,
  takeMockItems,
  type RunListItem,
  withMockProvenance,
} from "@/lib/control-center-api";

const triggerLabel: Record<string, string> = {
  manual: "手动",
  "timed-task": "定时任务",
  template: "模板",
  chat: "对话",
};

const fallbackRuns = withMockProvenance(
  takeMockItems(mockRunList),
  "对话与工作记录接口暂不可用，当前展示 1 条演示记录。",
) as RunListItem[];

export default function Runs() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const runsQuery = useQuery({
    queryKey: ["control-center", "runs"],
    queryFn: fetchControlCenterRuns,
  });

  const runs = runsQuery.data ?? fallbackRuns;
  const filtered = runs.filter((run) => {
    if (statusFilter !== "all" && run.status !== statusFilter) {
      return false;
    }

    if (sourceFilter !== "all" && run.triggerSource !== sourceFilter) {
      return false;
    }

    if (
      search &&
      !run.taskName.includes(search) &&
      !run.agentName.includes(search) &&
      !run.runId.includes(search) &&
      !run.conversationTopic.includes(search)
    ) {
      return false;
    }

    return true;
  });

  const mockNotes = collectMockNotes(runs);
  if (runsQuery.isError) {
    mockNotes.unshift("工作记录接口访问失败，当前页面已回退到演示数据。");
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-5 p-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">对话与工作记录</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            共 {runs.length} 条记录，{runs.filter((run) => run.status === "failed").length} 条失败
          </p>
        </div>

        <MockDataNotice notes={[...new Set(mockNotes)]} />

        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索任务名、数字员工或对话主题…"
              className="h-9 pl-9 text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[120px] text-sm">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="success">成功</SelectItem>
              <SelectItem value="running">进行中</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-9 w-[130px] text-sm">
              <SelectValue placeholder="来源" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部来源</SelectItem>
              <SelectItem value="manual">手动</SelectItem>
              <SelectItem value="timed-task">定时任务</SelectItem>
              <SelectItem value="template">模板</SelectItem>
              <SelectItem value="chat">对话</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-md border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">对话/任务 ID</TableHead>
                <TableHead className="text-xs">数字员工</TableHead>
                <TableHead className="text-xs">对话主题</TableHead>
                <TableHead className="text-xs">来源</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs">开始时间</TableHead>
                <TableHead className="text-xs text-right">耗时</TableHead>
                <TableHead className="text-xs">工作摘要</TableHead>
                <TableHead className="text-xs">记忆更新</TableHead>
                <TableHead className="text-center text-xs">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{run.runId}</TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{run.agentName}</span>
                        <DataSourceBadge item={run} className="px-1.5 py-0 text-[9px]" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{run.agentPosition}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/runs/${run.id}`}
                      className="text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {run.conversationTopic}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {triggerLabel[run.triggerSource]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={run.status} />
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">{run.startTime}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {run.duration}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">
                    {run.outputSummary}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                    {run.memorySummary}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link to={`/runs/${run.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      {run.versionDiff !== "—" ? (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="查看版本对比">
                          <GitCompare className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      {run.status === "failed" ? (
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
