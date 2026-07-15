const items = [
  {
    quote:
      "CodeLens caught a subtle race condition our linters never saw. It paid for itself on day one.",
    name: "Aisha Rahman",
    role: "Staff Engineer, Fintech",
  },
  {
    quote:
      "The security findings are actionable — not generic noise. We attach PDF reports to every release PR.",
    name: "Marcus Chen",
    role: "Security Lead",
  },
  {
    quote:
      "Junior engineers level up faster when they can chat with the review about *why* something is wrong.",
    name: "Elena Petrova",
    role: "Engineering Manager",
  },
];

export function Testimonials() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-white sm:text-4xl">
          Loved by builders
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((t) => (
            <blockquote
              key={t.name}
              className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-card/50 p-6"
            >
              <p className="text-sm leading-relaxed text-slate-300">“{t.quote}”</p>
              <footer className="mt-6">
                <div className="font-medium text-white">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
