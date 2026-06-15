import { useState } from "react";
import {
  useListSavedCaptions, useDeleteSavedCaption, getListSavedCaptionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2, Bookmark, CheckCircle2, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { PageHero, ROUTE_THEMES } from "@/components/layout/PageHero";
import { format } from "date-fns";

export default function Saved() {
  const [filterType, setFilterType] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: savedCaptions, isLoading } = useListSavedCaptions();
  const deleteCaptionMutation = useDeleteSavedCaption({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSavedCaptionsQueryKey() });
        toast({ title: "Deleted saved caption" });
      },
    },
  });

  const handleCopy = async (id: number, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const filtered = savedCaptions?.filter(c => filterType === "all" || c.type === filterType);
  const types = ["all", ...Array.from(new Set(savedCaptions?.map(c => c.type) || []))];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <PageHero
        ambientVariant="vault"
        eyebrow="Collection"
        title="Saved captions"
        subtitle="Your favorite captions, titles, hashtags, and bios — all in one safe place."
        icon={Bookmark}
        accent={ROUTE_THEMES.saved.accent}
        glow={ROUTE_THEMES.saved.glow}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        {savedCaptions && savedCaptions.length > 0 && (
          <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-lg">
            <Filter className="w-4 h-4 text-muted-foreground ml-2" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-transparent text-sm text-foreground focus:outline-none py-1 pr-2 cursor-pointer"
            >
              {types.map(t => (
                <option key={t} value={t} className="bg-card text-foreground">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : !savedCaptions?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
          <Bookmark className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-medium">No saved captions yet.</p>
          <p className="text-sm mt-1 text-center max-w-sm">Generate captions on the home page and save your favorites here.</p>
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No items found for this filter.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered?.map((caption, i) => (
            <motion.div
              key={caption.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{caption.category}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-foreground/5 text-muted-foreground border border-foreground/10">{caption.type}</span>
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(caption.savedAt), "MMM d, yyyy")}</span>
              </div>
              <p className="text-foreground text-sm mb-6 flex-1 whitespace-pre-wrap">{caption.text}</p>
              <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                <button
                  onClick={() => handleCopy(caption.id, caption.text)}
                  className="p-2 bg-foreground/5 hover:bg-foreground/10 rounded border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-xs"
                >
                  {copiedId === caption.id ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  Copy
                </button>
                <button
                  onClick={() => deleteCaptionMutation.mutate({ id: caption.id })}
                  disabled={deleteCaptionMutation.isPending}
                  className="p-2 bg-destructive/10 hover:bg-destructive/20 rounded border border-destructive/20 text-destructive transition-colors flex items-center gap-2 text-xs"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
