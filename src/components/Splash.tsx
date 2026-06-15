import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CreatorCredit } from "@/components/CreatorCredit";

const SESSION_KEY = "creatorcore_splash_shown_v2";
const LOGO = `${import.meta.env.BASE_URL}aethon-logo.png`;

// The splash is NOT on a fixed timer. It stays up until the app is actually
// ready (Clerk auth resolved + fonts loaded), but with a minimum cinematic
// display so the logo never just flashes. MAX_VISIBLE_MS is only a fault
// fallback for a stalled/failed load (e.g. Clerk never resolves) so we can never
// hang on the splash forever — under normal conditions readiness wins well
// before it, so the splash genuinely persists until the app is ready.
const MIN_VISIBLE_MS = 1600;
const MAX_VISIBLE_MS = 12000;

function removeBootSplash() {
  document.getElementById("boot-splash")?.remove();
}

/**
 * Cinematic startup splash. Renders an overlay that is visually identical to the
 * static `#boot-splash` in index.html, so the hand-off from the instant HTML
 * splash to the animated React splash is seamless — no blank/white flash.
 *
 * `ready` should reflect real app readiness (e.g. Clerk `isLoaded`). The splash
 * fades out once `ready` is true, assets are loaded, and the minimum display
 * time has elapsed.
 */
export function Splash({
  ready,
  onComplete,
}: {
  ready: boolean;
  onComplete: () => void;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"show" | "exit">("show");
  const [assetsReady, setAssetsReady] = useState(false);
  const startRef = useRef(Date.now());

  // Mount: take over from the static boot splash. Our overlay is painted on top
  // and is identical, so removing the boot node is invisible.
  useEffect(() => {
    if (reduce) {
      // Reduced motion: skip the cinematic gate entirely. The app has its own
      // ClerkLoading spinner, so dismissing immediately is safe.
      removeBootSplash();
      onComplete();
      return;
    }
    requestAnimationFrame(removeBootSplash);
  }, [reduce, onComplete]);

  // Asset readiness — fonts. The logo is already preloaded in index.html.
  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } })
      .fonts?.ready;
    Promise.resolve(fonts).then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    const fallback = window.setTimeout(() => {
      if (!cancelled) setAssetsReady(true);
    }, 2500);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [reduce]);

  // Safety cap from mount — never let the splash hang.
  useEffect(() => {
    if (reduce) return;
    const id = window.setTimeout(() => setPhase("exit"), MAX_VISIBLE_MS);
    return () => clearTimeout(id);
  }, [reduce]);

  // Dismiss once the app is ready, respecting the minimum cinematic display time.
  useEffect(() => {
    if (reduce) return;
    if (!ready || !assetsReady) return;
    const elapsed = Date.now() - startRef.current;
    const id = window.setTimeout(
      () => setPhase("exit"),
      Math.max(0, MIN_VISIBLE_MS - elapsed),
    );
    return () => clearTimeout(id);
  }, [ready, assetsReady, reduce]);

  // Let an impatient user skip ahead.
  useEffect(() => {
    if (reduce) return;
    const skip = () => setPhase("exit");
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {phase === "show" ? (
        <motion.div
          key="splash"
          role="dialog"
          aria-label="AETHON loading"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(244,18%,6%) 0%, hsl(244,22%,2%) 70%, #000 100%)",
          }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Ambient orb */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[56rem] h-[56rem] rounded-full blur-[170px] pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1.6, delay: 0.3 }}
          />

          {/* Logo lockup */}
          <div className="relative z-10 flex flex-col items-center px-6">
            <motion.div
              className="relative"
              initial={{ scale: 0.96, opacity: 0, filter: "blur(3px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Glow halo behind the wordmark */}
              <motion.div
                className="absolute inset-0 blur-3xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(99,102,241,0.45) 0%, rgba(236,72,153,0.18) 55%, transparent 75%)",
                }}
                animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.06, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Wordmark with a sweeping light reflection */}
              <div className="relative overflow-hidden">
                <img
                  src={LOGO}
                  alt="AETHON"
                  draggable={false}
                  className="relative w-[min(72vw,520px)] h-auto object-contain select-none"
                />
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.55) 50%, transparent 62%)",
                    mixBlendMode: "overlay",
                  }}
                  initial={{ x: "-130%" }}
                  animate={{ x: "130%" }}
                  transition={{ duration: 1.4, delay: 0.55, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </motion.div>

            {/* Animated underline */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-px w-56 mt-7 origin-center"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(192,132,252,0.7), transparent)",
              }}
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
              className="mt-6 text-[11px] md:text-xs font-medium tracking-[0.32em] uppercase text-white/55 font-mono"
            >
              The Cinematic AI Creator OS
            </motion.p>
          </div>

          {/* Indeterminate loading bar — honest "working" feedback, no fake % */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40 h-[2px] bg-white/5 rounded-full overflow-hidden"
          >
            <motion.div
              className="absolute inset-y-0 w-1/3 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(192,132,252,0.95), transparent)",
              }}
              initial={{ x: "-120%" }}
              animate={{ x: "320%" }}
              transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Creator credit */}
          <CreatorCredit
            tone="dark"
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function useSplash() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    // Hide splash if shown before in this tab (sessionStorage) OR on this device (localStorage).
    // Using both prevents the cinematic intro from re-triggering when the workspace iframe reloads,
    // which was being misread as "every nav shows the same page".
    try {
      if (localStorage.getItem(SESSION_KEY) === "1") return false;
      if (sessionStorage.getItem(SESSION_KEY) === "1") return false;
    } catch {
      // storage blocked — fall back to showing once per mount
    }
    return true;
  });

  const dismiss = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
        localStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    setShow(false);
  };

  return { show, dismiss };
}
