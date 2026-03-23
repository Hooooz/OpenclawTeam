import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { mockAgentDetail } from "@/data/mock-agents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Server } from "lucide-react";
import { Link } from "react-router-dom";

const a = mockAgentDetail;

const mockModels = [
  { id: "m1", name: "GPT-4o", provider: "OpenAI", role: "主模型", status: "healthy", lastTest: "2 分钟前", latency: "1.2s" },
  { id: "m2", name: "GPT-4o-mini", provider: "OpenAI", role: "回退模型", status: "healthy", lastTest: "5 分钟前", latency: "0.6s" },
];

const mockPlatforms = [
  { id: "p1", name: "企业微信", status: "connected", lastMsg: "1 分钟前", sessions: 12 },
  { id: "p2", name: "钉钉", status: "connected", lastMsg: "3 分钟前", sessions: 8 },
  { id: "p3", name: "飞书", status: "disconnected", lastMsg: "2 天前", sessions: 0 },
];

export default function BotModel() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        <div>
          <Link to={`/agents/${a.id}/bot`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-3.5 w-3.5" /> 返回运行面
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-sm font-medium">{a.avatar}</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{a.name} · 模型与平台</h1>
              <p className="text-xs text-muted-foreground">{a.position}</p>
            </div>
          </div>
        </div>

        {/* Models */}
        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5"><Server className="h-4 w-4" /> 模型配置</h3>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">模型</TableHead>
              <TableHead className="text-xs">Provider</TableHead>
              <TableHead className="text-xs">角色</TableHead>
              <TableHead className="text-xs">状态</TableHead>
              <TableHead className="text-xs">延迟</TableHead>
              <TableHead className="text-xs">最近测试</TableHead>
              <TableHead className="text-xs text-center">操作</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {mockModels.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm font-medium font-mono">{m.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.provider}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.role}</TableCell>
                  <TableCell><StatusBadge variant={m.status === "healthy" ? "success" : "error"} label={m.status === "healthy" ? "正常" : "异常"} /></TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{m.latency}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{m.lastTest}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="text-xs gap-1"><Play className="h-3 w-3" /> 测试</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Platforms */}
        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium mb-3">平台绑定</h3>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">平台</TableHead>
              <TableHead className="text-xs">状态</TableHead>
              <TableHead className="text-xs">活跃会话</TableHead>
              <TableHead className="text-xs">最近消息</TableHead>
              <TableHead className="text-xs text-center">操作</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {mockPlatforms.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm font-medium">{p.name}</TableCell>
                  <TableCell><StatusBadge variant={p.status === "connected" ? "success" : "error"} label={p.status === "connected" ? "已连接" : "断开"} /></TableCell>
                  <TableCell className="text-sm tabular-nums">{p.sessions}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{p.lastMsg}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="text-xs gap-1"><Play className="h-3 w-3" /> 测试连通</Button>
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
