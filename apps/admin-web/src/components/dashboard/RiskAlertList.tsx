import type { RiskItem } from "@/lib/control-center-api";
import { StatusBadge } from "./StatusBadge";
import { AlertTriangle } from "lucide-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";

export function RiskAlertList({ risks }: { risks: RiskItem[] }) {
  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))]" />
        风险提示
      </h3>
      <div className="space-y-2">
        {risks.map((r) => (
          <div key={r.id} className="flex items-start gap-2 text-sm py-1.5 border-b last:border-b-0 border-border/60">
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
