import { useState, useCallback, useRef, useEffect } from "react";
import { useLocalState, base64ToFile, fileToPersistableBase64 } from "@/hooks/use-persistent-state";
import { GenerationPhases } from "@/components/ui/GenerationPhases";
import { useToast } from "@/hooks/use-toast";
import { useSessionRecovery } from "@/lib/sessionRecovery";
import { useQueryClient } from "@tanstack/react-query";
import { getGetStatsQueryKey, getListHistoryQueryKey, getListGeneratedImagesQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Image as ImageIcon, X, UploadCloud, Loader2, Copy, CheckCircle2,
  Lightbulb, Eye, Palette, Wand2, Download, Sparkles, Settings2, RotateCcw, Maximize2, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHero, RouteAmbient, ROUTE_THEMES } from "@/components/layout/PageHero";
import { LabLayout } from "@/components/layout/WorkspaceLayouts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type StreamItemKind = "thumbnail_text" | "hook" | "title" | "caption" | "hashtag" | "cta" | "layout_idea" | "color_palette" | "scene_analysis";

interface LiveResult {
  thumbnail_text: string[];
  hook: string[];
  title: string[];
  caption: string[];
  hashtag: string[];
  cta: string[];
  layout_idea: string[];
  color_palette: string[];
  scene_analysis: string[];
}

interface GeneratedImage {
  id: number;
  b64_json: string;
  mimeType: string;
}

const PLATFORMS = ["YouTube", "YouTube Shorts", "Instagram", "Reels", "TikTok", "Facebook", "X/Twitter"];
const MOODS = ["Rage", "Revenge", "Dark", "Emotional", "Heroic", "Funny", "Clutch", "Aggressive", "Cinematic"];
const STYLES = ["Anime Aura", "Esports", "Cinematic", "Neon", "Fire", "Dark Mode", "Hyper-realistic", "Action Movie"];

type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "21:9" | "2:3";

const ASPECT_RATIOS: { label: string; value: AspectRatio; css: string; desc: string }[] = [
  { label: "16:9", value: "16:9", css: "aspect-video", desc: "Landscape — YouTube, Facebook" },
  { label: "9:16", value: "9:16", css: "aspect-[9/16]", desc: "Portrait — Shorts, Reels, TikTok" },
  { label: "1:1", value: "1:1", css: "aspect-square", desc: "Square — Instagram" },
  { label: "4:5", value: "4:5", css: "aspect-[4/5]", desc: "Portrait — Instagram Feed" },
  { label: "21:9", value: "21:9", css: "aspect-[21/9]", desc: "Cinematic Ultra-wide" },
  { label: "2:3", value: "2:3", css: "aspect-[2/3]", desc: "Vertical — Pinterest" },
];

const PLATFORM_RATIO: Record<string, AspectRatio> = {
  "YouTube": "16:9",
  "YouTube Shorts": "9:16",
  "Instagram": "1:1",
  "Reels": "9:16",
  "TikTok": "9:16",
  "Facebook": "16:9",
  "X/Twitter": "16:9",
};

const COLOR_MAP: Record<string, string> = {
  red: "#ef4444", blue: "#3b82f6", green: "#22c55e", yellow: "#eab308",
  purple: "#a855f7", orange: "#f97316", pink: "#ec4899", cyan: "#06b6d4",
  teal: "#14b8a6", indigo: "#6366f1", lime: "#84cc16", emerald: "#10b981",
  fuchsia: "#d946ef", rose: "#f43f5e", black: "#000000", white: "#ffffff",
  gray: "#6b7280", grey: "#6b7280", dark: "#111827", light: "#f3f4f6",
  navy: "#312e81", slate: "#475569", zinc: "#52525b", neutral: "#525252",
  stone: "#57534e", gold: "#ca8a04", bronze: "#b45309", silver: "#a3a3a3",
};

function getColorHex(colorName: string): string {
  const normalized = colorName.toLowerCase().trim();
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (normalized.includes(key)) return value;
  }
  return normalized.startsWith("#") ? normalized : "#cbd5e1";
}

async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      // Keep high resolution — Gemini needs detail to generate quality output
      const maxW = 1536;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Use high quality — degraded input = degraded output
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      URL.revokeObjectURL(url);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = url;
  });
}

