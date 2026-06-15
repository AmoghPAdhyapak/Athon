import { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  Lock,
  ArrowRight,
  Hash,
  Type,
  FileText,
  User as UserIcon,
  Layers,
  X,
  TrendingUp,
} from "lucide-react";
import { Show } from "@clerk/react";
import { cn } from "@/lib/utils";
import { RouteAmbient, ROUTE_THEMES } from "@/components/layout/PageHero";
import { MarketplaceLayout } from "@/components/layout/WorkspaceLayouts";
import { useIsMobile } from "@/hooks/use-mobile";

const PENDING_KEY = "creatorcore_pending_template";

type GenType = "captions" | "titles" | "hashtags" | "bio" | "all";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  topic: string;
  type: GenType;
  variantLabel: string;
  trending?: boolean;
}

interface CategoryDef {
  id: string;
  label: string;
  gradient: string;
  glow: string;
  ring: string;
  badge: string;
  topics: string[];
}

const CATEGORY_DEFS: CategoryDef[] = [
  {
    id: "gaming",
    label: "Gaming",
    gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
    glow: "rgba(139,92,246,0.45)",
    ring: "ring-violet-500/40",
    badge: "bg-violet-500/15 text-violet-200 border-violet-500/30",
    topics: [
      "1v4 Clutch",
      "Headshot Montage",
      "Ranked Grind",
      "Squad Wipe",
      "No-Scope Snipe",
      "Comeback Win",
      "Trick Shot Reel",
      "Tournament Final",
      "Pro Player Edit",
      "Stream Highlight",
    ],
  },
  {
    id: "anime",
    label: "Anime",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    glow: "rgba(236,72,153,0.45)",
    ring: "ring-pink-500/40",
    badge: "bg-pink-500/15 text-pink-200 border-pink-500/30",
    topics: [
      "Gojo Domain",
      "Sukuna Ultimate",
      "Naruto vs Sasuke",
      "Levi vs Beast Titan",
      "Goku Ultra Instinct",
      "Itachi Genjutsu",
      "Zoro Three Sword",
      "Eren Founding Titan",
      "Madara War Arc",
      "Tanjiro Sun Breathing",
    ],
  },
  {
    id: "attitude",
    label: "Attitude",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    glow: "rgba(245,158,11,0.45)",
    ring: "ring-amber-500/40",
    badge: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    topics: [
      "Silent Winner",
      "Royal Aura",
      "Lone Wolf",
      "Don't Talk Just Deliver",
      "King Energy",
      "Boss Mindset",
      "Beast Mode",
      "Untouchable",
      "Mafia Vibe",
      "Self Made",
    ],
  },
  {
    id: "motivation",
    label: "Motivation",
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
    glow: "rgba(6,182,212,0.45)",
    ring: "ring-cyan-500/40",
    badge: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
    topics: [
      "Discipline Beats Talent",
      "5AM Grind",
      "Become Best Version",
      "Hustle in Silence",
      "Pain to Power",
      "Mindset Shift",
      "No Excuses",
      "Trust the Process",
      "Daily Discipline",
      "Comfort Kills Dreams",
    ],
  },
  {
    id: "sad",
    label: "Sad",
    gradient: "from-blue-500 via-indigo-600 to-slate-700",
    glow: "rgba(99,102,241,0.45)",
    ring: "ring-indigo-500/40",
    badge: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
    topics: [
      "Missing Someone",
      "Letting Go",
      "Late Night Thoughts",
      "Heartbreak Healing",
      "Rain Memories",
      "Empty Streets",
      "Goodbye Forever",
      "Quiet Tears",
      "Hidden Pain",
      "Final Goodbye",
    ],
  },
  {
    id: "funny",
    label: "Funny",
    gradient: "from-yellow-400 via-lime-500 to-emerald-500",
    glow: "rgba(163,230,53,0.45)",
    ring: "ring-lime-500/40",
    badge: "bg-lime-500/15 text-lime-200 border-lime-500/30",
    topics: [
      "POV Mondays",
      "Awkward Family",
      "Me at 3am",
      "Group Chat Energy",
      "Bestie Roast",
      "Diet Fail",
      "Hangover Recovery",
      "School Mode",
      "Office Meeting",
      "Pet Roast",
    ],
  },
  {
    id: "romantic",
    label: "Romantic",
    gradient: "from-rose-500 via-pink-500 to-red-600",
    glow: "rgba(244,63,94,0.45)",
    ring: "ring-rose-500/40",
    badge: "bg-rose-500/15 text-rose-200 border-rose-500/30",
    topics: [
      "Anniversary Post",
      "First Date",
      "Forever Frame",
      "Sunset Together",
      "Coffee Date",
      "Slow Dance",
      "Love Letter",
      "Stargazing",
      "Holding Hands",
      "Promise Ring",
    ],
  },
  {
    id: "free-fire",
    label: "Free Fire",
    gradient: "from-red-600 via-orange-600 to-amber-600",
    glow: "rgba(234,88,12,0.45)",
    ring: "ring-orange-500/40",
    badge: "bg-orange-500/15 text-orange-200 border-orange-500/30",
    topics: [
      "Booyah M1887",
      "Lone Wolf Victory",
      "Squad Wipe Bermuda",
      "Solo vs Squad",
      "Sniper One-Shot",
      "Tournament Win",
      "Rank Push",
      "Gloo Wall Master",
      "Grenade Kill",
      "AWM Headshot",
    ],
  },
  {
    id: "cinematic",
    label: "Cinematic",
    gradient: "from-slate-400 via-indigo-500 to-violet-600",
    glow: "rgba(99,102,241,0.4)",
    ring: "ring-indigo-400/40",
    badge: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
    topics: [
      "Late Night Ride",
      "Slow-Mo Coffee",
      "Sunset Rooftop",
      "Rain on Window",
      "Foggy Mountain",
      "Empty Subway",
      "Neon Tokyo",
      "Beach Sunrise",
      "Vintage Film",
      "Forest Mist",
    ],
  },
  {
    id: "youtube",
    label: "YouTube",
    gradient: "from-red-500 via-rose-600 to-pink-600",
    glow: "rgba(239,68,68,0.45)",
    ring: "ring-red-500/40",
    badge: "bg-red-500/15 text-red-200 border-red-500/30",
    topics: [
      "Tutorial That Works",
      "30-Day Challenge",
      "Reacting To",
      "Vs Comparison",
      "Day in My Life",
      "Behind the Scenes",
      "Tried for First Time",
      "Unboxing Surprise",
      "Top 10 List",
      "Honest Review",
    ],
  },
];

