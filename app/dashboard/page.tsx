"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Clock,
  Plus,
  Search,
  X,
} from "lucide-react";

type OpenJob = {
  id: string;
  title: string;
  pay: string;
  type: string;
  location: string;
  postedDays: number;
  awaitingResponse?: number;
  metrics: {
    requiredSkills: number;
    lowMatchSkills: number;
    candidates: number;
    saved: number;
    savedBadge?: number;
    conversations: number;
    interviewsScheduled: number;
    offersSent: number;
  };
  skills: { name: string; lowMatch?: boolean }[];
};

type ClosedJob = {
  id: string;
  title: string;
  pay: string;
  type: string;
  location: string;
  closedOn: string;
  hires: number;
  metrics: {
    hires: number;
    candidates: number;
    interviews: number;
  };
};

const DEFAULT_SKILLS = [
  { name: "Solar Panels" },
  { name: "Electrical Wiring" },
  { name: "OSHA Certified" },
  { name: "Blueprint Reading", lowMatch: true },
  { name: "Roofing", lowMatch: true },
  { name: "Safety Compliance" },
  { name: "Troubleshooting" },
  { name: "Equipment Installation", lowMatch: true },
];

const OPEN_JOBS: OpenJob[] = [
  {
    id: "j1",
    title: "Solar Installer",
    pay: "$35/hr",
    type: "Full-time",
    location: "Forest Park, IL",
    postedDays: 2,
    awaitingResponse: 2,
    metrics: {
      requiredSkills: 8,
      lowMatchSkills: 3,
      candidates: 18,
      saved: 5,
      savedBadge: 1,
      conversations: 7,
      interviewsScheduled: 3,
      offersSent: 1,
    },
    skills: DEFAULT_SKILLS,
  },
  {
    id: "j2",
    title: "Project Manager",
    pay: "$45/hr",
    type: "Full-time",
    location: "Chicago, IL",
    postedDays: 5,
    metrics: {
      requiredSkills: 7,
      lowMatchSkills: 1,
      candidates: 12,
      saved: 3,
      conversations: 4,
      interviewsScheduled: 2,
      offersSent: 0,
    },
    skills: DEFAULT_SKILLS,
  },
  {
    id: "j3",
    title: "Solar Installer",
    pay: "$35/hr",
    type: "Full-time",
    location: "LaGrange, IL",
    postedDays: 5,
    metrics: {
      requiredSkills: 8,
      lowMatchSkills: 2,
      candidates: 9,
      saved: 2,
      conversations: 3,
      interviewsScheduled: 1,
      offersSent: 0,
    },
    skills: DEFAULT_SKILLS,
  },
  {
    id: "j4",
    title: "Electrician",
    pay: "$55/hr",
    type: "Part-time",
    location: "Chicago, IL",
    postedDays: 6,
    awaitingResponse: 3,
    metrics: {
      requiredSkills: 6,
      lowMatchSkills: 1,
      candidates: 14,
      saved: 4,
      conversations: 5,
      interviewsScheduled: 2,
      offersSent: 0,
    },
    skills: DEFAULT_SKILLS,
  },
  {
    id: "j5",
    title: "Sales Associate",
    pay: "$28/hr",
    type: "Full-time",
    location: "Chicago, IL",
    postedDays: 10,
    awaitingResponse: 5,
    metrics: {
      requiredSkills: 5,
      lowMatchSkills: 0,
      candidates: 22,
      saved: 6,
      conversations: 8,
      interviewsScheduled: 4,
      offersSent: 2,
    },
    skills: DEFAULT_SKILLS,
  },
  {
    id: "j6",
    title: "Solar Installer",
    pay: "$35/hr",
    type: "Full-time",
    location: "Berwyn, IL",
    postedDays: 14,
    metrics: {
      requiredSkills: 8,
      lowMatchSkills: 2,
      candidates: 7,
      saved: 1,
      conversations: 2,
      interviewsScheduled: 1,
      offersSent: 0,
    },
    skills: DEFAULT_SKILLS,
  },
];

