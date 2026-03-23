import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { mockSkillList } from "@/data/mock-skills";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { takeMockItems, withMockProvenance } from "@/lib/control-center-api";

const riskBadge = (level: string) => {
  const map: Record<string, { variant: any; label: string }> = {
    high: { variant: "high", label: "高风险" },
    medium: { variant: "medium", label: "中风险" },
    low: { variant: "low", label: "低风险" },
  };
  return map[level] || map.low;
};

const statusMap: Record<string, { variant: any; label: string }> = {
  active: { variant: "running", label: "启用" },
  draft: { variant: "idle", label: "草稿" },
  disabled: { variant: "paused", label: "停用" },
};

export default function Skills() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const skills = withMockProvenance(takeMockItems(mockSkillList), "Skill 注册中心当前仅提供 1 条演示数据样例。");

  const filtered = skills.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search && !s.name.includes(search) && !s.category.includes(search)) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Skill 注册中心</h1>
            <p className="text-xs text-muted-foreground mt-0.5">共 {skills.length} 个 Skill 样例，{skills.filter(s => s.status === "active").length} 个启用中</p>
          </div>
          <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> 新建 Skill</Button>
        </div>

        <MockDataNotice notes={["Skill 注册中心当前仅保留 1 条 mock 样例，并已标记为 MOCK。"]} />

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索名称或分类…" className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <TableHead className="text-xs">名称</TableHead>
                <TableHead className="text-xs">分类</TableHead>
                <TableHead className="text-xs">版本</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs text-center">绑定 Agent</TableHead>
                <TableHead className="text-xs">最近调用</TableHead>
                <TableHead className="text-xs text-right">7日调用</TableHead>
                <TableHead className="text-xs">风险</TableHead>
                <TableHead className="text-xs">更新</TableHead>
                <TableHead className="text-xs text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const st = statusMap[s.status];
                const risk = riskBadge(s.riskLevel);
                return (
                  <TableRow key={s.id}>
                  <TableCell>
                      <div className="flex items-center gap-2">
                        <Link to={`/skills/${s.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">{s.name}</Link>
                        <DataSourceBadge item={s} className="px-1.5 py-0 text-[9px]" />
                      </div>
                  </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.category}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{s.version}</TableCell>
                    <TableCell><StatusBadge variant={st.variant} label={st.label} /></TableCell>
                    <TableCell className="text-sm tabular-nums text-center">{s.agentCount}</TableCell>
                    <TableCell>
                      {s.lastCallResult ? <StatusBadge variant={s.lastCallResult === "success" ? "success" : "failed"} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-right">{s.callCount7d.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge variant={risk.variant} label={risk.label} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.lastUpdated}</TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link to={`/skills/${s.id}`}><Eye className="h-3.5 w-3.5" /></Link>
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
