import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { CreatorCredit } from "@/components/CreatorCredit";
import { navItems } from "./nav-items";

const LOGO = `${import.meta.env.BASE_URL}aethon-logo.png`;

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-50 border-r border-border bg-sidebar/80 backdrop-blur-2xl">

      {/* Logo */}
      <div className="px-6 pt-7 pb-3">
        <Link href="/" className="flex items-center group">
          <div className="relative">
            <div
              className="absolute -inset-2 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.4), transparent 70%)" }}
            />
            <img
              src={LOGO}
              alt="AETHON"
              draggable={false}
              className="relative h-8 w-auto object-contain select-none transition-transform group-hover:scale-[1.03]"
            />
          </div>
        </Link>
      </div>

      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

      <nav className="flex-1 px-3 space-y-1 mt-5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              style={isActive ? {
                background: `linear-gradient(135deg, ${item.glow.replace("0.35", "0.18")} 0%, transparent 100%)`,
                boxShadow: `inset 0 0 0 1px ${item.glow.replace("0.35", "0.25")}`,
              } : undefined}
            >
              {isActive && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full blur-lg pointer-events-none"
                  style={{ background: item.glow }} />
              )}

              {!isActive && (
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/[0.04] rounded-xl transition-colors pointer-events-none" />
              )}

              <div className={cn(
                "relative z-10 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                isActive ? `bg-gradient-to-br ${item.color} shadow-md` : "bg-foreground/[0.06] group-hover:bg-foreground/[0.12]"
              )}>
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
              </div>

              <span className={cn("font-semibold relative z-10", isActive ? "text-foreground" : "group-hover:text-foreground")}>
                {item.label}
              </span>

              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full relative z-10"
                  style={{ background: `linear-gradient(135deg, ${item.glow}, white)`, boxShadow: `0 0 6px ${item.glow}` }} />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-3">
        <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">Appearance</span>
          <ThemeToggle />
        </div>
        <UserMenu />
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">AETHON</span>
          <span className="text-[10px] font-mono text-muted-foreground/30">v1.0</span>
        </div>
        <CreatorCredit className="pt-1" />
      </div>
    </aside>
  );
}