// Hand-curated, polished template set. Each entry is a real starting point a
// creator would actually use — not a generated permutation. `trending` surfaces
// it in the discovery rail. Keep this list tight (curation > volume).
function mk(
  category: string,
  topic: string,
  type: GenType,
  variantLabel: string,
  description: string,
  trending = false,
): Template {
  const cat = CATEGORY_DEFS.find((c) => c.id === category)!;
  return {
    id: `${category}-${type}-${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    name: `${topic} · ${variantLabel}`,
    description,
    category,
    categoryLabel: cat.label,
    topic,
    type,
    variantLabel,
    trending,
  };
}

const CURATED_TEMPLATES: Template[] = [
  // Gaming
  mk("gaming", "1v4 Clutch", "captions", "Caption Pack", "Scroll-stopping captions for that impossible 1v4 — built to make people rewatch the kill.", true),
  mk("gaming", "Ranked Grind", "titles", "YouTube Titles", "High-CTR titles for ranked grind videos that promise the climb and deliver the clicks."),
  mk("gaming", "Stream Highlight", "all", "Full Set", "Captions, titles, hashtags and a bio line — a full kit to repackage your best stream moment."),
  mk("gaming", "No-Scope Snipe", "hashtags", "Hashtag Bundle", "Algorithm-tuned hashtags to push your cleanest snipe clip onto more For You pages."),
  // Anime
  mk("anime", "Gojo Domain", "captions", "Caption Pack", "Domain-expansion energy in caption form — dramatic, quotable, made for edit drops.", true),
  mk("anime", "Anime Edit Drop", "titles", "YouTube Titles", "Titles that make anime edits unmissable — beat-synced hype without the clickbait cringe."),
  mk("anime", "Villain Arc", "bio", "Bio Line", "A one-line profile bio with full villain-arc composure. Cold, confident, on-brand."),
  // Attitude
  mk("attitude", "Silent Winner", "captions", "Caption Pack", "Low-volume, high-impact captions for the win you didn't announce. Let the result talk.", true),
  mk("attitude", "Boss Mindset", "bio", "Tagline", "A brand-grade tagline pack to anchor a boss-energy profile in a single line."),
  // Motivation
  mk("motivation", "5AM Discipline", "captions", "Caption Pack", "Captions that sell the grind without the cliché — discipline over motivation, every line."),
  mk("motivation", "Pain to Power", "captions", "Story Caption", "Story-drop captions that turn the low chapter into the origin story."),
  mk("motivation", "Trust the Process", "all", "Full Set", "A full kit — captions, titles, hashtags, bio — for the long-game creator narrative."),
  // Sad
  mk("sad", "Late Night Thoughts", "captions", "Caption Pack", "Quiet, honest captions for the 2AM post. Vulnerable without being heavy-handed."),
  mk("sad", "Letting Go", "captions", "Story Caption", "Closure captions for the goodbye post — soft, final, and deeply shareable."),
  // Funny
  mk("funny", "Me at 3AM", "captions", "Caption Pack", "Relatable chaos captions built for the screenshot-and-share crowd.", true),
  mk("funny", "Group Chat Energy", "captions", "Tweet Pack", "Punchy, tweet-length lines that read exactly like your unhinged group chat."),
  // Romantic
  mk("romantic", "Anniversary Frame", "captions", "Caption Pack", "Warm anniversary captions that feel personal, not pulled from a greeting card."),
  mk("romantic", "Sunset Together", "captions", "Story Caption", "Golden-hour couple captions made for the soft-launch carousel."),
  // Free Fire
  mk("free-fire", "Booyah Squad Wipe", "titles", "YouTube Titles", "Titles engineered for Booyah clips — hype, searchable, and built to climb FF gaming.", true),
  mk("free-fire", "Sniper One-Shot", "captions", "Caption Pack", "One-tap AWM energy in caption form. Short, lethal, repost-ready."),
  // Cinematic
  mk("cinematic", "Neon Tokyo Night", "captions", "Caption Pack", "Moody, film-grain captions for the neon-soaked night reel. Pure aesthetic.", true),
  mk("cinematic", "Rain on Window", "captions", "Story Caption", "Slow, atmospheric captions for the rainy-day b-roll that hits different."),
  mk("cinematic", "Golden Hour Rooftop", "all", "Full Set", "A complete kit for the golden-hour rooftop edit — caption, title, tags, bio."),
  // YouTube
  mk("youtube", "Tutorial That Ranks", "titles", "YouTube Titles", "Search-aware tutorial titles that win the click and the algorithm at once.", true),
  mk("youtube", "30-Day Challenge", "titles", "YouTube Titles", "Challenge-format titles built around transformation and watch-time retention."),
  mk("youtube", "Honest Review", "captions", "Reel Hook", "First-3-second hooks for review content — earn trust before they swipe away."),
  mk("youtube", "Day in My Life", "all", "Full Set", "A full vlog kit: caption, title, hashtags and bio for the day-in-my-life format."),
];

const ALL_TEMPLATES: Template[] = CURATED_TEMPLATES;
const TRENDING_TEMPLATES: Template[] = CURATED_TEMPLATES.filter((t) => t.trending);
const CAT_MAP = new Map(CATEGORY_DEFS.map((c) => [c.id, c]));

const TYPE_ICON: Record<GenType, typeof Hash> = {
  captions: FileText,
  titles: Type,
  hashtags: Hash,
  bio: UserIcon,
  all: Layers,
};

const PAGE_SIZE = 36;

export default function Home() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [page, setPage] = useState(1);

  // reset pagination on filter / search change
  useEffect(() => { setPage(1); }, [query, activeCategory]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_TEMPLATES.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.topic.toLowerCase().includes(q) ||
        t.categoryLabel.toLowerCase().includes(q) ||
        t.variantLabel.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const handleUse = (t: Template) => {
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({
        category: t.category,
        type: t.type,
        topic: t.topic,
        name: t.name,
      }));
    } catch { /* ignore quota */ }
  };

  if (isMobile) {
    return (
      <TemplatesMobile
        query={query}
        setQuery={setQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        filtered={filtered}
        visible={visible}
        hasMore={hasMore}
        onLoadMore={() => setPage((p) => p + 1)}
        handleUse={handleUse}
        goCreate={() => setLocation("/create")}
      />
    );
  }

  return (
    <MarketplaceLayout>
      <RouteAmbient glow={ROUTE_THEMES.templates.glow} variant="marketplace" />
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-foreground/[0.06] bg-gradient-to-br from-violet-300/50 via-fuchsia-200/40 to-pink-300/50 dark:from-violet-950/40 dark:via-slate-950/60 dark:to-fuchsia-950/40 p-8 md:p-12">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-foreground/10 bg-foreground/[0.03] backdrop-blur text-xs font-mono uppercase tracking-widest text-foreground/70">
            <Sparkles className="w-3.5 h-3.5" /> {ALL_TEMPLATES.length} Curated Templates · Free Forever
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
              Pick a template.
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 dark:from-violet-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">
              Make it yours.
            </span>
          </h1>
          <p className="text-foreground/70 max-w-xl md:text-lg leading-relaxed">
            Hand-built starting points for captions, titles, hashtags and bios across gaming, anime, motivation, cinematic and more. Curated, not generated — use one as-is or edit every word.
          </p>
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 transition-shadow"
            >
              <Lock className="w-4 h-4" /> Sign in to create
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 transition-shadow"
            >
              Open blank editor <ArrowRight className="w-4 h-4" />
            </Link>
          </Show>
        </div>
      </section>

      {/* Search + category chips */}
      <section className="space-y-4 sticky top-0 z-20 -mx-4 px-4 py-3 backdrop-blur-xl bg-background/70 border-y border-foreground/[0.05]">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates — try “clutch”, “heartbreak”, “tutorial”…"
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-foreground/[0.04] border border-foreground/10 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-foreground/40 hover:text-foreground hover:bg-foreground/10"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <CategoryChip
            label="All"
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            gradient="from-foreground/20 to-foreground/10"
          />
          {CATEGORY_DEFS.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.label}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
              gradient={c.gradient}
            />
          ))}
        </div>
      </section>

      {/* Trending rail — only in the default (unfiltered) discovery view */}
      {activeCategory === "all" && !query.trim() && TRENDING_TEMPLATES.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/30">
              <TrendingUp className="w-4 h-4 text-white" />
            </span>
            <h2 className="text-xl font-black tracking-tight text-foreground">Trending now</h2>
            <span className="text-xs font-medium text-foreground/45">Most-used by creators this week</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory custom-scrollbar">
            {TRENDING_TEMPLATES.map((t, i) => (
              <div key={t.id} className="shrink-0 snap-start w-[300px]">
                <TemplateCard t={t} idx={i} onUse={handleUse} onUseNavigate={() => setLocation("/create")} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Results meta */}
      <div className="flex items-baseline justify-between text-sm">
        <p className="text-foreground/60">
          Showing <span className="text-foreground font-semibold">{visible.length.toLocaleString()}</span> of{" "}
          <span className="text-foreground font-semibold">{filtered.length.toLocaleString()}</span> templates
        </p>
        {(query || activeCategory !== "all") && (
          <button
            onClick={() => { setQuery(""); setActiveCategory("all"); }}
            className="text-violet-600 dark:text-violet-300 hover:text-foreground text-xs font-semibold"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="text-center py-20 text-foreground/50">
          <p className="text-lg font-semibold text-foreground/70">No templates match that search.</p>
          <p className="text-sm mt-2">Try a different keyword or pick another category.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((t, i) => (
            <TemplateCard key={t.id} t={t} idx={i} onUse={handleUse} onUseNavigate={() => setLocation("/create")} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2 pb-8">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-3 rounded-xl bg-foreground/[0.04] border border-foreground/10 hover:bg-foreground/[0.08] text-sm font-semibold text-foreground transition-colors"
          >
            Load {Math.min(PAGE_SIZE, filtered.length - visible.length)} more
          </button>
        </div>
      )}
    </MarketplaceLayout>
  );
}

function CategoryChip({
  label, active, onClick, gradient,
}: { label: string; active: boolean; onClick: () => void; gradient: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
        active
          ? `text-white border-transparent bg-gradient-to-r ${gradient} shadow-md`
          : "text-foreground/60 border-foreground/10 bg-foreground/[0.02] hover:text-foreground hover:bg-foreground/[0.06]"
      )}
    >
      {label}
    </button>
  );
}

// Deterministic high-quality stock image per template (picsum.photos seeded by id).
// Free CDN, no API key, served from any platform.
function templateImageUrl(id: string, w = 600, h = 340): string {
  return `https://picsum.photos/seed/cc-${id}/${w}/${h}`;
}

function TemplateCard({
  t, idx, onUse, onUseNavigate,
}: {
  t: Template;
  idx: number;
  onUse: (t: Template) => void;
  onUseNavigate: () => void;
}) {
  const cat = CAT_MAP.get(t.category)!;
  const Icon = TYPE_ICON[t.type];
  const imgUrl = templateImageUrl(t.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(idx, 12) * 0.015 }}
      className="group relative rounded-2xl border border-foreground/[0.06] bg-gradient-to-br from-foreground/[0.03] to-foreground/[0.01] overflow-hidden hover:border-foreground/20 transition-colors flex flex-col"
    >
      {/* Hover glow */}
      <div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"
        style={{ background: `radial-gradient(500px circle at 50% 0%, ${cat.glow}, transparent 50%)` }}
      />

      {/* Thumbnail preview */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
        <img
          src={imgUrl}
          alt={t.topic}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
        />
        {/* Category-tinted gradient wash */}
        <div
          className="absolute inset-0 mix-blend-overlay opacity-60"
          style={{ background: `linear-gradient(135deg, ${cat.glow.replace("0.45", "0.7").replace("0.4", "0.65").replace("0.35", "0.6")} 0%, transparent 60%)` }}
        />
        {/* Dark bottom-to-top fade for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* Top-left category badge */}
        <span className={cn(
          "absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur",
          cat.badge,
        )}>
          {cat.label}
        </span>

        {/* Top-right type icon */}
        <div className={cn(
          "absolute top-3 right-3 z-10 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br",
          cat.gradient,
        )}>
          <Icon className="w-4 h-4 text-white" />
        </div>

        {/* Topic title baked over image */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/70 mb-1">{t.variantLabel}</p>
          <h3 className="font-black text-lg leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-2">
            {t.topic}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 p-4 flex-1 flex flex-col gap-3">
        <p className="text-xs text-foreground/55 leading-relaxed line-clamp-2 flex-1">{t.description}</p>

        <div className="flex items-center justify-end">
          <Show when="signed-in">
            <button
              onClick={() => { onUse(t); onUseNavigate(); }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r shadow-sm hover:shadow-md transition-shadow w-full justify-center",
                cat.gradient,
              )}
            >
              Use template <ArrowRight className="w-3 h-3" />
            </button>
          </Show>
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-foreground/85 border border-foreground/15 bg-foreground/[0.03] hover:bg-foreground/[0.08] hover:text-foreground transition-colors w-full justify-center"
            >
              <Lock className="w-3 h-3" /> Sign in to use
            </Link>
          </Show>
        </div>
      </div>
    </motion.div>
  );
}

