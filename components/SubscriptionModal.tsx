"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const STORAGE_KEY = "skillmatch_subscription";

interface SubscriptionData {
  plan: "starter" | "growth" | "scale";
  status: "active";
  startedAt: string;
}

export function isSubscribed(): boolean {
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
 * Real Stripe checkout integration is deferred for MVP; here we capture
 * the plan choice + flag the user as subscribed so downstream flows
 * (Invite, Ask a Question, Unlock & Hire) proceed.
 */
export default function SubscriptionModal({ open, onClose, onSubscribed }: Props) {
  const [chosen, setChosen] = useState<"starter" | "growth" | "scale">("growth");

  if (!open) return null;

  function handleStart() {
    const data: SubscriptionData = {
      plan: chosen,
      status: "active",
      startedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    onSubscribed();
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

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-skTeal hover:opacity-90 transition-opacity"
          >
            Start subscription <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