const CLOSED_JOBS: ClosedJob[] = [
  {
    id: "c1",
    title: "Solar Installer",
    pay: "$35/hr",
    type: "Full-time",
    location: "Forest Park, IL",
    closedOn: "Mar 20, 2026",
    hires: 2,
    metrics: { hires: 2, candidates: 28, interviews: 5 },
  },
  {
    id: "c2",
    title: "Project Manager",
    pay: "$45/hr",
    type: "Full-time",
    location: "Chicago, IL",
    closedOn: "Mar 19, 2026",
    hires: 1,
    metrics: { hires: 1, candidates: 32, interviews: 6 },
  },
  {
    id: "c3",
    title: "Solar Installer",
    pay: "$35/hr",
    type: "Full-time",
    location: "LaGrange, IL",
    closedOn: "Mar 17, 2026",
    hires: 1,
    metrics: { hires: 1, candidates: 19, interviews: 4 },
  },
  {
    id: "c4",
    title: "Electrician",
    pay: "$55/hr",
    type: "Part-time",
    location: "Chicago, IL",
    closedOn: "Mar 10, 2026",
    hires: 0,
    metrics: { hires: 0, candidates: 11, interviews: 2 },
  },
  {
    id: "c5",
    title: "Sales Associate",
    pay: "$28/hr",
    type: "Full-time",
    location: "Chicago, IL",
    closedOn: "Mar 3, 2026",
    hires: 1,
    metrics: { hires: 1, candidates: 24, interviews: 5 },
  },
  {
    id: "c6",
    title: "Solar Installer",
    pay: "$35/hr",
    type: "Full-time",
    location: "Berwyn, IL",
    closedOn: "Feb 27, 2026",
    hires: 1,
    metrics: { hires: 1, candidates: 16, interviews: 3 },
  },
];

const TEAL = "#00B7C2";
const TEAL_DARK = "#0E8A93";
const AMBER = "#F5B400";
const YELLOW = "#F2D023";
const GREEN = "#3DC36B";
const RED = "#E0463A";

function Dot({ color, outline = false }: { color: string; outline?: boolean }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full mr-2 shrink-0"
      style={
        outline
          ? { border: `2px solid ${color}`, background: "transparent" }
          : { background: color }
      }
    />
  );
}

