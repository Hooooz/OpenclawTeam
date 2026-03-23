import { Database, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Provenance } from "@/lib/control-center-api";

type DataSourceBadgeProps = {
  item?: Partial<Provenance> | null;
  className?: string;
};

export function DataSourceBadge({ item, className }: DataSourceBadgeProps) {
  if (!item?.dataSource) {
    return null;
  }

  if (item.dataSource === "live") {
    return (
      <Badge variant="outline" className={className}>
        <Database className="mr-1 h-3 w-3" />
        LIVE
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      <FlaskConical className="mr-1 h-3 w-3" />
      MOCK
    </Badge>
  );
}
