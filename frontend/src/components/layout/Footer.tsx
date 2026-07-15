import { Link } from "react-router-dom";
import { Globe, Mail, MessageCircle } from "lucide-react";
import { Logo } from "@/components/common/Logo";

const social = [
  { icon: Globe, label: "Website", href: "#" },
  { icon: MessageCircle, label: "Community", href: "#" },
  { icon: Mail, label: "Email", href: "mailto:hello@codelens.ai" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-black/20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Intelligent AI code reviews that catch bugs, security holes, and
            performance issues before they ship.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/review" className="hover:text-white">
                Code Review
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="hover:text-white">
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <a href="#faq" className="hover:text-white">
                FAQ
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Connect</h4>
          <div className="flex gap-3">
            {social.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-muted-foreground transition hover:border-violet-500/40 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.06] py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CodeLens AI. Built for developers who ship quality.
      </div>
    </footer>
  );
}
