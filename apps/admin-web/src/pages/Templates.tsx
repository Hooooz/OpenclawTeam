import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { mockTemplateList } from "@/data/mock-templates";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Play, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { takeMockItems, withMockProvenance } from "@/lib/control-center-api";

const tplStatusMap: Record<string, { variant: any; label: string }> = {
  active: { variant: "running", label: "启用" },
  draft: { variant: "idle", label: "草稿" },
  disabled: { variant: "paused", label: "停用" },
};

export default function Templates() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const templates = withMockProvenance(takeMockItems(mockTemplateList), "任务模板当前仅提供 1 条演示数据样例。");

  const filtered = templates.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.name.includes(search) && !t.scene.includes(search)) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">任务模板</h1>
            <p className="text-xs text-muted-foreground mt-0.5">共 {templates.length} 个模板样例，{templates.filter(t => t.status === "active").length} 个可用</p>
          </div>
          <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> 新建模板</Button>
        </div>

        <MockDataNotice notes={["任务模板当前仅保留 1 条 mock 样例，并已标记为 MOCK。"]} />

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索名称或场景…" className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="disabled">停用</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">模板名称</TableHead>
                <TableHead className="text-xs">场景</TableHead>
                <TableHead className="text-xs">默认数字员工</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs">输入参数</TableHead>
                <TableHead className="text-xs text-right">使用次数</TableHead>
                <TableHead className="text-xs">最近使用</TableHead>
                <TableHead className="text-xs text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const st = tplStatusMap[t.status];
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{t.name}</span>
                          <DataSourceBadge item={t} className="px-1.5 py-0 text-[9px]" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-[250px] truncate">{t.description}</p>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">{t.scene}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.defaultAgent}</TableCell>
                    <TableCell><StatusBadge variant={st.variant} label={st.label} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.inputSummary}</TableCell>
                    <TableCell className="text-sm tabular-nums text-right">{t.useCount}</TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">{t.lastUsedTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Play className="h-3.5 w-3.5" /></Button>
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
