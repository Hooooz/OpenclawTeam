import { cn } from "@/lib/utils";
import type { AgentStatus, RunStatus as TaskStatus, RiskItem, ServiceHealth } from "@/lib/control-center-api";

type RiskLevel = RiskItem["level"];
type ServiceStatus = ServiceHealth["status"];
type BadgeVariant = AgentStatus | TaskStatus | RiskLevel | ServiceStatus;

const variantStyles: Record<string, string> = {
  // Agent
  running: "bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]",
  idle: "bg-muted text-muted-foreground",
  paused: "bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))]",
  error: "bg-[hsl(var(--status-danger)/0.12)] text-[hsl(var(--status-danger))]",
  // Task
  success: "bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))]",
  failed: "bg-[hsl(var(--status-danger)/0.12)] text-[hsl(var(--status-danger))]",
  cancelled: "bg-muted text-muted-foreground",
  // Risk
  high: "bg-[hsl(var(--status-danger)/0.12)] text-[hsl(var(--status-danger))]",
  medium: "bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))]",
  low: "bg-muted text-muted-foreground",
  // Service
  healthy: "bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))]",
  degraded: "bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))]",
  down: "bg-[hsl(var(--status-danger)/0.12)] text-[hsl(var(--status-danger))]",
};

const labelMap: Record<string, string> = {
  running: "运行中",
  idle: "空闲",
  paused: "已暂停",
  error: "异常",
  success: "成功",
  failed: "失败",
  cancelled: "已取消",
  high: "高",
  medium: "中",
  low: "低",
  healthy: "正常",
  degraded: "异常",
  down: "离线",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums whitespace-nowrap",
        variantStyles[variant],
        className
      )}
    >
      {label ?? labelMap[variant]}
    </span>
  );
}
