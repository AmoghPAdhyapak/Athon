import { useEffect, useRef } from "react";
import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  ClerkProvider,
  ClerkLoading,
  ClerkLoaded,
  SignIn,
  SignUp,
  Show,
  useClerk,
  useAuth,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Shell } from "@/components/layout/Shell";
import { Splash, useSplash } from "@/components/Splash";
import { SignInGate } from "@/components/auth/SignInGate";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PageTransition } from "@/components/PageTransition";
import { clerkAppearance, clerkLocalization } from "@/lib/clerkAppearance";
import Analyze from "@/pages/Analyze";
import Home from "@/pages/Home";
import Templates from "@/pages/Templates";
import Create from "@/pages/Create";
import Saved from "@/pages/Saved";
import History from "@/pages/History";
import Stats from "@/pages/Stats";
import Settings from "@/pages/Settings";
import Gallery from "@/pages/Gallery";
import Profile from "@/pages/Profile";
import SceneDecoder from "@/pages/SceneDecoder";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function SignInPage() {
  return (
    <AuthLayout>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={basePath || "/"}
      />
    </AuthLayout>
  );
}

function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={basePath || "/"}
      />
    </AuthLayout>
  );
}

/**
 * Entry point for the base path.
 * - Signed-in users land directly on the Home dashboard (inside the app Shell).
 * - Signed-out users are sent to the dedicated cinematic auth page. This is an
 *   intentional auth-first entry flow (per product direction): the /sign-in page
 *   is a full branded landing with creator showcase + context, not a bare form,
 *   so unauthenticated visitors still get a real first impression.
 */
function AuthBootLoader() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#07060c]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-violet-400" />
    </div>
  );
}

function RootEntry() {
  return (
    <>
      <ClerkLoading>
        <AuthBootLoader />
      </ClerkLoading>
      <ClerkLoaded>
        <Show when="signed-in">
          <Shell>
            <PageTransition key="home">
              <Home />
            </PageTransition>
          </Shell>
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </ClerkLoaded>
    </>
  );
}

function RequireAuth({
  children,
  feature,
}: {
  children: React.ReactNode;
  feature?: string;
}) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <SignInGate feature={feature} />
      </Show>
    </>
  );
}

function ShellRouter() {
  const [location] = useLocation();
  return (
    <Shell>
      <PageTransition key={location}>
        <Switch location={location}>
          <Route path="/templates" component={Templates} />
          <Route path="/create"><RequireAuth feature="Caption Studio"><Create /></RequireAuth></Route>
          <Route path="/analyze"><RequireAuth feature="the Thumbnail Lab"><Analyze /></RequireAuth></Route>
          <Route path="/scene-decoder"><RequireAuth feature="the Scene Decoder"><SceneDecoder /></RequireAuth></Route>
          <Route path="/gallery"><RequireAuth feature="the Gallery"><Gallery /></RequireAuth></Route>
          <Route path="/saved"><RequireAuth feature="Saved captions"><Saved /></RequireAuth></Route>
          <Route path="/history"><RequireAuth feature="your History"><History /></RequireAuth></Route>
          <Route path="/stats"><RequireAuth feature="your Stats"><Stats /></RequireAuth></Route>
          <Route path="/profile"><RequireAuth feature="your Profile"><Profile /></RequireAuth></Route>
          <Route path="/settings"><RequireAuth feature="Settings"><Settings /></RequireAuth></Route>
          <Route component={NotFound} />
        </Switch>
      </PageTransition>
    </Shell>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={clerkLocalization}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <SplashController />
        <Switch>
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/" component={RootEntry} />
          <Route><ShellRouter /></Route>
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

/**
 * Drives the cinematic splash from real app readiness instead of a fixed timer.
 * Rendered inside ClerkProvider so it can read Clerk's `isLoaded` state — the
 * splash stays up until auth has resolved (and assets are ready), then fades.
 */
function SplashController() {
  const { show, dismiss } = useSplash();
  const { isLoaded } = useAuth();
  if (!show) return null;
  return <Splash ready={isLoaded} onComplete={dismiss} />;
}

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
