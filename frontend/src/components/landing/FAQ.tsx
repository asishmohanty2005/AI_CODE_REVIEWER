import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Which AI models does CodeLens use?",
    a: "Google Gemini is the default provider. You can switch to OpenAI (e.g. GPT-4o-mini) from Settings or per review.",
  },
  {
    q: "Is my source code stored securely?",
    a: "Reviews are saved to your private account so you can revisit history. Use strong credentials and rotate API keys. Never commit secrets in code you submit.",
  },
  {
    q: "What languages are supported?",
    a: "Python, JavaScript, TypeScript, Java, C, C++, Go, Rust, HTML, CSS, and SQL — with automatic language detection.",
  },
  {
    q: "Can I export reports?",
    a: "Yes. Download a polished PDF report for any completed review, or copy refactored code directly from the UI.",
  },
  {
    q: "Does the free plan include AI chat?",
    a: "Yes. Free accounts can review code, chat about reviews, generate tests/docs, and export PDFs with generous daily limits.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center text-3xl font-bold text-white sm:text-4xl">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className="rounded-2xl border border-white/[0.07] bg-card/40"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="font-medium text-white">{f.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <p className="border-t border-white/5 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
