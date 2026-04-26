"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Mail, Loader2 } from "lucide-react";

const STORAGE_KEY = "skillmatch_verification";

const PERSONAL_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "live.com",
  "proton.me",
  "protonmail.com",
];

const JOB_TITLES = [
  "Recruiter",
  "HR Manager",
  "Hiring Manager",
  "Talent Acquisition Manager",
  "CEO / Founder",
  "Other",
];

interface VerificationData {
  companyName: string;
  recruiterName: string;
  workEmail: string;
  jobTitle: string;
  companyWebsite?: string;
  status: "pending" | "verified";
  submittedAt: string;
  verifiedAt?: string;
}

export function isRecruiterVerified(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data: VerificationData = JSON.parse(raw);
    return data.status === "verified";
  } catch {
    return false;
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when verification is complete + email confirmed. */
  onVerified: () => void;
}

export default function RecruiterVerificationModal({
  open,
  onClose,
  onVerified,
}: Props) {
  // Form state
  const [companyName, setCompanyName] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  // Flow state
  const [step, setStep] = useState<"form" | "email-sent" | "verifying">("form");
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("form");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const emailDomain = workEmail.split("@")[1]?.toLowerCase().trim() || "";
  const isPersonalEmail =
    !!emailDomain && PERSONAL_EMAIL_DOMAINS.includes(emailDomain);
  const requiresWebsite = isPersonalEmail;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!companyName.trim() || !recruiterName.trim() || !jobTitle) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!workEmail.includes("@") || !emailDomain.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (requiresWebsite && !companyWebsite.trim()) {
      setError(
        "We need your company website to verify accounts using a personal email."
      );
      return;
    }

    // Persist as pending
    const data: VerificationData = {
      companyName: companyName.trim(),
      recruiterName: recruiterName.trim(),
      workEmail: workEmail.trim(),
      jobTitle,
      companyWebsite: companyWebsite.trim() || undefined,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    setStep("email-sent");
  }

  function handleResendEmail() {
    setError(null);
    // No-op for MVP — would re-trigger backend email
  }

  function handleEditEmail() {
    setStep("form");
  }

  function simulateVerificationClick() {
    // For MVP — simulates user clicking the email verification link.
    // In production, this happens via a separate page or polling.
    setStep("verifying");
    setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data: VerificationData = JSON.parse(raw);
          data.status = "verified";
          data.verifiedAt = new Date().toISOString();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } catch {}
      onVerified();
    }, 800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0, 191, 165, 0.96)" }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-in">
        {/* ─── STEP 1: FORM ─────────────────────────────────────── */}
        {step === "form" && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Only verified recruiters can contact candidates.
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              This helps ensure candidates only hear from real recruiters.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-sm font-bold text-gray-900">
                Verify your account
              </p>
              <p className="text-xs text-gray-500">Takes 1-2 minutes</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-teal text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Recruiter Name
                </label>
                <input
                  type="text"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-teal text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-teal text-sm"
                  required
                />
                {requiresWebsite && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    Personal email detected — please add your company website
                    below.
                  </p>
                )}
              </div>

              {/* Conditional: company website if personal email */}
              {requiresWebsite && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Company Website
                  </label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-teal text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Job Title
                </label>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-teal text-sm appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select your role…</option>
                  {JOB_TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-teal hover:bg-teal-dark transition-colors"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </>
        )}

        {/* ─── STEP 2: EMAIL SENT WAITING ─────────────────────────── */}
        {step === "email-sent" && (
          <div className="text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center">
              <Mail size={28} className="text-teal" strokeWidth={2} />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Check your email to verify
            </h2>
            <p className="text-sm text-gray-600">We sent a verification link to:</p>
            <p className="text-sm font-bold text-gray-900 mb-4 break-all">
              {workEmail}
            </p>
            <p className="text-xs text-gray-500 italic mb-6">
              Once verified, this page will update automatically.
            </p>

            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <span className="text-sm text-gray-600">
                  Did not receive an email?
                </span>
                <button
                  onClick={handleResendEmail}
                  className="text-sm font-bold text-teal hover:underline"
                >
                  Resend
                </button>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <span className="text-sm text-gray-600">Wrong email?</span>
                <button
                  onClick={handleEditEmail}
                  className="text-sm font-bold text-teal hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Dev-only shortcut for MVP — simulates clicking the email link */}
            <button
              onClick={simulateVerificationClick}
              className="mt-6 w-full py-2.5 rounded-full text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              [Demo] I clicked the link — continue
            </button>
          </div>
        )}

        {/* ─── STEP 3: VERIFYING SPINNER ──────────────────────────── */}
        {step === "verifying" && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-teal animate-spin" />
            <p className="text-sm font-medium text-gray-600">
              Verifying your account…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
