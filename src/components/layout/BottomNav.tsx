import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { bottomNavItems } from "./nav-items";

const navItems = bottomNavItems.map((item) => ({
  href: item.href,
  label: item.shortLabel,
  icon: item.icon,
  glow: item.glow.replace("0.35", "0.45"),
}));

export function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe backdrop-blur-2xl border-t border-border bg-sidebar/85">
      {/* Top hairline glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <div className="flex items-center justify-around px-2 h-16 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all relative",
                isActive ? "text-foreground" : "text-muted-foreground active:scale-95"
              )}
            >
              {isActive && (
                <div
                  className="absolute top-1 w-10 h-10 rounded-full blur-xl pointer-events-none"
                  style={{ background: item.glow }}
                />
              )}
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200 relative",
                  isActive ? "scale-110" : ""
                )}
                style={isActive ? {
                  background: `linear-gradient(135deg, ${item.glow.replace("0.45", "0.25")} 0%, ${item.glow.replace("0.45", "0.1")} 100%)`,
                  boxShadow: `inset 0 0 0 1px ${item.glow.replace("0.45", "0.35")}`,
                } : undefined}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn("text-[10px] font-semibold tracking-wide", isActive ? "text-foreground" : "text-muted-foreground")}>
                {item.label}
              </span>
              {isActive && (
                <div
                  className="absolute -top-px w-8 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${item.glow}, transparent)`, boxShadow: `0 0 8px ${item.glow}` }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