export default function DashboardPage() {
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [search, setSearch] = useState("");
  const [expandedOpen, setExpandedOpen] = useState<string | null>(OPEN_JOBS[0].id);
  const [expandedClosed, setExpandedClosed] = useState<string | null>(null);
  const [skillsModalJob, setSkillsModalJob] = useState<OpenJob | null>(null);

  const filteredOpen = useMemo(() => {
    if (!search.trim()) return OPEN_JOBS;
    const q = search.toLowerCase();
    return OPEN_JOBS.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.type.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredClosed = useMemo(() => {
    if (!search.trim()) return CLOSED_JOBS;
    const q = search.toLowerCase();
    return CLOSED_JOBS.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.type.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Top header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/skillmatch-logo.png"
              alt="Skillmatch"
              width={180}
              height={42}
              priority
              className="italic"
            />
          </Link>
          <nav className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/dashboard"
              className="relative font-semibold pb-1"
              style={{ color: TEAL }}
            >
              Dashboard
              <span
                className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full"
                style={{ background: TEAL }}
              />
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <span>Messages</span>
              <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                21
              </span>
            </Link>
            <button
              type="button"
              aria-label="Profile"
              className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M4 20c0-4 4-6 8-6s8 2 8 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Top action row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Link
            href="/post-job"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-4 font-bold text-white shadow-md hover:shadow-lg transition"
            style={{ background: TEAL }}
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            <span className="leading-tight">
              Create a
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>New Job
            </span>
          </Link>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Jobs"
              className="w-full bg-white border-2 rounded-full pl-5 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{
                borderColor: TEAL,
                // @ts-expect-error css var
                "--tw-ring-color": TEAL,
              }}
            />
            <Search
              className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: TEAL }}
            />
          </div>
        </div>

        {/* Tab switcher card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setTab("open")}
              className={`flex items-center justify-center gap-2 py-4 font-semibold transition ${
                tab === "open"
                  ? "bg-white text-gray-800"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              <span>Open Jobs</span>
              <span className="bg-gray-200 text-gray-700 rounded-full px-2.5 py-0.5 text-xs font-bold">
                20
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab("closed")}
              className={`flex items-center justify-center gap-2 py-4 font-semibold transition ${
                tab === "closed"
                  ? "bg-white text-gray-800"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              <span>Closed Jobs</span>
              <span className="bg-gray-200 text-gray-700 rounded-full px-2.5 py-0.5 text-xs font-bold">
                53
              </span>
            </button>
          </div>

          {tab === "open" ? (
            <div>
              {/* Status summary */}
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="font-bold mb-2" style={{ color: TEAL }}>
                  You have:
                </div>
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center" style={{ color: TEAL }}>
                    <AlertCircle
                      className="w-4 h-4 mr-2"
                      style={{ color: AMBER }}
                      fill={AMBER}
                      stroke="white"
                    />
                    <span className="font-semibold">
                      2 candidates awaiting response
                    </span>
                  </div>
                  <div className="flex items-center" style={{ color: TEAL }}>
                    <Dot color={YELLOW} />
                    <span className="font-semibold">3 interviews this week</span>
                  </div>
                  <div className="flex items-center" style={{ color: TEAL }}>
                    <Dot color={GREEN} />
                    <span className="font-semibold">1 offer pending</span>
                  </div>
                </div>
              </div>

              {/* Job rows */}
              <ul className="divide-y divide-gray-200">
                {filteredOpen.map((job) => {
                  const isExpanded = expandedOpen === job.id;
                  return (
                    <li key={job.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOpen(isExpanded ? null : job.id)
                        }
                        className="w-full text-left px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800">
                            {job.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {job.pay} • {job.type} • {job.location}
                          </div>
                          {job.awaitingResponse ? (
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <AlertCircle
                                className="w-3.5 h-3.5 mr-1.5"
                                style={{ color: AMBER }}
                                fill={AMBER}
                                stroke="white"
                              />
                              <span>
                                {job.awaitingResponse} candidates awaiting response
                              </span>
                              <span className="ml-2 inline-flex items-center bg-gray-300 text-white rounded px-1.5 py-0.5 text-[10px]">
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 10 10"
                                  fill="white"
                                >
                                  <polygon points="2,1 9,5 2,9" />
                                </svg>
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap shrink-0 pt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Posted {job.postedDays} days ago</span>
                          <ChevronDown
                            className={`w-4 h-4 ml-1 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-6 animate-fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm pt-1 pb-5">
                            {/* Column 1 */}
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => setSkillsModalJob(job)}
                                className="flex items-center text-left hover:underline"
                                style={{ color: TEAL }}
                              >
                                <Dot color={TEAL} />
                                <span className="font-semibold text-gray-700">
                                  {job.metrics.requiredSkills} Required Skills
                                </span>
                                <span className="ml-2 inline-flex items-center bg-gray-300 text-white rounded px-1.5 py-0.5 text-[10px]">
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 10 10"
                                    fill="white"
                                  >
                                    <polygon points="2,1 9,5 2,9" />
                                  </svg>
                                </span>
                              </button>
                              <div className="flex items-center">
                                <AlertCircle
                                  className="w-3.5 h-3.5 mr-2"
                                  style={{ color: AMBER }}
                                  fill={AMBER}
                                  stroke="white"
                                />
                                <span className="text-gray-700">
                                  {job.metrics.lowMatchSkills} skills have low
                                  match rates
                                </span>
                              </div>
                            </div>
                            {/* Column 2 */}
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center">
                                <Dot color={TEAL} />
                                <span className="text-gray-700">
                                  {job.metrics.candidates} Candidates
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Dot color={TEAL} outline />
                                <span className="text-gray-700">
                                  {job.metrics.saved} Saved
                                </span>
                                {job.metrics.savedBadge ? (
                                  <span className="ml-2 inline-flex items-center justify-center bg-gray-300 text-white rounded px-1.5 py-0.5 text-[10px] font-bold min-w-[18px]">
                                    {job.metrics.savedBadge}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center">
                                <Dot color={TEAL_DARK} />
                                <span className="text-gray-700">
                                  {job.metrics.conversations} Conversations
                                </span>
                              </div>
                            </div>
                            {/* Column 3 */}
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center">
                                <Dot color={YELLOW} />
                                <span className="text-gray-700">
                                  {job.metrics.interviewsScheduled} Interviews
                                  Scheduled
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Dot color={GREEN} />
                                <span className="text-gray-700">
                                  {job.metrics.offersSent} Offer Sent
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-gray-100">
                            <button
                              type="button"
                              className="bg-gray-300 text-white font-semibold rounded-full px-6 py-2.5 hover:bg-gray-400 transition"
                            >
                              Edit Job
                            </button>
                            <button
                              type="button"
                              className="text-white font-semibold rounded-full px-6 py-2.5 transition hover:opacity-90"
                              style={{ background: TEAL }}
                            >
                              View Messages
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 text-white font-semibold rounded-full px-6 py-2.5 transition hover:opacity-90"
                              style={{ background: TEAL }}
                            >
                              View Candidates
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20">
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 10 10"
                                  fill="white"
                                >
                                  <polygon points="2,1 9,5 2,9" />
                                </svg>
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div>
              <ul className="divide-y divide-gray-200">
                {filteredClosed.map((job) => {
                  const isExpanded = expandedClosed === job.id;
                  return (
                    <li key={job.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedClosed(isExpanded ? null : job.id)
                        }
                        className="w-full text-left px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800">
                            {job.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {job.pay} • {job.type} • {job.location}
                          </div>
                          <div className="flex items-center mt-1.5 text-sm">
                            {job.hires > 0 ? (
                              <>
                                <Dot color={GREEN} />
                                <span className="text-gray-700">
                                  {job.hires} {job.hires === 1 ? "Hire" : "Hires"}
                                </span>
                              </>
                            ) : (
                              <>
                                <X
                                  className="w-3.5 h-3.5 mr-2"
                                  style={{ color: RED }}
                                  strokeWidth={3}
                                />
                                <span className="text-gray-700">0 Hire</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap shrink-0 pt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Closed on {job.closedOn}</span>
                          <ChevronDown
                            className={`w-4 h-4 ml-1 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-6 animate-fade-in">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm pb-4">
                            <div className="flex items-center">
                              {job.metrics.hires > 0 ? (
                                <>
                                  <Dot color={GREEN} />
                                  <span className="text-gray-700">
                                    {job.metrics.hires}{" "}
                                    {job.metrics.hires === 1 ? "Hire" : "Hires"}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <X
                                    className="w-3.5 h-3.5 mr-2"
                                    style={{ color: RED }}
                                    strokeWidth={3}
                                  />
                                  <span className="text-gray-700">0 Hire</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center">
                              <Dot color={TEAL} />
                              <span className="text-gray-700">
                                {job.metrics.candidates} Candidates
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Dot color={YELLOW} />
                              <span className="text-gray-700">
                                {job.metrics.interviews} Interviews
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-gray-100">
                            <button
                              type="button"
                              className="bg-gray-300 text-white font-semibold rounded-full px-6 py-2.5 hover:bg-gray-400 transition"
                            >
                              View Summary
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 text-white font-semibold rounded-full px-6 py-2.5 transition hover:opacity-90"
                              style={{ background: TEAL }}
                            >
                              Reopen Job
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20">
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 10 10"
                                  fill="white"
                                >
                                  <polygon points="2,1 9,5 2,9" />
                                </svg>
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>

      {/* Required Skills Modal */}
      {skillsModalJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Required Skills"
        >
          <button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 bg-black/30"
            onClick={() => setSkillsModalJob(null)}
          />
          <div
            className="relative bg-white rounded-2xl shadow-xl border-2 w-full max-w-sm p-6"
            style={{ borderColor: TEAL }}
          >
            <h2 className="font-bold text-gray-800 mb-4">Required Skills</h2>
            <ul className="flex flex-col gap-2.5 mb-6">
              {skillsModalJob.skills.map((s) => (
                <li key={s.name} className="flex items-center text-sm">
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-2.5 shrink-0"
                    style={{ background: TEAL }}
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={4} />
                  </span>
                  <span className="text-gray-700">{s.name}</span>
                  {s.lowMatch && (
                    <span className="ml-2" style={{ color: RED }}>
                      — Low match
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSkillsModalJob(null)}
                className="inline-flex items-center gap-1.5 bg-gray-300 text-white font-semibold rounded-full px-5 py-2 hover:bg-gray-400 transition"
              >
                <X className="w-4 h-4" strokeWidth={3} />
                Close
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-white font-semibold rounded-full px-5 py-2 transition hover:opacity-90"
                style={{ background: TEAL }}
              >
                Edit Skills
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                    <polygon points="2,1 9,5 2,9" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 160ms ease-out;
        }
      `}</style>
    </div>
  );
}
