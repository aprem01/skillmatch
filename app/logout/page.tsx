"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /logout — clears every Skilmatch-scoped localStorage key and returns
 * the recruiter to the marketing home. Kept as a page rather than a
 * dropdown handler so the nav item works even without JavaScript
 * enabled on the previous page (the redirect is a client-side
 * `router.replace` since Skilmatch has no server session yet — only
 * localStorage state).
 */
export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    try {
      // Blanket sweep every skillmatch_-prefixed key across BOTH
      // localStorage and sessionStorage. Explicit prefix means we
      // don't leave anything behind if a future feature adds a new key.
      // Wrapped in try/catch per-storage because private/incognito
      // modes can throw on access.
      const SWEEP = (store: Storage) => {
        const doomed: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && k.startsWith("skillmatch_")) doomed.push(k);
        }
        for (const k of doomed) store.removeItem(k);
      };
      try { SWEEP(localStorage); } catch {}
      try { SWEEP(sessionStorage); } catch {}
    } catch {
      // ignore — even if storage is inaccessible, the redirect still lands
    }
    router.replace("/");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-500 text-sm">
      Logging you out…
    </div>
  );
}
