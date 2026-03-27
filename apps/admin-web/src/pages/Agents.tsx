import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Filter, Pause, Pencil, Play, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockAgentList } from "@/data/mock-agents";
import {
  collectMockNotes,
  fetchControlCenterAgents,
  takeMockItems,
  type AgentListItem,
  withMockProvenance,
} from "@/lib/control-center-api";

const fallbackAgents = withMockProvenance(
  takeMockItems(mockAgentList),
  "数字员工列表接口暂不可用，当前展示 1 条演示员工数据。",
) as AgentListItem[];

export default function Agents() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const agentsQuery = useQuery({
    queryKey: ["control-center", "agents"],
    queryFn: fetchControlCenterAgents,
  });

  const agents = agentsQuery.data ?? fallbackAgents;
  const filtered = agents.filter((agent) => {
    if (statusFilter !== "all" && agent.status !== statusFilter) {
      return false;
    }

    if (
      search &&
      !agent.name.includes(search) &&
      !agent.role.includes(search) &&
      !agent.position.includes(search) &&
      !agent.department.includes(search)
    ) {
      return false;
    }

    return true;
  });

  const mockNotes = collectMockNotes(agents);
  if (agentsQuery.isError) {
    mockNotes.unshift("数字员工接口访问失败，当前页面已回退到演示数据。");
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold gradient-text">数字员工管理</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              共 {agents.length} 位数字员工，{agents.filter((agent) => agent.status === "running").length} 位工作中
            </p>
          </div>
          <Button size="sm" className="gap-1.5 text-xs gradient-blue-purple border-0 hover:opacity-90 glow-blue transition-all">
            <Plus className="h-3.5 w-3.5" />
            新建数字员工
          </Button>
        </div>

        <MockDataNotice notes={[...new Set(mockNotes)]} />

        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索姓名、职位或部门…"
              className="h-9 pl-9 text-sm bg-muted/30 border-border/50 input-glow focus:border-primary/40"
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
              <SelectItem value="running">工作中</SelectItem>
              <SelectItem value="idle">空闲</SelectItem>
              <SelectItem value="paused">已暂停</SelectItem>
              <SelectItem value="error">异常</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-lg glass-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">员工</TableHead>
                <TableHead className="text-xs">员工定位</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs">所在机器</TableHead>
                <TableHead className="text-center text-xs">OpenClaw</TableHead>
                <TableHead className="text-center text-xs">通道</TableHead>
                <TableHead className="text-xs">记忆 / Skills</TableHead>
                <TableHead className="text-xs">成功率</TableHead>
                <TableHead className="text-center text-xs">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((agent) => (
                <TableRow key={agent.id} className="table-row-glow transition-all">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                        <span className="text-xs font-medium text-foreground">{agent.avatar}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/agents/${agent.id}`}
                            className="text-sm font-medium text-foreground transition-colors hover:text-primary"
                          >
                            {agent.name}
                          </Link>
                          <DataSourceBadge item={agent} className="px-1.5 py-0 text-[9px]" />
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {agent.position} · {agent.department}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/80">{agent.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                    <p className="truncate italic">"{agent.motto}"</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {agent.specialties.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={agent.status} />
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-foreground">{agent.machine.name}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {agent.machine.runtime}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums">{agent.openclawCount}</TableCell>
                  <TableCell className="text-center text-sm tabular-nums">{agent.channelCount}</TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">记忆源 {agent.knowledgeCount}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Skills {agent.skillCount}</div>
                    <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                      最近活跃 {agent.lastRunTime}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-[100px] items-center gap-2">
                      <Progress value={agent.successRate} className="h-1.5 flex-1" />
                      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                        {agent.successRate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link to={`/agents/${agent.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        {agent.status === "paused" ? (
                          <Play className="h-3.5 w-3.5" />
                        ) : (
                          <Pause className="h-3.5 w-3.5" />
                        )}
                      </Button>
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
