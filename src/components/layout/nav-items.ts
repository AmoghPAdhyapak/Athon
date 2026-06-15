import {
  LayoutGrid,
  Bookmark,
  History,
  BarChart2,
  Camera,
  Settings2,
  Images,
  Sparkles,
  ScanEye,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  /** Full label used in the sidebar + mobile drawer. */
  label: string;
  /** Compact label used in the mobile bottom bar. */
  shortLabel: string;
  icon: LucideIcon;
  /** Tailwind gradient for the active icon chip. */
  color: string;
  /** Base glow color (alpha 0.35) — alpha is swapped per surface. */
  glow: string;
}

/** Canonical navigation — single source of truth for Sidebar, BottomNav and MobileNav. */
export const navItems: NavItem[] = [
  { href: "/templates", label: "Templates",            shortLabel: "Templates", icon: LayoutGrid, color: "from-cyan-400 to-blue-500",      glow: "rgba(6,182,212,0.35)"   },
  { href: "/create",    label: "Create Template",      shortLabel: "Template",  icon: Sparkles,   color: "from-violet-500 to-fuchsia-500", glow: "rgba(139,92,246,0.35)"  },
  { href: "/analyze",   label: "Thumbnail Generation", shortLabel: "Thumbnail", icon: Camera,     color: "from-pink-500 to-fuchsia-500",   glow: "rgba(217,70,239,0.35)"  },
  { href: "/scene-decoder", label: "Scene Decoder",    shortLabel: "Decode",    icon: ScanEye,    color: "from-sky-400 to-violet-500",     glow: "rgba(56,189,248,0.35)"  },
  { href: "/saved",     label: "Saved",                shortLabel: "Saved",     icon: Bookmark,   color: "from-fuchsia-500 to-purple-500", glow: "rgba(192,38,211,0.35)"  },
  { href: "/gallery",   label: "Gallery",              shortLabel: "Gallery",   icon: Images,     color: "from-pink-500 to-rose-500",      glow: "rgba(236,72,153,0.35)"  },
  { href: "/history",   label: "History",              shortLabel: "History",   icon: History,    color: "from-amber-400 to-orange-500",   glow: "rgba(245,158,11,0.35)"  },
  { href: "/stats",     label: "Stats",                shortLabel: "Stats",     icon: BarChart2,  color: "from-emerald-400 to-teal-500",   glow: "rgba(16,185,129,0.35)"  },
  { href: "/settings",  label: "Settings",             shortLabel: "Settings",  icon: Settings2,  color: "from-slate-400 to-slate-300",    glow: "rgba(148,163,184,0.25)" },
];

/** Primary destinations surfaced in the mobile bottom bar (touch-first quick access). */
export const bottomNavHrefs = ["/templates", "/create", "/analyze", "/saved", "/gallery"];

export const bottomNavItems = bottomNavHrefs
  .map((href) => navItems.find((item) => item.href === href))
  .filter((item): item is NavItem => Boolean(item));
