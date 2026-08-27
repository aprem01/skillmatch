"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Check, ArrowRight, X, Star } from "lucide-react";
import SkillmatchHeader from "@/components/SkillmatchHeader";
import RecruiterVerificationModal, {
  isRecruiterVerified,
  refreshRecruiterVerification,
} from "@/components/RecruiterVerificationModal";
import SubscriptionModal, {
  isSubscribed,
  refreshSubscriptionStatus,
} from "@/components/SubscriptionModal";

interface CandidateRow {
  handle: string;
  match: string; // for top: "check"; for close: "11/12"
  extra: string; // "+5", "+4", "+0"
  availability: string; // "now", "In 3 weeks" etc.
}

const TOP_CANDIDATES: CandidateRow[] = [
  { handle: "KeqJLS", match: "check", extra: "+5", availability: "In 3 months" },
  { handle: "JoeMy395", match: "check", extra: "+5", availability: "now" },
  { handle: "MuuYu301", match: "check", extra: "+5", availability: "now" },
  { handle: "Foaky222", match: "check", extra: "+4", availability: "In 2 weeks" },
];

const CLOSE_MATCHES: CandidateRow[] = [
  { handle: "Tosds403", match: "11/12", extra: "+2", availability: "now" },
  { handle: "SeDo130", match: "11/12", extra: "+0", availability: "In 6 months" },
  { handle: "ZesRe501", match: "10/12", extra: "+3", availability: "In 3 weeks" },
  { handle: "KacC001", match: "9/12", extra: "+3", availability: "now" },
  { handle: "MemBu113", match: "9/12", extra: "+2", availability: "now" },
  { handle: "WeeMe445", match: "9/12", extra: "+0", availability: "In 6 months" },
  { handle: "Veo1y906", match: "8/12", extra: "+3", availability: "In 3 weeks" },
  { handle: "CallKa809", match: "7/12", extra: "+3", availability: "now" },
  { handle: "BooC606", match: "7/12", extra: "+2", availability: "now" },
  { handle: "KarD307", match: "7/12", extra: "+0", availability: "In 6 months" },
  { handle: "MooAx758", match: "6/12", extra: "+3", availability: "In 3 weeks" },
];

// Placeholder extras for the demo candidate drawer. Caroline 6/27:
// keep these on-vertical for the canonical HHA demo path so it doesn't
// look like a copy-paste design template. Real candidate data replaces
// this once /api/employer/candidates returns from the live UserSkill
// pool (already wired — falls back to mock only when pool is empty).
const EXTRA_SKILL_DETAILS = [
  "Dementia and Alzheimer's care",
  "Hospice and palliative care support",
  "Experience with adaptive equipment",
  "CNA certification",
];

function AvailabilityCell({ value }: { value: string }) {
  if (value === "now") {
    return (
      <span className="inline-flex items-center">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
        now
      </span>
    );
  }
  return <>{value}</>;
}

type GatedAction =
  | { kind: "invite"; candidate: CandidateRow }
  | { kind: "ask"; candidate: CandidateRow }
  | { kind: "hire"; candidate: CandidateRow };

function CandidatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobTitle, setJobTitle] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [inviteCandidate, setInviteCandidate] = useState<CandidateRow | null>(
    null
  );
  const [slot1, setSlot1] = useState("");
  const [slot2, setSlot2] = useState("");
  const [slot3, setSlot3] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  // Caroline 8/26 Round 8: Save is scoped to a specific job posting, not
  // global. Structure in localStorage:
  //   skillmatch_saved_by_job = { [jobKey: string]: string[] handles }
  // jobKey resolves from the current job title (or "__default" when the
  // recruiter hasn't loaded a job). Legacy skillmatch_saved (flat array)
  // is migrated into the "__legacy" slot on first mount.
  const [savedHandles, setSavedHandles] = useState<Set<string>>(new Set());
  // Caroline 8/26 Round 8: live candidate fetch replaces the FPO
  // TOP_CANDIDATES / CLOSE_MATCHES arrays. When the pool is empty we
  // render an explicit empty state instead of placeholder rows. The
  // legacy arrays are kept only for ?demo=1 preview URLs.
  const [liveTop, setLiveTop] = useState<CandidateRow[]>([]);
  const [liveClose, setLiveClose] = useState<CandidateRow[]>([]);
  const [candidatesLoaded, setCandidatesLoaded] = useState(false);
  const [candidateFetchFailed, setCandidateFetchFailed] = useState(false);
  const demoMode = searchParams?.get("demo") === "1";

  // Gating: invite + ask + hire all require recruiter to be verified AND
  // subscribed. We hold the intended action while the modals run, then
  // replay it once both gates pass.
  const [pendingAction, setPendingAction] = useState<GatedAction | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);

  // Job key drives the scoped saved-candidates set. When jobTitle
  // hasn't loaded yet we use "__default" so the effect can re-run once
  // jobTitle is known.
  const jobKey = (jobTitle || "__default").trim().toLowerCase();

  useEffect(() => {
    // Migrate legacy global `skillmatch_saved` → per-job map's "__legacy"
    // bucket the first time we see it, then delete the old key.
    try {
      const legacy = localStorage.getItem("skillmatch_saved");
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const bookRaw = localStorage.getItem("skillmatch_saved_by_job");
          const book = bookRaw ? JSON.parse(bookRaw) : {};
          book.__legacy = parsed;
          localStorage.setItem(
            "skillmatch_saved_by_job",
            JSON.stringify(book)
          );
        }
        localStorage.removeItem("skillmatch_saved");
      }
    } catch {}
    // Load the set for the current job.
    try {
      const bookRaw = localStorage.getItem("skillmatch_saved_by_job");
      const book = bookRaw ? JSON.parse(bookRaw) : {};
      const list: string[] = Array.isArray(book[jobKey]) ? book[jobKey] : [];
      setSavedHandles(new Set(list));
    } catch {
      setSavedHandles(new Set());
    }
  }, [jobKey]);

  // Placeholder effect body (kept for the original verified-magic-link
  // handling below).
  useEffect(() => {

    // Returning from the Resend magic-link → refresh verified state.
    const verifiedParam = searchParams?.get("verified");
    const verifiedEmail = searchParams?.get("email");
    if (verifiedParam === "1") {
      void refreshRecruiterVerification(verifiedEmail || undefined).then(
        (ok) => {
          if (ok && pendingAction) {
            // Verification cleared — next gate is subscription, which the
            // existing handleVerified flow will trigger when the action
            // re-runs.
            const a = pendingAction;
            setPendingAction(null);
            handleVerified();
            void a; // referenced — handleVerified replays via state
          }
        }
      );
      router.replace("/candidates");
    }

    // Returning from Stripe Checkout — refresh the cached subscription
    // state from the webhook-backed Subscription table.
    const subParam = searchParams?.get("subscribed");
    if (subParam === "1") {
      void refreshSubscriptionStatus().then((ok) => {
        if (ok && pendingAction) {
          const a = pendingAction;
          setPendingAction(null);
          runAction(a);
        }
      });
      // Clean the param so reload doesn't re-trigger
      router.replace("/candidates");
    }

    const urlRole = searchParams?.get("role");
    const saved = localStorage.getItem("skillmatch_job");

    if (!saved && !urlRole) {
      router.push("/post-job");
      return;
    }
    try {
      if (saved) {
        const job = JSON.parse(saved);
        const fromStorage = job.selectedRole || job.roleInput || job.role || "";
        if (fromStorage) {
          setJobTitle(fromStorage);
          return;
        }
      }
      if (urlRole) {
        setJobTitle(urlRole);
        return;
      }
      setJobTitle("");
    } catch {
      setJobTitle(urlRole || "");
    }
  }, [router, searchParams]);

  // Caroline 8/26 Round 8: fetch live candidates from the shared user
  // pool. Empty result → explicit empty state (never FPO). The mapping
  // below squashes API's Candidate into CandidateRow so the existing
  // renderRow function works unchanged.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      try {
        const saved = localStorage.getItem("skillmatch_job");
        if (!saved) {
          setCandidatesLoaded(true);
          return;
        }
        const job = JSON.parse(saved);
        const required: string[] = Array.isArray(job.requiredSkills)
          ? job.requiredSkills
          : [];
        const optional: string[] = Array.isArray(job.optionalSkills)
          ? job.optionalSkills
          : [];
        if (required.length === 0 && optional.length === 0) {
          setCandidatesLoaded(true);
          return;
        }
        const res = await fetch("/api/employer/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requiredSkills: required,
            optionalSkills: optional,
            role: job.selectedRole || job.roleInput || job.role || null,
          }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const rows: CandidateRow[] = (data.candidates || []).map(
          (c: {
            handle: string;
            matchScore: number;
            matchedRequired: string[];
            missingRequired: string[];
            totalRequired: number;
          }) => ({
            handle: c.handle,
            match:
              c.missingRequired.length === 0
                ? "check"
                : `${c.matchedRequired.length}/${c.totalRequired}`,
            extra: "+0",
            availability: "now",
          })
        );
        setLiveTop(rows.filter((_, i) => (data.candidates[i] as { missingRequired: string[] }).missingRequired.length === 0));
        setLiveClose(rows.filter((_, i) => (data.candidates[i] as { missingRequired: string[] }).missingRequired.length > 0));
        setCandidatesLoaded(true);
      } catch {
        if (!cancelled) {
          setCandidateFetchFailed(true);
          setCandidatesLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Rows to render — live pool by default, FPO arrays only in ?demo=1.
  const topRows = demoMode ? TOP_CANDIDATES : liveTop;
  const closeRows = demoMode ? CLOSE_MATCHES : liveClose;
  const hasAnyRows = topRows.length + closeRows.length > 0;

  function openInvite(c: CandidateRow) {
    setInviteCandidate(c);
    setSlot1("");
    setSlot2("");
    setSlot3("");
    setInviteMessage("");
  }

  function closeInvite() {
    setInviteCandidate(null);
  }

  function toggleSave(handle: string) {
    setSavedHandles((prev) => {
      const next = new Set(prev);
      if (next.has(handle)) next.delete(handle);
      else next.add(handle);
      // Caroline 8/26 Round 8: scope to the current job.
      try {
        const raw = localStorage.getItem("skillmatch_saved_by_job");
        const book = raw ? JSON.parse(raw) : {};
        book[jobKey] = Array.from(next);
        localStorage.setItem("skillmatch_saved_by_job", JSON.stringify(book));
      } catch {}
      return next;
    });
  }

  // Run the pending action once verification + subscription gates pass.
  function runAction(action: GatedAction) {
    if (action.kind === "invite") {
      openInvite(action.candidate);
    } else if (action.kind === "ask") {
      router.push(
        `/messages?new=${encodeURIComponent(action.candidate.handle)}` +
          `&subject=${encodeURIComponent("Question about " + (jobTitle || "your skills"))}`
      );
    } else if (action.kind === "hire") {
      // Unlock & Hire modal — not yet designed (Caroline 5/22).
      // For now, just take them to messages with a hire-flavored subject.
      router.push(
        `/messages?new=${encodeURIComponent(action.candidate.handle)}` +
          `&subject=${encodeURIComponent("Offer for " + (jobTitle || "your role"))}`
      );
    }
  }

  // Entry point: route action through verification → subscription gates.
  function gateAction(action: GatedAction) {
    if (!isRecruiterVerified()) {
      setPendingAction(action);
      setVerifyOpen(true);
      return;
    }
    if (!isSubscribed()) {
      setPendingAction(action);
      setSubOpen(true);
      return;
    }
    runAction(action);
  }

  function handleVerified() {
    setVerifyOpen(false);
    if (!isSubscribed()) {
      setSubOpen(true);
      return;
    }
    if (pendingAction) {
      const a = pendingAction;
      setPendingAction(null);
      runAction(a);
    }
  }

  function handleSubscribed() {
    setSubOpen(false);
    if (pendingAction) {
      const a = pendingAction;
      setPendingAction(null);
      runAction(a);
    }
  }

  function renderRow(
    c: CandidateRow,
    section: "top" | "close",
    idx: number
  ) {
    const key = `${section}-${idx}-${c.handle}`;
    const isExpanded = expandedKey === key;
    const handleColor = section === "top" ? "text-skTeal" : "text-skGray";
    const matchCol =
      c.match === "check" ? (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-skTeal/10 text-skTeal">
          <Check size={16} strokeWidth={3} />
        </span>
      ) : (
        <span className="font-bold text-skGray">{c.match}</span>
      );

    return (
      <div
        key={key}
        className={`border-b border-gray-100 last:border-0 ${
          isExpanded ? "bg-skBeta-bg" : ""
        }`}
      >
        {/* Desktop row */}
        <button
          onClick={() => setExpandedKey(isExpanded ? null : key)}
          className="hidden md:grid w-full grid-cols-[40%_15%_15%_30%] items-center px-6 py-4 text-left hover:bg-skBeta-bg transition-colors cursor-pointer"
        >
          <div
            className={`font-bold ${handleColor}`}
            style={{ fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif" }}
          >
            {c.handle}
          </div>
          <div className="flex items-center">{matchCol}</div>
          <div className="font-bold text-skTeal">{c.extra}</div>
          <div className="flex items-center justify-between pr-2">
            <span className="text-skGray">
              <AvailabilityCell value={c.availability} />
            </span>
            <ChevronDown
              size={16}
              className={`text-skGray-desc transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Mobile card */}
        <button
          onClick={() => setExpandedKey(isExpanded ? null : key)}
          className="md:hidden w-full px-4 py-4 text-left hover:bg-skBeta-bg transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`font-bold ${handleColor}`}
              style={{ fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif" }}
            >
              {c.handle}
            </span>
            <ChevronDown
              size={16}
              className={`text-skGray-desc transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs uppercase text-skGray-desc mb-0.5">
                Match
              </div>
              <div>{matchCol}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-skGray-desc mb-0.5">
                Extra
              </div>
              <div className="font-bold text-skTeal">{c.extra}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-skGray-desc mb-0.5">
                Available
              </div>
              <div className="text-skGray text-xs">
                <AvailabilityCell value={c.availability} />
              </div>
            </div>
          </div>
        </button>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="px-4 md:px-6 pb-6 pt-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6">
              <p className="text-sm text-skGray mb-3 text-left">
                <span className="font-semibold text-gray-700">
                  {section === "top"
                    ? "Has all 12 required skills"
                    : `Has ${c.match} required skills`}
                </span>
                {" + "}
                {EXTRA_SKILL_DETAILS.join(" • ")}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  gateAction({ kind: "ask", candidate: c });
                }}
                className="text-sm text-skTeal font-semibold hover:underline mb-5"
              >
                Ask a Question
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                {/* Save — toggleable, fills blue when saved (Caroline 5/22) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(c.handle);
                  }}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 font-bold transition-colors ${
                    savedHandles.has(c.handle)
                      ? "bg-skBeta-bg border-skTeal-bright text-skTeal-bright"
                      : "bg-white border-skTeal-bright text-skTeal-bright hover:bg-skBeta-bg"
                  }`}
                  style={{ fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif" }}
                  aria-pressed={savedHandles.has(c.handle)}
                >
                  {savedHandles.has(c.handle) ? (
                    <Image
                      src="/icon-star-filled.png"
                      alt=""
                      width={18}
                      height={18}
                      aria-hidden="true"
                    />
                  ) : (
                    <Star size={16} strokeWidth={2.5} fill="none" />
                  )}
                  {savedHandles.has(c.handle) ? "Saved" : "Save"}
                </button>

                {/* Invite to Interview */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    gateAction({ kind: "invite", candidate: c });
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-skTeal text-white font-bold hover:opacity-90 transition-opacity"
                  style={{ fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif" }}
                >
                  Invite to Interview <ArrowRight size={16} />
                </button>

                {/* Unlock & Hire */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    gateAction({ kind: "hire", candidate: c });
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-skBlue text-white font-bold hover:opacity-90 transition-opacity"
                  style={{ fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif" }}
                >
                  Unlock &amp; Hire <ArrowRight size={16} />
                </button>
              </div>

              <p className="text-left text-xs text-skGray-desc">
                Candidates remain anonymous until you invite or hire.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-coolgray-50">
      {/* Teal top bar */}
      <div className="h-1 bg-skTeal" />

      <SkillmatchHeader messageCount={21} />
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.push("/post-job?edit=1")}
          className="text-sm text-skGray hover:text-skTeal transition-colors"
        >
          ← Edit role
        </button>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Summary bar */}
        <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1
              className="text-xl md:text-2xl font-bold mb-1"
              style={{
                color: "#719192",
                fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif",
              }}
            >
              {jobTitle || "Your role"}
            </h1>
            <p className="text-sm text-skGray-desc">
              {candidatesLoaded
                ? `${topRows.length + closeRows.length} candidate${
                    topRows.length + closeRows.length === 1 ? "" : "s"
                  } found`
                : "Searching your talent pool…"}
            </p>
          </div>
          <div className="shrink-0">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-skTeal text-skTeal font-semibold text-sm hover:bg-skBeta-bg transition-colors">
              Openings: 1 <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Caroline 6/27 Round 4: when arriving via ?filter=saved from
            the header dropdown or dashboard arrow, show only saved
            candidates instead of the full Top + Close tables. */}
        {(() => {
          const filterMode = searchParams?.get("filter") === "saved";
          if (filterMode) {
            const allRows = [...topRows, ...closeRows];
            const savedRows = allRows.filter((c) => savedHandles.has(c.handle));
            return (
              <section className="mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-4 md:px-6 py-3 bg-skTeal text-white font-bold text-sm md:text-base">
                    Saved candidates ({savedRows.length})
                  </div>
                  {savedRows.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <p className="text-sm text-skGray-desc mb-2">
                        No saved candidates yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push("/candidates")}
                        className="text-sm text-skTeal font-semibold hover:underline"
                      >
                        Browse candidates →
                      </button>
                    </div>
                  ) : (
                    <div>
                      {savedRows.map((c, i) => renderRow(c, "top", i))}
                    </div>
                  )}
                </div>
              </section>
            );
          }
          // Caroline 8/26 Round 8: proper empty state when the shared
          // pool has no matching candidates (no FPO fallback).
          if (candidatesLoaded && !hasAnyRows) {
            return (
              <section className="mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm px-6 py-12 text-center">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">
                    {candidateFetchFailed
                      ? "We couldn't load candidates right now."
                      : "No candidates found yet."}
                  </h2>
                  <p className="text-sm text-skGray-desc leading-relaxed max-w-md mx-auto">
                    {candidateFetchFailed
                      ? "Please try again in a moment."
                      : "We’ll notify you when candidates matching this role become available. In the meantime, refine the required skills or broaden the role."}
                  </p>
                </div>
              </section>
            );
          }
          if (!candidatesLoaded) {
            return (
              <section className="mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm px-6 py-12 text-center">
                  <p className="text-sm text-skGray-desc">Loading candidates…</p>
                </div>
              </section>
            );
          }
          return (
            <>
              {/* Top Candidates table */}
              <section className="mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-4 md:px-6 py-3 bg-skBlue text-white font-bold text-sm md:text-base">
                    Top Candidates (meet all required skills. Sorted by additional skills)
                  </div>

                  {/* Column headers (desktop) */}
                  <div
                    className="hidden md:grid grid-cols-[40%_15%_15%_30%] px-6 py-2.5 border-b border-gray-200 text-xs uppercase tracking-wider font-semibold"
                    style={{ backgroundColor: "#DEFBFF", color: "#719192" }}
                  >
                    <div>Candidate</div>
                    <div>Top Match</div>
                    <div>Extra Skills</div>
                    <div>Availability</div>
                  </div>

                  <div>
                    {topRows.length === 0 ? (
                      <p className="px-6 py-8 text-center text-sm text-skGray-desc">
                        No candidates yet meet every required skill for this role.
                      </p>
                    ) : (
                      topRows.map((c, i) => renderRow(c, "top", i))
                    )}
                  </div>
                </div>
              </section>

              {/* Close Matches table */}
              <section className="mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-4 md:px-6 py-3 bg-skGreen text-white font-bold text-sm md:text-base">
                    Close Matches (missing some required skills)
                  </div>

                  {/* Column headers (desktop) */}
                  <div
                    className="hidden md:grid grid-cols-[40%_15%_15%_30%] px-6 py-2.5 border-b border-gray-200 text-xs uppercase tracking-wider font-semibold"
                    style={{ backgroundColor: "#DEFCE8", color: "#719192" }}
                  >
                    <div>Candidate</div>
                    <div>Match</div>
                    <div>Extra Skills</div>
                    <div>Availability</div>
                  </div>

                  <div>
                    {closeRows.length === 0 ? (
                      <p className="px-6 py-8 text-center text-sm text-skGray-desc">
                        No close matches yet.
                      </p>
                    ) : (
                      closeRows.map((c, i) => renderRow(c, "close", i))
                    )}
                  </div>
                </div>
              </section>
            </>
          );
        })()}
      </main>

      {/* Invite to Interview Modal — teal, feels like a game not a form */}
      {inviteCandidate && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={closeInvite}
        >
          <div
            className="bg-skTeal rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8 text-white">
              <div className="flex items-start justify-between mb-1">
                <h2
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif" }}
                >
                  Invite {inviteCandidate.handle} to Interview
                </h2>
                <button
                  onClick={closeInvite}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-white/90 mb-6">
                Match all required skills • {inviteCandidate.extra} extra skills • Available{" "}
                {inviteCandidate.availability}
              </p>

              <h3 className="font-semibold text-white mb-3">
                Pick 3 times that work for you:
              </h3>

              <div className="flex flex-col gap-3 mb-6">
                {[
                  { label: "Slot 1", value: slot1, set: setSlot1 },
                  { label: "Slot 2", value: slot2, set: setSlot2 },
                  { label: "Slot 3", value: slot3, set: setSlot3 },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <label className="text-xs font-semibold text-white/90 mb-1">
                      {s.label}
                    </label>
                    <input
                      type="datetime-local"
                      value={s.value}
                      onChange={(e) => s.set(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/40 border border-white/20"
                      style={{ backgroundColor: "#04AFAA", colorScheme: "dark" }}
                    />
                  </div>
                ))}
              </div>

              <label className="block text-sm font-semibold text-white mb-2">
                Optional Message (Recommended)
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="We'd love to speak with you about this role..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none mb-6 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/40 border border-white/20"
                style={{ backgroundColor: "#04AFAA" }}
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={closeInvite}
                  className="px-5 py-2.5 rounded-xl text-white font-bold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: "#45D6D2",
                    fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: "#01D6FF",
                    fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif",
                  }}
                >
                  Send Invite <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recruiter verification gate — Caroline 5/22.
          Required before sending an invite, asking a question, or hiring. */}
      <RecruiterVerificationModal
        open={verifyOpen}
        onClose={() => {
          setVerifyOpen(false);
          setPendingAction(null);
        }}
        onVerified={handleVerified}
      />

      {/* Subscription gate — Caroline 5/22.
          Required immediately after verification before the action runs. */}
      <SubscriptionModal
        open={subOpen}
        onClose={() => {
          setSubOpen(false);
          setPendingAction(null);
        }}
        onSubscribed={handleSubscribed}
      />
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-coolgray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-skTeal border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CandidatesContent />
    </Suspense>
  );
}
