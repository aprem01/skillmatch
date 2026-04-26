"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Plus, Search } from "lucide-react";

type ThreadStatus =
  | "Interview Scheduled"
  | "Responded"
  | "Not Responded"
  | "Reviewing Offer";

type Thread = {
  id: string;
  handle: string;
  status: ThreadStatus;
  jobTitle: string;
  pay: string;
  type: string;
  availability: string;
  preview: string;
  fullMessage: string;
  timestamp: string;
};

const TEAL = "#00BFA5";

const THREADS: Thread[] = [
  {
    id: "t1",
    handle: "KeqJLS",
    status: "Interview Scheduled",
    jobTitle: "Solar Installer",
    pay: "$32/hr",
    type: "Full-time",
    availability: "Available now",
    preview:
      "KeqJLS: Accepted your meeting invite for Tuesday at 2:00 PM",
    fullMessage:
      "KeqJLS: Accepted your meeting invite for Tuesday at 2:00 PM. Looking forward to talking with the team — I have a few questions about the install schedule and the safety training program. See you then!",
    timestamp: "4/22/26 • 10:15am",
  },
  {
    id: "t2",
    handle: "JoeMy395",
    status: "Not Responded",
    jobTitle: "Project Manager",
    pay: "$45/hr",
    type: "Full-time",
    availability: "Available 4/16",
    preview:
      "You: We would love to have you meet our team manager Jerry next week...",
    fullMessage:
      "You: We would love to have you meet our team manager Jerry next week. Are you free Tuesday or Thursday afternoon for a 30-minute intro call? We can do it on Zoom or in person at our Chicago office — whichever you prefer.",
    timestamp: "4/21/26 • 11:20am",
  },
  {
    id: "t3",
    handle: "MuuYu301",
    status: "Responded",
    jobTitle: "Sales Associate",
    pay: "$28/hr",
    type: "Full-time",
    availability: "Available now",
    preview:
      "MuuYu301: Hi Sarah! Yes, I also speak some Spanish, from school...",
    fullMessage:
      "MuuYu301: Hi Sarah! Yes, I also speak some Spanish, from school, enough to have a general conversation with a crew, but I will have to learn specific terminology to address solar systems more specifically. Happy to keep practicing.",
    timestamp: "4/21/26 • 11:05am",
  },
  {
    id: "t4",
    handle: "JoeMy302",
    status: "Not Responded",
    jobTitle: "Design Director",
    pay: "$55/hr",
    type: "Contract",
    availability: "Available 5/1",
    preview:
      "You: We would love to meet you next week if possible. Do you have...",
    fullMessage:
      "You: We would love to meet you next week if possible. Do you have any availability Wednesday or Thursday for a portfolio review? Our creative lead Mia would love to walk through your past work with you.",
    timestamp: "4/20/26 • 9:45am",
  },
  {
    id: "t5",
    handle: "SoDi444",
    status: "Responded",
    jobTitle: "Project Manager",
    pay: "$45/hr",
    type: "Full-time",
    availability: "Available 4/24",
    preview:
      "You: We would love to have you meet our team manager Jerry next week...",
    fullMessage:
      "SoDi444: Thanks for reaching out — I am definitely interested. Tuesday afternoon works well on my end. Could you share a bit more about the team structure and the first 90 days in the role?",
    timestamp: "4/20/26 • 11:20am",
  },
  {
    id: "t6",
    handle: "YuJuu899",
    status: "Reviewing Offer",
    jobTitle: "Solar Panel Installer",
    pay: "$35/hr",
    type: "Full-time",
    availability: "Available now",
    preview:
      "YuJuu899: Hi Sarah, thank you for reaching out. Yes I can do next week...",
    fullMessage:
      "YuJuu899: Hi Sarah, thank you for the offer. I am reviewing the details now and want to confirm a couple of things on benefits and the start date before signing. Can we hop on a quick call tomorrow?",
    timestamp: "4/19/26 • 11:20am",
  },
];

const AVATAR_COLORS = [
  "#00BFA5",
  "#26A69A",
  "#1DB1A8",
  "#3DBDB0",
  "#0FB7A8",
  "#1ABFAB",
];

