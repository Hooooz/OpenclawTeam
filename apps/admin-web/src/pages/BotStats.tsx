import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { mockAgentDetail } from "@/data/mock-agents";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const a = mockAgentDetail;

export default function BotStats() {
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
              <h1 className="text-lg font-semibold text-foreground">{a.name} · 消息统计</h1>
              <p className="text-xs text-muted-foreground">{a.position}</p>
            </div>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="今日 Token" value={28400} change={-3} />
          <MetricCard label="本周 Token" value={186200} change={5} />
          <MetricCard label="本月 Token" value={742800} change={12} />
          <MetricCard label="平均响应时间" value={1.8} unit="s" change={-5} />
        </div>

        {/* Trend placeholders */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-3">会话量趋势（最近 7 天）</h3>
            <div className="space-y-2">
              {[
                { day: "3/16", count: 32 }, { day: "3/17", count: 28 }, { day: "3/18", count: 41 },
                { day: "3/19", count: 38 }, { day: "3/20", count: 45 }, { day: "3/21", count: 42 }, { day: "3/22", count: 47 },
              ].map(d => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="text-xs tabular-nums text-muted-foreground w-10">{d.day}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(d.count / 50) * 100}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-3">平台来源分布</h3>
            <div className="space-y-3">
              {[
                { platform: "企业微信", pct: 52, count: 245 },
                { platform: "钉钉", pct: 28, count: 132 },
                { platform: "系统定时", pct: 15, count: 71 },
                { platform: "飞书", pct: 5, count: 24 },
              ].map(p => (
                <div key={p.platform} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{p.platform}</span>
                    <span className="text-muted-foreground tabular-nums">{p.count} ({p.pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 rounded-full" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Failure rate */}
        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium mb-3">失败率趋势（最近 7 天）</h3>
          <div className="space-y-2">
            {[
              { day: "3/16", rate: 2.1 }, { day: "3/17", rate: 1.8 }, { day: "3/18", rate: 3.2 },
              { day: "3/19", rate: 2.5 }, { day: "3/20", rate: 1.2 }, { day: "3/21", rate: 4.1 }, { day: "3/22", rate: 3.7 },
            ].map(d => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-muted-foreground w-10">{d.day}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${d.rate > 3 ? 'bg-[hsl(var(--status-danger))]' : 'bg-[hsl(var(--status-warning))]'}`} style={{ width: `${(d.rate / 5) * 100}%` }} />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{d.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
