import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { MetricItem } from "@/lib/control-center-api";
import { DataSourceBadge } from "@/components/DataSourceBadge";

export function MetricCard(metric: MetricItem) {
  const { label, value, change, danger } = metric;
  const isUp = change > 0;
  const isDown = change < 0;
  const isFlat = change === 0;

  return (
    <div
      className={cn(
        "glass-card rounded-lg p-4 transition-all duration-300 hover:bg-white/[0.05] group",
        danger && "border-[hsl(var(--status-danger)/0.3)] glow-red"
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <DataSourceBadge item={metric} className="px-1.5 py-0 text-[9px]" />
      </div>
      <p className={cn(
        "text-2xl font-semibold tracking-tight tabular-nums transition-colors",
        danger ? "text-destructive" : "text-foreground group-hover:gradient-text"
      )}>
        {value}
      </p>
      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
        {isUp && <TrendingUp className={cn("h-3 w-3", danger ? "text-destructive" : "text-[hsl(var(--status-success))]")} />}
        {isDown && <TrendingDown className="h-3 w-3 text-[hsl(var(--status-success))]" />}
        {isFlat && <Minus className="h-3 w-3" />}
        <span>较昨日 {isFlat ? "持平" : `${isUp ? "+" : ""}${change}`}</span>
      </div>
    </div>
  );
}
