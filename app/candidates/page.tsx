"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, ArrowRight, X } from "lucide-react";
import SkillmatchHeader from "@/components/SkillmatchHeader";

interface CandidateRow {
  handle: string;
  match: string; // for top: "✓"; for close: "11/12"
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

const DEFAULT_TIME_SLOTS = [
  "Tue, Apr 28 • 2:00 PM",
  "Wed, Apr 29 • 10:30 AM",
  "Thu, Apr 30 • 4:00 PM",
];

export default function CandidatesPage() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [inviteCandidate, setInviteCandidate] = useState<CandidateRow | null>(
    null
  );
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [inviteMessage, setInviteMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("skillmatch_job");
    if (!saved) {
      router.push("/post-job");
      return;
    }
    try {
      const job = JSON.parse(saved);
      setJobTitle(
        job.selectedRole ||
          job.roleInput ||
          "Design Director — Construction/Architecture"
      );
    } catch {
      setJobTitle("Design Director — Construction/Architecture");
    }
  }, [router]);

  function toggleSlot(slot: string) {
    setSelectedSlots((prev) =>
      prev.includes(slot)
        ? prev.filter((s) => s !== slot)
        : prev.length >= 3
          ? prev
          : [...prev, slot]
    );
  }

  function openInvite(c: CandidateRow) {
    setInviteCandidate(c);
    setSelectedSlots([]);
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
    const matchCol =
      c.match === "check" ? (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal/10 text-teal">
          <Check size={16} strokeWidth={3} />
        </span>
      ) : (
        <span className="font-bold text-gray-700">{c.match}</span>
      );

    return (
      <div
        key={key}
        className={`border-b border-gray-100 last:border-0 ${
          isExpanded ? "bg-teal/5" : ""
        }`}
      >
        {/* Desktop row */}
        <button
          onClick={() => setExpandedKey(isExpanded ? null : key)}
          className="hidden md:grid w-full grid-cols-[40%_15%_15%_30%] items-center px-6 py-4 text-left hover:bg-teal/5 transition-colors cursor-pointer"
        >
          <div className="font-bold text-teal">{c.handle}</div>
          <div className="flex items-center">{matchCol}</div>
          <div className="font-bold text-teal">{c.extra}</div>
          <div className="flex items-center justify-between pr-2">
            <span className="text-gray-700">{c.availability}</span>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Mobile card */}
        <button
          onClick={() => setExpandedKey(isExpanded ? null : key)}
          className="md:hidden w-full px-4 py-4 text-left hover:bg-teal/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-teal">{c.handle}</span>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs uppercase text-gray-400 mb-0.5">
                {section === "top" ? "Match" : "Match"}
              </div>
              <div>{matchCol}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400 mb-0.5">
                Extra
              </div>
              <div className="font-bold text-teal">{c.extra}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400 mb-0.5">
                Available
              </div>
              <div className="text-gray-700 text-xs">{c.availability}</div>
            </div>
          </div>
        </button>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="px-4 md:px-6 pb-6 pt-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6">
              <p className="text-sm text-gray-700 mb-3">
                <span className="font-semibold">
                  {section === "top"
                    ? "Has all 12 required skills"
                    : `Has ${c.match} required skills`}
                </span>
                {" • "}
                {EXTRA_SKILL_DETAILS.join(" • ")}
              </p>

              <button className="text-sm text-teal font-medium hover:underline mb-5">
                + Add a Question
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-4">
                <button className="px-6 py-2 rounded-full border border-teal text-teal font-semibold hover:bg-teal/5 transition-colors">
                  Save
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openInvite(c);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-teal text-white font-semibold hover:bg-teal/90 transition-colors"
                >
                  Invite to Interview <ArrowRight size={16} />
                </button>
                <button className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-teal text-white font-semibold hover:bg-teal/90 transition-colors">
                  Unlock & Hire <ArrowRight size={16} />
                </button>
              </div>

              <p className="text-center text-xs text-gray-500">
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
      <div className="h-1 bg-teal" />

      <SkillmatchHeader active="dashboard" messageCount={21} />
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.push("/post-job")}
          className="text-sm text-gray-500 hover:text-teal transition-colors"
        >
          ← Edit role
        </button>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Summary bar */}
        <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
              {jobTitle || "Design Director — Construction/Architecture"}
            </h1>
            <p className="text-sm text-gray-500">
              ~148 candidates found • Avg market pay: $34-$42/hr
            </p>
          </div>
          <div className="shrink-0">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal text-teal font-semibold text-sm hover:bg-teal/5 transition-colors">
              Openings: 1 <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Top Candidates table */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-4 md:px-6 py-3 bg-teal text-white font-bold text-sm md:text-base">
              Top Candidates (meet all required skills. Ranked by extra skills)
            </div>

            {/* Column headers (desktop) */}
            <div className="hidden md:grid grid-cols-[40%_15%_15%_30%] px-6 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
            <div className="px-4 md:px-6 py-3 bg-teal text-white font-bold text-sm md:text-base">
              Close Matches (missing some required skills)
            </div>

            {/* Column headers (desktop) */}
            <div className="hidden md:grid grid-cols-[40%_15%_15%_30%] px-6 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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

      {/* Invite to Interview Modal */}
      {inviteCandidate && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={closeInvite}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-xl font-bold text-gray-900">
                  Invite {inviteCandidate.handle} to Interview
                </h2>
                <button
                  onClick={closeInvite}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Match all required skills • +5 extra skills • Available now
              </p>

              <h3 className="font-semibold text-gray-900 mb-3">
                Select interview times (choose 3):
              </h3>

              <div className="flex flex-col gap-2 mb-3">
                {DEFAULT_TIME_SLOTS.map((slot) => {
                  const selected = selectedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => toggleSlot(slot)}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium text-left border transition-colors ${
                        selected
                          ? "bg-teal text-white border-teal"
                          : "bg-white text-gray-700 border-gray-300 hover:border-teal hover:text-teal"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              <button className="text-sm text-teal font-medium hover:underline mb-6">
                + Add another time
              </button>

              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Optional Message (Recommended)
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="We'd love to speak with you about this role..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-teal text-sm resize-none mb-6"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={closeInvite}
                  className="px-5 py-2 rounded-full text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-teal text-white font-semibold hover:bg-teal/90 transition-colors">
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
