import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { navItems } from "./nav-items";

const LOGO = `${import.meta.env.BASE_URL}aethon-logo.png`;

/**
 * Mobile-only top app bar + slide-in drawer. Renders the FULL navigation
 * (everything the desktop sidebar exposes) plus appearance + account, so
 * routes that aren't in the bottom bar (History, Stats, Settings, Profile)
 * stay reachable. Desktop uses <Sidebar> instead — this is `md:hidden`.
 */
export function MobileNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes (e.g. after tapping a link).
  useEffect(() => {
    setOpen(false);
  }, [location]);

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b border-border bg-sidebar/85 backdrop-blur-2xl">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Open menu"
            className="inline-flex items-center justify-center w-10 h-10 -ml-1 rounded-xl border border-foreground/10 bg-foreground/[0.04] text-foreground/80 active:scale-95 transition-transform"
          >
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-[82%] max-w-xs p-0 border-r border-border bg-sidebar/95 backdrop-blur-2xl flex flex-col"
        >
          <div className="px-6 pt-6 pb-4">
            <Link href="/" className="flex items-center">
              <img src={LOGO} alt="AETHON" draggable={false} className="h-7 w-auto object-contain select-none" />
            </Link>
          </div>

          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden",
                    isActive ? "text-foreground" : "text-muted-foreground active:text-foreground"
                  )}
                  style={isActive ? {
                    background: `linear-gradient(135deg, ${item.glow.replace("0.35", "0.18")} 0%, transparent 100%)`,
                    boxShadow: `inset 0 0 0 1px ${item.glow.replace("0.35", "0.25")}`,
                  } : undefined}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                    isActive ? `bg-gradient-to-br ${item.color} shadow-md` : "bg-foreground/[0.06]"
                  )}>
                    <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-muted-foreground")} />
                  </div>
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 space-y-3 border-t border-border">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">Appearance</span>
              <ThemeToggle />
            </div>
            <UserMenu />
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/" className="flex items-center mx-auto">
        <img src={LOGO} alt="AETHON" draggable={false} className="h-6 w-auto object-contain select-none" />
      </Link>

      {/* Spacer to balance the hamburger so the logo stays centered. */}
      <div className="w-10 h-10 -mr-1" aria-hidden />
    </header>
  );
}
