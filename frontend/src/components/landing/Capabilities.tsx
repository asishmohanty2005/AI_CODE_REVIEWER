import { Badge } from "@/components/ui/badge";

const languages = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C",
  "C++",
  "Go",
  "Rust",
  "HTML",
  "CSS",
  "SQL",
];

const capabilities = [
  "Overall quality score (0–100)",
  "Bug & security detection",
  "Time & space complexity",
  "Readability & maintainability",
  "Best-practice checklist",
  "Suggested optimizations",
  "Language conversion",
  "Unit test generation",
  "README & documentation",
  "Function-level explanations",
];

export function Capabilities() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <Badge variant="accent" className="mb-4">
            AI Capabilities
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Deep analysis across your stack
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Paste a snippet or upload a source file. CodeLens auto-detects the
            language, runs a multi-dimensional review, and returns structured
            insights you can act on immediately.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {languages.map((l) => (
              <Badge key={l} variant="secondary">
                {l}
              </Badge>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {capabilities.map((c) => (
            <div
              key={c}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs">
                ✓
              </span>
              {c}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
