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

  const barGlow =
    agent.successRate >= 95
      ? "shadow-[0_0_6px_hsl(var(--status-success)/0.4)]"
      : agent.successRate >= 80
        ? "shadow-[0_0_6px_hsl(var(--status-warning)/0.4)]"
        : "shadow-[0_0_6px_hsl(var(--status-danger)/0.4)]";

  return (
    <div className="glass-card rounded-lg p-3.5 transition-all duration-300 hover:bg-white/[0.05] group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 border border-primary/20">
            <span className="text-xs font-medium text-foreground">{agent.avatar}</span>
            {agent.status === "running" && (
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[hsl(var(--status-success))] border border-background status-dot-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-medium truncate block group-hover:text-primary transition-colors">{agent.name}</span>
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
        <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", barColor, barGlow)} style={{ width: `${agent.successRate}%` }} />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{agent.successRate}%</span>
      </div>
    </div>
  );
}
