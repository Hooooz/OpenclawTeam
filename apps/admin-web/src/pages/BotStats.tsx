import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { buildBotStatsData } from "@/lib/bot-operations";
import { collectMockNotes } from "@/lib/control-center-api";
import { useBotPageData } from "@/lib/use-bot-page-data";

export default function BotStats() {
  const { id } = useParams<{ id: string }>();
  const agentId = id || "a1";
  const { agent, runs, mockNotes } = useBotPageData(agentId);
  const stats = buildBotStatsData(agent, runs);
  const pageMockNotes = [
    ...mockNotes,
    ...collectMockNotes(stats.summaryMetrics),
    ...collectMockNotes(stats.sessionTrend),
    ...collectMockNotes(stats.platformDistribution),
    ...collectMockNotes(stats.failureTrend),
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
                <h1 className="text-lg font-semibold text-foreground">{agent.name} · 消息统计</h1>
                <DataSourceBadge item={agent} />
              </div>
              <p className="text-xs text-muted-foreground">{agent.position}</p>
            </div>
          </div>
        </div>

        <MockDataNotice notes={[...new Set(pageMockNotes)]} />

        <div className="grid grid-cols-4 gap-3">
          {stats.summaryMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium">会话量趋势（最近 7 天）</h3>
            <div className="space-y-2">
              {stats.sessionTrend.map((item) => (
                <div key={item.day} className="flex items-center gap-3">
                  <span className="w-10 text-xs tabular-nums text-muted-foreground">{item.day}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${Math.max((item.count / Math.max(...stats.sessionTrend.map((value) => value.count), 1)) * 100, 6)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{item.count}</span>
                  <DataSourceBadge item={item} className="px-1.5 py-0 text-[9px]" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium">平台来源分布</h3>
            <div className="space-y-3">
              {stats.platformDistribution.map((item) => (
                <div key={item.platform} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{item.platform}</span>
                      <DataSourceBadge item={item} className="px-1.5 py-0 text-[9px]" />
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/50" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium">失败率趋势（最近 7 天）</h3>
          <div className="space-y-2">
            {stats.failureTrend.map((item) => (
              <div key={item.day} className="flex items-center gap-3">
                <span className="w-10 text-xs tabular-nums text-muted-foreground">{item.day}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${item.rate > 3 ? "bg-[hsl(var(--status-danger))]" : "bg-[hsl(var(--status-warning))]"}`}
                    style={{ width: `${Math.max((item.rate / 100) * 100, item.rate > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{item.rate}%</span>
                <DataSourceBadge item={item} className="px-1.5 py-0 text-[9px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
