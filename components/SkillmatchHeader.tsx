"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Props {
  /** Active tab */
  active?: "dashboard" | "messages";
  /** Unread message count badge */
  messageCount?: number;
}

/**
 * Skillmatch top header — Dashboard | Messages | Profile-dropdown.
 *
 * Caroline 6/27 Round 4: profile icon now opens a dropdown menu
 * with: Your Account / Your Dashboard / Your Messages / Saved
 * Candidates / Contact Us.
 */
export default function SkillmatchHeader({
  active,
  messageCount = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const MENU_ITEMS: { label: string; href: string; key: string }[] = [
    { label: "Our Mission", href: "/mission", key: "mission" },
    { label: "Your Profile", href: "/account", key: "profile" },
    { label: "Your Dashboard", href: "/dashboard", key: "dashboard" },
    { label: "Your Messages", href: "/messages", key: "messages" },
    { label: "Saved Candidates", href: "/candidates?filter=saved", key: "saved" },
    { label: "Contact Us", href: "/contact", key: "contact" },
  ];

  return (
    <header className="bg-white border-b border-gray-100 py-5 px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/">
          <Image
            src="/skillmatch-logo.png"
            alt="Skilmatch"
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

          {/* Profile dropdown — Caroline 6/27 */}
          <div ref={wrapRef} className="relative">
            <button
              aria-label="Open profile menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
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
            {open && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-gray-100 py-2 z-50">
                {MENU_ITEMS.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-skBeta-bg hover:text-skTeal transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
