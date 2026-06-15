# AETHON — AI Caption Generator

An AI-powered caption generator for content creators (gamers, anime editors, Instagram users, YouTubers, reel creators). Uses Google Gemini AI to generate captions, YouTube titles, hashtags, and bios by category and topic. Premium cinematic creator workspace, violet/fuchsia brand identity, no emojis, FREE (no billing).

> Brand note: product was renamed CreatorCore → AETHON. Internal localStorage/sessionStorage keys are still prefixed `creatorcore_*` (and the splash key `creatorcore_splash_shown_v2`) — these are intentionally NOT renamed to avoid invalidating existing users' persisted state.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/caption-generator run dev` — run the frontend (port 20808)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_GEMINI_BASE_URL`, `AI_INTEGRATIONS_GEMINI_API_KEY` — auto-set by Replit AI Integrations

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Framer Motion
- API: Express 5
- AI: Google Gemini via Replit AI Integrations (`gemini-3-flash-preview`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/captions.ts` — DB schema: saved_captions, generation_history tables
- `artifacts/api-server/src/routes/captions.ts` — Caption generation routes + Gemini AI integration
- `artifacts/caption-generator/src/` — React frontend (pages: Home, Saved, History, Stats)

## Architecture decisions

- All AI calls go through the backend to keep the Gemini API key server-side only.
- Gemini AI integration uses Replit-managed credentials (no user API key needed).
- `@google/*` removed from esbuild externals so `@google/genai` bundles correctly.
- Prompt returns structured JSON via `responseMimeType: "application/json"` for reliable parsing.
- Generation history saved automatically on every AI call for the History page.

## Product

- Home (`/`): cinematic landing/dashboard — time-of-day greeting, hero CTA, 3 quick-action cards (Templates / Create / Analyze), trending categories, secondary workspace links. Signed-in users also see live activity tiles (total generations, saved count, last generation). Pure isolated page, no template grid.
- Templates (`/templates`): ~27 HAND-CURATED templates (see `Templates.tsx` `CURATED_TEMPLATES` + `mk()` helper) across 10 categories, with a "Trending now" rail (entries flagged `trending`), search + category chips + grid. Curation is INTENTIONAL — do NOT regenerate to thousands of permutations. Cards: signed-out → "Sign in to use" → `/sign-in`; signed-in → "Use" stores `creatorcore_pending_template` in sessionStorage and navigates to `/create`.
- Create (`/create`, auth-gated): caption generator editor — prefills category/type/topic from pending template (one-shot, cleared on mount), but everything is editable. Same UI as old Home generator. Instagram-adaptive "Select Category": when platform=Instagram + a subtype (Reel/Story/Post/Carousel; Carousel reuses Post) is selected, the category grid swaps from generic vibe categories to subtype-specific Instagram creator categories (`INSTAGRAM_CATEGORIES` in `Create.tsx`); the chosen label threads to Gemini as the optional `instagramCategory` field (backend `INSTAGRAM_CATEGORY_GUIDANCE` in `captions.ts`, Instagram-gated + whitelist-only). In this mode the request/history `category` is sent as a neutral `"social media"` so the hidden persisted generic vibe never leaks into the prompt or Stats — see `.agents/memory/adaptive-category-hidden-field.md`. Reverts to generic categories for non-Instagram platforms.
- Saved: Manage favorited captions with copy/delete, filterable by category
- History: Browse past generations with regenerate shortcut
- Stats: Usage analytics — total generations, saved count, top category, category breakdown chart
- Responsive: sidebar nav on desktop, bottom tab bar on mobile

## User preferences

- Dark cinematic gaming-inspired UI, no emojis in UI text
- Gemini AI via Replit AI Integrations (no user API key required)
- Auth (when implemented): Google login as primary, dark cinematic auth UI, persistent sessions, mobile + desktop friendly. NOT Replit Auth.
- App should feel like a premium creator platform (Canva / Pinterest / CapCut / Midjourney vibe), not a basic AI website with a form.
- Vision roadmap: splash → auth → onboarding → home dashboard → generation workspace → profiles → community feed → projects (versioning) → PWA install. Building in phases.

## Per-route visual identity

- `src/components/layout/PageHero.tsx` — reusable `<PageHero>` + `<RouteAmbient>` + `ROUTE_THEMES` palette. Each route gets a distinct gradient/icon/glow so navigation feels like switching products, not relabeling the same screen.
- Palette: templates=cyan→blue, create=violet→fuchsia, analyze=pink→fuchsia, gallery=emerald→teal, saved=amber→orange, history=indigo→violet, stats=cyan→emerald, profile=rose→pink, settings=slate→zinc.
- Home and Templates and Profile keep their custom hero sections (more elaborate than PageHero) but call `<RouteAmbient>` for matching ambient backdrop tint.
- Hero gradients are THEME-AWARE: light mode uses a soft pastel brand tint (`from-violet-300/50 via-fuchsia-200/40 to-pink-300/50`), dark mode uses the cinematic dark gradient (`dark:from-violet-950/40 dark:via-slate-950/60 dark:to-fuchsia-950/40`). Do NOT leave heroes on the dark 950 gradient with no `dark:` split — over the light background it composites to a washed mid-tone that makes `text-foreground` low-contrast (a "dark island"). Light tint + theme-aware text reads cleanly in both modes.
- Splash uses BOTH localStorage + sessionStorage so it only shows once per device — prevents the cinematic intro re-triggering on iframe reloads (was being misread as "every nav shows the same page").

## Generation UX (balanced — deliberately NOT over-built)

- `src/components/ui/GenerationPhases.tsx` — subtle, honest loading copy that cycles a few plain-language phase labels (no fake percentages, no GPU/telemetry spam). Used by Create + Analyze loading states. Reduced-motion shows a single static phrase.
- Create page inputs (category/type/topic) persist via the EXISTING `useLocalState` hook (keys `create:*`). A pending template still overrides persisted inputs one-shot on mount. Did NOT add a separate persistence hook — `useLocalState` already covers this.
- Rejected (per user balance rules): clashing teal/terminal per-page palette, fake telemetry loaders ("GPU execution blocks", random %), and a duplicate persistence hook. App keeps ONE unified violet/fuchsia design language; per-route identity comes from PageHero variants + RouteAmbient + per-page containers, not a second visual system.

## Shell layer (built)

- `src/components/Splash.tsx` — animated logo intro, ~2.7s, sessionStorage-gated, respects `prefers-reduced-motion`, dismiss on any interaction
- `src/components/PageTransition.tsx` — framer-motion route transitions, ENTER-ONLY (per-route initial→animate, opacity+y/scale, no blur for GPU cost), reduced-motion aware. NO `AnimatePresence`/`mode="wait"` and NO `exit` animations — `mode="wait"` held the exiting page on screen for the full exit duration (0.3–0.45s) while the URL + sidebar already updated, so the route's CONTENT lagged behind and showed the PREVIOUS page (looked like clicks opening the wrong page). Content now swaps synchronously with `location`; the keyed `<PageTransition key={location}>` replays the enter animation. Do not reintroduce `mode="wait"` here.
- `src/components/layout/Sidebar.tsx` + `BottomNav.tsx` — glassmorphism (`backdrop-blur-2xl`) with per-route glow colors
- `index.html` — AETHON branding + PWA meta (theme-color, apple-mobile-web-app-*) + no-FOUC inline theme script (reads `aethon_theme`, applies `.dark` class before paint, default dark)

## Theme system (dark + light — built)

- `src/components/theme/ThemeProvider.tsx` — React context, persists choice to localStorage key `aethon_theme` ("dark" | "light"), toggles the `.dark` class on `<html>`. Default is dark.
- `src/components/theme/ThemeToggle.tsx` — reusable sun/moon toggle. Mounted in Sidebar ("Appearance" row) + BottomNav; Settings has a real dark/light segmented control.
- Tailwind dark-class strategy. `src/index.css` defines real light tokens on `:root` and dark tokens on `.dark` (warm-gray premium light, NOT harsh white).
- `index.html` runs a no-FOUC inline script that applies the stored theme before first paint to prevent a flash.
- Light-mode color conversion rule (applied across all pages/components): theme-aware surfaces use semantic tokens (`text-foreground`, `bg-card`, `bg-popover`, `bg-foreground/[x]`). Brand-accent PASTEL text (`text-<color>-300/400`) on light/neutral/card/tinted-chip backgrounds gets a DEEPER light default + pastel under `dark:` (e.g. `text-violet-600 dark:text-violet-300`). Pastel text on EXPLICITLY dark/opaque surfaces (bg-black/* scrims, dark lightbox controls, saturated gradient buttons) KEEPS `text-white`/pastel — do NOT convert those to foreground tokens or they break in both themes.
- AETHON logo: `public/aethon-logo.png` (trimmed 852×218), referenced via `${import.meta.env.BASE_URL}aethon-logo.png`. Used in Splash + Sidebar.

## Aspect Ratio Engine (built)

- `artifacts/api-server/src/lib/recompose.ts` — sharp-based pre-recomposition. Decode source → blurred cover background at target ratio → fit-inside source composited centered → JPEG out.
- Gemini image gen preserves input dimensions, so we MUST hand it a target-ratio canvas. Prompt-only instructions don't work.
- Canonical dims: 16:9→1920×1080, 9:16→1080×1920, 1:1→1080×1080, 4:5→1080×1350, 21:9→1920×822, 2:3→1080×1620.
- Prompt explicitly instructs Gemini to outpaint into the blurred bands and not crop back.
- Sharp is in esbuild externals (`build.mjs` line 33) — do not remove.

## Emotion guidance (tuned)

- Image-gen prompt section "FACIAL EXPRESSION" was rewritten to "realistic combat focus / controlled dominance / John-Wick-like composure".
- Explicit DO/DO NOT lists prevent anime rage screaming, glowing eyes, cartoon villain faces.

## Persistence layer (built)

- `src/hooks/use-persistent-state.ts` — `useLocalState` (debounced 200ms localStorage), `base64ToFile`, `fileToPersistableBase64` (downscales to max edge 1600 JPEG q=0.82 to stay under ~5MB quota).
- All Analyze inputs persist (platform, mood, style, game, situation, extraPrompt, aspectRatio, ratioLocked, activeTab) + uploaded image (downscaled JPEG base64) + last generated image.
- Rehydrates File + preview on mount with "Restored" notice (4s).
- aspectRatio is validated on read against allowed set (defaults to 16:9 if corrupted).
- Object URLs are revoked when replaced to prevent memory leaks.

## Auth + Profiles (Phase 1 — built)

- Clerk via Replit-managed integration (`@clerk/react` web, `@clerk/express` server). Google + email/password, password reset, email verification, persistent cookie sessions. NOT Replit Auth.
- Cinematic glassmorphism sign-in/up at `/sign-in` and `/sign-up` (shadcn theme + custom dark purple/fuchsia/pink gradient appearance in `src/lib/clerkAppearance.ts`).
- `users` table mirrors Clerk identity (id = Clerk userId) + `username` (unique), `displayName`, `bio`, `avatarUrl`. JIT-provisioned on first authenticated `/api/me` hit.
- `generated_images` now has `user_id` (Clerk userId) + `is_public` boolean. Owner-only DELETE + visibility PATCH at `/api/analyze/generated-images/:id/visibility`.
- Entry flow (auth-first, per product direction): cinematic Splash (~2.2s, once per device) → `RootEntry` at `/`: signed-in → Home dashboard inside `<Shell>`; signed-out → `<Redirect to="/sign-in">`. `RootEntry` gates on `<ClerkLoading>` (branded `AuthBootLoader` spinner) / `<ClerkLoaded>` to avoid a blank flash before auth resolves.
  - This intentionally redirects signed-out `/` → `/sign-in`, overriding the Clerk-default "base path stays publicly accessible". MITIGATION: `/sign-in` is itself a full branded cinematic landing (`AuthLayout` — left brand + animated showcase marquee + trust pills, right Clerk widget), so unauthenticated visitors still get a real first impression, not a bare form.
- `src/components/auth/AuthLayout.tsx` — two-column cinematic auth shell wrapping `<SignIn>`/`<SignUp>`. Always dark (literal `bg-[#07060c]` + ambient blurs), not theme-aware by design. Left panel is `h-[100dvh] overflow-hidden` and the showcase columns are `h-full overflow-hidden` so the tall scrolling marquee is CLIPPED and never dictates the grid row height (otherwise it stretched the right column and pushed the Clerk form off-screen). Right pane is `lg:h-[100dvh] overflow-y-auto` with the content block `my-auto` (centers when room, scrolls when not) so the form is never clipped on short viewports.
- Clerk card logo is hidden (`logoBox: "hidden"` in `clerkAppearance.ts`) — AuthLayout provides AETHON branding; the old `/logo.svg` was a stale "CC" CreatorCore mark.
- (Legacy) `HomeRedirect` superseded by `RootEntry`.
- `RequireAuth` wraps `/analyze`, `/gallery`, `/saved`, `/history`, `/stats`, `/profile`, `/settings` — redirects to `/sign-in`.
- `UserMenu` in Sidebar bottom: signed-in shows avatar + dropdown (Profile / Settings / Sign out); signed-out shows gradient "Sign in to create" CTA.
- `/profile` page: editable username (a–z0-9_ 3–32), displayName, bio, with cinematic gradient hero card.

### Auth gotchas (don't redo these mistakes)

- `@clerk/themes/shadcn.css` contains `@source "./shadcn.js"` which Tailwind v4 rejects when nested via `@import`. Fix: use `@source "../../../node_modules/@clerk/themes/dist/themes/shadcn.js";` directly in `index.css` instead of `@import "@clerk/themes/shadcn.css"`.
- `tailwindcss({ optimize: false })` is required in `vite.config.ts` — without it, Clerk's nested `@layer` imports get reordered in prod builds.
- `publishableKey` MUST use `publishableKeyFromHost(window.location.hostname, env)` from `@clerk/react/internal`. Never the raw env var.
- `proxyUrl={import.meta.env.VITE_CLERK_PROXY_URL}` is unconditional (empty in dev, set in prod). Don't gate on NODE_ENV.
- Sign-in/up routes MUST be `path="/sign-in/*?"` and `path="/sign-up/*?"` (optional wildcard) for OAuth sub-paths to match.
- `<SignIn path>` must be the FULL browser path (`${basePath}/sign-in`) because Clerk reads `window.location.pathname` directly, ignoring wouter base.
- `parseInt(req.params.id, 10)` errors under Express 5 + Clerk type augmentation — use `parseInt(String(req.params.id), 10)`.

## Gotchas

- `@google/*` was in esbuild externals list — removed it so `@google/genai` bundles correctly
- After OpenAPI spec changes, always run codegen before starting the server
- Gemini image gen preserves input image dimensions — use the Aspect Ratio Engine, do not rely on prompt-level ratio instructions alone

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `ai-integrations-gemini` skill for Gemini client setup details
