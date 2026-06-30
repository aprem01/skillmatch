"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Share2, ArrowRight } from "lucide-react";
import SkillmatchHeader from "@/components/SkillmatchHeader";

/* ------------------------------------------------------------------ */
/*  Mock data — role variants with pre-populated skills               */
/* ------------------------------------------------------------------ */

type RoleVariant = {
  title: string;
  requiredSkills: string[];
  optionalSkills: string[];
};

const MOCK_ROLES: Record<string, RoleVariant[]> = {
  "design director": [
    {
      title: "Design Director — Advertising/Creative",
      requiredSkills: ["Brand Strategy", "Creative Direction", "Adobe Creative Suite", "Team Leadership"],
      optionalSkills: ["Copywriting", "Motion Graphics", "Client Presentations"],
    },
    {
      title: "Design Director — Construction/Architecture",
      requiredSkills: ["AutoCAD", "Project Management", "Building Codes", "Team Leadership"],
      optionalSkills: ["Revit", "Sustainable Design", "Client Relations"],
    },
    {
      title: "Design Director — Product/Tech",
      requiredSkills: ["Figma", "Design Systems", "User Research", "Prototyping"],
      optionalSkills: ["Front-end Development", "A/B Testing", "Accessibility"],
    },
  ],
  "sales associate": [
    {
      title: "Sales Associate — Retail",
      requiredSkills: ["Customer Service", "POS Systems", "Product Knowledge", "Cash Handling"],
      optionalSkills: ["Visual Merchandising", "Inventory Management", "Bilingual"],
    },
    {
      title: "Sales Associate — B2B / SaaS",
      requiredSkills: ["CRM Software", "Cold Outreach", "Pipeline Management", "Product Demos"],
      optionalSkills: ["Salesforce", "HubSpot", "Contract Negotiation"],
    },
    {
      title: "Sales Associate — Real Estate",
      requiredSkills: ["Property Showings", "MLS Systems", "Client Relations", "Negotiation"],
      optionalSkills: ["Staging", "Social Media Marketing", "Transaction Coordination"],
    },
  ],
  "hvac": [
    {
      title: "HVAC Technician — Residential",
      requiredSkills: ["HVAC Installation", "Troubleshooting", "Refrigerant Handling", "Electrical Basics"],
      optionalSkills: ["EPA Certification", "Ductwork", "Customer Service"],
    },
    {
      title: "HVAC Technician — Commercial",
      requiredSkills: ["Commercial HVAC Systems", "Preventive Maintenance", "Building Automation", "Blueprints"],
      optionalSkills: ["Energy Audits", "Project Management", "Welding"],
    },
    {
      title: "HVAC Assistant — Entry Level",
      requiredSkills: ["Basic Tools", "Physical Fitness", "Following Instructions", "Safety Protocols"],
      optionalSkills: ["Electrical Basics", "Customer Interaction", "Vehicle Operation"],
    },
  ],
  "nurse": [
    {
      title: "Registered Nurse — Hospital",
      requiredSkills: ["Patient Assessment", "Medication Administration", "IV Therapy", "EMR Systems"],
      optionalSkills: ["BLS/ACLS Certification", "Wound Care", "Patient Education"],
    },
    {
      title: "Nurse — Home Health",
      requiredSkills: ["Patient Care", "Vital Signs Monitoring", "Care Plans", "Documentation"],
      optionalSkills: ["Wound Care", "Bilingual", "Reliable Transportation"],
    },
    {
      title: "Nurse Practitioner — Primary Care",
      requiredSkills: ["Diagnosis", "Prescriptive Authority", "Physical Exams", "Chronic Disease Management"],
      optionalSkills: ["Telehealth", "Procedures", "Research"],
    },
  ],
  "software engineer": [
    {
      title: "Software Engineer — Frontend",
      requiredSkills: ["React", "TypeScript", "CSS/Tailwind", "Git"],
      optionalSkills: ["Next.js", "Testing", "Accessibility", "Design Systems"],
    },
    {
      title: "Software Engineer — Backend",
      requiredSkills: ["Node.js", "SQL", "REST APIs", "System Design"],
      optionalSkills: ["Docker", "AWS", "GraphQL", "CI/CD"],
    },
    {
      title: "Software Engineer — Full Stack",
      requiredSkills: ["React", "Node.js", "SQL", "Git"],
      optionalSkills: ["TypeScript", "Docker", "Cloud Services", "Testing"],
    },
  ],
};

