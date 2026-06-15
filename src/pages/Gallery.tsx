import { useState, useEffect } from "react";
import {
  useListGeneratedImages, useDeleteGeneratedImage, getListGeneratedImagesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Download, X, Images, Wand2, ChevronLeft, ChevronRight, Maximize2, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PageHero, ROUTE_THEMES } from "@/components/layout/PageHero";
import { MarketplaceLayout } from "@/components/layout/WorkspaceLayouts";

interface LightboxState {
  b64_json: string;
  mimeType: string;
  style: string;
  mood: string;
  platform: string;
  game?: string | null;
  situation?: string | null;
  createdAt: string;
  id: number;
  index: number;
}

export default function Gallery() {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: generatedImages, isLoading } = useListGeneratedImages();
  const deleteImageMutation = useDeleteGeneratedImage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGeneratedImagesQueryKey() });
        setLightbox(null);
        toast({ title: "Deleted from gallery" });
      },
    },
  });

  const filtered = generatedImages?.filter(img => filterPlatform === "all" || img.platform === filterPlatform);
  const platforms = ["all", ...Array.from(new Set(generatedImages?.map(i => i.platform) || []))];

  const downloadImage = (b64: string, mime: string, style: string, mood: string) => {
    const link = document.createElement("a");
    link.href = `data:${mime};base64,${b64}`;
    link.download = `aethon-${style.toLowerCase().replace(/\s+/g, "-")}-${mood.toLowerCase()}-${Date.now()}.png`;
    link.click();
  };

  const openLightbox = (img: NonNullable<typeof generatedImages>[number], index: number) => {
    setLightbox({
      b64_json: img.thumbnailB64,
      mimeType: img.mimeType,
      style: img.style,
      mood: img.mood,
      platform: img.platform,
      game: img.game,
      situation: img.situation,
      createdAt: img.createdAt,
      id: img.id,
      index,
    });
  };

  const navigateLightbox = (dir: -1 | 1) => {
    if (!lightbox || !filtered) return;
    const next = lightbox.index + dir;
    if (next < 0 || next >= filtered.length) return;
    const img = filtered[next];
    setLightbox({
      b64_json: img.thumbnailB64,
      mimeType: img.mimeType,
      style: img.style,
      mood: img.mood,
      platform: img.platform,
      game: img.game,
      situation: img.situation,
      createdAt: img.createdAt,
      id: img.id,
      index: next,
    });
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox]);

  return (
    <MarketplaceLayout>
      {/* Header */}
      <PageHero
        ambientVariant="feed"
        eyebrow="Library"
        title="Image gallery"
        subtitle="All your AI-generated thumbnails in one place. Click any image to view full-size."
        icon={Images}
        accent={ROUTE_THEMES.gallery.accent}
        glow={ROUTE_THEMES.gallery.glow}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">

        {generatedImages && generatedImages.length > 0 && platforms.length > 2 && (
          <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-lg">
            <Filter className="w-4 h-4 text-muted-foreground ml-2" />
            <select
              value={filterPlatform}
              onChange={e => setFilterPlatform(e.target.value)}
              className="bg-transparent text-sm text-foreground focus:outline-none py-1 pr-2 cursor-pointer"
            >
              {platforms.map(p => (
                <option key={p} value={p} className="bg-card text-foreground">
                  {p === "all" ? "All Platforms" : p}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-video bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !generatedImages?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed border-border rounded-2xl">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-pink-500/20 border border-violet-500/20 flex items-center justify-center mb-5">
            <Wand2 className="w-10 h-10 text-violet-600/50 dark:text-violet-400/50" />
          </div>
          <p className="font-bold text-foreground/80 text-lg">No thumbnails yet</p>
          <p className="text-sm mt-2 text-center max-w-sm">
            Go to the <span className="text-violet-600 dark:text-violet-400 font-semibold">Analyze</span> page, upload your image, and hit{" "}
            <span className="text-violet-600 dark:text-violet-400 font-semibold">Generate Image</span> — every thumbnail you create lands here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {filtered?.length ?? 0} thumbnail{(filtered?.length ?? 0) !== 1 ? "s" : ""}
            {filterPlatform !== "all" ? ` for ${filterPlatform}` : ""}
          </p>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered?.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-pink-500/50 transition-all cursor-pointer hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]"
                onClick={() => openLightbox(img, i)}
              >
                {/* Image */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={`data:${img.mimeType};base64,${img.thumbnailB64}`}
                    alt={`${img.style} ${img.mood}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Hover hint */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <div className="flex items-center gap-1.5 text-white text-xs font-medium bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                      <Maximize2 className="w-3 h-3" /> Click to view full size
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="p-4 space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25 uppercase tracking-wider">{img.style}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-600 dark:text-pink-300 border border-pink-500/25 uppercase tracking-wider">{img.mood}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/25 uppercase tracking-wider">{img.platform}</span>
                  </div>
                  {img.situation && (
                    <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">{img.situation}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">{format(new Date(img.createdAt), "MMM d, HH:mm")}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); downloadImage(img.thumbnailB64, img.mimeType, img.style, img.mood); }}
                        className="p-1.5 bg-foreground/5 hover:bg-violet-500/20 rounded-md text-muted-foreground hover:text-violet-600 dark:hover:text-violet-300 transition-colors border border-foreground/10"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteImageMutation.mutate({ id: img.id }); }}
                        disabled={deleteImageMutation.isPending}
                        className="p-1.5 bg-foreground/5 hover:bg-red-500/20 rounded-md text-muted-foreground hover:text-red-400 transition-colors border border-foreground/10"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 z-20 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Prev */}
            {filtered && lightbox.index > 0 && (
              <button
                onClick={e => { e.stopPropagation(); navigateLightbox(-1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next */}
            {filtered && lightbox.index < filtered.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); navigateLightbox(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative max-w-6xl w-full flex flex-col gap-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Full image */}
              <div className="relative rounded-2xl overflow-hidden border border-border/10 shadow-2xl bg-black">
                <img
                  src={`data:${lightbox.mimeType};base64,${lightbox.b64_json}`}
                  alt={`${lightbox.style} ${lightbox.mood}`}
                  className="w-full h-auto object-contain max-h-[75vh]"
                />
              </div>

              {/* Footer */}
              <div className="bg-card/95 border border-border rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25 uppercase tracking-wider">{lightbox.style}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-600 dark:text-pink-300 border border-pink-500/25 uppercase tracking-wider">{lightbox.mood}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/25 uppercase tracking-wider">{lightbox.platform}</span>
                    {lightbox.game && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/25 uppercase tracking-wider">{lightbox.game}</span>
                    )}
                  </div>
                  {lightbox.situation && (
                    <p className="text-sm text-foreground/80 line-clamp-2">{lightbox.situation}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(lightbox.createdAt), "MMM d, yyyy 'at' HH:mm")}
                    {filtered && <span className="ml-2 opacity-60">• {lightbox.index + 1} of {filtered.length}</span>}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => downloadImage(lightbox.b64_json, lightbox.mimeType, lightbox.style, lightbox.mood)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    onClick={() => deleteImageMutation.mutate({ id: lightbox.id })}
                    disabled={deleteImageMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold border border-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MarketplaceLayout>
  );
}
