import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/react";
import { Loader2, AtSign, User as UserIcon, FileText, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RouteAmbient, ROUTE_THEMES } from "@/components/layout/PageHero";

interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  email: string | null;
  createdAt: string;
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = (p: string) => `${basePath}/api${p}`;

export default function Profile() {
  const { user } = useUser();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: "", displayName: "", bio: "" });

  useEffect(() => {
    let mounted = true;
    fetch(API("/me"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((p: Profile) => {
        if (!mounted) return;
        setProfile(p);
        setForm({
          username: p.username ?? "",
          displayName: p.displayName ?? "",
          bio: p.bio ?? "",
        });
      })
      .catch(() => toast({ title: "Could not load profile", variant: "destructive" }))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [toast]);

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (form.username.trim()) payload.username = form.username.trim().toLowerCase();
      if (form.displayName.trim()) payload.displayName = form.displayName.trim();
      payload.bio = form.bio.trim();

      const res = await fetch(API("/me"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Save failed");
      }
      const updated: Profile = await res.json();
      setProfile(updated);
      toast({ title: "Profile saved", description: "Your creator identity is updated." });
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const usernameValid = !form.username || /^[a-z0-9_]{3,32}$/.test(form.username);
  const initial = (user?.firstName?.[0] || profile?.username?.[0] || "C").toUpperCase();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">
      <RouteAmbient glow={ROUTE_THEMES.profile.glow} variant="default" />
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-violet-300/45 via-fuchsia-200/35 to-pink-300/45 dark:from-violet-950/30 dark:via-fuchsia-950/20 dark:to-pink-950/30 p-8"
      >
        <div className="absolute inset-0 -z-0 opacity-60">
          <div className="absolute top-[-30%] left-[20%] w-[60%] h-[120%] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-pink-500 blur-xl opacity-60" />
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="relative w-24 h-24 rounded-full object-cover ring-4 ring-foreground/10" />
            ) : (
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white font-black text-4xl ring-4 ring-foreground/10">
                {initial}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-violet-600 dark:text-violet-300/80 mb-1">Creator Profile</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground truncate">
              {profile?.displayName || user?.firstName || profile?.username || "Your identity"}
            </h1>
            {profile?.username && (
              <p className="text-foreground/60 mt-1 flex items-center gap-1">
                <AtSign className="w-4 h-4" />{profile.username}
              </p>
            )}
            {profile?.email && (
              <p className="text-xs font-mono text-muted-foreground/60 mt-2">{profile.email}</p>
            )}
          </div>
        </div>
      </motion.section>

      {/* Edit form */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-foreground/[0.02]">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-300" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-foreground">Edit your identity</h2>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <Field
              label="Username"
              icon={AtSign}
              help="Lowercase letters, numbers, underscore. 3–32 chars."
              error={!usernameValid ? "Invalid format" : undefined}
            >
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s+/g, "") })}
                placeholder="your_handle"
                className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-xl px-4 h-11 text-foreground placeholder-foreground/30 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-mono"
                maxLength={32}
              />
            </Field>

            <Field label="Display name" icon={UserIcon}>
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="How you want to be known"
                className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-xl px-4 h-11 text-foreground placeholder-foreground/30 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                maxLength={64}
              />
            </Field>

            <Field label="Bio" icon={FileText} help={`${form.bio.length}/280`}>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 280) })}
                placeholder="Gamer. Editor. Storyteller. Tell creators who you are."
                rows={4}
                className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all resize-none"
              />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={save}
                disabled={saving || !usernameValid}
                className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-white font-bold text-sm shadow-[0_8px_24px_-6px_rgba(168,85,247,0.6)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save profile
              </button>
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  help,
  error,
  children,
}: {
  label: string;
  icon: React.ElementType;
  help?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-violet-600 dark:text-violet-300" />
        <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">{label}</label>
      </div>
      {children}
      {(help || error) && (
        <p className={`text-xs flex items-center gap-1 ${error ? "text-red-400" : "text-muted-foreground"}`}>
          {error && <AlertCircle className="w-3 h-3" />}
          {error ?? help}
        </p>
      )}
    </div>
  );
}