/* ----------------------------- Mobile (app-style) ----------------------------- */

interface TemplatesMobileProps {
  query: string;
  setQuery: (s: string) => void;
  activeCategory: string | "all";
  setActiveCategory: (s: string | "all") => void;
  filtered: Template[];
  visible: Template[];
  hasMore: boolean;
  onLoadMore: () => void;
  handleUse: (t: Template) => void;
  goCreate: () => void;
}

function TemplatesMobile({
  query,
  setQuery,
  activeCategory,
  setActiveCategory,
  filtered,
  visible,
  hasMore,
  onLoadMore,
  handleUse,
  goCreate,
}: TemplatesMobileProps) {
  const showFeed = activeCategory === "all" && !query.trim();

  return (
    <div className="px-4 py-4 space-y-5">
      <RouteAmbient glow={ROUTE_THEMES.templates.glow} variant="marketplace" />

      {/* Compact hero */}
      <section className="relative overflow-hidden rounded-2xl border border-foreground/[0.06] bg-gradient-to-br from-violet-300/50 via-fuchsia-200/40 to-pink-300/50 dark:from-violet-950/40 dark:via-slate-950/60 dark:to-fuchsia-950/40 p-5">
        <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
        <div className="relative space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-foreground/10 bg-foreground/[0.03] backdrop-blur text-[10px] font-mono uppercase tracking-widest text-foreground/70">
            <Sparkles className="w-3 h-3" /> {ALL_TEMPLATES.length} Curated Templates
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 dark:from-violet-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">
              Pick a template.
            </span>
          </h1>
          <p className="text-foreground/70 text-sm leading-relaxed">
            Tap a card to start. Swipe rows to explore each vibe.
          </p>
        </div>
      </section>

      {/* Sticky search + chips (sits just under the mobile top bar) */}
      <div className="sticky top-14 z-20 -mx-4 px-4 py-2.5 space-y-2.5 backdrop-blur-xl bg-background/80 border-b border-foreground/[0.05]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-foreground/[0.04] border border-foreground/10 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-foreground/40 active:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar -mx-4 px-4">
          <CategoryChip
            label="All"
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            gradient="from-foreground/20 to-foreground/10"
          />
          {CATEGORY_DEFS.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.label}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
              gradient={c.gradient}
            />
          ))}
        </div>
      </div>

      {showFeed ? (
        /* Discovery feed — one swipeable row per category */
        <div className="space-y-6">
          {TRENDING_TEMPLATES.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </span>
                <h2 className="text-base font-black text-foreground">Trending now</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 custom-scrollbar">
                {TRENDING_TEMPLATES.map((t) => (
                  <TemplateFeedCard key={t.id} t={t} onUse={handleUse} goCreate={goCreate} />
                ))}
              </div>
            </section>
          )}
          {CATEGORY_DEFS.map((c) => {
            const rowItems = ALL_TEMPLATES.filter((t) => t.category === c.id);
            if (rowItems.length === 0) return null;
            return (
              <section key={c.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full bg-gradient-to-br", c.gradient)} />
                    <h2 className="text-base font-black text-foreground">{c.label}</h2>
                  </div>
                  <button
                    onClick={() => setActiveCategory(c.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-300 active:opacity-70"
                  >
                    See all <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 custom-scrollbar">
                  {rowItems.map((t) => (
                    <TemplateFeedCard key={t.id} t={t} onUse={handleUse} goCreate={goCreate} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Filtered / searched — single-column stacked list */
        <div className="space-y-3">
          <p className="text-xs text-foreground/60">
            <span className="text-foreground font-semibold">{filtered.length.toLocaleString()}</span> results
          </p>
          {visible.length === 0 ? (
            <div className="text-center py-16 text-foreground/50">
              <p className="text-base font-semibold text-foreground/70">No templates match.</p>
              <p className="text-sm mt-1">Try another keyword or category.</p>
            </div>
          ) : (
            visible.map((t) => (
              <TemplateListRow key={t.id} t={t} onUse={handleUse} goCreate={goCreate} />
            ))
          )}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={onLoadMore}
                className="px-5 py-2.5 rounded-xl bg-foreground/[0.04] border border-foreground/10 active:bg-foreground/[0.08] text-sm font-semibold text-foreground"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateFeedCard({
  t,
  onUse,
  goCreate,
}: {
  t: Template;
  onUse: (t: Template) => void;
  goCreate: () => void;
}) {
  const cat = CAT_MAP.get(t.category)!;
  return (
    <div className="snap-start shrink-0 w-[240px] rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] overflow-hidden flex flex-col">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <img
          src={templateImageUrl(t.id, 480, 300)}
          alt={t.topic}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <span className={cn(
          "absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border backdrop-blur",
          cat.badge,
        )}>
          {cat.label}
        </span>
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-[9px] font-mono uppercase tracking-widest text-white/70">{t.variantLabel}</p>
          <h3 className="font-black text-sm leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-2">{t.topic}</h3>
        </div>
      </div>
      <div className="p-2.5">
        <Show when="signed-in">
          <button
            onClick={() => { onUse(t); goCreate(); }}
            className={cn("w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r", cat.gradient)}
          >
            Use <ArrowRight className="w-3 h-3" />
          </button>
        </Show>
        <Show when="signed-out">
          <Link
            href="/sign-in"
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-foreground/85 border border-foreground/15 bg-foreground/[0.03]"
          >
            <Lock className="w-3 h-3" /> Sign in
          </Link>
        </Show>
      </div>
    </div>
  );
}

function TemplateListRow({
  t,
  onUse,
  goCreate,
}: {
  t: Template;
  onUse: (t: Template) => void;
  goCreate: () => void;
}) {
  const cat = CAT_MAP.get(t.category)!;
  return (
    <div className="flex gap-3 rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] p-2.5">
      <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-900">
        <img
          src={templateImageUrl(t.id, 240, 240)}
          alt={t.topic}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className={cn(
          "absolute top-1.5 left-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border backdrop-blur",
          cat.badge,
        )}>
          {cat.label}
        </span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-1">{t.topic}</h3>
        <p className="text-[11px] text-foreground/55 leading-snug line-clamp-2 mt-0.5 flex-1">{t.description}</p>
        <div className="mt-1.5">
          <Show when="signed-in">
            <button
              onClick={() => { onUse(t); goCreate(); }}
              className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r", cat.gradient)}
            >
              Use template <ArrowRight className="w-3 h-3" />
            </button>
          </Show>
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-foreground/85 border border-foreground/15 bg-foreground/[0.03]"
            >
              <Lock className="w-3 h-3" /> Sign in to use
            </Link>
          </Show>
        </div>
      </div>
    </div>
  );
}
