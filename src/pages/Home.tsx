import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Show, useUser } from "@clerk/react";
import {
  Sparkles,
  LayoutGrid,
  Camera,
  Bookmark,
  Images,
  History as HistoryIcon,
  BarChart2,
  ArrowRight,
  PlayCircle,
  Flame,
  Compass,
} from "lucide-react";
import {
  useListHistory,
  useListSavedCaptions,
  useGetStats,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  href: string;
  label: string;
  description: string;
  icon: typeof Sparkles;
  gradient: string;
  glow: string;
  requiresAuth: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: "/templates",
    label: "Browse templates",
    description: "Cinematic starting points for any niche.",
    icon: LayoutGrid,
    gradient: "from-cyan-400 to-blue-600",
    glow: "rgba(6,182,212,0.4)",
    requiresAuth: false,
  },
  {
    href: "/create",
    label: "Generate captions",
    description: "Captions, titles, hashtags and bios in seconds.",
    icon: Sparkles,
    gradient: "from-violet-500 to-fuchsia-600",
    glow: "rgba(139,92,246,0.4)",
    requiresAuth: true,
  },
  {
    href: "/analyze",
    label: "Design a thumbnail",
    description: "AI image studio with aspect-ratio engine.",
    icon: Camera,
    gradient: "from-pink-500 to-fuchsia-600",
    glow: "rgba(217,70,239,0.4)",
    requiresAuth: true,
  },
];

const SECONDARY_LINKS: { href: string; label: string; icon: typeof Sparkles }[] = [
  { href: "/saved",   label: "Saved",   icon: Bookmark },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/stats",   label: "Stats",   icon: BarChart2 },
];

const TRENDING = [
  { id: "gaming",     label: "Gaming",     gradient: "from-violet-600 to-fuchsia-600", glow: "rgba(139,92,246,0.5)" },
  { id: "anime",      label: "Anime",      gradient: "from-pink-500 to-rose-500",      glow: "rgba(236,72,153,0.5)" },
  { id: "cinematic",  label: "Cinematic",  gradient: "from-slate-400 to-indigo-600",   glow: "rgba(99,102,241,0.5)" },
  { id: "motivation", label: "Motivation", gradient: "from-cyan-500 to-blue-600",      glow: "rgba(6,182,212,0.5)" },
  { id: "youtube",    label: "YouTube",    gradient: "from-red-500 to-pink-600",       glow: "rgba(239,68,68,0.5)" },
  { id: "free-fire",  label: "Free Fire",  gradient: "from-red-600 to-amber-600",      glow: "rgba(234,88,12,0.5)" },
];

