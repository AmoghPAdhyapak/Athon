import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tone = "auto" | "dark";

/**
 * Subtle, premium creator-ownership credit.
 * Not a watermark — small, low-opacity, modern type with a gentle gradient
 * glow on hover and a soft fade-in. Use tone="dark" on always-dark surfaces
 * (Splash, AuthLayout); tone="auto" uses theme-aware foreground tokens.
 */
export function CreatorCredit({
  className = "",
  tone = "auto",
  verb = "Crafted",
}: {
  className?: string;
  tone?: Tone;
  verb?: "Crafted" | "Built";
}) {
  const reduce = useReducedMotion();
  const base =
    tone === "dark" ? "text-white/30 hover:text-white/55" : "text-foreground/30 hover:text-foreground/55";
  const name =
    tone === "dark" ? "text-white/45" : "text-foreground/45";

  return (
    <motion.p
      initial={reduce ? false : { opacity: 0 }}
      animate={reduce ? undefined : { opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
      className={cn(
        "group select-none text-center text-[10px] font-light tracking-[0.18em] transition-colors duration-500",
        base,
        className,
      )}
    >
      {verb} by{" "}
      <span
        className={cn(
          "font-normal transition-all duration-500",
          name,
          "group-hover:bg-gradient-to-r group-hover:from-violet-300 group-hover:via-fuchsia-300 group-hover:to-pink-300 group-hover:bg-clip-text group-hover:text-transparent group-hover:[filter:drop-shadow(0_0_10px_rgba(192,132,252,0.5))]",
        )}
      >
        Amogh P Adhyapak
      </span>
    </motion.p>
  );
}
