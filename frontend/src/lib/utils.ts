import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function scoreColor(score: number | null | undefined) {
  if (score == null) return "text-muted-foreground";
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-cyan-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}

export function scoreBg(score: number | null | undefined) {
  if (score == null) return "from-slate-700 to-slate-800";
  if (score >= 85) return "from-emerald-500 to-teal-500";
  if (score >= 70) return "from-violet-500 to-cyan-500";
  if (score >= 50) return "from-amber-500 to-orange-500";
  return "from-rose-500 to-red-600";
}

export function severityColor(severity: string) {
  const s = severity?.toLowerCase();
  if (s === "critical") return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  if (s === "high") return "bg-orange-500/15 text-orange-300 border-orange-500/30";
  if (s === "medium") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (s === "low") return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  return "bg-violet-500/15 text-violet-300 border-violet-500/30";
}

export function languageLabel(lang: string) {
  const map: Record<string, string> = {
    python: "Python",
    javascript: "JavaScript",
    typescript: "TypeScript",
    java: "Java",
    c: "C",
    cpp: "C++",
    go: "Go",
    rust: "Rust",
    html: "HTML",
    css: "CSS",
    sql: "SQL",
    auto: "Auto-detect",
  };
  return map[lang] || lang;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}
