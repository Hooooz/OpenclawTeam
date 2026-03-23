import { Activity, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildBotAlertsData } from "@/lib/bot-operations";
import { collectMockNotes } from "@/lib/control-center-api";
import { useBotPageData } from "@/lib/use-bot-page-data";

export default function BotAlerts() {
  const { id } = useParams<{ id: string }>();
  const agentId = id || "a1";
  const { agent, runs, settings, mockNotes } = useBotPageData(agentId);
  const alertData = buildBotAlertsData(agent, runs, settings);
  const pageMockNotes = [
    ...mockNotes,
    ...collectMockNotes(alertData.metrics),
    ...collectMockNotes(alertData.alerts),
    ...collectMockNotes(alertData.gatewayChecks),
    ...collectMockNotes(alertData.platformChecks),
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-5 p-6">
        <div>
          <Link
            to={`/agents/${agent.id}/bot`}
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回运行面
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <span className="text-sm font-medium">{agent.avatar}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">{agent.name} · 告警与健康</h1>
                <DataSourceBadge item={agent} />
              </div>
              <p className="text-xs text-muted-foreground">{agent.position}</p>
            </div>
          </div>
        </div>

        <MockDataNotice notes={[...new Set(pageMockNotes)]} />

        <div className="grid grid-cols-4 gap-3">
          {alertData.metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
            <ShieldAlert className="h-4 w-4" />
            告警列表
          </h3>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs">级别</TableHead>
                <TableHead className="text-xs">描述</TableHead>
                <TableHead className="text-xs">来源</TableHead>
                <TableHead className="text-xs">触发时间</TableHead>
                <TableHead className="text-xs">恢复时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertData.alerts.length > 0 ? (
                alertData.alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <StatusBadge
                        variant={alert.type === "active" ? "error" : "success"}
                        label={alert.type === "active" ? "活跃" : "已恢复"}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        variant={alert.severity}
                        label={alert.severity === "high" ? "严重" : alert.severity === "medium" ? "警告" : "提示"}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <span>{alert.message}</span>
                        <DataSourceBadge item={alert} className="px-1.5 py-0 text-[9px]" />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{alert.source}</TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">{alert.time}</TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">{alert.recoveredAt ?? "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    当前没有活跃或历史告警。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
              <Activity className="h-4 w-4" />
              Gateway 检查
            </h3>
            <div className="space-y-2">
              {alertData.gatewayChecks.map((check) => (
                <div key={check.name} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        check.status === "pass"
                          ? "bg-[hsl(var(--status-success))]"
                          : check.status === "warn"
                            ? "bg-[hsl(var(--status-warning))]"
                            : "bg-[hsl(var(--status-danger))]"
                      }`}
                    />
                    <span>{check.name}</span>
                    <DataSourceBadge item={check} className="px-1.5 py-0 text-[9px]" />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {check.latency} · {check.lastCheck}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              平台连通
            </h3>
            <div className="space-y-2">
              {alertData.platformChecks.map((check) => (
                <div key={`${check.platform}-${check.lastMsg}`} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        check.status === "pass" ? "bg-[hsl(var(--status-success))]" : "bg-[hsl(var(--status-danger))]"
                      }`}
                    />
                    <span>{check.platform}</span>
                    <DataSourceBadge item={check} className="px-1.5 py-0 text-[9px]" />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">最近消息 {check.lastMsg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
