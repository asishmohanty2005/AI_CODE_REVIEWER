import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function Logo({
  className,
  showText = true,
  size = "md",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const icon = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <Link to="/" className={cn("inline-flex items-center gap-2.5 group", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 p-[1px] shadow-lg shadow-violet-500/30",
          icon
        )}
      >
        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0b0f1a]">
          <svg viewBox="0 0 24 24" className="h-[60%] w-[60%]" fill="none">
            <path
              d="M8 7L4 12l4 5M16 7l4 5-4 5M14 4l-4 16"
              stroke="url(#logoGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="logoGrad" x1="4" y1="4" x2="20" y2="20">
                <stop stopColor="#C4B5FD" />
                <stop offset="1" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      {showText && (
        <span className={cn("font-semibold tracking-tight text-white", text)}>
          Code<span className="text-gradient">Lens</span>
          <span className="ml-1 text-xs font-medium text-violet-300/80">AI</span>
        </span>
      )}
    </Link>
  );
}