function ResultCard({ text, type, index }: { text: string; type: StreamItemKind; index: number }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };
  const isThumbnail = type === "thumbnail_text";
  const isHashtag = type === "hashtag";
  if (isHashtag) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.02 }}
        onClick={handleCopy}
        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
      >
        <span>{text}</span>
        {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-50" />}
      </motion.button>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn("group relative border rounded-xl p-4 transition-colors",
        isThumbnail ? "bg-black border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.15)]"
          : "bg-foreground/[0.04] border-border hover:border-primary/50")}
    >
      <p className={cn("whitespace-pre-wrap leading-relaxed pr-10",
        isThumbnail ? "text-2xl font-black uppercase text-white font-mono tracking-wide" : "text-foreground text-sm"
      )}>{text}</p>
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleCopy}
          className="p-1.5 bg-card hover:bg-foreground/10 border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
}

function InfoCard({ text, type, index }: { text: string; type: StreamItemKind; index: number }) {
  const Icon = type === "layout_idea" ? Lightbulb : type === "scene_analysis" ? Eye : Palette;
  const title = type === "layout_idea" ? "Layout Idea" : type === "scene_analysis" ? "Scene Analysis" : "Color Palette";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
      className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2 text-primary">
        <Icon className="w-4 h-4" />
        <h4 className="font-bold text-sm tracking-wide uppercase">{title}</h4>
      </div>
      {type === "color_palette" ? (
        <div className="flex flex-wrap gap-3 mt-2">
          {text.split(",").map(c => c.trim()).filter(Boolean).map((color, i) => (
            <div key={i} className="flex items-center gap-2 bg-foreground/[0.04] px-2 py-1.5 rounded-md border border-border">
              <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: getColorHex(color) }} />
              <span className="text-xs text-foreground/80">{color}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-foreground/90 text-sm mt-1 leading-relaxed">{text}</p>
      )}
    </motion.div>
  );
}

// Aspect ratio visual preview frame
function RatioFrame({ ratio, children, className }: { ratio: AspectRatio; children?: React.ReactNode; className?: string }) {
  const ratioMap: Record<AspectRatio, string> = {
    "16:9": "aspect-video",
    "9:16": "aspect-[9/16]",
    "1:1": "aspect-square",
    "4:5": "aspect-[4/5]",
    "21:9": "aspect-[21/9]",
    "2:3": "aspect-[2/3]",
  };
  return (
    <div className={cn(ratioMap[ratio], "w-full", className)}>
      {children}
    </div>
  );
}

type PersistedImage = { base64: string; mimeType: string; name: string } | null;

