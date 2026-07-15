import { motion } from "framer-motion";
import {
  Bug,
  ShieldAlert,
  Gauge,
  BookOpen,
  RefreshCw,
  FileCode2,
  MessageSquare,
  FileDown,
} from "lucide-react";

const features = [
  {
    icon: Bug,
    title: "Bug Detection",
    desc: "Find logic errors, edge cases, and silent failures before they hit production.",
  },
  {
    icon: ShieldAlert,
    title: "Security Audit",
    desc: "Surface injection risks, insecure APIs, and secret leaks with clear remediations.",
  },
  {
    icon: Gauge,
    title: "Performance Insights",
    desc: "Spot hot loops, N+1 patterns, and complexity bottlenecks with O-notation analysis.",
  },
  {
    icon: BookOpen,
    title: "Line-by-line Explain",
    desc: "Understand every critical line with senior-level annotations and intent.",
  },
  {
    icon: RefreshCw,
    title: "Refactored Code",
    desc: "Get production-ready optimized rewrites you can copy or compare side-by-side.",
  },
  {
    icon: FileCode2,
    title: "Unit Tests & Docs",
    desc: "Generate tests, docstrings, and README files tailored to your codebase.",
  },
  {
    icon: MessageSquare,
    title: "AI Code Chat",
    desc: "Ask follow-up questions about any review — architecture, trade-offs, rewrites.",
  },
  {
    icon: FileDown,
    title: "PDF Export",
    desc: "Share polished review reports with teammates or attach them to PRs.",
  },
];

export function Features() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything a senior reviewer would catch
          </h2>
          <p className="mt-4 text-muted-foreground">
            From security to style — one submission, a complete quality report.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border border-white/[0.07] bg-card/60 p-5 backdrop-blur transition hover:border-violet-500/30 hover:bg-card/90"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20 transition group-hover:bg-violet-500/20">
                <f.icon className="h-5 w-5 text-violet-300" />
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
