import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { mockAgentDetail } from "@/data/mock-agents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ShieldAlert, CheckCircle2, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const a = mockAgentDetail;

const mockAlerts = [
  { id: "al1", type: "active", severity: "high", message: "GPT-4o API 响应延迟升高至 3.2s", time: "5 分钟前", source: "模型监控" },
  { id: "al2", type: "recovered", severity: "medium", message: "飞书平台连接断开", time: "2 小时前", source: "平台监控", recoveredAt: "1 小时前" },
  { id: "al3", type: "recovered", severity: "high", message: "失败率超过 5% 阈值", time: "昨天 16:00", source: "任务监控", recoveredAt: "昨天 17:30" },
];

const mockGatewayChecks = [
  { name: "API 可达性", status: "pass", latency: "120ms", lastCheck: "30s 前" },
  { name: "Token 验证", status: "pass", latency: "45ms", lastCheck: "30s 前" },
  { name: "模型响应", status: "warn", latency: "3200ms", lastCheck: "30s 前" },
  { name: "平台 Webhook", status: "pass", latency: "80ms", lastCheck: "1 分钟前" },
];

const mockPlatformChecks = [
  { platform: "企业微信", status: "pass", lastMsg: "1 分钟前" },
  { platform: "钉钉", status: "pass", lastMsg: "3 分钟前" },
  { platform: "飞书", status: "fail", lastMsg: "2 天前" },
];

export default function BotAlerts() {
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
              <h1 className="text-lg font-semibold text-foreground">{a.name} · 告警与健康</h1>
              <p className="text-xs text-muted-foreground">{a.position}</p>
            </div>
          </div>
        </div>

        {/* Health score */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="健康分" value={82} unit="分" change={-5} danger />
          <MetricCard label="活跃告警" value={1} change={0} danger />
          <MetricCard label="已恢复告警" value={2} change={0} />
          <MetricCard label="24h 风险事件" value={3} change={1} danger />
        </div>

        {/* Active alerts */}
        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> 告警列表</h3>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">状态</TableHead>
              <TableHead className="text-xs">级别</TableHead>
              <TableHead className="text-xs">描述</TableHead>
              <TableHead className="text-xs">来源</TableHead>
              <TableHead className="text-xs">触发时间</TableHead>
              <TableHead className="text-xs">恢复时间</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {mockAlerts.map(al => (
                <TableRow key={al.id}>
                  <TableCell>
                    {al.type === "active" 
                      ? <StatusBadge variant="error" label="活跃" /> 
                      : <StatusBadge variant="success" label="已恢复" />}
                  </TableCell>
                  <TableCell><StatusBadge variant={al.severity as any} label={al.severity === "high" ? "严重" : "警告"} /></TableCell>
                  <TableCell className="text-sm">{al.message}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{al.source}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{al.time}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{"recoveredAt" in al ? al.recoveredAt : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Gateway checks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5"><Activity className="h-4 w-4" /> Gateway 检查</h3>
            <div className="space-y-2">
              {mockGatewayChecks.map(c => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${c.status === "pass" ? "bg-[hsl(var(--status-success))]" : c.status === "warn" ? "bg-[hsl(var(--status-warning))]" : "bg-[hsl(var(--status-danger))]"}`} />
                    <span>{c.name}</span>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">{c.latency} · {c.lastCheck}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> 平台连通</h3>
            <div className="space-y-2">
              {mockPlatformChecks.map(p => (
                <div key={p.platform} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${p.status === "pass" ? "bg-[hsl(var(--status-success))]" : "bg-[hsl(var(--status-danger))]"}`} />
                    <span>{p.platform}</span>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">最近消息 {p.lastMsg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
