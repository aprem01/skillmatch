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
      // Clear everything Skilmatch persists client-side. Legacy keys
      // included for safety even if not currently in use.
      const KEYS = [
        "skillmatch_verification",
        "skillmatch_subscription",
        "skillmatch_job",
        "skillmatch_saved",
        "skillmatch_saved_by_job",
      ];
      for (const k of KEYS) localStorage.removeItem(k);
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
