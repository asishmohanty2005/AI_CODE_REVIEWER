import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Badge className="mb-4">About</Badge>
      <h1 className="text-3xl font-bold text-white sm:text-5xl">
        Built for engineers who care about craft
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        CodeLens AI is an intelligent code reviewer that combines modern editor
        ergonomics with multi-provider AI analysis. Paste a snippet, upload a
        file, and get a structured report covering bugs, security, performance,
        complexity, and actionable refactors.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { t: "Mission", d: "Make senior-level code review accessible on every commit." },
          { t: "Stack", d: "React, FastAPI, PostgreSQL, Gemini & OpenAI." },
          { t: "Privacy", d: "Your reviews stay in your account. Bring your own API keys." },
        ].map((c) => (
          <Card key={c.t}>
            <CardContent className="p-5">
              <h3 className="font-semibold text-white">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="prose-ai mt-12 space-y-4">
        <h2 className="text-2xl font-semibold text-white">How CodeLens works</h2>
        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
          <li>You submit source code with an optional language hint.</li>
          <li>The backend normalizes input and routes it to Gemini or OpenAI.</li>
          <li>
            A structured JSON schema captures scores, issues, complexity, and
            refactored code.
          </li>
          <li>
            Results are stored in your history so you can chat, re-run actions,
            and export PDFs.
          </li>
        </ol>
      </div>
    </div>
  );
}
