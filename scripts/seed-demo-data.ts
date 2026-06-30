/**
 * Demo-data seed for the shared Neon DB.
 *
 * Caroline 6/27 Round 4: she asked for test candidates + test job
 * posts so Messages / Edit Job / View Candidates / View Messages /
 * Dashboard all show meaningful data during testing. This script
 * populates exactly that — 3 demo recruiters, 6 demo jobs, 30 demo
 * workers with skill baskets aligned to the jobs.
 *
 * Idempotent: every demo entity uses a `@demo.` email pattern so
 * re-running upserts rather than duplicating. Real (non-demo) data
 * is never touched.
 *
 * Run: cd ~/workpath && npx tsx scripts/seed-demo-data.ts
 *
 * To wipe demo data without touching real users:
 *   psql $DATABASE_URL -c "DELETE FROM \"Job\" WHERE \"recruiterEmail\" LIKE '%@demo.%';"
 *   psql $DATABASE_URL -c "DELETE FROM \"User\" WHERE \"anonymousHandle\" LIKE 'demo%';"
 */

import * as path from "node:path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ── Demo recruiters ──────────────────────────────────────────────
const RECRUITERS = [
  {
    workEmail: "karen@demo.forddirect.com",
    companyName: "Ford Direct",
    recruiterName: "Karen Mendez",
    jobTitle: "Talent Acquisition Manager",
  },
  {
    workEmail: "sarah@demo.attendhomecare.com",
    companyName: "Attend Home Care",
    recruiterName: "Sarah Chen",
    jobTitle: "HR Manager",
  },
  {
    workEmail: "marcus@demo.solarchicago.com",
    companyName: "Solar Chicago",
    recruiterName: "Marcus Reilly",
    jobTitle: "Operations Director",
  },
];

// ── Demo jobs (vertical roughly maps to lib/domains.ts verticals) ──
const JOBS = [
  {
    recruiterEmail: "sarah@demo.attendhomecare.com",
    title: "Home Health Aide — Elderly/Geriatric Care",
    employer: "Attend Home Care",
    location: "Lakeview, Chicago, IL",
    vertical: "healthcare",
    description:
      "Provide in-home care to elderly clients in the Lakeview area. Companionship, mobility assistance, medication reminders, light housekeeping. Background check and HHA Certification required.",
    payMin: 1750,
    payMax: 2100,
    payType: "hourly",
    shiftType: "full_time",
    requiredSkills: ["Personal Care Assistance", "Vital Signs Monitoring", "Companionship", "Mobility Assistance", "HHA Certification"],
    optionalSkills: ["Dementia and Alzheimer's care", "Hospice and palliative care support", "CPR / First Aid", "Bilingual Spanish"],
  },
  {
    recruiterEmail: "sarah@demo.attendhomecare.com",
    title: "Certified Nursing Assistant",
    employer: "Attend Home Care",
    location: "Edgewater, Chicago, IL",
    vertical: "healthcare",
    description:
      "CNA position supporting our home-care clients with daily living activities, vital monitoring, and documentation. Must be IL-state certified.",
    payMin: 1900,
    payMax: 2400,
    payType: "hourly",
    shiftType: "full_time",
    requiredSkills: ["Patient Care", "Vital Signs Monitoring", "CNA License", "EMR Charting"],
    optionalSkills: ["Wound Care", "Catheter Care", "Dementia and Alzheimer's care"],
  },
  {
    recruiterEmail: "marcus@demo.solarchicago.com",
    title: "Solar Photovoltaic Installer",
    employer: "Solar Chicago",
    location: "Forest Park, Chicago, IL",
    vertical: "trades",
    description:
      "Install residential + commercial solar systems across the Chicagoland area. OSHA-10 required, OSHA-30 a plus.",
    payMin: 2400,
    payMax: 3000,
    payType: "hourly",
    shiftType: "full_time",
    requiredSkills: ["Install solar energy systems", "Electrical Wiring", "OSHA-10 Certification", "Blueprint Reading"],
    optionalSkills: ["Roofing Safety", "Inverter Setup", "OSHA-30 Certification"],
  },
  {
    recruiterEmail: "marcus@demo.solarchicago.com",
    title: "Electrician — Residential",
    employer: "Solar Chicago",
    location: "LaGrange, IL",
    vertical: "trades",
    description:
      "Licensed residential electrician supporting solar installs + service calls. Trade license required.",
    payMin: 3200,
    payMax: 4200,
    payType: "hourly",
    shiftType: "full_time",
    requiredSkills: ["Electrical Wiring", "Trade License", "Conduit Bending", "Electrical Code (NEC)"],
    optionalSkills: ["Troubleshooting", "Blueprint Reading"],
  },
  {
    recruiterEmail: "karen@demo.forddirect.com",
    title: "Auto Service Advisor",
    employer: "Ford Direct",
    location: "Chicago, IL",
    vertical: "automotive",
    description:
      "Service advisor role at a high-volume Ford dealership. Customer service + service writing + dealership management system.",
    payMin: 2200,
    payMax: 2800,
    payType: "hourly",
    shiftType: "full_time",
    requiredSkills: ["Customer Service", "Service Writing", "Estimating", "Dealership Management System"],
    optionalSkills: ["Upselling"],
  },
  {
    recruiterEmail: "karen@demo.forddirect.com",
    title: "Auto Mechanic — Ford-Certified",
    employer: "Ford Direct",
    location: "Chicago, IL",
    vertical: "automotive",
    description:
      "Ford-certified mechanic for engine diagnostics, brake repair, transmission service. ASE certification preferred.",
    payMin: 2800,
    payMax: 3600,
    payType: "hourly",
    shiftType: "full_time",
    requiredSkills: ["Engine Diagnostics", "Brake Repair", "Transmission Service", "OBD-II Scanning"],
    optionalSkills: ["ASE Certification", "Hand & Power Tools", "Suspension & Alignment"],
  },
];

