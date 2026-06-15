import { motion } from "framer-motion";
import { Link } from "wouter";
import { Lock, Sparkles } from "lucide-react";

export function SignInGate({ feature }: { feature?: string }) {
  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-foreground/[0.08] bg-gradient-to-br from-foreground/[0.05] via-foreground/[0.02] to-transparent p-8 md:p-10 text-center"
      >
        <div
          className="absolute -top-24 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-60"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.30), transparent 70%)" }}
        />

        <div className="relative flex flex-col items-center gap-5">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-70"
              style={{ background: "radial-gradient(circle, rgba(139,92,246,0.45), transparent 65%)" }}
            />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-2xl">
              <Lock className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Sign in to use {feature ?? "this"}
              </span>
            </h2>
            <p className="text-sm text-foreground/55 max-w-sm mx-auto">
              {feature
                ? `${feature} is part of your AETHON workspace. Sign in to start creating — it's free.`
                : "Sign in to your AETHON workspace to continue — it's free."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-1">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 w-full sm:flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-sm font-semibold shadow-lg shadow-fuchsia-500/20 hover:opacity-95 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center w-full sm:flex-1 px-5 py-3 rounded-xl border border-foreground/10 bg-foreground/[0.03] text-foreground/80 text-sm font-medium hover:bg-foreground/[0.06] transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
