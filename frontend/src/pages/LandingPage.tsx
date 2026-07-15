import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Capabilities } from "@/components/landing/Capabilities";
import { Workflow } from "@/components/landing/Workflow";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Hero />
      <Features />
      <Capabilities />
      <Workflow />
      <Testimonials />
      <FAQ />
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-500/10 p-10 text-center glow-primary">
          <h2 className="text-3xl font-bold text-white">
            Ready to review smarter?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Join engineers who ship safer, faster, and cleaner code with CodeLens AI.
          </p>
          <Button
            size="lg"
            className="mt-8"
            onClick={() => navigate(isAuthenticated ? "/review" : "/register")}
          >
            {isAuthenticated ? "Open reviewer" : "Create free account"}
          </Button>
        </div>
      </section>
    </>
  );
}
