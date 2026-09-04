"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * /login?email=<workEmail>
 *
 * One-shot recruiter login for pre-verified accounts. Hits
 * /api/recruiter/status server-side to confirm the row is verified,
 * populates localStorage.skillmatch_verification with the shape the
 * app expects, then redirects to /dashboard.
 *
 * If the email isn't verified in the DB, we send the user through the
 * normal RecruiterVerificationModal path (i.e. /post-job) instead.
 *
 * This bridges the gap between "pre-verify the row in the DB" and the
 * modal path that otherwise still asks the user to click a magic-link
 * email that might never arrive.
 */
function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = (params.get("email") || "").trim().toLowerCase();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!email || !email.includes("@")) {
        setMessage("Missing ?email= parameter.");
        return;
      }
      try {
        const res = await fetch(
          `/api/recruiter/status?email=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (!data.verified) {
          setMessage(
            `We couldn't find a verified recruiter for ${email}. Redirecting to the verification form…`
          );
          setTimeout(() => router.replace("/post-job"), 1500);
          return;
        }
        // Server confirms verified — populate the localStorage shape the
        // dashboard + candidates page read from.
        localStorage.setItem(
          "skillmatch_verification",
          JSON.stringify({
            companyName: data.companyName || "Your Company",
            recruiterName: data.recruiterName || "Recruiter",
            workEmail: email,
            jobTitle: data.jobTitle || "Recruiter",
            companyWebsite: data.companyWebsite || undefined,
            status: "verified",
            submittedAt: new Date().toISOString(),
            verifiedAt: new Date().toISOString(),
          })
        );
        router.replace("/dashboard");
      } catch {
        setMessage("Login failed. Please try again in a moment.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-sm">
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
