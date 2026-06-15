import { useCallback } from "react";
import { useClerk } from "@clerk/react";

/**
 * When an authenticated API request returns 401, the local Clerk session is
 * stale/invalid (e.g. expired, or competing suffixed/unsuffixed cookies that
 * can't be validated). We clear EVERY Clerk cookie variant — not just the one
 * `signOut` knows about — then sign out and redirect to sign-in, so the user
 * re-authenticates with a genuinely clean cookie jar instead of being stuck in a
 * "Session expired" loop where re-signing-in leaves stale-suffix cookies behind.
 */
let recovering = false;

/**
 * Expire all Clerk cookies (`__session*`, `__client*`, `__clerk*`) across the
 * plausible path/domain scopes a browser may have stored them at. Clerk's web
 * cookies are not httpOnly, so they are reachable from JS.
 */
function clearAllClerkCookies() {
  if (typeof document === "undefined") return;
  const names = new Set(
    document.cookie
      .split(";")
      .map((c) => c.split("=")[0]?.trim())
      .filter(
        (n): n is string =>
          !!n &&
          (n.startsWith("__session") ||
            n.startsWith("__client") ||
            n.startsWith("__clerk")),
      ),
  );
  if (names.size === 0) return;

  const host = window.location.hostname;
  const domains = ["", host, `.${host}`];
  const base = import.meta.env.BASE_URL || "/";
  const paths = Array.from(new Set(["/", base, base.replace(/\/$/, "") || "/"]));
  const expired = "Thu, 01 Jan 1970 00:00:00 GMT";

  for (const name of names) {
    for (const path of paths) {
      for (const domain of domains) {
        document.cookie =
          `${name}=; expires=${expired}; path=${path}` +
          (domain ? `; domain=${domain}` : "");
      }
    }
  }
}

export function useSessionRecovery() {
  const { signOut } = useClerk();

  return useCallback(async () => {
    if (recovering) return;
    recovering = true;
    const base = import.meta.env.BASE_URL || "/";
    const signInUrl = `${base}sign-in`;
    try {
      await signOut();
    } catch {
      // ignore — we still clear cookies and redirect below
    } finally {
      clearAllClerkCookies();
      window.location.assign(signInUrl);
    }
  }, [signOut]);
}
