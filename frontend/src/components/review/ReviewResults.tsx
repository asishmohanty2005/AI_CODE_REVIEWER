import { useState } from "react";
import {
  Bug,
  ShieldAlert,
  Gauge,
  Sparkles,
  BookOpen,
  Wrench,
  ListTree,
  Code2,
  Copy,
  Check,
} from "lucide-react";
import type { Review } from "@/types";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/common/ScoreRing";
import { IssueList } from "./IssueList";
import { CodeEditor } from "./CodeEditor";
import { copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";

export function ReviewResults({ review }: { review: Review }) {
  const result = review.result;
  const [tab, setTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: "overview", label: "Overview", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "bugs", label: "Bugs", icon: <Bug className="h-3.5 w-3.5" /> },
    { id: "security", label: "Security", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
    { id: "performance", label: "Perf", icon: <Gauge className="h-3.5 w-3.5" /> },
    { id: "complexity", label: "Complexity", icon: <ListTree className="h-3.5 w-3.5" /> },
    { id: "refactored", label: "Refactored", icon: <Code2 className="h-3.5 w-3.5" /> },
    { id: "lines", label: "Line notes", icon: <BookOpen className="h-3.5 w-3.5" /> },
    { id: "practices", label: "Practices", icon: <Wrench className="h-3.5 w-3.5" /> },
  ];

  const handleCopy = async () => {
    if (!result?.refactored_code) return;
    await copyToClipboard(result.refactored_code);
    setCopied(true);
    toast.success("Refactored code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result) {
    return (
      <p className="text-sm text-muted-foreground">
        No structured results available for this review.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-card/60 p-5 sm:flex-row sm:items-center">
        <ScoreRing score={review.quality_score ?? result.quality_score} size={110} />
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge>{review.language}</Badge>
            <Badge variant="secondary">{review.ai_provider}</Badge>
            {review.ai_model && <Badge variant="accent">{review.ai_model}</Badge>}
          </div>
          <h3 className="text-lg font-semibold text-white">Summary</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {review.summary || result.summary}
          </p>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} className="w-full" />

      {tab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard
            title="Readability"
            score={result.readability?.score}
            notes={result.readability?.notes}
          />
          <MetricCard
            title="Maintainability"
            score={result.maintainability?.score}
            notes={result.maintainability?.notes}
          />
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 md:col-span-2">
            <h4 className="mb-2 font-medium text-white">Strengths</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {(result.strengths || []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
              {(!result.strengths || result.strengths.length === 0) && (
                <li>No strengths listed.</li>
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 md:col-span-2">
            <h4 className="mb-2 font-medium text-white">Suggested optimizations</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {(result.optimizations || []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "bugs" && <IssueList items={result.bugs} empty="No bugs detected." />}
      {tab === "security" && (
        <IssueList items={result.security_issues} empty="No security issues detected." />
      )}
      {tab === "performance" && (
        <IssueList
          items={result.performance_issues}
          empty="No performance issues detected."
        />
      )}
      {tab === "practices" && (
        <IssueList items={result.best_practices} empty="Looks aligned with best practices." />
      )}

      {tab === "complexity" && (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
          <div className="mb-4 flex flex-wrap gap-3">
            <Badge variant="accent">
              Time: {result.complexity?.time_complexity || "N/A"}
            </Badge>
            <Badge variant="default">
              Space: {result.complexity?.space_complexity || "N/A"}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.complexity?.explanation || "No complexity analysis available."}
          </p>
        </div>
      )}

      {tab === "refactored" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy
            </Button>
          </div>
          <CodeEditor
            value={result.refactored_code || review.source_code}
            language={review.language}
            readOnly
            height="480px"
          />
        </div>
      )}

      {tab === "lines" && (
        <div className="space-y-2">
          {(result.line_explanations || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No line explanations.</p>
          )}
          {(result.line_explanations || []).map((le, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
            >
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="secondary">L{le.line}</Badge>
                <code className="truncate font-mono text-xs text-cyan-300">
                  {le.code}
                </code>
              </div>
              <p className="text-sm text-muted-foreground">{le.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  score,
  notes,
}: {
  title: string;
  score?: number;
  notes?: string[];
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-medium text-white">{title}</h4>
        <span className="text-lg font-bold text-violet-300">
          {score != null ? Math.round(score) : "—"}
        </span>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {(notes || []).map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
