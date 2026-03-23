import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { mockKnowledgeList } from "@/data/mock-knowledge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, RefreshCw, Eye, Link2Off, Link2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { takeMockItems, withMockProvenance } from "@/lib/control-center-api";

const ksStatusMap: Record<string, { variant: any; label: string }> = {
  active: { variant: "healthy", label: "正常" },
  syncing: { variant: "running", label: "同步中" },
  error: { variant: "error", label: "异常" },
  disabled: { variant: "idle", label: "停用" },
};

export default function Knowledge() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const items = withMockProvenance(takeMockItems(mockKnowledgeList), "知识库当前仅提供 1 条演示数据样例。");

  const filtered = items.filter((k) => {
    if (statusFilter !== "all" && k.status !== statusFilter) return false;
    if (search && !k.name.includes(search) && !k.type.includes(search)) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">知识库</h1>
            <p className="text-xs text-muted-foreground mt-0.5">共 {items.length} 个知识源样例，{items.filter(k => k.status === "active").length} 个可用</p>
          </div>
          <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> 新建知识源</Button>
        </div>

        <MockDataNotice notes={["知识库当前仅保留 1 条 mock 样例，并已标记为 MOCK。"]} />

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索名称或类型…" className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">正常</SelectItem>
              <SelectItem value="syncing">同步中</SelectItem>
              <SelectItem value="error">异常</SelectItem>
              <SelectItem value="disabled">停用</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">名称</TableHead>
                <TableHead className="text-xs">类型</TableHead>
                <TableHead className="text-xs">来源</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs">最近同步</TableHead>
                <TableHead className="text-xs text-center">绑定数字员工</TableHead>
                <TableHead className="text-xs">更新频率</TableHead>
                <TableHead className="text-xs text-right">大小</TableHead>
                <TableHead className="text-xs text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((k) => {
                const st = ksStatusMap[k.status];
                return (
                  <TableRow key={k.id}>
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <span>{k.name}</span>
                        <DataSourceBadge item={k} className="px-1.5 py-0 text-[9px]" />
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">{k.type}</span></TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground max-w-[180px] truncate">{k.sourcePath}</TableCell>
                    <TableCell><StatusBadge variant={st.variant} label={st.label} /></TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">{k.lastSyncTime}</TableCell>
                    <TableCell className="text-sm tabular-nums text-center">{k.agentCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{k.updateFrequency}</TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground text-right">{k.fileSize}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><RefreshCw className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          {k.status === "disabled" ? <Link2 className="h-3.5 w-3.5" /> : <Link2Off className="h-3.5 w-3.5" />}
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