interface AnalyzeCtx {
  // image
  imageFile: File | null;
  imagePreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: () => void;
  // selectors
  platform: string; setPlatform: React.Dispatch<React.SetStateAction<string>>;
  mood: string; setMood: React.Dispatch<React.SetStateAction<string>>;
  style: string; setStyle: React.Dispatch<React.SetStateAction<string>>;
  game: string; setGame: React.Dispatch<React.SetStateAction<string>>;
  situation: string; setSituation: React.Dispatch<React.SetStateAction<string>>;
  extraPrompt: string; setExtraPrompt: React.Dispatch<React.SetStateAction<string>>;
  aspectRatio: AspectRatio; setAspectRatio: React.Dispatch<React.SetStateAction<AspectRatio>>;
  ratioLocked: boolean; setRatioLocked: React.Dispatch<React.SetStateAction<boolean>>;
  currentRatioInfo: (typeof ASPECT_RATIOS)[number];
  // settings
  showSettings: boolean; setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  // generation
  activeTab: "generate" | "analyze"; setActiveTab: React.Dispatch<React.SetStateAction<"generate" | "analyze">>;
  isAnalyzing: boolean; isGeneratingImage: boolean;
  result: LiveResult | null; hasAnyResults: boolean;
  generatedImage: GeneratedImage | null;
  generateError: string | null; setGenerateError: React.Dispatch<React.SetStateAction<string | null>>;
  handleAnalyze: () => void;
  handleGenerateImage: () => void;
  downloadImage: (img?: GeneratedImage) => void;
  imageLightbox: boolean; setImageLightbox: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Analyze() {
  // Persisted: uploaded image (as base64) so a refresh / minimize / tab switch keeps it.
  const [persistedImage, setPersistedImage] = useLocalState<PersistedImage>("analyze:image", null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Persisted: all form selections + generated result.
  const [platform, setPlatform] = useLocalState("analyze:platform", PLATFORMS[0]);
  const [mood, setMood] = useLocalState("analyze:mood", MOODS[0]);
  const [style, setStyle] = useLocalState("analyze:style", STYLES[0]);
  const [game, setGame] = useLocalState("analyze:game", "");
  const [situation, setSituation] = useLocalState("analyze:situation", "");
  const [extraPrompt, setExtraPrompt] = useLocalState("analyze:extraPrompt", "");
  const [aspectRatio, setAspectRatioRaw] = useLocalState<AspectRatio>("analyze:aspectRatio", "16:9");
  const VALID_RATIOS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "21:9", "2:3"];
  const setAspectRatio: typeof setAspectRatioRaw = (v) => {
    setAspectRatioRaw((prev) => {
      const next = typeof v === "function" ? (v as (p: AspectRatio) => AspectRatio)(prev) : v;
      return VALID_RATIOS.includes(next) ? next : "16:9";
    });
  };
  // Sanitize a corrupted persisted ratio on mount (one-time).
  useEffect(() => {
    if (!VALID_RATIOS.includes(aspectRatio)) setAspectRatioRaw("16:9");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [ratioLocked, setRatioLocked] = useLocalState("analyze:ratioLocked", false);
  const [activeTab, setActiveTab] = useLocalState<"generate" | "analyze">("analyze:tab", "generate");
  const [generatedImage, setGeneratedImage] = useLocalState<GeneratedImage | null>("analyze:lastGenerated", null);

  const [showSettings, setShowSettings] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [result, setResult] = useState<LiveResult | null>(null);
  const [imageLightbox, setImageLightbox] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [restoredNotice, setRestoredNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const recoverSession = useSessionRecovery();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Rehydrate the File + preview from persisted base64 on mount.
  useEffect(() => {
    let alive = true;
    let createdUrl: string | null = null;
    if (persistedImage && !imageFile) {
      base64ToFile(persistedImage.base64, persistedImage.mimeType, persistedImage.name).then((file) => {
        if (!alive) return;
        setImageFile(file);
        createdUrl = URL.createObjectURL(file);
        setImagePreview(createdUrl);
        setRestoredNotice(true);
        setTimeout(() => setRestoredNotice(false), 4000);
      }).catch(() => { /* ignore */ });
    }
    return () => {
      alive = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-update aspect ratio when platform changes (unless user locked it)
  useEffect(() => {
    if (!ratioLocked) {
      setAspectRatio(PLATFORM_RATIO[platform] ?? "16:9");
    }
  }, [platform, ratioLocked, setAspectRatio]);

  // When a new File is set, persist a downscaled JPEG base64 for cross-session recovery
  // (keeps payload under localStorage's ~5MB cap).
  const persistFile = useCallback(async (file: File) => {
    try {
      const encoded = await fileToPersistableBase64(file, 1600);
      setPersistedImage(encoded);
    } catch {
      // Quota or read error — non-fatal, persistence just won't work this round.
    }
  }, [setPersistedImage]);

  // Set image + preview, revoking any previous object URL to avoid memory leaks.
  const adoptImage = useCallback((file: File) => {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setImageFile(file);
    persistFile(file);
  }, [persistFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ variant: "destructive", title: "Invalid file", description: "Please select an image file." });
        return;
      }
      adoptImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      adoptImage(file);
    } else {
      toast({ variant: "destructive", title: "Invalid file", description: "Please drop an image file." });
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setGeneratedImage(null);
    setResult(null);
    setPersistedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      toast({ variant: "destructive", title: "Image Required", description: "Please upload an image to analyze." });
      return;
    }
    setIsAnalyzing(true);
    setResult({ thumbnail_text: [], hook: [], title: [], caption: [], hashtag: [], cta: [], layout_idea: [], color_palette: [], scene_analysis: [] });

    try {
      const { base64, mimeType } = await compressImage(imageFile);
      const response = await fetch("/api/analyze/generate-thumbnail", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType, platform, mood, style, situation, game, extraPrompt }),
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
              const { kind, text } = event as { type: string; kind: StreamItemKind; text: string };
              setResult(prev => prev ? { ...prev, [kind]: [...(prev[kind] || []), text] } : prev);
            } else if (event.type === "done") {
              queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
              queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
            } else if (event.type === "error") {
              throw new Error(event.error ?? "Analysis failed");
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      toast({ variant: "destructive", title: "Analysis Failed", description: "Something went wrong. Please try again." });
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateImage = useCallback(async () => {
    if (!imageFile) {
      toast({ variant: "destructive", title: "Image Required", description: "Please upload a source image first." });
      return;
    }
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setGenerateError(null);

    try {
      const { base64, mimeType } = await compressImage(imageFile);

      const response = await fetch("/api/analyze/generate-image", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64, mimeType, platform, mood, style,
          situation: situation || "creator thumbnail",
          game: game || "general content",
          extraPrompt,
          aspectRatio,
        }),
      });

      if (response.status === 401) {
        toast({ variant: "destructive", title: "Session expired", description: "Please sign in again to continue." });
        await recoverSession();
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Image generation failed");
      }

      const data = await response.json() as { id: number; b64_json: string; mimeType: string };
      setGeneratedImage({ id: data.id, b64_json: data.b64_json, mimeType: data.mimeType });
      queryClient.invalidateQueries({ queryKey: getListGeneratedImagesQueryKey() });
      toast({ title: "Thumbnail Generated", description: "Saved to your gallery." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setGenerateError(msg);
      toast({ variant: "destructive", title: "Generation Failed", description: msg });
    } finally {
      setIsGeneratingImage(false);
    }
  }, [imageFile, platform, mood, style, situation, game, extraPrompt, aspectRatio, toast, queryClient, setGeneratedImage, recoverSession]);

  const downloadImage = (img?: GeneratedImage) => {
    const target = img ?? generatedImage;
    if (!target) return;
    const link = document.createElement("a");
    link.href = `data:${target.mimeType};base64,${target.b64_json}`;
    link.download = `thumbnail-${style.toLowerCase().replace(/\s+/g, "-")}-${mood.toLowerCase()}-${aspectRatio.replace(":", "x")}.png`;
    link.click();
  };

  const hasAnyResults = !!(result && Object.values(result).some(arr => arr.length > 0));
  const currentRatioInfo = ASPECT_RATIOS.find(r => r.value === aspectRatio)!;

  const ctx: AnalyzeCtx = {
    imageFile, imagePreview, fileInputRef, handleDrop, handleFileChange, removeImage,
    platform, setPlatform, mood, setMood, style, setStyle, game, setGame,
    situation, setSituation, extraPrompt, setExtraPrompt,
    aspectRatio, setAspectRatio, ratioLocked, setRatioLocked, currentRatioInfo,
    showSettings, setShowSettings,
    activeTab, setActiveTab, isAnalyzing, isGeneratingImage,
    result, hasAnyResults, generatedImage, generateError, setGenerateError,
    handleAnalyze, handleGenerateImage, downloadImage, imageLightbox, setImageLightbox,
  };

  if (isMobile) return <AnalyzeMobile ctx={ctx} />;
  return <AnalyzeDesktop ctx={ctx} />;
}

/* ------------------------------ Desktop split ------------------------------ */

function AnalyzeDesktop({ ctx }: { ctx: AnalyzeCtx }) {
  const { showSettings, setShowSettings } = ctx;
  return (
    <LabLayout>
      <PageHero
        ambientVariant="lab"
        eyebrow="Image Studio"
        title="AI thumbnail lab"
        subtitle="Upload your image, set the vibe — AI generates a styled thumbnail or extracts viral content ideas."
        icon={Camera}
        accent={ROUTE_THEMES.analyze.accent}
        glow={ROUTE_THEMES.analyze.glow}
        actions={
          <button
            onClick={() => setShowSettings(s => !s)}
            className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
            showSettings ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
          )}
        >
            <Settings2 className="w-4 h-4" />
            Settings
          </button>
        }
      />

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && <SettingsPanel ctx={ctx} />}
      </AnimatePresence>

      <div className="grid lg:grid-cols-[1fr,1fr] gap-8">
        {/* Left: Inputs */}
        <div className="space-y-6">
          <UploadZone ctx={ctx} />
          <AnalyzeSelectors ctx={ctx} />
          <AnalyzeActions ctx={ctx} />
        </div>

        {/* Right: Results */}
        <AnalyzeResults ctx={ctx} />
      </div>

      <Lightbox ctx={ctx} />
    </LabLayout>
  );
}

/* ------------------------------- Mobile flow ------------------------------- */

function AnalyzeMobile({ ctx }: { ctx: AnalyzeCtx }) {
  const { showSettings, setShowSettings, generatedImage, hasAnyResults } = ctx;
  const [resultsOpen, setResultsOpen] = useState(false);
  const hasOutput = !!generatedImage || hasAnyResults;

  return (
    <div className="px-4 py-5 pb-36 space-y-5">
      <RouteAmbient variant="lab" glow={ROUTE_THEMES.analyze.glow} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-foreground/10 bg-foreground/[0.03] text-[10px] font-mono uppercase tracking-widest text-foreground/70">
            <Camera className="w-3 h-3" /> Image Studio
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 dark:from-pink-300 dark:via-fuchsia-300 dark:to-violet-300 bg-clip-text text-transparent">
            Thumbnail lab
          </h1>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className={cn(
            "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all",
            showSettings ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border text-muted-foreground",
          )}
        >
          <Settings2 className="w-3.5 h-3.5" /> Settings
        </button>
      </div>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && <SettingsPanel ctx={ctx} />}
      </AnimatePresence>

      {/* Upload always visible */}
      <UploadZone ctx={ctx} />

      {/* Collapsible details */}
      <Collapsible defaultOpen className="space-y-4">
        <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-sm font-bold text-foreground">
          <span className="uppercase tracking-wider text-xs text-muted-foreground">Style &amp; details</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-5 pt-1">
          <AnalyzeSelectors ctx={ctx} />
        </CollapsibleContent>
      </Collapsible>

      {/* Sticky action bar */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-30 px-4 py-3 bg-background/90 backdrop-blur-xl border-t border-border space-y-2">
        {hasOutput && !resultsOpen && (
          <button
            onClick={() => setResultsOpen(true)}
            className="w-full py-2.5 rounded-xl text-sm font-bold border border-primary/30 bg-primary/10 text-primary active:bg-primary/20"
          >
            View results
          </button>
        )}
        <AnalyzeActions ctx={ctx} afterAction={() => setResultsOpen(true)} />
      </div>

      {/* Results sheet */}
      <Sheet open={resultsOpen} onOpenChange={setResultsOpen}>
        <SheetContent side="bottom" className="h-[92dvh] p-0 border-t border-border bg-background flex flex-col gap-0">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <SheetTitle className="text-sm font-bold">Output</SheetTitle>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <AnalyzeResults ctx={ctx} />
          </div>
        </SheetContent>
      </Sheet>

      <Lightbox ctx={ctx} />
    </div>
  );
}

/* ------------------------------- Shared pieces ------------------------------ */

function SettingsPanel({ ctx }: { ctx: AnalyzeCtx }) {
  const { ratioLocked, setRatioLocked, aspectRatio, setAspectRatio, platform, currentRatioInfo } = ctx;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card border border-border rounded-2xl p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" />
          Output Settings
        </h3>
        {ratioLocked && (
          <button
            onClick={() => { setRatioLocked(false); setAspectRatio(PLATFORM_RATIO[platform] ?? "16:9"); }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset to platform default
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Aspect Ratio</h4>
          {ratioLocked && (
            <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">Manual Override</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ASPECT_RATIOS.map(r => (
            <button
              key={r.value}
              onClick={() => { setAspectRatio(r.value); setRatioLocked(r.value !== (PLATFORM_RATIO[platform] ?? "16:9")); }}
              className={cn(
                "group flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-xs font-medium transition-all",
                aspectRatio === r.value
                  ? "bg-primary text-white border-primary shadow-[0_0_12px_rgba(var(--primary),0.4)]"
                  : "bg-foreground/[0.04] border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
              title={r.desc}
            >
              {/* Visual ratio preview box */}
              <div className={cn(
                "border-2 rounded-sm transition-colors",
                aspectRatio === r.value ? "border-white/70" : "border-current opacity-60",
                r.value === "16:9" && "w-8 h-[18px]",
                r.value === "9:16" && "w-[18px] h-8",
                r.value === "1:1" && "w-5 h-5",
                r.value === "4:5" && "w-[18px] h-[22px]",
                r.value === "21:9" && "w-10 h-[17px]",
                r.value === "2:3" && "w-[18px] h-[27px]",
              )} />
              <span>{r.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{currentRatioInfo.desc}</p>
      </div>
    </motion.div>
  );
}

function UploadZone({ ctx }: { ctx: AnalyzeCtx }) {
  const { aspectRatio, ratioLocked, imagePreview, fileInputRef, handleDrop, handleFileChange, removeImage } = ctx;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Source Image</h2>
        <span className="text-xs text-muted-foreground/60 bg-card border border-border px-2 py-0.5 rounded-full">
          {aspectRatio} {ratioLocked ? "(manual)" : "(auto)"}
        </span>
      </div>
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !imagePreview && fileInputRef.current?.click()}
        className={cn(
          "relative w-full border-2 border-dashed rounded-xl transition-all overflow-hidden flex items-center justify-center",
          !imagePreview
            ? "border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 cursor-pointer min-h-[180px]"
            : "border-primary/30"
        )}
      >
        {/* Ratio-matching frame preview */}
        {!imagePreview && (
          <div className="absolute inset-4 border border-foreground/5 rounded-lg pointer-events-none flex items-center justify-center">
            <RatioFrame ratio={aspectRatio} className="max-w-[120px] max-h-[100px] border border-primary/20 rounded bg-primary/5 opacity-40" />
          </div>
        )}
        {imagePreview ? (
          <>
            <RatioFrame ratio={aspectRatio} className="w-full">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            </RatioFrame>
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={e => { e.stopPropagation(); removeImage(); }}
                className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 font-semibold backdrop-blur-sm"
              >
                <X className="w-4 h-4" /> Remove
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-10 text-center z-10">
            <div className="w-14 h-14 bg-card border border-border rounded-full flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-bold text-foreground mb-1">Drop your image here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" />
      </div>
    </section>
  );
}

function AnalyzeSelectors({ ctx }: { ctx: AnalyzeCtx }) {
  const { platform, setPlatform, mood, setMood, style, setStyle, game, setGame, situation, setSituation, extraPrompt, setExtraPrompt } = ctx;
  return (
    <>
      {/* Platform */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Platform</h2>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                platform === p
                  ? "bg-primary text-white border-primary shadow-[0_0_10px_rgba(var(--primary),0.4)]"
                  : "bg-card border-border text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Vibe &amp; Mood</h2>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <button key={m} onClick={() => setMood(m)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                mood === m
                  ? "bg-foreground text-background border-foreground shadow-md"
                  : "bg-card border-border text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Visual Style</h2>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <button key={s} onClick={() => setStyle(s)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                style === s
                  ? "bg-foreground text-background border-foreground shadow-md"
                  : "bg-card border-border text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Game / Context — mandatory */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Game / Context</h2>
        <input
          value={game}
          onChange={e => setGame(e.target.value)}
          placeholder="e.g. Free Fire, Minecraft, Valorant, anime edit..."
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      {/* Situation — mandatory */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Situation / Hook Angle</h2>
        <textarea
          value={situation}
          onChange={e => setSituation(e.target.value)}
          placeholder="e.g. 1v4 clutch revenge scene, last circle, 360 no-scope, final boss kill..."
          className="w-full h-20 bg-card border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
        />
      </div>

      {/* Extra Prompt */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Extra Prompt</h2>
          <span className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-full">AI Instructions</span>
        </div>
        <textarea
          value={extraPrompt}
          onChange={e => setExtraPrompt(e.target.value)}
          placeholder="e.g. add falling cherry blossoms, make it look like a movie poster, include lightning strike effect, add text 'GAMING BEAST' in bold..."
          className="w-full h-20 bg-card border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-all"
        />
        <p className="text-xs text-muted-foreground">Any specific visual effects, elements, or instructions you want in the generated image.</p>
      </div>
    </>
  );
}

function AnalyzeActions({ ctx, afterAction }: { ctx: AnalyzeCtx; afterAction?: () => void }) {
  const { setActiveTab, handleGenerateImage, handleAnalyze, isGeneratingImage, isAnalyzing, imageFile } = ctx;
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => { setActiveTab("generate"); handleGenerateImage(); afterAction?.(); }}
        disabled={isGeneratingImage || isAnalyzing || !imageFile}
        className="py-4 rounded-xl font-bold text-white text-base bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 hover:to-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] relative overflow-hidden group"
      >
        {isGeneratingImage ? (
          <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Generating...</span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Wand2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Generate Image
          </span>
        )}
      </button>
      <button
        onClick={() => { setActiveTab("analyze"); handleAnalyze(); afterAction?.(); }}
        disabled={isAnalyzing || isGeneratingImage || !imageFile}
        className="py-4 rounded-xl font-bold text-foreground text-base bg-card border border-border hover:border-primary/50 hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden group"
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Analyze Image
          </span>
        )}
      </button>
    </div>
  );
}

function AnalyzeResults({ ctx }: { ctx: AnalyzeCtx }) {
  const {
    generatedImage, hasAnyResults, activeTab, setActiveTab, isGeneratingImage, generateError,
    setGenerateError, handleGenerateImage, aspectRatio, ratioLocked, style, mood, platform,
    downloadImage, setImageLightbox, result, isAnalyzing,
  } = ctx;
  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      {(generatedImage || hasAnyResults) && (
        <div className="flex gap-2 bg-card border border-border rounded-xl p-1">
          <button
            onClick={() => setActiveTab("generate")}
            className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
              activeTab === "generate" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground")}
          >
            <Wand2 className="w-4 h-4" /> Generated Image
          </button>
          <button
            onClick={() => setActiveTab("analyze")}
            className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
              activeTab === "analyze" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground")}
          >
            <Sparkles className="w-4 h-4" /> Content Ideas
          </button>
        </div>
      )}

      {/* Generate Image Panel */}
      {activeTab === "generate" && (
        <div className="bg-card/50 border border-border/50 rounded-2xl p-6 relative overflow-hidden min-h-[400px] flex flex-col">
          {!generatedImage && !isGeneratingImage && !generateError && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-primary/20 border border-primary/20 flex items-center justify-center mb-4">
                <Wand2 className="w-10 h-10 text-primary/60" />
              </div>
              <p className="font-bold text-foreground/70 text-lg">AI Thumbnail Generator</p>
              <p className="text-sm mt-2 max-w-[280px] leading-relaxed">
                Upload your image, pick a style and mood, add your extra prompt — then hit Generate Image.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border px-3 py-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                Output ratio: <span className="text-foreground font-medium">{aspectRatio}</span>
                {ratioLocked && <span className="text-amber-400">(manual)</span>}
              </div>
            </div>
          )}

          {!isGeneratingImage && generateError && !generatedImage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <p className="font-bold text-red-500 dark:text-red-300 text-base mb-2">Generation Blocked</p>
              <p className="text-sm text-foreground/70 max-w-[360px] leading-relaxed mb-5">
                {generateError}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setGenerateError(null)}
                  className="px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-xs font-medium text-foreground hover:bg-foreground/10 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleGenerateImage()}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Try Again
                </button>
              </div>
            </motion.div>
          )}

          {isGeneratingImage && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <div className="absolute inset-0 blur-2xl bg-violet-500/20 rounded-full" />
              </div>
              <div className="text-center space-y-1">
                <GenerationPhases
                  phases={["Reading your image", "Composing the scene", "Painting the thumbnail", "Refining details"]}
                  className="text-violet-600 dark:text-violet-400 font-mono font-bold"
                />
                <p className="text-xs text-muted-foreground">{style} + {mood} — {aspectRatio} format</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${delay}s` }} />
                ))}
              </div>
            </div>
          )}

          {generatedImage && !isGeneratingImage && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-4 h-full">
              <button
                type="button"
                onClick={() => setImageLightbox(true)}
                className="relative rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.25)] group cursor-zoom-in block w-full"
                title="Click to view full size"
              >
                <RatioFrame ratio={aspectRatio}>
                  <img
                    src={`data:${generatedImage.mimeType};base64,${generatedImage.b64_json}`}
                    alt="AI generated thumbnail"
                    className="w-full h-full object-cover"
                  />
                </RatioFrame>
                {/* Always-visible "Click to view" hint */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 text-white text-[11px] font-bold bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 pointer-events-none">
                  <Maximize2 className="w-3 h-3" /> View full size
                </div>
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground/80">{style} + {mood}</p>
                  <p className="text-xs text-muted-foreground">{platform} — {aspectRatio} — saved to Gallery</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setImageLightbox(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-xs font-medium text-foreground hover:bg-foreground/10 transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => downloadImage()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white rounded-lg text-xs font-bold transition-all shadow-md">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button
                    onClick={() => { setActiveTab("generate"); handleGenerateImage(); }}
                    disabled={isGeneratingImage}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Regenerate
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Analysis Results Panel */}
      {activeTab === "analyze" && (
        <div className="bg-card/50 border border-border/50 rounded-2xl p-6 relative overflow-hidden min-h-[400px]">
          {!result && !isAnalyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-medium text-foreground/70">Awaiting your image</p>
              <p className="text-sm mt-2 max-w-[250px]">Upload an image and click Analyze Image to extract viral hooks and thumbnail ideas.</p>
            </div>
          )}
          {isAnalyzing && !hasAnyResults && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm z-10">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
              </div>
              <p className="text-primary font-mono animate-pulse">Running vision models...</p>
            </div>
          )}
          {result && (
            <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar max-h-[700px]">
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-xs text-primary font-mono bg-primary/10 w-max px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" /> Analyzing image...
                </div>
              )}
              <AnimatePresence mode="popLayout">
                {result.scene_analysis?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    {result.scene_analysis.map((item, i) => <InfoCard key={i} text={item} type="scene_analysis" index={i} />)}
                  </motion.div>
                )}
                {result.thumbnail_text?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">Thumbnail Text Ideas</h3>
                    <div className="space-y-3">{result.thumbnail_text.map((item, i) => <ResultCard key={i} text={item} type="thumbnail_text" index={i} />)}</div>
                  </motion.div>
                )}
                {result.layout_idea?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    {result.layout_idea.map((item, i) => <InfoCard key={i} text={item} type="layout_idea" index={i} />)}
                  </motion.div>
                )}
                {result.color_palette?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    {result.color_palette.map((item, i) => <InfoCard key={i} text={item} type="color_palette" index={i} />)}
                  </motion.div>
                )}
                {result.hook?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">Viral Hooks</h3>
                    <div className="space-y-3">{result.hook.map((item, i) => <ResultCard key={i} text={item} type="hook" index={i} />)}</div>
                  </motion.div>
                )}
                {result.title?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">Titles</h3>
                    <div className="space-y-3">{result.title.map((item, i) => <ResultCard key={i} text={item} type="title" index={i} />)}</div>
                  </motion.div>
                )}
                {result.caption?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">Captions</h3>
                    <div className="space-y-3">{result.caption.map((item, i) => <ResultCard key={i} text={item} type="caption" index={i} />)}</div>
                  </motion.div>
                )}
                {result.cta?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">Call to Actions</h3>
                    <div className="space-y-3">{result.cta.map((item, i) => <ResultCard key={i} text={item} type="cta" index={i} />)}</div>
                  </motion.div>
                )}
                {result.hashtag?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">Hashtags</h3>
                    <div className="flex flex-wrap gap-2">{result.hashtag.map((item, i) => <ResultCard key={i} text={item} type="hashtag" index={i} />)}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Lightbox({ ctx }: { ctx: AnalyzeCtx }) {
  const { imageLightbox, generatedImage, setImageLightbox, style, mood, platform, aspectRatio, downloadImage } = ctx;
  return (
    <AnimatePresence>
      {imageLightbox && generatedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          onClick={() => setImageLightbox(false)}
        >
          <button
            onClick={() => setImageLightbox(false)}
            className="absolute top-4 right-4 z-20 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="relative max-w-6xl w-full flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              <img
                src={`data:${generatedImage.mimeType};base64,${generatedImage.b64_json}`}
                alt="AI generated thumbnail"
                className="w-full h-auto object-contain max-h-[80vh]"
              />
            </div>
            <div className="bg-card/95 border border-border rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/25 uppercase tracking-wider">{style}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-300 border border-pink-500/25 uppercase tracking-wider">{mood}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 uppercase tracking-wider">{platform}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase tracking-wider">{aspectRatio}</span>
                </div>
                <p className="text-xs text-muted-foreground">Saved to Gallery — find all your generations there anytime.</p>
              </div>
              <button
                onClick={() => downloadImage()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
