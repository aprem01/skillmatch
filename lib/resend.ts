import { Resend } from "resend";

/**
 * Server-side Resend client singleton.
 *
 * Required env vars:
 *   RESEND_API_KEY   — re_... from resend.com/api-keys
 *   RESEND_FROM      — e.g. "Skilmatch <hello@skilmatch.io>" (must be a
 *                      verified sender / verified domain on Resend)
 *   NEXT_PUBLIC_APP_URL — used to build verification-link URLs
 *
 * When env isn't configured, `isResendConfigured()` returns false and
 * the verification flow falls back to the localStorage demo path so
 * the modal keeps working pre-key.
 */
export const resend = new Resend(process.env.RESEND_API_KEY || "re_missing");

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM;
}
