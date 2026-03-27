import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

type MockDataNoticeProps = {
  notes: string[];
  className?: string;
};

export function MockDataNotice({ notes, className }: MockDataNoticeProps) {
  const [dismissed, setDismissed] = useState(false);
  const normalizedNotes = [...new Set(notes.map((note) => note.trim()).filter(Boolean))];

  if (normalizedNotes.length === 0 || dismissed) {
    return null;
  }

  return (
    <div
      className={`flex items-start gap-2 rounded-md border border-[hsl(var(--status-warning)/0.15)] bg-[hsl(var(--status-warning)/0.08)] px-3 py-2 text-xs text-[hsl(var(--status-warning))] ${className ?? ""}`}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="font-medium">页面包含演示数据</div>
        <ul className="space-y-1">
          {normalizedNotes.map((note) => (
            <li key={note} className="break-words leading-5">
              {note}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
