"use client";

import { useState, useEffect, useCallback } from "react";

interface EmptySearch {
  role?: string;
  skills: string[];
  at: string;
}

interface RolesStats {
  total: number;
  errors: number;
  noResultRate: number;
  avgDurationMs: number;
  topQueries: { query: string; count: number }[];
}

interface CandidatesStats {
  total: number;
  errors: number;
  emptyRate: number;
  avgDurationMs: number;
  avgCandidatesReturned: number;
  avgPerfectMatches: number;
  avgRequiredSkillCount: number;
  topRequiredSkills: { skill: string; count: number }[];
  recentEmptySearches: EmptySearch[];
}

interface WindowStats {
  roles: RolesStats;
  candidates: CandidatesStats;
}

interface StatsResponse {
  generatedAt: string;
  eventCounts: { event: string; _count: number }[];
  windows: {
    "24h": WindowStats;
    "7d": WindowStats;
    "30d": WindowStats;
  };
}

export default function AdminDashboard() {
  const [key, setKey] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [windowKey, setWindowKey] = useState<"24h" | "7d" | "30d">("24h");

  const fetchStats = useCallback(async (k: string) => {
    if (!k) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/stats?key=${encodeURIComponent(k)}`);
      if (!r.ok) {
        setError(r.status === 401 ? "Wrong key" : `Error ${r.status}`);
        setStats(null);
      } else {
        const data = await r.json();
        setStats(data);
        sessionStorage.setItem("skillmatch_admin_key", k);
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("skillmatch_admin_key");
    if (saved) {
      setKey(saved);
      fetchStats(saved);
    }
  }, [fetchStats]);

  const w = stats?.windows[windowKey];

  return (
    <div className="min-h-screen bg-coolgray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-teal italic">Skillmatch</span>
          <span className="text-gray-500 font-normal text-xl ml-2 not-italic">
            / admin
          </span>
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Employer-side production analytics &amp; debugging.
        </p>

        {/* Auth */}
        {!stats && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Admin secret
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchStats(key)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-teal text-sm"
              placeholder="ADMIN_SECRET env var (same as PayRanker)"
            />
            <button
              onClick={() => fetchStats(key)}
              disabled={!key || loading}
              className="mt-3 w-full bg-teal text-white font-bold py-3 rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "View Stats"}
            </button>
            {error && (
              <p className="text-sm text-red-600 mt-2 font-medium">{error}</p>
            )}
          </div>
        )}

        {/* Stats viewer */}
        {stats && w && (
          <>
            {/* Window selector */}
            <div className="flex gap-2 mb-6">
              {(["24h", "7d", "30d"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setWindowKey(k)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                    windowKey === k
                      ? "bg-teal text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-teal"
                  }`}
                >
                  Last {k}
                </button>
              ))}
              <button
                onClick={() => fetchStats(key)}
                disabled={loading}
                className="ml-auto px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-teal"
              >
                ↻ Refresh
              </button>
            </div>

            {/* Section: Role searches */}
            <h2 className="text-lg font-bold text-gray-900 mt-2 mb-3">
              Role searches
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <KpiCard
                label="Searches"
                value={w.roles.total.toLocaleString()}
                hint={`${w.roles.errors} errors`}
              />
              <KpiCard
                label="No-result rate"
                value={`${(w.roles.noResultRate * 100).toFixed(1)}%`}
                hint="claude returned 0 variants"
                warn={w.roles.noResultRate > 0.15}
              />
              <KpiCard
                label="Avg duration"
                value={`${w.roles.avgDurationMs}ms`}
                hint="claude API"
                warn={w.roles.avgDurationMs > 4000}
              />
              <KpiCard
                label="Unique queries"
                value={w.roles.topQueries.length.toLocaleString()}
                hint="distinct role searches"
              />
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 mb-8">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">
                Top role queries
              </h3>
              {w.roles.topQueries.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No data yet.</p>
              ) : (
                <div className="space-y-2">
                  {w.roles.topQueries.map((q) => (
                    <div
                      key={q.query}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700 truncate pr-2">
                        {q.query}
                      </span>
                      <span className="font-bold text-teal shrink-0">
                        {q.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Candidate searches */}
            <h2 className="text-lg font-bold text-gray-900 mt-2 mb-3">
              Candidate searches
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <KpiCard
                label="Searches"
                value={w.candidates.total.toLocaleString()}
                hint={`${w.candidates.errors} errors`}
              />
              <KpiCard
                label="Empty-result rate"
                value={`${(w.candidates.emptyRate * 100).toFixed(1)}%`}
                hint={`avg ${w.candidates.avgRequiredSkillCount} req skills`}
                warn={w.candidates.emptyRate > 0.2}
              />
              <KpiCard
                label="Avg candidates"
                value={w.candidates.avgCandidatesReturned.toFixed(1)}
                hint={`${w.candidates.avgPerfectMatches.toFixed(1)} perfect`}
              />
              <KpiCard
                label="Avg duration"
                value={`${w.candidates.avgDurationMs}ms`}
                warn={w.candidates.avgDurationMs > 2000}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Top required skills */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">
                  Top required skills (employer side)
                </h3>
                {w.candidates.topRequiredSkills.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {w.candidates.topRequiredSkills.map((s) => (
                      <div
                        key={s.skill}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700 truncate pr-2">
                          {s.skill}
                        </span>
                        <span className="font-bold text-teal shrink-0">
                          {s.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent empty searches */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">
                  Recent zero-result candidate searches
                </h3>
                {w.candidates.recentEmptySearches.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    None — every search returned at least one candidate. 🎉
                  </p>
                ) : (
                  <div className="space-y-3">
                    {w.candidates.recentEmptySearches.map((m, i) => (
                      <div
                        key={i}
                        className="border-l-2 border-amber pl-3 py-1"
                      >
                        <p className="text-xs text-gray-400 mb-1">
                          {new Date(m.at).toLocaleString()}
                          {m.role && ` · ${m.role}`}
                        </p>
                        <p className="text-xs text-gray-700">
                          {m.skills.join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Event counts (shared DB across both apps) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 mt-6">
              <h2 className="font-bold text-gray-900 mb-3 text-sm">
                All-time event counts
                <span className="text-gray-400 font-normal ml-2 text-xs">
                  (PayRanker + Skillmatch share the same DB)
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.eventCounts.map((e) => (
                  <div
                    key={e.event}
                    className="bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <p className="text-xs text-gray-500">{e.event}</p>
                    <p className="font-bold text-gray-900">
                      {e._count.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-6 text-center italic">
              Generated at {new Date(stats.generatedAt).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 border-2 ${
        warn ? "border-amber" : "border-gray-200"
      }`}
    >
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p
        className={`text-2xl font-bold ${
          warn ? "text-amber-dark" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
