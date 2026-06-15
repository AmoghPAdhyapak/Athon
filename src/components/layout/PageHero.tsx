import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AmbientVariant =
  | "marketplace"
  | "studio"
  | "lab"
  | "feed"
  | "vault"
  | "timeline"
  | "cockpit"
  | "account"
  | "default";

export interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  /** Tailwind gradient classes, e.g. "from-cyan-400 to-blue-600" */
  accent: string;
  /** rgba glow color matching accent, used for halo + ambient backdrop */
  glow: string;
  /** Optional CTAs / chips rendered on the right side of the hero */
  actions?: React.ReactNode;
  /** Render route-themed ambient orbs fixed behind the page content */
  ambient?: boolean;
  /** Orb placement personality for the route ambient layer */
  ambientVariant?: AmbientVariant;
}

/**
 * Distinct per-route page hero. Gives every page its own visual identity
 * (gradient icon tile, accent halo, eyebrow tag) so users can feel they've
 * navigated to a different surface — not just changed the body content.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  accent,
  glow,
  actions,
  ambient = true,
  ambientVariant = "default",
}: PageHeroProps) {
  return (
    <>
      {ambient && <RouteAmbient glow={glow} variant={ambientVariant} />}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-foreground/[0.06] bg-gradient-to-br from-foreground/[0.04] via-foreground/[0.015] to-transparent p-6 md:p-8 mb-8"
      >
        <div
          className="absolute -top-24 -right-16 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-60"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }}
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 md:gap-5">
            <div className="relative shrink-0">
              <div
                className="absolute inset-0 rounded-2xl blur-xl opacity-70"
                style={{ background: `radial-gradient(circle, ${glow}, transparent 65%)` }}
              />
              <div
                className={cn(
                  "relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-2xl",
                  accent,
                )}
                style={{ boxShadow: `0 18px 40px -12px ${glow}` }}
              >
                <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
            </div>
            <div className="min-w-0 space-y-1.5 pt-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-foreground/10 bg-foreground/[0.04] text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/70">
                {eyebrow}
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>
              {subtitle && (
                <p className="text-sm md:text-base text-foreground/55 max-w-2xl">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 md:gap-3 md:shrink-0">{actions}</div>
          )}
        </div>
      </motion.header>
    </>
  );
}

/** Fixed route-ambient layer. Each route gets unique orb placement + energy. */
export function RouteAmbient({
  glow,
  variant = "default",
}: {
  glow: string;
  variant?: AmbientVariant;
}) {
  const configs: Record<AmbientVariant, React.ReactNode> = {
    marketplace: (
      <>
        <div className="absolute top-[-5%] left-[10%] w-[80%] h-[35%] rounded-full blur-[120px] opacity-20"
          style={{ background: `radial-gradient(ellipse, ${glow}, transparent 70%)` }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[40%] rounded-full blur-[100px] opacity-15"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[40%] rounded-full blur-[100px] opacity-15"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
      </>
    ),
    studio: (
      <>
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[40%] h-[60%] rounded-full blur-[160px] opacity-30"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 65%)` }} />
        <div className="absolute top-[-10%] left-[30%] w-[40%] h-[30%] rounded-full blur-[100px] opacity-10"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
      </>
    ),
    lab: (
      <>
        <div className="absolute top-[10%] right-[-5%] w-[45%] h-[50%] rounded-full blur-[130px] opacity-22"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
        <div className="absolute bottom-[10%] left-[-5%] w-[35%] h-[40%] rounded-full blur-[100px] opacity-15"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
      </>
    ),
    feed: (
      <>
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-18"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
        <div className="absolute top-[40%] right-[-5%] w-[35%] h-[35%] rounded-full blur-[110px] opacity-15"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
        <div className="absolute bottom-[-5%] left-[20%] w-[40%] h-[30%] rounded-full blur-[100px] opacity-12"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
      </>
    ),
    vault: (
      <>
        <div className="absolute top-[-5%] left-[25%] w-[50%] h-[40%] rounded-full blur-[130px] opacity-20"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
        <div className="absolute bottom-[-15%] right-[10%] w-[35%] h-[45%] rounded-full blur-[100px] opacity-12"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
      </>
    ),
    timeline: (
      <>
        <div className="absolute top-[5%] left-[-5%] w-[30%] h-[70%] rounded-full blur-[120px] opacity-20"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-12"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
      </>
    ),
    cockpit: (
      <>
        <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[50%] rounded-full blur-[140px] opacity-20"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
        <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full blur-[130px] opacity-15"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
        <div className="absolute top-[20%] left-[30%] w-[40%] h-[25%] rounded-full blur-[100px] opacity-10"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
      </>
    ),
    account: (
      <>
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full blur-[150px] opacity-15"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
        <div className="absolute bottom-[-15%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
      </>
    ),
    default: (
      <>
        <div className="absolute top-[-10%] left-[-5%] w-[55%] h-[55%] rounded-full blur-[140px] opacity-25"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] opacity-20"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
      </>
    ),
  };

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {configs[variant] ?? configs.default}
    </div>
  );
}

/**
 * Canonical per-route theme palette. Single source of truth so Sidebar,
 * BottomNav, and PageHero stay in sync.
 */
export const ROUTE_THEMES = {
  templates: { accent: "from-cyan-400 to-blue-600",        glow: "rgba(6,182,212,0.45)"  },
  create:    { accent: "from-violet-500 to-fuchsia-600",   glow: "rgba(139,92,246,0.45)" },
  analyze:   { accent: "from-pink-500 to-fuchsia-600",     glow: "rgba(236,72,153,0.45)" },
  gallery:   { accent: "from-emerald-400 to-teal-600",     glow: "rgba(16,185,129,0.45)" },
  saved:     { accent: "from-amber-400 to-orange-600",     glow: "rgba(245,158,11,0.45)" },
  history:   { accent: "from-indigo-400 to-violet-600",    glow: "rgba(99,102,241,0.45)" },
  stats:     { accent: "from-cyan-400 to-emerald-500",     glow: "rgba(16,185,129,0.40)" },
  profile:   { accent: "from-rose-400 to-pink-600",        glow: "rgba(244,63,94,0.45)"  },
  settings:  { accent: "from-slate-400 to-zinc-500",       glow: "rgba(148,163,184,0.35)"},
  sceneDecoder: { accent: "from-sky-400 to-violet-600",    glow: "rgba(56,189,248,0.45)" },
} as const;
