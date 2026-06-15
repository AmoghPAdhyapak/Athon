import { useListHistory } from "@workspace/api-client-react";
import { History as HistoryIcon, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { PageHero, ROUTE_THEMES } from "@/components/layout/PageHero";

export default function History() {
  const { data: history, isLoading } = useListHistory();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <PageHero
        ambientVariant="timeline"
        eyebrow="Timeline"
        title="Generation history"
        subtitle="Every prompt you've run, ready to revisit or remix."
        icon={HistoryIcon}
        accent={ROUTE_THEMES.history.accent}
        glow={ROUTE_THEMES.history.glow}
      />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !history?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
          <Clock className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-medium">No history yet.</p>
          <p className="text-sm mt-1">Start generating content to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border hover:border-primary/50 transition-colors rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    {entry.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-foreground/5 text-muted-foreground">
                    {entry.type}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(entry.generatedAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-foreground text-sm font-medium line-clamp-2">
                  "{entry.topic}"
                </p>
              </div>

              <Link 
                href={`/`}
                className="shrink-0 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors py-2 px-4 rounded-lg bg-primary/10 hover:bg-primary/20"
              >
                Regenerate
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
