import { useState } from "react";
import { Settings2, Palette, Sliders, Info, Github, Globe, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PageHero, ROUTE_THEMES } from "@/components/layout/PageHero";
import { CreatorCredit } from "@/components/CreatorCredit";
import { useTheme } from "@/components/theme/ThemeProvider";

const PLATFORMS = ["YouTube", "YouTube Shorts", "Instagram", "Reels", "TikTok", "Facebook", "X/Twitter"];
const MOODS = ["Rage", "Revenge", "Dark", "Emotional", "Heroic", "Funny", "Clutch", "Aggressive", "Cinematic"];
const STYLES = ["Anime Aura", "Esports", "Cinematic", "Neon", "Fire", "Dark Mode", "Hyper-realistic", "Action Movie"];

const DEFAULTS_KEY = "creatorcore_defaults";

function loadDefaults() {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDefaults(data: Record<string, string>) {
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(data));
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-foreground/[0.02]">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-sm uppercase tracking-wider text-foreground">{title}</h2>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </motion.section>
  );
}

function PillGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              value === opt
                ? "bg-primary text-white border-primary shadow-[0_0_10px_rgba(var(--primary),0.4)]"
                : "bg-foreground/[0.04] border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const saved = loadDefaults();
  const { theme, setTheme } = useTheme();
  const [defaultPlatform, setDefaultPlatform] = useState<string>(saved.platform ?? "YouTube");
  const [defaultMood, setDefaultMood] = useState<string>(saved.mood ?? "Rage");
  const [defaultStyle, setDefaultStyle] = useState<string>(saved.style ?? "Anime Aura");
  const [saved2, setSaved2] = useState(false);

  const handleSave = () => {
    saveDefaults({ platform: defaultPlatform, mood: defaultMood, style: defaultStyle });
    setSaved2(true);
    setTimeout(() => setSaved2(false), 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 md:py-12 space-y-10">
      <PageHero
        ambientVariant="account"
        eyebrow="Preferences"
        title="Settings"
        subtitle="Customize your AETHON experience."
        icon={Settings2}
        accent={ROUTE_THEMES.settings.accent}
        glow={ROUTE_THEMES.settings.glow}
      />

      {/* Defaults */}
      <Section title="Generation Defaults" icon={Sliders}>
        <p className="text-sm text-muted-foreground -mt-2">
          These defaults are pre-selected whenever you open the Generate or Analyze page.
        </p>
        <PillGroup label="Default Platform" options={PLATFORMS} value={defaultPlatform} onChange={setDefaultPlatform} />
        <PillGroup label="Default Mood" options={MOODS} value={defaultMood} onChange={setDefaultMood} />
        <PillGroup label="Default Style" options={STYLES} value={defaultStyle} onChange={setDefaultStyle} />
        <button
          onClick={handleSave}
          className={cn(
            "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
            saved2
              ? "bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-400"
              : "bg-primary hover:bg-primary/90 text-white shadow-[0_0_14px_rgba(var(--primary),0.3)]"
          )}
        >
          {saved2 ? "Saved!" : "Save Defaults"}
        </button>
      </Section>

      {/* UI */}
      <Section title="Appearance" icon={Palette}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Theme</p>
            <p className="text-xs text-muted-foreground mt-0.5">Switch between cinematic dark and soft premium light.</p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-foreground/[0.05] border border-border shrink-0">
            {(["dark", "light"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                aria-pressed={theme === mode}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                  theme === mode
                    ? "bg-primary text-white shadow-[0_0_12px_rgba(var(--primary),0.35)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                {mode}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Accent Color</p>
            <p className="text-xs text-muted-foreground mt-0.5">Primary highlight used across the UI.</p>
          </div>
          <div className="flex gap-2">
            {["#6d28d9", "#0ea5e9", "#ef4444", "#f97316", "#10b981"].map(color => (
              <button
                key={color}
                className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground/50 transition-colors"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* About */}
      <Section title="About" icon={Info}>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">App</span>
            <span className="text-sm font-medium text-foreground">AETHON</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">AI Model</span>
            <span className="text-sm font-medium text-foreground">Gemini 2.5 Flash</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Image Model</span>
            <span className="text-sm font-medium text-foreground">Gemini 2.5 Flash Image</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Built for</span>
            <span className="text-sm font-medium text-foreground">Gamers, Creators, Anime Editors</span>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <a
            href="https://replit.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            Built on Replit
          </a>
          <a
            href="https://ai.google.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            Powered by Gemini
          </a>
        </div>
        <div className="mt-6 border-t border-border/50 pt-5">
          <CreatorCredit />
        </div>
      </Section>
    </div>
  );
}
