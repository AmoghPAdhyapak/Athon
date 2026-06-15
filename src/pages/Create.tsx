import { useState, useCallback, useEffect } from "react";
import { useLocalState } from "@/hooks/use-persistent-state";
import { GenerationPhases } from "@/components/ui/GenerationPhases";
import { StudioLayout } from "@/components/layout/WorkspaceLayouts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useSessionRecovery } from "@/lib/sessionRecovery";
import { CATEGORIES, GENERATION_TYPES } from "@/lib/constants";

const PENDING_KEY = "creatorcore_pending_template";
const SCENE_PROMPT_KEY = "creatorcore_scene_prompt";
type PendingTemplate = { category?: string; type?: string; topic?: string; name?: string };

function readPending(): PendingTemplate | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingTemplate;
    return parsed;
  } catch { return null; }
}
import { getListHistoryQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Copy, Share2, BookmarkPlus, CheckCircle2, RefreshCw, X, Flame, Music, Hash, MessageCircle, Megaphone, Type, Palette, Quote, HelpCircle, AlignLeft, GalleryHorizontalEnd, Image as ImageIcon, UserRound, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSaveCaption, getListSavedCaptionsQueryKey } from "@workspace/api-client-react";
import { PageHero, RouteAmbient, ROUTE_THEMES } from "@/components/layout/PageHero";

type StreamItem = { kind: "caption" | "title" | "hashtag" | "bio"; text: string };

interface LiveResult {
  captions: string[];
  titles: string[];
  hashtags: string[];
  bio: string | null;
  category: string;
  topic: string;
}

type CatColors = { gradient: string; glow: string; border: string; badge: string };

