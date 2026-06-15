import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Subtle, honest loading copy for generation flows.
 * Cycles through a few plain-language phase labels — no fake percentages,
 * no GPU/telemetry spam. Stays on-brand and calm.
 */
export function GenerationPhases({
  phases,
  interval = 1800,
  className,
}: {
  phases: string[];
  interval?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (phases.length <= 1) return;
    const id = window.setInterval(() => {
      setI((prev) => (prev + 1) % phases.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [phases.length, interval]);

  if (!phases.length) return null;

  if (reduce) {
    return <p className={className}>{phases[0]}</p>;
  }

  return (
    <span className="relative inline-block">
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={className}
        >
          {phases[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