// ── Demo workers (anonymous handles + skill baskets) ─────────────
// Each handle is "demo" + 2 syllables + 3 digits so they're trivially
// distinguishable from real users (who use just 2 syllables + digits).
const SYLLABLES = ["kee","joo","mee","too","noo","bee","zee","loo","ka","to","bu","mi","ze","ri","lu","na","fi","da"];
function demoHandle(seed: number): string {
  const s1 = SYLLABLES[(seed * 7) % SYLLABLES.length];
  const s2 = SYLLABLES[(seed * 13) % SYLLABLES.length];
  const n = 100 + (seed * 37) % 900;
  return `demo${s1}${s2}${n}`;
}

const WORKER_BASKETS = [
  // ── 10 healthcare workers ────────────────────────────────────
  ...Array.from({ length: 10 }, (_, i) => ({
    handle: demoHandle(i + 1),
    zipCode: ["60614", "60640", "60622", "60625", "60618"][i % 5],
    skills: [
      "Personal Care Assistance",
      "Vital Signs Monitoring",
      "Companionship",
      ...(i % 3 === 0 ? ["Dementia and Alzheimer's care", "HHA Certification", "Bilingual Spanish"] : []),
      ...(i % 3 === 1 ? ["CNA License", "Patient Care", "EMR Charting", "Wound Care"] : []),
      ...(i % 3 === 2 ? ["Hospice and palliative care support", "CPR / First Aid", "Mobility Assistance"] : []),
    ],
  })),
  // ── 10 trades workers ─────────────────────────────────────────
  ...Array.from({ length: 10 }, (_, i) => ({
    handle: demoHandle(i + 11),
    zipCode: ["60160", "60546", "60130", "60154", "60153"][i % 5],
    skills: [
      "Electrical Wiring",
      "OSHA-10 Certification",
      "Hand & Power Tools",
      ...(i % 3 === 0 ? ["Install solar energy systems", "Roofing Safety", "Inverter Setup"] : []),
      ...(i % 3 === 1 ? ["Trade License", "Conduit Bending", "Electrical Code (NEC)", "Troubleshooting"] : []),
      ...(i % 3 === 2 ? ["Blueprint Reading", "OSHA-30 Certification"] : []),
    ],
  })),
  // ── 10 automotive / customer service workers ──────────────────
  ...Array.from({ length: 10 }, (_, i) => ({
    handle: demoHandle(i + 21),
    zipCode: ["60615", "60601", "60612", "60630", "60655"][i % 5],
    skills: [
      "Customer Service",
      "Cash Handling",
      ...(i % 3 === 0 ? ["Engine Diagnostics", "Brake Repair", "OBD-II Scanning", "ASE Certification"] : []),
      ...(i % 3 === 1 ? ["Service Writing", "Estimating", "Upselling", "Dealership Management System"] : []),
      ...(i % 3 === 2 ? ["Transmission Service", "Hand & Power Tools", "Suspension & Alignment"] : []),
    ],
  })),
];

async function main() {
  console.log("Seeding demo data…");

  // 1. Recruiters
  for (const r of RECRUITERS) {
    await prisma.recruiterVerification.upsert({
      where: { workEmail: r.workEmail },
      create: { ...r, status: "verified", verifiedAt: new Date() },
      update: { status: "verified", verifiedAt: new Date() },
    });
  }
  console.log(`  ${RECRUITERS.length} recruiters`);

  // 2. Jobs — first remove any prior demo jobs from these recruiters so
  // re-runs don't accumulate.
  for (const r of RECRUITERS) {
    await prisma.job.deleteMany({ where: { recruiterEmail: r.workEmail } });
  }
  for (const j of JOBS) {
    const created = await prisma.job.create({
      data: {
        title: j.title,
        employer: j.employer,
        location: j.location,
        vertical: j.vertical,
        description: j.description,
        payMin: j.payMin,
        payMax: j.payMax,
        payType: j.payType,
        shiftType: j.shiftType,
        isActive: true,
        recruiterEmail: j.recruiterEmail,
        optionalSkills: j.optionalSkills,
      },
    });
    await prisma.jobSkill.createMany({
      data: j.requiredSkills.map((s) => ({
        jobId: created.id,
        normalizedTerm: s,
        proficiencyLevel: "intermediate",
        isRequired: true,
      })),
    });
  }
  console.log(`  ${JOBS.length} jobs`);

  // 3. Workers
  for (const w of WORKER_BASKETS) {
    const user = await prisma.user.upsert({
      where: { anonymousHandle: w.handle },
      create: {
        anonymousHandle: w.handle,
        zipCode: w.zipCode,
        profileComplete: true,
      },
      update: { zipCode: w.zipCode, profileComplete: true },
      select: { id: true },
    });
    await prisma.$transaction([
      prisma.userSkill.deleteMany({ where: { userId: user.id } }),
      prisma.userSkill.createMany({
        data: w.skills.map((s) => ({
          userId: user.id,
          rawInput: s,
          normalizedTerm: s,
          category: "other",
          proficiencyLevel: "intermediate",
          isAISuggested: false,
        })),
      }),
    ]);
  }
  console.log(`  ${WORKER_BASKETS.length} workers (with skill baskets)`);

  console.log("\nDone. Skilmatch /dashboard will now show real recruiter jobs.");
  console.log("/api/employer/candidates will return real workers from UserSkill pool.");
}

main()
  .catch((e) => {
    console.error("seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
