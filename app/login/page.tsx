"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * /login?email=<workEmail>&token=<SKILMATCH_LOGIN_TOKEN>
 *
 * Test-helper login for pre-verified accounts. Callers MUST supply a
 * shared token matching NEXT_PUBLIC_SKILMATCH_LOGIN_TOKEN — without it
 * the endpoint refuses so a random attacker can't just guess emails
 * and log in as arbitrary recruiters.
 *
 * This is not a real authentication system. It's a controlled bridge
 * so pre-seeded test cohorts can be entered without waiting on a
 * magic-link email that might never arrive. Real recruiter session
 * auth (email OTP → server session cookie) is the deferred follow-up.
 */
function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  // Capture ONCE and freeze into a ref — history.replaceState below
  // triggers useSearchParams to re-evaluate to an empty state, so the
  // effect would otherwise re-run with no email/token. Ref survives.
  const captured = useRef<{ email: string; token: string } | null>(null);
  if (captured.current === null) {
    captured.current = {
      email: (params.get("email") || "").trim().toLowerCase(),
      token: params.get("token") || "",
    };
  }
  const ranRef = useRef(false);
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    let cancelled = false;
    const { email, token } = captured.current!;
    // Referer / history leak defence: strip the token (and email) from
    // the visible URL immediately so any subsequent navigation or
    // embedded resource on /dashboard doesn't ship the token to a
    // third party in the Referer header.
    if (typeof window !== "undefined") {
      try {
        window.history.replaceState({}, "", "/login");
      } catch {
        // Some browsers/private modes throw; not worth blocking on.
      }
    }
    (async () => {
      if (!email || !email.includes("@")) {
        setMessage("Missing ?email= parameter.");
        return;
      }
      if (!token) {
        setMessage(
          "Missing ?token= parameter. Ask an admin for the current test-login token."
        );
        return;
      }
      try {
        const res = await fetch(
          `/api/recruiter/self-profile?email=${encodeURIComponent(email)}`,
          { headers: { "x-skilmatch-login-token": token } }
        );
        if (res.status === 401) {
          setMessage(
            "Test-login token is invalid. Ask an admin for the current token."
          );
          return;
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
