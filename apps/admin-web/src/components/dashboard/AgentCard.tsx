import type { DashboardAgentSummary as AgentSummary } from "@/lib/control-center-api";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { DataSourceBadge } from "@/components/DataSourceBadge";

export function AgentCard({ agent }: { agent: AgentSummary }) {
  const barColor =
    agent.successRate >= 95
      ? "bg-[hsl(var(--status-success))]"
      : agent.successRate >= 80
        ? "bg-[hsl(var(--status-warning))]"
        : "bg-[hsl(var(--status-danger))]";

  return (
    <div className="rounded-md border bg-card p-3.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-foreground">{agent.avatar}</span>
          </div>
          <div className="min-w-0">
            <span className="text-sm font-medium truncate block">{agent.name}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{agent.position}</span>
              <DataSourceBadge item={agent} className="px-1.5 py-0 text-[9px]" />
            </div>
          </div>
        </div>
        <StatusBadge variant={agent.status} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span>{agent.skillCount} 个 Skill</span>
        <span>最近工作：{agent.lastRun}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full", barColor)} style={{ width: `${agent.successRate}%` }} />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{agent.successRate}%</span>
      </div>
    </div>
  );
}
