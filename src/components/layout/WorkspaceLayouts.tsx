import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WorkspaceLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Reusable workspace layout system.
 *
 * These are intentionally THIN container wrappers. They differentiate pages by
 * width + vertical density only — they do NOT render their own headers,
 * ambient layers, or chrome. Every page keeps its own <PageHero>/<RouteAmbient>
 * so the per-route identity (ROUTE_THEMES) and the single violet/fuchsia design
 * language stay intact. The goal is to make Templates/Gallery feel like a wide
 * discovery surface, Create feel like a focused studio, and Analyze/Stats feel
 * like a wide diagnostic workbench — without a second visual system.
 */

/**
 * MarketplaceLayout — wide, dense browsing surface.
 * Used by discovery/showcase pages (Templates, Gallery).
 */
export function MarketplaceLayout({ children, className }: WorkspaceLayoutProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[1800px] mx-auto px-4 md:px-8 xl:px-12 py-6 md:py-8 space-y-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * StudioLayout — focused, centered creator workspace.
 * Narrower and calmer than the other layouts so generation feels like a
 * dedicated studio, not another dashboard. Stays fully scrollable + mobile-safe
 * (no fixed-viewport trapping).
 */
export function StudioLayout({ children, className }: WorkspaceLayoutProps) {
  return (
    <div
      className={cn(
        "w-full max-w-3xl mx-auto px-4 py-8 md:py-14 space-y-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * LabLayout — wide diagnostic workbench that comfortably hosts split panels.
 * Used by analysis/insight pages (Analyze, Stats).
 */
export function LabLayout({ children, className }: WorkspaceLayoutProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 space-y-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