function findRoleVariants(query: string): RoleVariant[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  // Direct match
  for (const [key, variants] of Object.entries(MOCK_ROLES)) {
    if (key.includes(q) || q.includes(key)) return variants;
  }

  // Partial word match
  for (const [key, variants] of Object.entries(MOCK_ROLES)) {
    const words = key.split(" ");
    if (words.some((w) => w.startsWith(q) || q.startsWith(w))) return variants;
  }

  // Fallback — generate a generic set
  return [
    {
      title: `${query} — General`,
      requiredSkills: ["Communication", "Problem Solving", "Time Management", "Teamwork"],
      optionalSkills: ["Microsoft Office", "Customer Service", "Adaptability"],
    },
    {
      title: `${query} — Senior`,
      requiredSkills: ["Leadership", "Strategic Planning", "Mentoring", "Project Management"],
      optionalSkills: ["Budget Management", "Cross-functional Collaboration", "Reporting"],
    },
    {
      title: `${query} — Entry Level`,
      requiredSkills: ["Willingness to Learn", "Basic Computer Skills", "Reliability", "Communication"],
      optionalSkills: ["Internship Experience", "Relevant Coursework", "Bilingual"],
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Pill component                                                     */
/* ------------------------------------------------------------------ */

function SkillPill({
  label,
  type,
  onRemove,
  onToggle,
  animate,
}: {
  label: string;
  type: "required" | "optional";
  onRemove: () => void;
  onToggle: () => void;
  animate: boolean;
}) {
  const bg = type === "required" ? "bg-skBlue" : "bg-skGreen";
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${bg} text-white text-sm font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 cursor-pointer transition-colors hover:opacity-90 ${animate ? "animate-pill-pop" : ""}`}
      title={type === "required" ? "Click to make extra" : "Click to make required"}
    >
      {label}
      <span
        role="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 text-white hover:text-white/80 text-xs leading-none"
      >
        &times;
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom radio (white bg, teal stroke, gray dot when filled)         */
/* ------------------------------------------------------------------ */

function SkRadio({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-skGray select-none">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white border-2 border-skTeal"
        aria-hidden="true"
      >
        {checked && (
          <span className="block w-1.5 h-1.5 rounded-full bg-skGray" />
        )}
      </span>
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page content                                                  */
/* ------------------------------------------------------------------ */

function PostJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- state ---
  const [roleInput, setRoleInput] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [optionalSkills, setOptionalSkills] = useState<string[]>([]);
  const [employment, setEmployment] = useState<"contract" | "part_time" | "full_time">("full_time");
  const [shift, setShift] = useState<"day" | "night" | "on_call">("day");
  const [location, setLocation] = useState<"on_site" | "hybrid" | "remote">("on_site");
  const [pay, setPay] = useState("");
  const [payPeriod, setPayPeriod] = useState<"year" | "month" | "hour">("year");
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [roleVariants, setRoleVariants] = useState<RoleVariant[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [animatedSkills, setAnimatedSkills] = useState<Set<string>>(new Set());
  // Caroline 5/22 sketch: when the recruiter types an ambiguous skill,
  // ask which industry they meant before adding it to the basket. The
  // role's basket-classified industry serves as the anchor.
  const [pendingClarification, setPendingClarification] = useState<{
    raw: string;
    industries: string[];
  } | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- prefill from share-link query params on mount ---
  useEffect(() => {
    // Caroline 6/27 Round 4: when the recruiter hits "← Edit role" from
    // /candidates we should rehydrate the saved basket so they can add
    // one missing skill without retyping everything. Source-of-truth is
    // localStorage["skillmatch_job"], written by handleSubmit below.
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("skillmatch_job")
          : null;
      if (raw) {
        const job = JSON.parse(raw);
        const restoredRole =
          job.selectedRole || job.roleInput || job.role || "";
        if (restoredRole) {
          setRoleInput(restoredRole);
          setSelectedRole(restoredRole);
        }
        if (Array.isArray(job.requiredSkills) && job.requiredSkills.length) {
          setRequiredSkills(job.requiredSkills);
        }
        if (Array.isArray(job.optionalSkills) && job.optionalSkills.length) {
          setOptionalSkills(job.optionalSkills);
        }
        if (job.employment) setEmployment(job.employment);
        if (job.shift) setShift(job.shift);
        if (job.location) setLocation(job.location);
        if (job.pay) setPay(job.pay);
        if (job.payPeriod) setPayPeriod(job.payPeriod);
      }
    } catch {
      // ignore — fall through to empty state
    }

    // Then layer share-link overrides if present (a hiring manager
    // forwarded a draft to fill in).
    if (!searchParams) return;
    const shared = searchParams.get("shared");
    if (shared !== "1") return;
    const sharedRole = searchParams.get("role") || "";
    const sharedSkills = searchParams.get("skills") || "";
    if (sharedRole) {
      setRoleInput(sharedRole);
      setSelectedRole(sharedRole);
    }
    if (sharedSkills) {
      const list = sharedSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length > 0) {
        setRequiredSkills(list);
        setAnimatedSkills(new Set(list));
        setTimeout(() => setAnimatedSkills(new Set()), 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- close dropdown on outside click ---
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // --- debounced role search ---
  const handleRoleInput = useCallback((value: string) => {
    setRoleInput(value);
    setSelectedRole("");

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setRoleVariants([]);
      setShowDropdown(false);
      return;
    }

    setIsLoadingRoles(true);
    debounceRef.current = setTimeout(async () => {
      // Try live AI API first, fall back to mock data
      try {
        const res = await fetch("/api/employer/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: value.trim() }),
        });
        const data = await res.json();
        if (data.variants && data.variants.length > 0) {
          setRoleVariants(data.variants);
          setShowDropdown(true);
          setIsLoadingRoles(false);
          return;
        }
      } catch {}
      // Fallback to mock
      const results = findRoleVariants(value);
      setRoleVariants(results);
      setShowDropdown(results.length > 0);
      setIsLoadingRoles(false);
    }, 400);
  }, []);

  // --- select a role variant ---
  const selectVariant = useCallback((variant: RoleVariant) => {
    setRoleInput(variant.title);
    setSelectedRole(variant.title);
    setShowDropdown(false);

    const newRequired = new Set<string>();
    const newOptional = new Set<string>();
    variant.requiredSkills.forEach((s) => newRequired.add(s));
    variant.optionalSkills.forEach((s) => newOptional.add(s));

    setAnimatedSkills(new Set(Array.from(newRequired).concat(Array.from(newOptional))));
    setRequiredSkills(Array.from(newRequired));
    setOptionalSkills(Array.from(newOptional));

    // clear animation flags after animation completes
    setTimeout(() => setAnimatedSkills(new Set()), 500);
  }, []);

  // --- skill actions ---
  const removeSkill = (skill: string) => {
    setRequiredSkills((s) => s.filter((x) => x !== skill));
    setOptionalSkills((s) => s.filter((x) => x !== skill));
  };

  const toggleSkill = (skill: string) => {
    if (requiredSkills.includes(skill)) {
      setRequiredSkills((s) => s.filter((x) => x !== skill));
      setOptionalSkills((s) => [...s, skill]);
    } else {
      setOptionalSkills((s) => s.filter((x) => x !== skill));
      setRequiredSkills((s) => [...s, skill]);
    }
  };

  const commitManualSkill = (trimmed: string) => {
    setAnimatedSkills(new Set([trimmed]));
    setRequiredSkills((s) => [...s, trimmed]);
    setNewSkill("");
    setTimeout(() => setAnimatedSkills(new Set()), 500);
  };

  const addManualSkill = async () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (requiredSkills.includes(trimmed) || optionalSkills.includes(trimmed)) {
      setNewSkill("");
      return;
    }
    // Ambiguity check: post the basket to the server so the 900KB+
    // O*NET taxonomy stays off the client bundle.
    try {
      const res = await fetch("/api/skills/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: trimmed,
          basket: [...requiredSkills, ...optionalSkills],
        }),
      });
      const data = await res.json();
      if (data.candidates) {
        setPendingClarification({ raw: trimmed, industries: data.candidates });
        setNewSkill("");
        return;
      }
    } catch {
      // Network failure → proceed without clarification.
    }
    // Caroline 5/22: manually added skills are more likely Required than
    // Extra — if the recruiter typed it, they meant it. They can toggle
    // it to Extra by clicking the pill.
    commitManualSkill(trimmed);
  };

  // --- share link ---
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const role = selectedRole || roleInput.trim();
    const allSkills = [...requiredSkills, ...optionalSkills];
    const params = new URLSearchParams();
    params.set("shared", "1");
    if (role) params.set("role", role);
    if (allSkills.length > 0) params.set("skills", allSkills.join(","));
    const url = `${window.location.origin}/post-job?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareToast("Link copied! Share it with your team.");
    } catch {
      // fallback: legacy execCommand path
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setShareToast("Link copied! Share it with your team.");
      } catch {
        setShareToast("Couldn't copy automatically — copy this URL manually.");
      }
    }
    setTimeout(() => setShareToast(null), 3000);
  };

  // --- computed stats ---
  const totalSkills = requiredSkills.length + optionalSkills.length;
  const candidateCount = totalSkills > 0 ? Math.max(20, 200 - totalSkills * 8) : 0;
  const payNum = parseFloat(pay.replace(/[^0-9.]/g, "")) || 0;
  const hourlyLow = payPeriod === "hour" ? payNum * 0.8 : payPeriod === "month" ? (payNum / 160) * 0.8 : (payNum / 2080) * 0.8;
  const hourlyHigh = payPeriod === "hour" ? payNum * 1.2 : payPeriod === "month" ? (payNum / 160) * 1.2 : (payNum / 2080) * 1.2;

  // --- submit ---
  const handleSubmit = () => {
    const jobData = {
      role: selectedRole || roleInput,
      selectedRole: selectedRole || roleInput,
      roleInput,
      requiredSkills,
      optionalSkills,
      employment,
      shift,
      location,
      pay,
      payPeriod,
    };
    localStorage.setItem("skillmatch_job", JSON.stringify(jobData));

    // Caroline 6/27 Round 4: persist a real Job row so /dashboard shows
    // the posting and Close Job/Edit Job/View Candidates work end-to-end.
    // Recruiter identity comes from the verification modal (work email).
    let recruiterEmail: string | null = null;
    try {
      const raw = localStorage.getItem("skillmatch_verification");
      if (raw) recruiterEmail = JSON.parse(raw).workEmail?.toLowerCase() ?? null;
    } catch {}

    if (recruiterEmail) {
      // Convert pay to hourly cents (Adzuna-compatible).
      const payNum = parseFloat((pay || "").replace(/[^0-9.]/g, "")) || 0;
      const hourly =
        payPeriod === "hour"
          ? payNum
          : payPeriod === "month"
          ? payNum / 160
          : payNum / 2080;
      const cents = Math.round(hourly * 100);
      fetch("/api/employer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruiterEmail,
          role: jobData.role,
          location: location || "Chicago, IL",
          shiftType: employment,
          payType: payPeriod === "hour" ? "hourly" : "salary",
          payMin: cents > 0 ? Math.round(cents * 0.85) : 1500,
          payMax: cents > 0 ? Math.round(cents * 1.15) : 2500,
          requiredSkills,
          optionalSkills,
        }),
      }).catch(() => {
        // Non-blocking — dashboard still has prior fixture data
      });
    }

    // Existing analytics log of the candidate-search intent.
    fetch("/api/employer/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: jobData.role,
        requiredSkills,
        optionalSkills,
      }),
    }).catch(() => {});

    router.push("/candidates");
  };

  const canSubmit = !!((selectedRole || roleInput.trim()) && totalSkills > 0);

  return (
    <div className="min-h-screen bg-coolgray-50">
      <SkillmatchHeader messageCount={21} />

      <main className="max-w-5xl mx-auto px-6 pb-16">
        {/* Headline + subhead sit directly on the gray page background */}
        <div className="pt-6 pb-8">
          <h1
            className="text-3xl sm:text-4xl font-bold text-left mb-2"
            style={{ color: "#719192", fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif" }}
          >
            Find the best candidates in seconds.
          </h1>
          <p
            className="text-base sm:text-lg font-semibold text-left"
            style={{ color: "#719192", fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif" }}
          >
            Start with a role — we&apos;ll handle the skills and find your best matches.
          </p>
        </div>

        {/* ---- Role input (no card around it) ---- */}
        <div className="relative mb-6 max-w-2xl" ref={dropdownRef}>
          <label htmlFor="role-input" className="block text-sm font-semibold text-skGray mb-1.5">
            Role
          </label>
          <input
            ref={inputRef}
            id="role-input"
            type="text"
            value={roleInput}
            onChange={(e) => handleRoleInput(e.target.value)}
            onFocus={() => roleVariants.length > 0 && setShowDropdown(true)}
            placeholder="ex: Sales Associate, HVAC Assistant, Design Director"
            className="w-full bg-white px-5 py-3.5 rounded-xl border-2 border-skTeal-bright focus:border-[4px] focus:border-skTeal-bright focus:outline-none transition-[border-width] text-gray-900 placeholder:text-skTeal"
          />

          {/* Loading indicator */}
          {isLoadingRoles && (
            <div className="absolute right-4 top-[46px]">
              <div className="w-5 h-5 border-2 border-skTeal border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Autocomplete dropdown */}
          {showDropdown && roleVariants.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border-2 border-skTeal-bright rounded-xl shadow-lg overflow-hidden">
              {roleVariants.map((v) => (
                <button
                  key={v.title}
                  type="button"
                  onClick={() => selectVariant(v)}
                  className="w-full text-left px-4 py-3 hover:bg-skBeta-bg transition-colors text-gray-800 border-b border-coolgray-100 last:border-b-0"
                >
                  <span className="font-medium">{v.title}</span>
                  <span className="block text-xs text-skGray-desc mt-0.5">
                    {v.requiredSkills.slice(0, 3).join(", ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---- Share with team (above Skills Basket) ---- */}
        {totalSkills > 0 && (
          <div className="max-w-2xl mb-3 flex items-center justify-between gap-3">
            <p className="text-sm sm:text-base text-skGray-desc">
              Not sure on skills? Share this with your hiring manager.
            </p>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-skGray-desc text-skGray text-xs font-semibold bg-white hover:border-skGray hover:text-skGray transition-colors"
            >
              <Share2 size={14} />
              Share with team
            </button>
          </div>
        )}

        {/* ---- Skills basket (white card only here) ---- */}
        {totalSkills > 0 && (
          <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-coolgray-200 p-5 sm:p-6 mb-6 animate-fade-in">
            <p className="text-xs font-semibold text-skGray uppercase tracking-wide mb-3">
              Skills &mdash; click to toggle required/extra
            </p>

            {/* Required */}
            {requiredSkills.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-skGray-desc mb-1.5">Required</p>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.map((skill) => (
                    <SkillPill
                      key={`req-${skill}`}
                      label={skill}
                      type="required"
                      onRemove={() => removeSkill(skill)}
                      onToggle={() => toggleSkill(skill)}
                      animate={animatedSkills.has(skill)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Extra (aka Optional / Nice-to-have — unified label across
                candidates list per Caroline 5/22 feedback) */}
            {optionalSkills.length > 0 && (
              <div>
                <p className="text-xs text-skGray-desc mb-1.5">Nice-to-have Extra Skills</p>
                <div className="flex flex-wrap gap-2">
                  {optionalSkills.map((skill) => (
                    <SkillPill
                      key={`opt-${skill}`}
                      label={skill}
                      type="optional"
                      onRemove={() => removeSkill(skill)}
                      onToggle={() => toggleSkill(skill)}
                      animate={animatedSkills.has(skill)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Manual add — gray gradient button, differentiated from skill pills */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManualSkill()}
                placeholder="Add a skill..."
                className="flex-1 px-3 py-2 rounded-lg border border-coolgray-200 focus:border-skTeal focus:outline-none text-sm text-gray-800 placeholder:text-skGray-desc"
              />
              <button
                type="button"
                onClick={addManualSkill}
                className="px-4 py-2 rounded-xl bg-gradient-to-t from-[#808080] to-[#A2A4A7] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Add
              </button>
            </div>

            {/* Industry clarification picker (Caroline 5/22 sketch) */}
            {pendingClarification && (
              <div className="mt-3 p-3 rounded-xl border-2 border-skTeal/30 bg-skBeta-bg">
                <p className="text-sm font-semibold text-skGray mb-2">
                  &ldquo;{pendingClarification.raw}&rdquo; — which industry did you mean?
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {pendingClarification.industries.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => {
                        const raw = pendingClarification.raw;
                        setPendingClarification(null);
                        commitManualSkill(raw);
                      }}
                      className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white border-2 border-skTeal text-skTeal hover:bg-skTeal hover:text-white transition-colors"
                    >
                      {ind}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPendingClarification(null)}
                  className="text-xs text-skGray-desc hover:text-skTeal underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---- Employment details ---- */}
        {totalSkills > 0 && (
          <div className="max-w-2xl space-y-5 mb-6 animate-fade-in">
            {/* Employment type */}
            <fieldset>
              <legend className="text-sm font-semibold text-skGray mb-2">Employment</legend>
              <div className="flex flex-wrap gap-4">
                {([
                  ["contract", "Contract"],
                  ["part_time", "Part-time"],
                  ["full_time", "Full-time"],
                ] as const).map(([val, label]) => (
                  <SkRadio
                    key={val}
                    name="employment"
                    value={val}
                    checked={employment === val}
                    onChange={() => setEmployment(val)}
                    label={label}
                  />
                ))}
              </div>
            </fieldset>

            {/* Shift */}
            <fieldset>
              <legend className="text-sm font-semibold text-skGray mb-2">Shift</legend>
              <div className="flex flex-wrap gap-4">
                {([
                  ["day", "Day-shift"],
                  ["night", "Night-shift"],
                  ["on_call", "On-Call"],
                ] as const).map(([val, label]) => (
                  <SkRadio
                    key={val}
                    name="shift"
                    value={val}
                    checked={shift === val}
                    onChange={() => setShift(val)}
                    label={label}
                  />
                ))}
              </div>
            </fieldset>

            {/* Location */}
            <fieldset>
              <legend className="text-sm font-semibold text-skGray mb-2">Location</legend>
              <div className="flex flex-wrap gap-4">
                {([
                  ["on_site", "On-site"],
                  ["hybrid", "Hybrid"],
                  ["remote", "Remote"],
                ] as const).map(([val, label]) => (
                  <SkRadio
                    key={val}
                    name="location"
                    value={val}
                    checked={location === val}
                    onChange={() => setLocation(val)}
                    label={label}
                  />
                ))}
              </div>
            </fieldset>

            {/* Pay */}
            <fieldset>
              <legend className="text-sm font-semibold text-skGray mb-2">Pay</legend>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pay}
                  onChange={(e) => setPay(e.target.value)}
                  placeholder="ex: $80,000"
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-skTeal-bright focus:border-[3px] focus:border-skTeal-bright focus:outline-none text-gray-900 placeholder:text-skTeal bg-white"
                />
                <div className="relative">
                  <select
                    value={payPeriod}
                    onChange={(e) => setPayPeriod(e.target.value as "year" | "month" | "hour")}
                    className="px-4 pr-10 py-2.5 rounded-xl bg-skTeal text-white font-semibold border-0 cursor-pointer appearance-none min-w-[110px]"
                  >
                    <option value="year">/year</option>
                    <option value="month">/month</option>
                    <option value="hour">/hour</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
                  />
                </div>
              </div>
            </fieldset>
          </div>
        )}

        {/* ---- Stats line ---- */}
        {totalSkills > 0 && candidateCount > 0 && (
          <p className="max-w-2xl text-sm text-skGray-desc mb-5">
            ~{candidateCount} candidates
            {payNum > 0 && (
              <span>
                {" "}&bull; avg ${Math.round(hourlyLow)}&ndash;${Math.round(hourlyHigh)}/hr
              </span>
            )}
          </p>
        )}

        {/* ---- CTA ---- */}
        <div className="max-w-2xl">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`w-full py-3.5 px-5 rounded-xl text-white font-bold text-base transition-all flex items-center justify-between ${
              canSubmit
                ? "bg-gradient-to-r from-[#01D6FF] to-[#09C8C8] hover:opacity-95 shadow-md hover:shadow-lg cursor-pointer"
                : "bg-coolgray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={{ fontFamily: "Open Sans, var(--font-inter), system-ui, sans-serif" }}
          >
            <span className="text-left">See Candidates</span>
            <ArrowRight size={20} className="text-white" aria-hidden="true" />
          </button>
        </div>

        {/* Toast */}
        {shareToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-skGray text-white text-sm font-medium shadow-lg animate-fade-in">
            {shareToast}
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page export with Suspense                                          */
/* ------------------------------------------------------------------ */

export default function PostJobPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-coolgray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-skTeal border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PostJobContent />
    </Suspense>
  );
}
