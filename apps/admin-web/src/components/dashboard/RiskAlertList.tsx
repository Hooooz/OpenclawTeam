import type { RiskItem } from "@/lib/control-center-api";
import { StatusBadge } from "./StatusBadge";
import { AlertTriangle } from "lucide-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";

export function RiskAlertList({ risks }: { risks: RiskItem[] }) {
  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))]" />
        <span>风险提示</span>
        {risks.length > 0 && (
          <span className="ml-auto text-[10px] rounded-full bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] px-2 py-0.5 tabular-nums">
            {risks.length}
          </span>
        )}
      </h3>
      <div className="space-y-1.5">
        {risks.map((r) => (
          <div key={r.id} className="flex items-start gap-2 text-sm py-2 px-2 rounded-md border-b last:border-b-0 border-border/20 hover:bg-white/[0.02] transition-colors">
            <StatusBadge variant={r.level} className="mt-0.5 shrink-0" />
            <span className="flex-1 text-foreground leading-snug">{r.message}</span>
            <DataSourceBadge item={r} className="px-1.5 py-0 text-[9px]" />
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{r.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
