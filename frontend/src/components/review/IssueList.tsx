import type { IssueItem } from "@/types";
import { severityColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function IssueList({
  items,
  empty = "No issues found — nice work!",
}: {
  items?: IssueItem[] | null;
  empty?: string;
}) {
  if (!items || items.length === 0) {
    return (
      <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
        {empty}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={`${item.title}-${i}`}
          className="rounded-xl border border-white/8 bg-white/[0.02] p-4"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                severityColor(item.severity)
              )}
            >
              {item.severity}
            </span>
            {item.line != null && (
              <span className="text-xs text-muted-foreground">Line {item.line}</span>
            )}
          </div>
          <h4 className="font-medium text-white">{item.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
          {item.suggestion && (
            <p className="mt-2 rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-200">
              <span className="font-medium">Suggestion: </span>
              {item.suggestion}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
