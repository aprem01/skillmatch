"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

const STORAGE_KEY = "skillmatch_subscription";
const VERIFICATION_KEY = "skillmatch_verification";

interface SubscriptionData {
  plan: "starter" | "growth" | "scale";
  status: "active";
  startedAt: string;
}

interface VerificationData {
  workEmail: string;
}

/**
 * Client-cached subscription status. Source of truth lives in the
 * Subscription table (written by the Stripe webhook). Components that
 * gate UI synchronously can call isSubscribedCached() for a fast answer;
 * components that need an authoritative answer (e.g. before unlocking a
 * candidate's identity) should call refreshSubscriptionStatus().
 */
export function isSubscribedCached(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data: SubscriptionData = JSON.parse(raw);
    return data.status === "active";
  } catch {
    return false;
  }
}

/** Backwards-compatible alias for existing call sites in candidates page. */
export function isSubscribed(): boolean {
  return isSubscribedCached();
}

function recruiterEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VERIFICATION_KEY);
    if (!raw) return null;
    const data: VerificationData = JSON.parse(raw);
    return data.workEmail?.toLowerCase().trim() || null;
  } catch {
    return null;
  }
}

/**
 * Hit /api/billing/status to refresh the cached subscription state.
 * Call on app load / when returning from Stripe Checkout / when a
 * recruiter takes a gated action.
 */
export async function refreshSubscriptionStatus(): Promise<boolean> {
  const email = recruiterEmail();
  if (!email) return false;
  try {
    const res = await fetch(`/api/billing/status?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (data.subscribed) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          plan: data.plan || "growth",
          status: "active",
          startedAt: new Date().toISOString(),
        } as SubscriptionData)
      );
      return true;
    }
    localStorage.removeItem(STORAGE_KEY);
    return false;
  } catch {
    return isSubscribedCached();
  }
}

const PLANS: {
  id: "starter" | "growth" | "scale";
  name: string;
  price: string;
  blurb: string;
  features: string[];
  recommended?: boolean;
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$199/mo",
    blurb: "1 open role, up to 5 candidate unlocks.",
    features: ["1 open job", "5 unlocks / mo", "Anonymous handles"],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$499/mo",
    blurb: "Most teams start here.",
    features: ["5 open jobs", "25 unlocks / mo", "Interview scheduling", "Priority support"],
    recommended: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: "$1,299/mo",
    blurb: "For higher-volume hiring teams.",
    features: ["Unlimited jobs", "100 unlocks / mo", "Bulk messaging", "Dedicated CSM"],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when subscription succeeds. */
  onSubscribed: () => void;
}

/**
 * Caroline 5/22: third gating step (after verify-account + check-email).
 *
 * Real flow: redirect to Stripe Checkout, recruiter pays, Stripe webhook
 * writes to our Subscription table, recruiter returns to /candidates and
 * refreshSubscriptionStatus() flips them subscribed.
 *
 * Demo flow: when Stripe env vars aren't set, the checkout endpoint
 * returns { url: null, fallback: "localStorage" } and we mark the user
 * subscribed locally so the gated UI proceeds. This keeps the demo
 * usable before live keys land.
 */
export default function SubscriptionModal({ open, onClose, onSubscribed }: Props) {
  const [chosen, setChosen] = useState<"starter" | "growth" | "scale">("growth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleStart() {
    setError(null);
    setLoading(true);

    const email = recruiterEmail();
    if (!email) {
      setError(
        "We couldn't find your verified work email. Please re-verify your account."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: chosen, email }),
      });
      const data = await res.json();

      if (data.url) {
        // Real Stripe path — redirect to hosted checkout.
        window.location.href = data.url;
        return;
      }

      // Fallback path (Stripe not configured yet) — mark subscribed locally
      // so the demo flow keeps working.
      const fallback: SubscriptionData = {
        plan: chosen,
        status: "active",
        startedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      setLoading(false);
      onSubscribed();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start checkout";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0, 191, 165, 0.96)" }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          Start your Skilmatch subscription
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Picking a plan unlocks candidate messaging, interviews, and hiring.
          You can switch tiers any time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {PLANS.map((p) => {
            const active = chosen === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setChosen(p.id)}
                className={`text-left rounded-xl border-2 px-4 py-4 transition-all ${
                  active
                    ? "border-skTeal bg-skBeta-bg shadow-sm"
                    : "border-gray-200 bg-white hover:border-skTeal/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">{p.name}</span>
                  {p.recommended && (
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-skTeal text-white">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="text-lg font-bold text-skTeal mb-2">
                  {p.price}
                </div>
                <p className="text-xs text-gray-600 mb-3 leading-snug">
                  {p.blurb}
                </p>
                <ul className="space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <Check size={12} className="text-skTeal mt-0.5 shrink-0" strokeWidth={3} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-sm font-semibold text-red-600 mb-3">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-skTeal hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Start subscription <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-gray-400 italic mt-4 text-center">
          Secure payment via Stripe. Cancel any time from your dashboard.
        </p>
      </div>
    </div>
  );
}
