import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { mockAgentDetail } from "@/data/mock-agents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, Server, MessageSquare, Coins, AlertTriangle, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const a = mockAgentDetail;

export default function BotOverview() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        <div>
          <Link to={`/agents/${a.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-3.5 w-3.5" /> 返回员工详情
          </Link>
          {/* Identity header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-lg font-medium text-foreground">{a.avatar}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">{a.name}</h1>
                <StatusBadge variant={a.status} />
              </div>
              <p className="text-sm text-muted-foreground">{a.position} · {a.department}</p>
              <p className="text-xs text-muted-foreground/70 italic">"{a.motto}"</p>
            </div>
            <div className="ml-auto flex gap-2">
              {a.specialties.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
            </div>
          </div>
        </div>

        {/* Health summary metrics */}
        <div className="grid grid-cols-6 gap-3">
          <MetricCard label="Gateway 健康" value={98} unit="%" change={0} />
          <MetricCard label="今日会话数" value={47} change={12} />
          <MetricCard label="今日 Token" value={28400} change={-3} />
          <MetricCard label="平均响应" value={1.8} unit="s" change={-5} />
          <MetricCard label="今日失败" value={2} change={1} danger />
          <MetricCard label="活跃告警" value={1} change={0} danger />
        </div>

        {/* Quick nav cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Server, label: "模型与平台", desc: "查看模型、Provider 和连通性", to: `/agents/${a.id}/bot/model` },
            { icon: MessageSquare, label: "Session 管理", desc: "查看会话、平台和异常", to: `/agents/${a.id}/bot/sessions` },
            { icon: Coins, label: "消息统计", desc: "Token 消耗、响应时间与趋势", to: `/agents/${a.id}/bot/stats` },
            { icon: AlertTriangle, label: "告警与健康", desc: "活跃告警和 Gateway 状态", to: `/agents/${a.id}/bot/alerts` },
          ].map((card) => (
            <Link key={card.label} to={card.to} className="rounded-md border bg-card p-4 shadow-sm hover:shadow-md transition-shadow group">
              <card.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
              <p className="text-sm font-medium text-foreground">{card.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent runs */}
        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium mb-3">最近 5 次工作</h3>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">任务</TableHead>
              <TableHead className="text-xs">状态</TableHead>
              <TableHead className="text-xs">时间</TableHead>
              <TableHead className="text-xs text-right">耗时</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {a.recentRuns.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.taskName}</TableCell>
                  <TableCell><StatusBadge variant={r.status as any} /></TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{r.time}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground text-right">{r.duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Recent memory */}
        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Brain className="h-4 w-4" /> 最近记忆更新</h3>
          <div className="space-y-2">
            {[
              { time: "14:32", summary: "新增 3 条 FAQ 映射规则" },
              { time: "13:30", summary: "无新增记忆" },
              { time: "昨天 18:00", summary: "更新日报模板格式" },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-xs tabular-nums text-muted-foreground w-16">{m.time}</span>
                <span className="text-muted-foreground">{m.summary}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
