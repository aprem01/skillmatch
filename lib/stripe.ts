import Stripe from "stripe";

/**
 * Server-side Stripe SDK singleton.
 *
 * Required env vars (set in Vercel + .env):
 *   STRIPE_SECRET_KEY        — sk_test_... or sk_live_...
 *   STRIPE_WEBHOOK_SECRET    — whsec_... (per-endpoint, from Stripe dashboard)
 *   STRIPE_PRICE_STARTER     — price_... ($199/mo)
 *   STRIPE_PRICE_GROWTH      — price_... ($499/mo)
 *   STRIPE_PRICE_SCALE       — price_... ($1299/mo)
 *   NEXT_PUBLIC_APP_URL      — https://skillmatch-red.vercel.app (or custom domain)
 *                              used for Stripe success/cancel URLs
 */
// Pin to a known-working API version. Update when the Stripe SDK does.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2025-09-30.acacia" as any,
  typescript: true,
});

export const PRICE_BY_PLAN: Record<"starter" | "growth" | "scale", string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  growth: process.env.STRIPE_PRICE_GROWTH || "",
  scale: process.env.STRIPE_PRICE_SCALE || "",
};

export function isStripeConfigured(): boolean {
  return (
    !!process.env.STRIPE_SECRET_KEY &&
    !!process.env.STRIPE_PRICE_STARTER &&
    !!process.env.STRIPE_PRICE_GROWTH &&
    !!process.env.STRIPE_PRICE_SCALE
  );
}

export type Plan = "starter" | "growth" | "scale";
