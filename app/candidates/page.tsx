"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ChevronDown, Check } from "lucide-react";

interface Candidate {
  handle: string;
  matchScore: number;
  matchedRequired: string[];
  matchedOptional: string[];
  missingRequired: string[];
  totalRequired: number;
  totalOptional: number;
}

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedHandle, setExpandedHandle] = useState<string | null>(null);
  const [unlockedHandles, setUnlockedHandles] = useState<Set<string>>(
    new Set()
  );
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("skillmatch_job");
    if (!saved) {
      router.push("/post-job");
      return;
    }

    const job = JSON.parse(saved);
    setJobTitle(job.selectedRole || job.roleInput || "");

    async function fetchCandidates() {
      try {
        const res = await fetch("/api/employer/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requiredSkills: job.requiredSkills || [],
            optionalSkills: job.optionalSkills || [],
            employment: job.employment,
            location: job.location,
            pay: job.pay,
          }),
        });
        const data = await res.json();
        setCandidates(data.candidates || []);
      } catch {
        setCandidates([]);
      }
      setIsLoading(false);
    }
    fetchCandidates();
  }, [router]);

  function unlockCandidate(handle: string) {
    const updated = new Set(unlockedHandles);
    updated.add(handle);
    setUnlockedHandles(updated);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-coolgray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-teal mx-auto mb-3" size={36} />
          <p className="text-gray-600 font-medium">
            Finding your best candidates...
          </p>
        </div>
      </div>
    );
  }

  const perfectMatches = candidates.filter((c) => c.matchScore >= 90);
  const strongMatches = candidates.filter(
    (c) => c.matchScore >= 70 && c.matchScore < 90
  );
  void candidates.filter((c) => c.matchScore < 70); // partialMatches for future use

  return (
    <div className="min-h-screen bg-coolgray-50">
      {/* Teal top bar */}
      <div className="h-1 bg-teal" />

      {/* Header */}
      <header className="py-4 px-4 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold italic text-teal">Skillmatch</h1>
          <button
            onClick={() => router.push("/post-job")}
            className="text-sm text-gray-500 hover:text-teal transition-colors"
          >
            ← Edit role
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {candidates.length} candidates found
          </h2>
          <p className="text-gray-500">
            for <span className="font-semibold text-teal">{jobTitle}</span>
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="px-3 py-1 bg-teal-light text-teal-dark rounded-full font-medium">
              {perfectMatches.length} perfect matches
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
              {strongMatches.length} strong matches
            </span>
          </div>
        </div>

        {/* Candidate list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Candidate</div>
            <div className="col-span-2 text-center">Match</div>
            <div className="col-span-3">Required Skills</div>
            <div className="col-span-2">Optional Skills</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {candidates.map((c) => {
            const isExpanded = expandedHandle === c.handle;
            const isUnlocked = unlockedHandles.has(c.handle);
            const matchColor =
              c.matchScore >= 90
                ? "text-teal bg-teal-light"
                : c.matchScore >= 70
                  ? "text-amber-dark bg-amber-light"
                  : "text-gray-500 bg-gray-100";

            return (
              <div key={c.handle} className="border-b border-gray-100 last:border-0">
                <button
                  onClick={() =>
                    setExpandedHandle(isExpanded ? null : c.handle)
                  }
                  className="w-full grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Handle */}
                  <div className="col-span-3">
                    <p className="font-bold text-gray-900 text-sm">
                      {c.handle}
                    </p>
                  </div>

                  {/* Match score */}
                  <div className="col-span-2 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-sm font-bold ${matchColor}`}
                    >
                      {c.matchScore}%
                    </span>
                  </div>

                  {/* Required */}
                  <div className="col-span-3">
                    <span className="text-sm text-gray-600">
                      {c.matchedRequired.length}/{c.totalRequired} matched
                    </span>
                  </div>

                  {/* Optional */}
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">
                      {c.matchedOptional.length}/{c.totalOptional}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="col-span-2 text-right flex items-center justify-end gap-2">
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="bg-gray-50 rounded-xl p-5">
                      {/* Matched required skills */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Required Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.matchedRequired.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-light text-teal-dark"
                            >
                              <Check size={12} /> {s}
                            </span>
                          ))}
                          {c.missingRequired.map((s) => (
                            <span
                              key={s}
                              className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-500 border border-red-200"
                            >
                              ✗ {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Matched optional */}
                      {c.matchedOptional.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Optional Skills
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {c.matchedOptional.map((s) => (
                              <span
                                key={s}
                                className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-light text-green-dark"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Unlock / Contact CTA */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {isUnlocked ? (
                          <div>
                            <p className="text-sm text-teal font-semibold mb-1">
                              Candidate unlocked!
                            </p>
                            <p className="text-xs text-gray-500">
                              Contact details will be shared when the
                              candidate accepts your invitation.
                            </p>
                            <button className="mt-2 px-5 py-2 bg-teal text-white font-semibold rounded-full text-sm hover:bg-teal-dark transition-colors">
                              Send Invitation
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unlockCandidate(c.handle);
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal text-white font-semibold rounded-full text-sm hover:bg-teal-dark transition-colors"
                          >
                            <Lock size={14} /> Unlock this candidate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
