const steps = [
  {
    n: "01",
    title: "Paste or upload",
    desc: "Drop code from any supported language into the Monaco editor.",
  },
  {
    n: "02",
    title: "AI reviews deeply",
    desc: "Gemini or OpenAI analyzes bugs, security, performance, and style.",
  },
  {
    n: "03",
    title: "Act on insights",
    desc: "Apply refactors, export PDFs, chat about the code, or generate tests.",
  },
];

export function Workflow() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Three steps to better code
          </h2>
          <p className="mt-4 text-muted-foreground">
            A frictionless workflow designed for real engineering teams.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-6"
            >
              <span className="text-5xl font-black text-white/[0.06]">{s.n}</span>
              <h3 className="mt-2 text-xl font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