// Per-category color palettes
const CATEGORY_COLORS: Record<string, CatColors> = {
  gaming:     { gradient: "from-violet-600 to-purple-700",  glow: "rgba(124,58,237,0.4)",   border: "border-violet-500/60",  badge: "bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/30" },
  anime:      { gradient: "from-pink-500 to-rose-600",      glow: "rgba(236,72,153,0.4)",   border: "border-pink-500/60",    badge: "bg-pink-500/20 text-pink-600 dark:text-pink-300 border-pink-500/30" },
  attitude:   { gradient: "from-orange-500 to-amber-600",   glow: "rgba(245,158,11,0.4)",   border: "border-orange-500/60",  badge: "bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/30" },
  motivation: { gradient: "from-cyan-500 to-blue-600",      glow: "rgba(6,182,212,0.4)",    border: "border-cyan-500/60",    badge: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/30" },
  sad:        { gradient: "from-blue-500 to-indigo-700",    glow: "rgba(99,102,241,0.4)",   border: "border-blue-500/60",    badge: "bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30" },
  funny:      { gradient: "from-yellow-400 to-lime-500",    glow: "rgba(163,230,53,0.4)",   border: "border-yellow-400/60",  badge: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 border-yellow-500/30" },
  romantic:   { gradient: "from-rose-500 to-red-600",       glow: "rgba(244,63,94,0.4)",    border: "border-rose-500/60",    badge: "bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  "free-fire":{ gradient: "from-red-600 to-orange-600",     glow: "rgba(234,88,12,0.4)",    border: "border-red-500/60",     badge: "bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/30" },
  cinematic:  { gradient: "from-slate-400 to-indigo-500",   glow: "rgba(99,102,241,0.35)",  border: "border-indigo-400/60",  badge: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30" },
  youtube:    { gradient: "from-red-500 to-rose-600",       glow: "rgba(239,68,68,0.4)",    border: "border-red-500/60",     badge: "bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/30" },
};

// Platform Subtype Intelligence — choosing a platform reveals its content
// subtypes; the backend adapts tone/pacing per channel. "Any" keeps the
// original platform-agnostic behavior (nothing sent).
const ANY_PLATFORM = "Any";
const PLATFORM_SUBTYPES: Record<string, string[]> = {
  Instagram: ["Reel", "Story", "Post", "Carousel"],
  YouTube: ["Long Video", "Shorts", "Community Post"],
  TikTok: ["Viral Clip", "Story Style", "Trend Hook"],
  Facebook: ["Post", "Story", "Reel"],
};
const PLATFORM_OPTIONS = [ANY_PLATFORM, ...Object.keys(PLATFORM_SUBTYPES)];

// Instagram Creator Intelligence — Instagram creators don't think in one
// generic mode. Once Instagram + a content type is chosen, two more adaptive
// layers progressively appear: a visual STYLE register and an engagement
// INTENT. Both are optional and only surfaced for Instagram; the backend
// threads whatever is selected into the Gemini prompt.
const INSTAGRAM_PLATFORM = "Instagram";
const INSTAGRAM_STYLES = ["Cinematic", "Aesthetic", "Dark", "Viral", "Sigma", "Glow", "Luxury"];
const INSTAGRAM_INTENTS = ["Engagement", "Motivation", "Emotional", "Meme", "Promotion", "Trend"];

// Instagram Category Intelligence — when Instagram + a content subtype is
// chosen, the "Select Category" picker swaps its generic vibe categories for
// subtype-specific creator categories. The selected label is threaded into the
// Gemini prompt (backend INSTAGRAM_CATEGORY_GUIDANCE). Carousel reuses the Post
// set since it shares the same feed-caption workflow.
type IgCategory = { id: string; label: string; icon: LucideIcon };
const IG_POST_CATEGORIES: IgCategory[] = [
  { id: "feed-caption", label: "Feed Caption", icon: AlignLeft },
  { id: "carousel-caption", label: "Carousel Caption", icon: GalleryHorizontalEnd },
  { id: "aesthetic-post", label: "Aesthetic Post", icon: ImageIcon },
  { id: "personal-branding", label: "Personal Branding", icon: UserRound },
  { id: "engagement-post", label: "Engagement Post", icon: Heart },
];
const INSTAGRAM_CATEGORIES: Record<string, IgCategory[]> = {
  Reel: [
    { id: "viral-reel", label: "Viral Reel", icon: Flame },
    { id: "trending-audio", label: "Trending Audio", icon: Music },
    { id: "hook-caption", label: "Hook Caption", icon: Sparkles },
    { id: "reel-hashtags", label: "Reel Hashtags", icon: Hash },
    { id: "engagement-caption", label: "Engagement Caption", icon: MessageCircle },
    { id: "short-form-cta", label: "Short-form CTA", icon: Megaphone },
  ],
  Story: [
    { id: "story-caption", label: "Story Caption", icon: Type },
    { id: "aesthetic-story-text", label: "Aesthetic Story Text", icon: Palette },
    { id: "mood-quote", label: "Mood Quote", icon: Quote },
    { id: "poll-question-hook", label: "Poll/Question Hook", icon: HelpCircle },
    { id: "story-hashtags", label: "Story Hashtags", icon: Hash },
  ],
  Post: IG_POST_CATEGORIES,
  Carousel: IG_POST_CATEGORIES,
};

// Single on-brand violet/fuchsia palette for the adaptive Instagram cards —
// keeps the exact card design, just a unified Instagram accent.
const IG_CARD_COLOR: CatColors = {
  gradient: "from-violet-600 to-fuchsia-600",
  glow: "rgba(168,85,247,0.4)",
  border: "border-violet-500/60",
  badge: "bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/30",
};

// Per-type colors for result sections
const TYPE_COLORS: Record<string, { accent: string; bar: string }> = {
  captions: { accent: "text-violet-600 dark:text-violet-400", bar: "bg-gradient-to-r from-violet-500 to-fuchsia-500" },
  titles:   { accent: "text-cyan-600 dark:text-cyan-400",   bar: "bg-gradient-to-r from-cyan-500 to-blue-500" },
  hashtags: { accent: "text-pink-600 dark:text-pink-400",   bar: "bg-gradient-to-r from-pink-500 to-rose-500" },
  bio:      { accent: "text-amber-600 dark:text-amber-400",  bar: "bg-gradient-to-r from-amber-500 to-orange-500" },
};

export default function Create() {
  const initial = readPending();
  const validCategory = (id?: string) => CATEGORIES.find((c) => c.id === id)?.id;
  const validType = (id?: string) => GENERATION_TYPES.find((t) => t.id === id)?.id;

  // Inputs persist across refresh/navigation via existing localStorage hook.
  const [category, setCategory] = useLocalState<string>("create:category", CATEGORIES[0].id);
  const [type, setType] = useLocalState<string>("create:type", GENERATION_TYPES[0].id);
  const [topic, setTopic] = useLocalState<string>("create:topic", "");
  const [platform, setPlatform] = useLocalState<string>("create:platform", ANY_PLATFORM);
  const [subtype, setSubtype] = useLocalState<string>("create:subtype", "");
  const [style, setStyle] = useLocalState<string>("create:style", "");
  const [intent, setIntent] = useLocalState<string>("create:intent", "");
  const [igCategory, setIgCategory] = useLocalState<string>("create:igCategory", "");
  const [pendingName, setPendingName] = useState<string | null>(initial?.name ?? null);

  // Keep subtype consistent with the chosen platform (reset when it no longer applies).
  useEffect(() => {
    if (platform === ANY_PLATFORM) {
      if (subtype !== "") setSubtype("");
      return;
    }
    const options = PLATFORM_SUBTYPES[platform] ?? [];
    if (!options.includes(subtype)) setSubtype(options[0] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  // The Style + Intent layers are Instagram-only — clear them whenever the
  // creator leaves Instagram so stale context is never threaded into a prompt.
  useEffect(() => {
    if (platform !== INSTAGRAM_PLATFORM) {
      if (style !== "") setStyle("");
      if (intent !== "") setIntent("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  // The adaptive Instagram category is Instagram-only and subtype-scoped. Keep
  // it valid: clear it when not on Instagram; default to the first category and
  // re-validate whenever the subtype changes so the picker never shows a stale
  // selection from a different content type.
  useEffect(() => {
    if (platform !== INSTAGRAM_PLATFORM || !subtype) {
      if (igCategory !== "") setIgCategory("");
      return;
    }
    const list = INSTAGRAM_CATEGORIES[subtype] ?? [];
    if (!list.some((c) => c.id === igCategory)) setIgCategory(list[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, subtype]);

  // Scene Decoder handoff (one-shot): a creator-ready prompt sent from the
  // Scene Decoder prefills the topic so they can generate immediately.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scenePrompt = sessionStorage.getItem(SCENE_PROMPT_KEY);
    if (scenePrompt) {
      setTopic(scenePrompt.slice(0, 200));
      setPendingName("Scene Decoder prompt");
      sessionStorage.removeItem(SCENE_PROMPT_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A pending template (one-shot) overrides any persisted inputs on mount.
  useEffect(() => {
    if (!initial) return;
    const c = validCategory(initial.category);
    const t = validType(initial.type);
    if (c) setCategory(c);
    if (t) setType(t);
    if (initial.topic) setTopic(initial.topic);
    if (typeof window !== "undefined") sessionStorage.removeItem(PENDING_KEY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [result, setResult] = useState<LiveResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const recoverSession = useSessionRecovery();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const catColors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.gaming;

  const runGenerate = useCallback(async () => {
    if (!topic.trim()) {
      toast({ variant: "destructive", title: "Topic Required", description: "Please enter a topic before generating." });
      return;
    }

    setIsGenerating(true);

    // In Instagram mode the subtype-specific Instagram category REPLACES the
    // generic vibe category. Send a neutral base category (never the hidden
    // generic selection) so neither the prompt nor the saved history record
    // leaks a stale vibe like "romantic" when the user picked e.g. "Viral Reel".
    const igActive = platform === INSTAGRAM_PLATFORM && !!subtype && !!igCategory;
    const igLabel = igActive
      ? (INSTAGRAM_CATEGORIES[subtype] ?? []).find((c) => c.id === igCategory)?.label
      : undefined;
    const baseCategory = igActive && igLabel ? "social media" : category;

    setResult({ captions: [], titles: [], hashtags: [], bio: null, category: baseCategory, topic });

    try {
      const usePlatform = platform !== ANY_PLATFORM && subtype;
      const useInstagramContext = platform === INSTAGRAM_PLATFORM;
      const body: Record<string, string> = { category: baseCategory, topic, type };
      if (usePlatform) {
        body.platform = platform;
        body.subtype = subtype;
      }
      if (useInstagramContext && style) body.style = style;
      if (useInstagramContext && intent) body.intent = intent;
      if (igActive && igLabel) body.instagramCategory = igLabel;
      const response = await fetch("/api/captions/generate-stream", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        toast({ variant: "destructive", title: "Session expired", description: "Please sign in again to continue." });
        setResult(null);
        await recoverSession();
        return;
      }
      if (!response.ok || !response.body) throw new Error("Stream request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "item") {
              const { kind, text } = event as StreamItem & { type: string };
              setResult((prev) => {
                if (!prev) return prev;
                switch (kind) {
                  case "caption": return { ...prev, captions: [...prev.captions, text] };
                  case "title":   return { ...prev, titles:   [...prev.titles,   text] };
                  case "hashtag": return { ...prev, hashtags: [...prev.hashtags, text] };
                  case "bio":     return { ...prev, bio: text };
                  default:        return prev;
                }
              });
            } else if (event.type === "done") {
              queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
              queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
            } else if (event.type === "error") {
              throw new Error(event.error ?? "Generation failed");
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      toast({ variant: "destructive", title: "Generation Failed", description: "Something went wrong. Please try again." });
      setResult(null);
    } finally {
      setIsGenerating(false);
    }
  }, [category, topic, type, platform, subtype, style, intent, igCategory, queryClient, toast, recoverSession]);

  const handleGenerate = () => { setResult(null); runGenerate(); };
  const handleGenerateMore = () => { runGenerate(); };

  const hasAnyResults = !!(result && (result.captions.length > 0 || result.titles.length > 0 || result.hashtags.length > 0 || result.bio));

  /* ------------------------------- Mobile flow ------------------------------- */
  if (isMobile) {
    return (
      <div className="px-4 py-5 pb-36 space-y-5">
        <RouteAmbient variant="studio" glow={ROUTE_THEMES.create.glow} />

        {/* Compact header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-foreground/10 bg-foreground/[0.03] text-[10px] font-mono uppercase tracking-widest text-foreground/70">
            <Sparkles className="w-3 h-3" /> Caption Studio
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 dark:from-violet-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">
            Create
          </h1>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Pick a vibe, set your topic, then generate captions, titles, hashtags or a bio.
          </p>
        </div>

        {pendingName && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-semibold text-violet-600 dark:text-violet-200">
            <Sparkles className="w-3 h-3" />
            <span>Template: <span className="text-foreground">{pendingName}</span></span>
            <button onClick={() => setPendingName(null)} className="ml-1 text-violet-600/70 dark:text-violet-300/70" aria-label="Clear template">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <CreateControls
          category={category} setCategory={setCategory}
          type={type} setType={setType}
          topic={topic} setTopic={setTopic}
          platform={platform} setPlatform={setPlatform}
          subtype={subtype} setSubtype={setSubtype}
          style={style} setStyle={setStyle}
          intent={intent} setIntent={setIntent}
          igCategory={igCategory} setIgCategory={setIgCategory}
          catColors={catColors}
        />

        {/* Sticky action bar (sits above the bottom nav) */}
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-30 px-4 py-3 bg-background/90 backdrop-blur-xl border-t border-border flex items-center gap-2">
          {hasAnyResults && !sheetOpen && (
            <button
              onClick={() => setSheetOpen(true)}
              className="shrink-0 px-4 py-3.5 rounded-xl text-sm font-bold border border-foreground/15 bg-foreground/[0.04] text-foreground active:bg-foreground/[0.08]"
            >
              Results
            </button>
          )}
          <GenerateButton
            onClick={() => { handleGenerate(); setSheetOpen(true); }}
            isGenerating={isGenerating}
            className="flex-1 py-3.5 text-base"
          />
        </div>

        {/* Fullscreen results sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="h-[90dvh] p-0 border-t border-border bg-background flex flex-col gap-0">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <SheetTitle className="text-sm font-bold">Generated results</SheetTitle>
            </div>
            <div className="flex-1 overflow-hidden">
              <CreateResults
                result={result}
                isGenerating={isGenerating}
                hasAnyResults={hasAnyResults}
                catColors={catColors}
                onGenerateMore={handleGenerateMore}
                className="h-full rounded-none"
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  /* ------------------------------ Desktop split ------------------------------ */
  return (
    <StudioLayout>
      <PageHero
        ambientVariant="studio"
        eyebrow="Caption Studio"
        title="Create"
        subtitle="Edit the template or write your own topic, then generate captions, titles, hashtags, or a bio."
        icon={Sparkles}
        accent={ROUTE_THEMES.create.accent}
        glow={ROUTE_THEMES.create.glow}
        actions={pendingName ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-semibold text-violet-600 dark:text-violet-200">
            <Sparkles className="w-3 h-3" />
            <span>Template loaded: <span className="text-foreground">{pendingName}</span></span>
            <button onClick={() => setPendingName(null)}
              className="ml-1 text-violet-600/70 dark:text-violet-300/70 hover:text-foreground">clear</button>
          </div>
        ) : undefined}
      />

      <div className="grid lg:grid-cols-[1fr,1fr] gap-8">
        <div className="space-y-7">
          <CreateControls
            category={category} setCategory={setCategory}
            type={type} setType={setType}
            topic={topic} setTopic={setTopic}
            platform={platform} setPlatform={setPlatform}
            subtype={subtype} setSubtype={setSubtype}
            style={style} setStyle={setStyle}
            intent={intent} setIntent={setIntent}
            igCategory={igCategory} setIgCategory={setIgCategory}
            catColors={catColors}
          />
          <GenerateButton onClick={handleGenerate} isGenerating={isGenerating} />
        </div>

        <CreateResults
          result={result}
          isGenerating={isGenerating}
          hasAnyResults={hasAnyResults}
          catColors={catColors}
          onGenerateMore={handleGenerateMore}
          className="rounded-2xl min-h-[420px]"
        />
      </div>
    </StudioLayout>
  );
}

/* ----------------------------- Shared controls ----------------------------- */

interface CreateControlsProps {
  category: string;
  setCategory: (id: string) => void;
  type: string;
  setType: (id: string) => void;
  topic: string;
  setTopic: (s: string) => void;
  platform: string;
  setPlatform: (s: string) => void;
  subtype: string;
  setSubtype: (s: string) => void;
  style: string;
  setStyle: (s: string) => void;
  intent: string;
  setIntent: (s: string) => void;
  igCategory: string;
  setIgCategory: (s: string) => void;
  catColors: CatColors;
}

function CreateControls({ category, setCategory, type, setType, topic, setTopic, platform, setPlatform, subtype, setSubtype, style, setStyle, intent, setIntent, igCategory, setIgCategory, catColors }: CreateControlsProps) {
  const subtypeOptions = platform === ANY_PLATFORM ? [] : PLATFORM_SUBTYPES[platform] ?? [];
  // Instagram-only adaptive layers reveal once a content type is chosen.
  const showInstagramLayers = platform === INSTAGRAM_PLATFORM && !!subtype;
  // The "Select Category" picker adapts: Instagram + subtype → subtype-specific
  // creator categories; otherwise the generic vibe categories. Same card design.
  const categoryCards: { id: string; label: string; icon: LucideIcon; colors: CatColors }[] = showInstagramLayers
    ? (INSTAGRAM_CATEGORIES[subtype] ?? []).map((c) => ({ id: c.id, label: c.label, icon: c.icon, colors: IG_CARD_COLOR }))
    : CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon, colors: CATEGORY_COLORS[c.id] ?? CATEGORY_COLORS.gaming }));
  const activeCategoryId = showInstagramLayers ? igCategory : category;
  const selectCategory = showInstagramLayers ? setIgCategory : setCategory;
  return (
    <div className="space-y-7">
      {/* Platform Subtype Intelligence */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Platform</h2>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Adapts tone</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((p) => {
            const isSelected = platform === p;
            return (
              <button
                key={p}
                data-testid={`button-platform-${p.toLowerCase()}`}
                onClick={() => setPlatform(p)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200",
                  isSelected
                    ? "text-white border-transparent shadow-md bg-gradient-to-r from-violet-500 to-fuchsia-600"
                    : "bg-card/60 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20",
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
        <AnimatePresence initial={false}>
          {subtypeOptions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-1">
                {subtypeOptions.map((s) => {
                  const isSelected = subtype === s;
                  return (
                    <button
                      key={s}
                      data-testid={`button-subtype-${s.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => setSubtype(s)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200",
                        isSelected
                          ? "text-violet-700 dark:text-violet-200 border-violet-500/50 bg-violet-500/15"
                          : "bg-card/40 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20",
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instagram Creator Intelligence — progressive Style + Intent layers */}
        <AnimatePresence initial={false}>
          {showInstagramLayers && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-4 rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] dark:bg-violet-500/[0.06] p-3.5">
                {/* Style Layer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300">Style</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Optional</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INSTAGRAM_STYLES.map((s) => {
                      const isSelected = style === s;
                      return (
                        <button
                          key={s}
                          data-testid={`button-style-${s.toLowerCase()}`}
                          onClick={() => setStyle(isSelected ? "" : s)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200",
                            isSelected
                              ? "text-white border-transparent shadow-md bg-gradient-to-r from-violet-500 to-fuchsia-600"
                              : "bg-card/40 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20",
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Intent Layer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-700 dark:text-fuchsia-300">Intent</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Optional</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INSTAGRAM_INTENTS.map((i) => {
                      const isSelected = intent === i;
                      return (
                        <button
                          key={i}
                          data-testid={`button-intent-${i.toLowerCase()}`}
                          onClick={() => setIntent(isSelected ? "" : i)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200",
                            isSelected
                              ? "text-white border-transparent shadow-md bg-gradient-to-r from-fuchsia-500 to-pink-600"
                              : "bg-card/40 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20",
                          )}
                        >
                          {i}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Category Picker — adapts to the chosen Instagram subtype when active */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Category</h2>
          {showInstagramLayers && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Instagram {subtype}</span>
          )}
        </div>
        <motion.div
          key={showInstagramLayers ? `ig-${subtype}` : "default"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
        >
          {categoryCards.map((c) => {
            const Icon = c.icon;
            const isSelected = activeCategoryId === c.id;
            const cc = c.colors;
            return (
              <button
                key={c.id}
                data-testid={`button-category-${c.id}`}
                onClick={() => selectCategory(c.id)}
                className={cn(
                  "relative flex items-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition-all duration-200 overflow-hidden group",
                  isSelected
                    ? `${cc.border} text-white`
                    : "bg-card/60 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                )}
                style={isSelected ? {
                  background: `linear-gradient(135deg, ${cc.glow.replace("0.4", "0.15")} 0%, transparent 100%)`,
                  boxShadow: `0 0 20px ${cc.glow.replace("0.4", "0.2")}, inset 0 0 0 1px ${cc.glow.replace("0.4", "0.3")}`,
                } : undefined}
              >
                {isSelected && (
                  <div
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full blur-xl pointer-events-none"
                    style={{ background: cc.glow }}
                  />
                )}
                <div className={cn(
                  "relative z-10 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                  isSelected ? `bg-gradient-to-br ${cc.gradient} shadow-md` : "bg-foreground/5 group-hover:bg-foreground/10"
                )}>
                  <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                </div>
                <span className="relative z-10">{c.label}</span>
              </button>
            );
          })}
        </motion.div>
      </section>

      {/* Type Picker */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Generation Type</h2>
        <div className="flex flex-wrap gap-2">
          {GENERATION_TYPES.map((t) => {
            const isSelected = type === t.id;
            const typeColor = TYPE_COLORS[t.id] ?? TYPE_COLORS.captions;
            return (
              <button
                key={t.id}
                data-testid={`button-type-${t.id}`}
                onClick={() => setType(t.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200",
                  isSelected
                    ? "text-white border-transparent shadow-md"
                    : "bg-card/60 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                )}
                style={isSelected ? {
                  background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                } : undefined}
              >
                <span className={cn(isSelected ? "text-white" : typeColor.accent)}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Topic Input */}
      <section className="space-y-3">
        <div className="flex justify-between items-end">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Topic</h2>
          <span className="text-xs text-muted-foreground font-mono">{topic.length}/200</span>
        </div>
        <textarea
          data-testid="input-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value.slice(0, 200))}
          placeholder="e.g., Epic 1v4 clutch in Valorant final round..."
          className="w-full h-32 bg-card/60 border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-transparent resize-none transition-all"
          style={{ boxShadow: topic ? `0 0 0 2px ${catColors.glow.replace("0.4", "0.5")}` : undefined }}
        />
      </section>
    </div>
  );
}

function GenerateButton({ onClick, isGenerating, className }: { onClick: () => void; isGenerating: boolean; className?: string }) {
  return (
    <button
      data-testid="button-generate"
      onClick={onClick}
      disabled={isGenerating}
      className={cn(
        "w-full py-4 rounded-xl font-black text-white text-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(263,90%,58%) 0%, hsl(328,100%,55%) 100%)`,
        boxShadow: isGenerating ? "none" : "0 0 30px rgba(139,92,246,0.5), 0 0 60px rgba(236,72,153,0.2)",
      }}
    >
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none" />
      {isGenerating ? (
        <span className="relative flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Generating...
        </span>
      ) : (
        <span className="relative flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" />
          Generate Magic
        </span>
      )}
    </button>
  );
}

/* ----------------------------- Shared results ----------------------------- */

interface CreateResultsProps {
  result: LiveResult | null;
  isGenerating: boolean;
  hasAnyResults: boolean;
  catColors: CatColors;
  onGenerateMore: () => void;
  className?: string;
}

function CreateResults({ result, isGenerating, hasAnyResults, catColors, onGenerateMore, className }: CreateResultsProps) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: "linear-gradient(135deg, hsl(244,12%,7%) 0%, hsl(244,15%,6%) 100%)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Top accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 z-10")}
        style={{ background: `linear-gradient(90deg, transparent, ${catColors.glow}, transparent)` }}
      />

      {/* Empty state */}
      {!result && !isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-violet-600 dark:text-violet-400/60" />
            </div>
            <div className="absolute inset-0 blur-2xl bg-violet-500/10 rounded-full" />
          </div>
          <p className="font-bold text-white/70 text-base">Awaiting your prompt</p>
          <p className="text-sm mt-2 max-w-[250px] leading-relaxed">Enter a topic and hit generate to see the AI magic happen here.</p>
        </div>
      )}

      {/* Initial spinner */}
      {isGenerating && !hasAnyResults && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-background/70 backdrop-blur-sm z-10">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            <div className="absolute inset-0 blur-xl bg-violet-500/20 rounded-full" />
          </div>
          <GenerationPhases
            phases={["Reading your topic", "Shaping ideas", "Writing variations", "Polishing wording"]}
            className="text-violet-600 dark:text-violet-400 font-mono text-sm"
          />
        </div>
      )}

      {/* Live results */}
      {result && (
        <div className="p-6 space-y-6 h-full overflow-y-auto custom-scrollbar">
          {isGenerating && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: catColors.glow }} />
              <span style={{ color: catColors.glow.replace("rgba(", "rgb(").replace(",0.4)", ")") }}>Streaming results...</span>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {result.captions.length > 0 && (
              <ResultSection key="captions" title="Captions" items={result.captions} category={result.category} type="captions" />
            )}
            {result.titles.length > 0 && (
              <ResultSection key="titles" title="Titles" items={result.titles} category={result.category} type="titles" />
            )}
            {result.hashtags.length > 0 && (
              <ResultSection key="hashtags" title="Hashtags" items={result.hashtags} category={result.category} type="hashtags" />
            )}
            {result.bio && (
              <ResultSection key="bio" title="Bio" items={[result.bio]} category={result.category} type="bio" />
            )}
          </AnimatePresence>

          {!isGenerating && hasAnyResults && (
            <motion.button
              data-testid="button-generate-more"
              onClick={onGenerateMore}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all group border"
              style={{
                borderColor: catColors.glow.replace("0.4", "0.3"),
                color: catColors.glow.replace("rgba(", "rgb(").replace(",0.4)", ")"),
                background: catColors.glow.replace("0.4", "0.08"),
              }}
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              Generate More
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, items, category, type }: { title: string; items: string[]; category: string; type: string }) {
  if (!items || items.length === 0) return null;
  const tc = TYPE_COLORS[type] ?? TYPE_COLORS.captions;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={cn("h-3 w-0.5 rounded-full", tc.bar)} />
        <h3 className={cn("text-sm font-bold uppercase tracking-wider", tc.accent)}>{title}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
      </div>
      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item, i) => (
            <ResultCard key={`${item.slice(0, 20)}-${i}`} text={item} category={category} type={type} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ResultCard({ text, category, type, index }: { text: string; category: string; type: string; index: number }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tc = TYPE_COLORS[type] ?? TYPE_COLORS.captions;

  const saveMutation = useSaveCaption({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSavedCaptionsQueryKey() });
        toast({ title: "Saved to collection" });
      },
    },
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { handleCopy(); }
    } else { handleCopy(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group relative rounded-xl p-4 transition-all duration-200 border border-white/[0.06] hover:border-white/[0.14]"
      style={{ background: "rgba(255,255,255,0.025)" }}
    >
      {/* Left accent bar */}
      <div className={cn("absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full opacity-60", tc.bar)} />

      <p className="text-white text-sm whitespace-pre-wrap leading-relaxed pr-10 pl-2">{text}</p>

      <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          data-testid={`button-copy-${index}`}
          className="p-1.5 bg-white/5 hover:bg-white/15 rounded-md text-muted-foreground hover:text-white transition-colors border border-white/10"
          title="Copy"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => saveMutation.mutate({ data: { text, category, type } })}
          disabled={saveMutation.isPending}
          data-testid={`button-save-${index}`}
          className="p-1.5 bg-white/5 hover:bg-violet-500/20 rounded-md text-muted-foreground hover:text-violet-600 dark:hover:text-violet-300 transition-colors border border-white/10"
          title="Save"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleShare}
          data-testid={`button-share-${index}`}
          className="p-1.5 bg-white/5 hover:bg-white/15 rounded-md text-muted-foreground hover:text-white transition-colors border border-white/10"
          title="Share"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