function avatarColor(handle: string): string {
  let sum = 0;
  for (let i = 0; i < handle.length; i++) sum += handle.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function statusBadgeClasses(status: ThreadStatus): string {
  switch (status) {
    case "Interview Scheduled":
      return "bg-yellow-100 text-yellow-700";
    case "Responded":
      return "bg-teal/15 text-teal";
    case "Not Responded":
      return "bg-gray-200 text-gray-600";
    case "Reviewing Offer":
      return "bg-green-100 text-green-700";
  }
}

function StatusDot({ status }: { status: ThreadStatus }) {
  const color =
    status === "Interview Scheduled"
      ? "#F5A623"
      : status === "Responded"
      ? TEAL
      : status === "Reviewing Offer"
      ? "#4CAF50"
      : "#9CA3AF";
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5 shrink-0"
      style={{ background: color }}
    />
  );
}

function ActionButtons({ status }: { status: ThreadStatus }) {
  if (status === "Interview Scheduled") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border-2 hover:bg-teal/5 transition"
          style={{ borderColor: TEAL, color: TEAL }}
        >
          Reschedule
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={3} />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
          style={{ background: TEAL }}
        >
          Message
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 transition"
        >
          Cancel Interview
        </button>
      </div>
    );
  }

  if (status === "Reviewing Offer") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
          style={{ background: TEAL }}
        >
          Message
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 transition"
        >
          Withdraw Interview
        </button>
      </div>
    );
  }

  // Responded + Not Responded share the same action set.
  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
        style={{ color: TEAL }}
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={3} />
        Add a Question
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        style={{ background: TEAL }}
      >
        Invite to Interview
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={3} />
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 transition"
      >
        Archive
      </button>
    </div>
  );
}

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return THREADS;
    const q = search.toLowerCase();
    return THREADS.filter(
      (t) =>
        t.handle.toLowerCase().includes(q) ||
        t.jobTitle.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-coolgray-50">
      {/* Top header — matches dashboard */}
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
              className="text-gray-600 hover:text-teal transition"
            >
              Dashboard
            </Link>
            <Link
              href="/messages"
              className="relative flex items-center gap-2 font-semibold pb-1"
              style={{ color: TEAL }}
            >
              <span>Messages</span>
              <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                21
              </span>
              <span
                className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full"
                style={{ background: TEAL }}
              />
            </Link>
            <button
              type="button"
              aria-label="Profile"
              className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="2"
                />
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
        <h1 className="font-bold uppercase tracking-wider text-gray-500 text-xs mb-4">
          Your Inbox
        </h1>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: TEAL }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="w-full bg-white border-2 rounded-full pl-11 pr-5 py-2.5 text-sm focus:outline-none focus:ring-2"
            style={{
              borderColor: TEAL,
              // @ts-expect-error css var
              "--tw-ring-color": TEAL,
            }}
          />
        </div>

        {/* Thread list */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filtered.map((t) => {
              const isExpanded = expanded === t.id;
              const initials = t.handle.slice(0, 2).toUpperCase();
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : t.id)}
                    className="w-full text-left px-4 sm:px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition"
                  >
                    {/* Avatar */}
                    <div
                      className="rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                      style={{
                        background: avatarColor(t.handle),
                        width: 50,
                        height: 50,
                      }}
                    >
                      {initials}
                    </div>

                    {/* Middle */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className="font-bold"
                          style={{ color: TEAL }}
                        >
                          {t.handle}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClasses(
                            t.status
                          )}`}
                        >
                          <StatusDot status={t.status} />
                          {t.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {t.jobTitle} • {t.pay} • {t.type} • {t.availability}
                      </div>
                      <div className="text-sm text-gray-500 italic mt-1.5 truncate">
                        {t.preview}
                      </div>
                    </div>

                    {/* Right: timestamp + chevron */}
                    <div className="flex items-start gap-2 shrink-0 pt-0.5">
                      <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">
                        {t.timestamp}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-5 animate-fade-in">
                      <div className="sm:pl-[66px]">
                        <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 mb-4">
                          {t.fullMessage}
                        </div>
                        <ActionButtons status={t.status} />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-6 py-10 text-center text-sm text-gray-500">
                No conversations match &ldquo;{search}&rdquo;.
              </li>
            )}
          </ul>
        </div>
      </main>

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
