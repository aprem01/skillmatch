"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Check, ArrowRight, X, Star } from "lucide-react";
import SkillmatchHeader from "@/components/SkillmatchHeader";

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

const EXTRA_SKILL_DETAILS = [
  "Sketch",
  "Rhino",
  "Procurement",
  "Urban Planning",
  "Risk Management",
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

  useEffect(() => {
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

              <button className="text-sm text-skTeal font-semibold hover:underline mb-5">
                + Add a Question
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                {/* Save */}
                <button
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-skTeal-bright text-skTeal-bright font-bold hover:bg-skBeta-bg transition-colors"
                  style={{ fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif" }}
                >
                  <Star size={16} strokeWidth={2.5} />
                  Save
                </button>

                {/* Invite to Interview */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openInvite(c);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-skTeal text-white font-bold hover:opacity-90 transition-opacity"
                  style={{ fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif" }}
                >
                  Invite to Interview <ArrowRight size={16} />
                </button>

                {/* Unlock & Hire */}
                <button
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

      <SkillmatchHeader active="dashboard" messageCount={21} />
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.push("/post-job")}
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
              ~148 candidates found • Avg market pay: $34-$42/hr
            </p>
          </div>
          <div className="shrink-0">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-skTeal text-skTeal font-semibold text-sm hover:bg-skBeta-bg transition-colors">
              Openings: 1 <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Top Candidates table */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-4 md:px-6 py-3 bg-skBlue text-white font-bold text-sm md:text-base">
              Top Candidates (meet all required skills. Ranked by extra skills)
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
              {TOP_CANDIDATES.map((c, i) => renderRow(c, "top", i))}
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
              {CLOSE_MATCHES.map((c, i) => renderRow(c, "close", i))}
            </div>
          </div>
        </section>
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