export default function Home() {
  const { isSignedIn, user } = useUser();
  const firstName = user?.firstName ?? user?.username ?? null;
  const [now, setNow] = useState(() => new Date());

  // Tick the clock every minute so the greeting stays accurate.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 5) return "Late night creating";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 22) return "Good evening";
    return "Burning the midnight oil";
  }, [now]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-foreground/[0.06] bg-gradient-to-br from-violet-300/50 via-fuchsia-200/40 to-pink-300/50 dark:from-violet-950/40 dark:via-slate-950/60 dark:to-fuchsia-950/40 p-8 md:p-14">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-20 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-foreground/10 bg-foreground/[0.03] backdrop-blur text-xs font-mono uppercase tracking-widest text-foreground/70">
            <Compass className="w-3.5 h-3.5" /> AETHON · Home
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
              {greeting}{isSignedIn && firstName ? <>, <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 dark:from-violet-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">{firstName}</span></> : null}.
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 dark:from-violet-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">
              What are we making today?
            </span>
          </h1>
          <p className="text-foreground/70 max-w-xl md:text-lg leading-relaxed">
            Your cinematic creator workspace. Pick a starting point below or jump straight into a template.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 transition-shadow"
              >
                <PlayCircle className="w-4 h-4" /> Start creating — it's free
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 transition-shadow"
              >
                <Sparkles className="w-4 h-4" /> New caption
              </Link>
            </Show>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-foreground/15 bg-foreground/[0.04] text-foreground font-bold hover:bg-foreground/[0.08] transition-colors"
            >
              <LayoutGrid className="w-4 h-4" /> Browse templates
            </Link>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="space-y-4">
        <SectionHeader title="Jump in" icon={Sparkles} />
        <div className="grid gap-4 md:grid-cols-3">
          {QUICK_ACTIONS.map((a, i) => (
            <QuickActionCard key={a.href} action={a} idx={i} signedIn={!!isSignedIn} />
          ))}
        </div>
      </section>

      {/* Signed-in: live activity. Signed-out: trending categories. */}
      <Show when="signed-in">
        <SignedInActivity />
      </Show>

      <section className="space-y-4">
        <SectionHeader title="Trending categories" icon={Flame} />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {TRENDING.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                href="/templates"
                className={cn(
                  "block aspect-[4/5] rounded-2xl p-4 relative overflow-hidden bg-gradient-to-br border border-foreground/10 hover:border-foreground/30 transition-colors group",
                  c.gradient,
                )}
                style={{ boxShadow: `0 10px 30px -10px ${c.glow}` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/70">Explore</p>
                  <p className="font-black text-white text-lg leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">{c.label}</p>
                </div>
                <ArrowRight className="absolute top-3 right-3 w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Secondary nav strip */}
      <section className="space-y-4">
        <SectionHeader title="Your workspace" icon={Compass} />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {SECONDARY_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 p-4 rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] hover:bg-foreground/[0.05] hover:border-foreground/15 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-foreground/[0.05] flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                <Icon className="w-4 h-4 text-foreground/80" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">{label}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: typeof Sparkles }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-foreground/70" />
      <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/70">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-foreground/10 to-transparent" />
    </div>
  );
}

function QuickActionCard({ action, idx, signedIn }: { action: QuickAction; idx: number; signedIn: boolean }) {
  const { href, label, description, icon: Icon, gradient, glow, requiresAuth } = action;
  const goingToAuth = requiresAuth && !signedIn;
  const target = goingToAuth ? "/sign-in" : href;
  const Wrapper = Link;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.05 }}
    >
      <Wrapper
        href={target}
        className="block relative overflow-hidden rounded-2xl border border-foreground/[0.06] bg-gradient-to-br from-foreground/[0.04] to-foreground/[0.01] p-6 hover:border-foreground/20 transition-colors group"
      >
        <div
          className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ background: `radial-gradient(400px circle at 0% 0%, ${glow}, transparent 50%)` }}
        />
        <div className="relative space-y-4">
          <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", gradient)} style={{ boxShadow: `0 10px 30px -10px ${glow}` }}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-lg text-foreground">{label}</p>
            <p className="mt-1 text-sm text-foreground/55 leading-relaxed">{description}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/70 group-hover:text-foreground transition-colors">
            {goingToAuth ? "Sign in to use" : "Open"} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Wrapper>
    </motion.div>
  );
}

function SignedInActivity() {
  const { data: history } = useListHistory();
  const { data: saved } = useListSavedCaptions();
  const { data: stats } = useGetStats();

  const totalGenerated = stats?.totalGenerations ?? 0;
  const totalSaved = Array.isArray(saved) ? saved.length : 0;
  const lastGen = Array.isArray(history) && history.length > 0 ? history[0] : null;

  return (
    <section className="space-y-4">
      <SectionHeader title="Your activity" icon={Flame} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Total generations" value={totalGenerated.toLocaleString()} accent="from-violet-600 to-fuchsia-600 dark:from-violet-500 dark:to-fuchsia-500" glow="rgba(139,92,246,0.4)" />
        <StatTile label="Saved captions"   value={totalSaved.toLocaleString()}     accent="from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500"     glow="rgba(6,182,212,0.4)" />
        <Link href="/history" className="block rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] hover:bg-foreground/[0.05] hover:border-foreground/15 p-5 transition-colors group">
          <p className="text-xs uppercase tracking-widest font-bold text-foreground/50 mb-1">Last generation</p>
          {lastGen ? (
            <>
              <p className="font-black text-foreground text-lg line-clamp-1">{lastGen.topic ?? "Untitled"}</p>
              <p className="text-xs text-foreground/55 mt-1 capitalize">{lastGen.category} · {lastGen.type}</p>
            </>
          ) : (
            <p className="font-bold text-foreground/60">No generations yet — start in Create.</p>
          )}
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-foreground/70 group-hover:text-foreground">
            Open history <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>
    </section>
  );
}

function StatTile({ label, value, accent, glow }: { label: string; value: string; accent: string; glow: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] p-5">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 100% 0%, ${glow}, transparent 60%)` }} />
      <p className="relative text-xs uppercase tracking-widest font-bold text-foreground/50">{label}</p>
      <p className={cn("relative mt-2 text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r", accent)}>{value}</p>
    </div>
  );
}
