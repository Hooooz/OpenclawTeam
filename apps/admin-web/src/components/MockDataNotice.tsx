import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type MockDataNoticeProps = {
  notes: string[];
  className?: string;
};

export function MockDataNotice({ notes, className }: MockDataNoticeProps) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <Alert className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>页面包含演示数据</AlertTitle>
      <AlertDescription>
        <div className="space-y-1">
          {notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
