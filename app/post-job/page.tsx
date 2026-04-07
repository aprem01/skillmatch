"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  const bg = type === "required" ? "bg-teal" : "bg-green";
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${bg} text-white text-sm font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 cursor-pointer transition-colors hover:opacity-90 ${animate ? "animate-pill-pop" : ""}`}
      title={type === "required" ? "Click to make optional" : "Click to make required"}
    >
      {label}
      <span
        role="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 text-white/70 hover:text-white text-xs leading-none"
      >
        &times;
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page content                                                  */
/* ------------------------------------------------------------------ */

function PostJobContent() {
  const router = useRouter();

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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const addManualSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (requiredSkills.includes(trimmed) || optionalSkills.includes(trimmed)) {
      setNewSkill("");
      return;
    }
    setAnimatedSkills(new Set([trimmed]));
    setOptionalSkills((s) => [...s, trimmed]);
    setNewSkill("");
    setTimeout(() => setAnimatedSkills(new Set()), 500);
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
      requiredSkills,
      optionalSkills,
      employment,
      shift,
      location,
      pay,
      payPeriod,
    };
    localStorage.setItem("skillmatch_job", JSON.stringify(jobData));
    router.push("/candidates");
  };

  const canSubmit = (selectedRole || roleInput.trim()) && totalSkills > 0;

  return (
    <div className="min-h-screen bg-coolgray-50">
      {/* Header */}
      <header className="w-full px-6 py-4">
        <span className="text-2xl font-bold text-teal">Skillmatch</span>
      </header>

      {/* Main card */}
      <main className="max-w-2xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-coolgray-200 p-6 sm:p-8 animate-fade-in">
          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Find the best candidates in seconds.
          </h1>
          <p className="text-gray-500 mb-8">
            Start with a role — we&apos;ll handle the skills and find your best matches.
          </p>

          {/* ---- Role input ---- */}
          <div className="relative mb-6" ref={dropdownRef}>
            <label htmlFor="role-input" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
              className="w-full px-4 py-3 rounded-xl border-2 border-coolgray-200 focus:border-teal focus:outline-none transition-colors text-gray-900 placeholder:text-gray-400"
            />

            {/* Loading indicator */}
            {isLoadingRoles && (
              <div className="absolute right-4 top-[42px]">
                <div className="w-5 h-5 border-2 border-teal border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Autocomplete dropdown */}
            {showDropdown && roleVariants.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-coolgray-200 rounded-xl shadow-lg overflow-hidden">
                {roleVariants.map((v) => (
                  <button
                    key={v.title}
                    type="button"
                    onClick={() => selectVariant(v)}
                    className="w-full text-left px-4 py-3 hover:bg-teal-light transition-colors text-gray-800 border-b border-coolgray-100 last:border-b-0"
                  >
                    <span className="font-medium">{v.title}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {v.requiredSkills.slice(0, 3).join(", ")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- Skills basket ---- */}
          {totalSkills > 0 && (
            <div className="mb-6 border border-coolgray-200 rounded-xl p-4 animate-fade-in">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Skills &mdash; click to toggle required/optional
              </p>

              {/* Required */}
              {requiredSkills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1.5">Required</p>
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

              {/* Optional */}
              {optionalSkills.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Nice to have</p>
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

              {/* Manual add */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addManualSkill()}
                  placeholder="Add a skill..."
                  className="flex-1 px-3 py-2 rounded-lg border border-coolgray-200 focus:border-teal focus:outline-none text-sm text-gray-800 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={addManualSkill}
                  className="px-4 py-2 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal-dark transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* ---- Employment details ---- */}
          {totalSkills > 0 && (
            <div className="space-y-5 mb-6 animate-fade-in">
              {/* Employment type */}
              <fieldset>
                <legend className="text-sm font-semibold text-gray-700 mb-2">Employment</legend>
                <div className="flex flex-wrap gap-4">
                  {([
                    ["contract", "Contract"],
                    ["part_time", "Part-time"],
                    ["full_time", "Full-time"],
                  ] as const).map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input
                        type="radio"
                        name="employment"
                        value={val}
                        checked={employment === val}
                        onChange={() => setEmployment(val)}
                        className="w-4 h-4 accent-teal"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Shift */}
              <fieldset>
                <legend className="text-sm font-semibold text-gray-700 mb-2">Shift</legend>
                <div className="flex flex-wrap gap-4">
                  {([
                    ["day", "Day-shift"],
                    ["night", "Night-shift"],
                    ["on_call", "On-Call"],
                  ] as const).map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input
                        type="radio"
                        name="shift"
                        value={val}
                        checked={shift === val}
                        onChange={() => setShift(val)}
                        className="w-4 h-4 accent-teal"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Location */}
              <fieldset>
                <legend className="text-sm font-semibold text-gray-700 mb-2">Location</legend>
                <div className="flex flex-wrap gap-4">
                  {([
                    ["on_site", "On-site"],
                    ["hybrid", "Hybrid"],
                    ["remote", "Remote"],
                  ] as const).map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input
                        type="radio"
                        name="location"
                        value={val}
                        checked={location === val}
                        onChange={() => setLocation(val)}
                        className="w-4 h-4 accent-teal"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Pay */}
              <fieldset>
                <legend className="text-sm font-semibold text-gray-700 mb-2">Pay</legend>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pay}
                    onChange={(e) => setPay(e.target.value)}
                    placeholder="ex: $80,000"
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-coolgray-200 focus:border-teal focus:outline-none text-gray-900 placeholder:text-gray-400"
                  />
                  <select
                    value={payPeriod}
                    onChange={(e) => setPayPeriod(e.target.value as "year" | "month" | "hour")}
                    className="px-4 py-2.5 rounded-xl bg-teal text-white font-medium border-0 cursor-pointer appearance-none text-center min-w-[90px]"
                  >
                    <option value="year">/year</option>
                    <option value="month">/month</option>
                    <option value="hour">/hour</option>
                  </select>
                </div>
              </fieldset>
            </div>
          )}

          {/* ---- Stats line ---- */}
          {totalSkills > 0 && candidateCount > 0 && (
            <p className="text-sm text-gray-400 mb-5">
              ~{candidateCount} candidates
              {payNum > 0 && (
                <span>
                  {" "}&bull; avg ${Math.round(hourlyLow)}&ndash;${Math.round(hourlyHigh)}/hr
                </span>
              )}
            </p>
          )}

          {/* ---- CTA ---- */}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`w-full py-3.5 rounded-full text-white font-semibold text-base transition-all ${
              canSubmit
                ? "bg-teal hover:bg-teal-dark shadow-md hover:shadow-lg cursor-pointer"
                : "bg-coolgray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            See Candidates &rarr;
          </button>
        </div>
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
          <div className="w-8 h-8 border-3 border-teal border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PostJobContent />
    </Suspense>
  );
}
