import type { ServiceHealth } from "@/lib/control-center-api";
import { cn } from "@/lib/utils";
import { DataSourceBadge } from "@/components/DataSourceBadge";

const dotColor: Record<string, string> = {
  healthy: "bg-[hsl(var(--status-success))]",
  degraded: "bg-[hsl(var(--status-warning))]",
  down: "bg-[hsl(var(--status-danger))]",
};

export function SystemHealthCard({ services }: { services: ServiceHealth[] }) {
  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-medium mb-3">系统健康</h3>
      <div className="space-y-2.5">
        {services.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor[s.status])} />
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
