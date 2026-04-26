"use client";

import Link from "next/link";
import Image from "next/image";

interface Props {
  /** Active tab */
  active?: "dashboard" | "messages";
  /** Unread message count badge */
  messageCount?: number;
}

/**
 * Skillmatch top header — Dashboard | Messages | Profile
 * Used on authenticated pages (dashboard, messages, post-job, candidates)
 */
export default function SkillmatchHeader({
  active,
  messageCount = 0,
}: Props) {
  return (
    <header className="bg-white border-b border-gray-100 py-5 px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/dashboard">
          <Image
            src="/skillmatch-logo.png"
            alt="Skillmatch"
            width={180}
            height={42}
            priority
          />
        </Link>

        <nav className="flex items-center gap-5">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`text-sm font-semibold transition-colors ${
              active === "dashboard"
                ? "text-teal border-b-2 border-teal pb-1"
                : "text-gray-500 hover:text-teal"
            }`}
          >
            Dashboard
          </Link>

          {/* Messages with badge */}
          <Link
            href="/messages"
            className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              active === "messages"
                ? "text-teal border-b-2 border-teal pb-1"
                : "text-gray-500 hover:text-teal"
            }`}
          >
            Messages
            {messageCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-gray-200 text-gray-600 text-xs font-bold">
                {messageCount}
              </span>
            )}
          </Link>

          {/* Profile circle */}
          <button
            aria-label="Profile"
            className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center text-gray-500"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
}
