import type { ServiceHealth } from "@/lib/control-center-api";
import { cn } from "@/lib/utils";
import { DataSourceBadge } from "@/components/DataSourceBadge";

const dotColor: Record<string, string> = {
  healthy: "bg-[hsl(var(--status-success))]",
  degraded: "bg-[hsl(var(--status-warning))]",
  down: "bg-[hsl(var(--status-danger))]",
};

const glowColor: Record<string, string> = {
  healthy: "shadow-[0_0_6px_hsl(var(--status-success)/0.4)]",
  degraded: "shadow-[0_0_6px_hsl(var(--status-warning)/0.4)]",
  down: "shadow-[0_0_6px_hsl(var(--status-danger)/0.4)]",
};

export function SystemHealthCard({ services }: { services: ServiceHealth[] }) {
  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[hsl(var(--status-success))] status-dot-pulse" />
        系统健康
      </h3>
      <div className="space-y-2.5">
        {services.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-b-0">
            <div className="flex items-center gap-2.5">
              <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor[s.status], glowColor[s.status], s.status !== "healthy" && "status-dot-pulse")} />
              <span className="text-foreground">{s.name}</span>
              <DataSourceBadge item={s} className="px-1.5 py-0 text-[9px]" />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{s.lastHeartbeat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
