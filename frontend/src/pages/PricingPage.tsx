import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For students and side projects",
    features: [
      "20 reviews / month",
      "Gemini AI provider",
      "PDF export",
      "AI chat on reviews",
      "History & favorites",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    description: "For professional developers",
    features: [
      "Unlimited reviews",
      "Gemini + OpenAI",
      "Priority analysis",
      "Language conversion",
      "Team PDF branding",
      "Email support",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/ seat / mo",
    description: "For engineering squads",
    features: [
      "Everything in Pro",
      "Shared workspaces",
      "SSO (coming soon)",
      "Admin analytics",
      "Custom model routing",
      "Priority support",
    ],
    cta: "Contact sales",
    highlight: false,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <Badge className="mb-4">Pricing</Badge>
        <h1 className="text-3xl font-bold text-white sm:text-5xl">
          Simple plans for serious code quality
        </h1>
        <p className="mt-4 text-muted-foreground">
          Start free. Scale when your team does. Cancel anytime.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <Card
            key={p.name}
            className={cn(
              "relative flex flex-col",
              p.highlight && "gradient-border glow-primary scale-[1.02]"
            )}
          >
            {p.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="accent">Most popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              <div className="pt-4">
                <span className="text-4xl font-bold text-white">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="mb-8 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={p.highlight ? "default" : "outline"}
                className="w-full"
                onClick={() =>
                  navigate(isAuthenticated ? "/dashboard" : "/register")
                }
              >
                {p.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
