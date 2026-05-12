import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";

const valueProps = [
  {
    icon: "/icon-checkmark.png",
    title: "Top candidates, already matched",
    desc: "Only see workers who meet 100% of your required skills — no more resumes to screen.",
  },
  {
    icon: "/icon-target.png",
    title: "Prioritize what matters most",
    desc: "Select top skills, certifications, and experience to find the best fit.",
  },
  {
    icon: "/icon-magnifying-glass.png",
    title: "See why each candidate fits",
    desc: "Clear insights show exactly how each candidate matches your role.",
  },
  {
    icon: "/icon-stars.png",
    title: "Hire in minutes, not days",
    desc: "Instantly connect with your best matches — no more waiting for applications.",
  },
  {
    icon: "/icon-certificate.png",
    title: "A stronger talent pool over time",
    desc: "We encourage workers to gain skills and certifications, so you get better candidates over time.",
  },
];

const comparisonRows = [
  "See top candidates instantly",
  "Match 100% of your requirements",
  "No unqualified applicants",
  "No resumes to review",
  "Based on real skills",
  "Prioritize what matters most",
  "Know exactly why they fit",
  "No waiting for applications",
  "Continuously improving talent pool",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-coolgray-50">
      {/* Header — logo only (pre-signup, no full SkillmatchHeader) */}
      <header className="w-full px-6 py-5 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <Image
            src="/skillmatch-logo.png"
            alt="Skillmatch"
            width={180}
            height={42}
            priority
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-20">
        {/* Hero — sits directly on gray page background (no white card) */}
        <section className="pt-10 sm:pt-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-skGray leading-tight max-w-3xl">
            Find the best candidates for any job — instantly.
          </h1>
          <p className="mt-4 text-base sm:text-lg font-semibold text-skGray max-w-2xl">
            Enter a job title or skills — we&apos;ll match you with the best
            candidates in seconds.
          </p>

          {/* Beta band — light blue band, left-aligned text inside */}
          <div className="mt-6 -mx-6 sm:mx-0 sm:rounded-lg bg-skBeta-bg px-6 sm:px-5 py-3">
            <p className="text-sm sm:text-base font-semibold text-skBeta-text">
              Try us now for free while we are in Beta.
            </p>
          </div>

          {/* CTA — rounded box, gradient, left-aligned */}
          <div className="mt-8">
            <Link
              href="/post-job"
              className="inline-flex items-center justify-between gap-6 bg-gradient-to-r from-skTeal-bright to-skTeal-light text-white font-bold text-lg px-8 py-3.5 rounded-xl shadow-sm hover:opacity-95 transition-opacity"
            >
              <span className="text-left">Find Workers</span>
              <Image
                src="/forward-arrow.png"
                alt=""
                width={18}
                height={18}
                aria-hidden="true"
              />
            </Link>
          </div>
          <p className="mt-3 text-skGray-desc text-sm">
            Takes less than 30 seconds.
          </p>
        </section>

        {/* Value Props — ONLY white-background section, left-aligned text */}
        <section className="mt-14 bg-white rounded-2xl shadow-sm px-6 py-10 sm:px-10 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {valueProps.map((prop) => (
              <div
                key={prop.title}
                className="flex flex-col items-start text-left max-w-[14rem]"
              >
                <div className="w-14 h-14 flex items-center justify-start mb-4">
                  <Image
                    src={prop.icon}
                    alt=""
                    width={56}
                    height={56}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-bold text-skTeal-title text-base sm:text-lg leading-snug">
                  {prop.title}
                </h3>
                <p className="mt-2 font-semibold text-skGray-desc text-sm sm:text-base leading-relaxed">
                  {prop.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Chart — no white wrapper, tight 1fr 100px 100px grid */}
        <section className="mt-16 sm:mt-20">
          {/* Header row */}
          <div
            className="grid items-end pb-4 border-b border-gray-200"
            style={{ gridTemplateColumns: "1fr 100px 100px" }}
          >
            <div />
            <div className="flex justify-center">
              <Image
                src="/skillmatch-logo.png"
                alt="Skillmatch"
                width={110}
                height={26}
              />
            </div>
            <div className="flex justify-center text-center">
              <span className="text-sm font-bold text-skGray leading-tight">
                Traditional
                <br />
                Platforms
              </span>
            </div>
          </div>

          {/* Rows */}
          {comparisonRows.map((row) => (
            <div
              key={row}
              className="grid items-center py-3.5 border-b border-gray-100 last:border-b-0"
              style={{ gridTemplateColumns: "1fr 100px 100px" }}
            >
              <span className="text-sm sm:text-base font-semibold text-skGray">
                {row}
              </span>
              <div className="flex justify-center">
                <Image
                  src="/icon-checkmark.png"
                  alt="Included"
                  width={24}
                  height={24}
                />
              </div>
              <div className="flex justify-center">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-red-400" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Footer tagline — left-aligned */}
        <p className="mt-12 mb-12 text-left font-bold text-skGray text-base sm:text-lg max-w-3xl">
          Skillmatch doesn&apos;t just find better candidates — it helps create
          them.
        </p>
      </main>
    </div>
  );
}
