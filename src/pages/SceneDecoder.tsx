import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ScanEye,
  Upload,
  Loader2,
  Copy,
  CheckCircle2,
  Sparkles,
  ImageIcon,
  X,
  ArrowRight,
} from "lucide-react";
import { LabLayout } from "@/components/layout/WorkspaceLayouts";
import { PageHero, ROUTE_THEMES, RouteAmbient } from "@/components/layout/PageHero";
import { GenerationPhases } from "@/components/ui/GenerationPhases";
import { fileToPersistableBase64 } from "@/hooks/use-persistent-state";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useDecodeScene } from "@workspace/api-client-react";
import type { SceneDecodeResult } from "@workspace/api-client-react";

const SCENE_PROMPT_KEY = "creatorcore_scene_prompt";

type SceneUpload = { preview: string; base64: string; mimeType: string };

const BREAKDOWN_FIELDS: { key: keyof SceneDecodeResult; label: string }[] = [
  { key: "cinematicBreakdown", label: "Cinematic breakdown" },
  { key: "lightingAnalysis", label: "Lighting" },
  { key: "compositionAnalysis", label: "Composition" },
  { key: "moodAnalysis", label: "Mood & atmosphere" },
];

export default function SceneDecoder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [upload, setUpload] = useState<SceneUpload | null>(null);
  const [result, setResult] = useState<SceneDecodeResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const decode = useDecodeScene();
  const isDecoding = decode.isPending;

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast({ variant: "destructive", title: "Unsupported file", description: "Please upload an image." });
        return;
      }
      try {
        const { base64, mimeType } = await fileToPersistableBase64(file);
        if (upload?.preview) URL.revokeObjectURL(upload.preview);
        setUpload({ preview: URL.createObjectURL(file), base64, mimeType });
        setResult(null);
      } catch {
        toast({ variant: "destructive", title: "Could not read image", description: "Try a different file." });
      }
    },
    [toast, upload],
  );

  const runDecode = useCallback(async () => {
    if (!upload) {
      toast({ variant: "destructive", title: "No image", description: "Upload a frame to decode first." });
      return;
    }
    try {
      const res = await decode.mutateAsync({
        data: { imageBase64: upload.base64, mimeType: upload.mimeType },
      });
      setResult(res);
    } catch {
      toast({
        variant: "destructive",
        title: "Decode failed",
        description: "The scene could not be analyzed. Please try again.",
      });
    }
  }, [upload, decode, toast]);

  const copy = useCallback(
    (text: string, key: string) => {
      if (!text) return;
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1600);
    },
    [],
  );

  const sendToCreate = useCallback(() => {
    if (!result?.creatorReadyPrompt) return;
    sessionStorage.setItem(SCENE_PROMPT_KEY, result.creatorReadyPrompt);
    setLocation("/create");
  }, [result, setLocation]);

  const clearImage = useCallback(() => {
    if (upload?.preview) URL.revokeObjectURL(upload.preview);
    setUpload(null);
    setResult(null);
  }, [upload]);

  /* ------------------------------- Uploader ------------------------------- */
  const uploader = (
    <section className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="input-scene-image"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {!upload ? (
        <button
          onClick={() => fileRef.current?.click()}
          data-testid="button-upload-scene"
          className="group relative w-full rounded-2xl border-2 border-dashed border-foreground/15 bg-card/40 hover:border-sky-400/50 hover:bg-sky-500/[0.04] transition-all duration-200 p-10 flex flex-col items-center justify-center gap-4 text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 blur-2xl rounded-full bg-sky-500/15" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-violet-600 flex items-center justify-center shadow-lg">
              <Upload className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <p className="font-bold text-foreground">Upload a frame to decode</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Drop a screenshot, thumbnail, or any image — the decoder reads it like a director.
            </p>
          </div>
        </button>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-foreground/10 bg-card/40">
          <img src={upload.preview} alt="Scene to decode" className="w-full max-h-[420px] object-contain bg-black/40" />
          <button
            onClick={clearImage}
            data-testid="button-clear-scene"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <button
        onClick={runDecode}
        disabled={!upload || isDecoding}
        data-testid="button-decode-scene"
        className="w-full py-4 rounded-xl font-black text-white text-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        style={{
          background: "linear-gradient(135deg, hsl(199,89%,55%) 0%, hsl(263,90%,58%) 100%)",
          boxShadow: isDecoding ? "none" : "0 0 30px rgba(56,189,248,0.4), 0 0 60px rgba(139,92,246,0.2)",
        }}
      >
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none" />
        {isDecoding ? (
          <span className="relative flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Decoding...
          </span>
        ) : (
          <span className="relative flex items-center justify-center gap-2">
            <ScanEye className="w-5 h-5 group-hover:scale-110 transition-transform" /> Decode Scene
          </span>
        )}
      </button>
    </section>
  );

  /* -------------------------------- Results -------------------------------- */
  const results = (
    <div className="relative">
      {!result && !isDecoding && (
        <div className="rounded-2xl border border-foreground/10 bg-card/40 p-10 min-h-[320px] flex flex-col items-center justify-center text-center">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/20 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-sky-600 dark:text-sky-400/60" />
            </div>
            <div className="absolute inset-0 blur-2xl bg-sky-500/10 rounded-full" />
          </div>
          <p className="font-bold text-foreground/70">No decode yet</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-[260px] leading-relaxed">
            Upload an image and decode it to reveal its cinematic breakdown and a creator-ready prompt.
          </p>
        </div>
      )}

      {isDecoding && (
        <div className="rounded-2xl border border-foreground/10 bg-card/40 p-10 min-h-[320px] flex flex-col items-center justify-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
            <div className="absolute inset-0 blur-xl bg-sky-500/20 rounded-full" />
          </div>
          <GenerationPhases
            phases={["Reading the frame", "Reading light and lens", "Mapping composition", "Writing your prompt"]}
            className="text-sky-600 dark:text-sky-400 font-mono text-sm"
          />
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5"
        >
          {/* Scene description + tone */}
          <div className="rounded-2xl border border-foreground/10 bg-card/50 p-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">The scene</h3>
              {result.emotionalTone && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-200 border border-sky-500/30">
                  {result.emotionalTone}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{result.sceneDescription}</p>
          </div>

          {/* Breakdown grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {BREAKDOWN_FIELDS.map(({ key, label }) => {
              const value = result[key];
              if (typeof value !== "string" || !value) return null;
              return (
                <div key={key} className="rounded-2xl border border-foreground/10 bg-card/40 p-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-1.5">{label}</h4>
                  <p className="text-sm text-foreground/75 leading-relaxed">{value}</p>
                </div>
              );
            })}
          </div>

          {/* Creator-ready prompt */}
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.08] to-fuchsia-500/[0.05] p-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300">
                <Sparkles className="w-3.5 h-3.5" /> Creator-ready prompt
              </h3>
              <button
                onClick={() => copy(result.creatorReadyPrompt, "prompt")}
                data-testid="button-copy-prompt"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:text-foreground transition-colors"
              >
                {copiedKey === "prompt" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === "prompt" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">{result.creatorReadyPrompt}</p>
            <button
              onClick={sendToCreate}
              data-testid="button-send-to-create"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-violet-500 to-fuchsia-600 shadow-md hover:shadow-lg transition-all"
            >
              Send to Create <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Caption suggestions */}
          {result.captionSuggestions.length > 0 && (
            <div className="rounded-2xl border border-foreground/10 bg-card/40 p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Caption ideas</h3>
              <div className="space-y-2">
                {result.captionSuggestions.map((c, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-card/40 px-3.5 py-2.5"
                  >
                    <span className="text-sm text-foreground/80">{c}</span>
                    <button
                      onClick={() => copy(c, `cap-${i}`)}
                      data-testid={`button-copy-caption-${i}`}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Copy caption"
                    >
                      {copiedKey === `cap-${i}` ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );

  /* -------------------------------- Layout -------------------------------- */
  if (isMobile) {
    return (
      <div className="px-4 py-5 pb-24 space-y-6">
        <RouteAmbient variant="lab" glow={ROUTE_THEMES.sceneDecoder.glow} />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-foreground/10 bg-foreground/[0.03] text-[10px] font-mono uppercase tracking-widest text-foreground/70">
            <ScanEye className="w-3 h-3" /> Scene Decoder
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-sky-500 via-violet-600 to-fuchsia-600 dark:from-sky-300 dark:via-violet-300 dark:to-fuchsia-300 bg-clip-text text-transparent">
            Decode
          </h1>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Upload a frame and get a director-grade breakdown plus a creator-ready prompt.
          </p>
        </div>
        {uploader}
        {results}
      </div>
    );
  }

  return (
    <LabLayout>
      <PageHero
        ambientVariant="lab"
        eyebrow="Scene Decoder"
        title="Decode"
        subtitle="Upload any frame. Get a cinematic breakdown and a creator-ready prompt you can send straight to Create."
        icon={ScanEye}
        accent={ROUTE_THEMES.sceneDecoder.accent}
        glow={ROUTE_THEMES.sceneDecoder.glow}
      />
      <div className="grid lg:grid-cols-[minmax(0,1fr),minmax(0,1.1fr)] gap-8 items-start">
        <div className={cn("space-y-6")}>{uploader}</div>
        {results}
      </div>
    </LabLayout>
  );
}
