import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileNav } from "./MobileNav";
import { BackButton } from "./BackButton";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-foreground">
      {/* Base atmospheric orbs — pages add their own route-specific layer on top */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-15%] left-[-8%] w-[55%] h-[55%] rounded-full blur-[140px]"
          style={{
            background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
            animation: "aurora 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[-10%] right-[-10%] w-[40%] h-[45%] rounded-full blur-[120px]"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
            animation: "aurora 15s ease-in-out infinite 3s",
          }}
        />
        <div
          className="absolute bottom-[-20%] left-[-5%] w-[42%] h-[50%] rounded-full blur-[130px]"
          style={{
            background: "radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)",
            animation: "aurora 18s ease-in-out infinite 6s",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-8%] w-[38%] h-[40%] rounded-full blur-[110px]"
          style={{
            background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
            animation: "aurora 20s ease-in-out infinite 9s",
          }}
        />
      </div>

      <Sidebar />
      <MobileNav />

      {/*
        No max-width, no padding, no centering here.
        Every page component owns its own container, width, padding, and
        layout rhythm. This is what enables true per-route identity — each
        page can be full-bleed, centered, split-screen, or anything else.
      */}
      <main className="md:pl-64 flex flex-col min-h-screen pb-20 md:pb-0 relative z-10">
        <BackButton />
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
