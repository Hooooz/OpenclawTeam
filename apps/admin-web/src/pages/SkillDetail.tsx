import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { mockSkillDetail } from "@/data/mock-skills";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { takeMockItems, toMockProvenance, withMockProvenance } from "@/lib/control-center-api";

const s = {
  ...mockSkillDetail,
  ...toMockProvenance("Skill 详情当前仅提供 1 条演示档案样例。"),
  inputSchema: takeMockItems(mockSkillDetail.inputSchema),
  outputSchema: takeMockItems(mockSkillDetail.outputSchema),
  boundAgents: withMockProvenance(takeMockItems(mockSkillDetail.boundAgents), "使用范围当前仅保留 1 条 mock 样例。"),
  recentCalls: withMockProvenance(takeMockItems(mockSkillDetail.recentCalls), "最近调用当前仅保留 1 条 mock 样例。"),
  versions: takeMockItems(mockSkillDetail.versions),
  permissions: takeMockItems(mockSkillDetail.permissions),
};

export default function SkillDetail() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        <div>
          <Link to="/skills" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-3.5 w-3.5" /> 返回列表
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground">{s.name}</h1>
              <span className="text-xs font-mono text-muted-foreground">{s.version}</span>
              <StatusBadge variant="running" label="启用" />
              <StatusBadge variant={s.riskLevel} label={s.riskLevel === "low" ? "低风险" : s.riskLevel === "medium" ? "中风险" : "高风险"} />
              <DataSourceBadge item={s} />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Pencil className="h-3.5 w-3.5" /> 编辑</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
        </div>

        <MockDataNotice notes={["Skill 详情当前仅保留每个板块 1 条 mock 样例，并已标记为 MOCK。"]} />

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "分类", value: s.category },
            { label: "绑定 Agent", value: String(s.agentCount) },
            { label: "7 日调用", value: s.callCount7d.toLocaleString() },
            { label: "最近更新", value: s.lastUpdated },
          ].map((item) => (
            <div key={item.label} className="rounded-md border bg-card p-3 shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-medium mt-0.5 text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="io" className="space-y-4">
          <TabsList>
            <TabsTrigger value="io" className="text-xs">输入 / 输出</TabsTrigger>
            <TabsTrigger value="agents" className="text-xs">使用范围</TabsTrigger>
            <TabsTrigger value="calls" className="text-xs">最近调用</TabsTrigger>
            <TabsTrigger value="versions" className="text-xs">版本记录</TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs">权限边界</TabsTrigger>
          </TabsList>

          <TabsContent value="io" className="space-y-4">
            <div className="rounded-md border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-medium mb-2">输入参数</h3>
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">参数名</TableHead>
                  <TableHead className="text-xs">类型</TableHead>
                  <TableHead className="text-xs">必填</TableHead>
                  <TableHead className="text-xs">说明</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {s.inputSchema.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="text-sm font-mono">{p.name}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.type}</TableCell>
                      <TableCell>{p.required ? <StatusBadge variant="high" label="必填" /> : <span className="text-xs text-muted-foreground">可选</span>}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.desc}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="rounded-md border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-medium mb-2">输出结果</h3>
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">字段名</TableHead>
                  <TableHead className="text-xs">类型</TableHead>
                  <TableHead className="text-xs">说明</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {s.outputSchema.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="text-sm font-mono">{p.name}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.desc}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="agents">
            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Agent</TableHead>
                  <TableHead className="text-xs">状态</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {s.boundAgents.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <span>{a.name}</span>
                          <DataSourceBadge item={a} className="px-1.5 py-0 text-[9px]" />
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge variant={a.status as any} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="calls">
            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Agent</TableHead>
                  <TableHead className="text-xs">结果</TableHead>
                  <TableHead className="text-xs">时间</TableHead>
                  <TableHead className="text-xs text-right">耗时</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {s.recentCalls.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <span>{c.agentName}</span>
                          <DataSourceBadge item={c} className="px-1.5 py-0 text-[9px]" />
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge variant={c.result as any} /></TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">{c.time}</TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground text-right">{c.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="versions">
            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">版本</TableHead>
                  <TableHead className="text-xs">日期</TableHead>
                  <TableHead className="text-xs">作者</TableHead>
                  <TableHead className="text-xs">说明</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {s.versions.map((v) => (
                    <TableRow key={v.version}>
                      <TableCell className="text-sm font-mono font-medium">{v.version}</TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">{v.date}</TableCell>
                      <TableCell className="text-sm">{v.author}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="permissions">
            <div className="rounded-md border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-medium mb-2">权限边界</h3>
              <ul className="space-y-1.5">
                {s.permissions.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-info))] shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
