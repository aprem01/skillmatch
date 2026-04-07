import Link from "next/link";
import {
  Check,
  X,
  ArrowRight,
  Users,
  Target,
  Eye,
  Clock,
  TrendingUp,
} from "lucide-react";

const valueProps = [
  {
    icon: Users,
    title: "Top candidates, already matched",
    desc: "Only see workers who meet 100% of your required skills — no more resumes to screen.",
  },
  {
    icon: Target,
    title: "Prioritize what matters most",
    desc: "Select top skills, certifications, and experience to find the best fit.",
  },
  {
    icon: Eye,
    title: "See why each candidate fits",
    desc: "Clear insights show exactly how each candidate matches your role.",
  },
  {
    icon: Clock,
    title: "Hire in minutes, not days",
    desc: "Instantly connect with your best matches — no more waiting for applications.",
  },
  {
    icon: TrendingUp,
    title: "A stronger talent pool over time",
    desc: "We encourage workers to gain skills and certifications, so you get better candidates. Forever.",
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
      {/* Teal top bar */}
      <div className="h-1 bg-teal w-full" />

      {/* Header */}
      <header className="w-full px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <span className="text-2xl font-bold italic text-teal tracking-tight">
            Skillmatch
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 pb-20">
        <section className="bg-white rounded-2xl shadow-sm px-8 py-14 sm:px-14 sm:py-16 text-center mt-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Find the best candidates for any job — instantly.
          </h1>
          <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
            Enter a job title or skills — we&apos;ll match you with the best
            candidates in seconds.
          </p>
          <p className="mt-3 text-teal underline text-sm font-medium">
            Try us now for free while we are in Beta.
          </p>
          <div className="mt-8">
            <Link
              href="/post-job"
              className="inline-flex items-center gap-2 bg-teal hover:bg-teal-dark text-white font-semibold text-lg px-8 py-3.5 rounded-full transition-colors"
            >
              Find Workers
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="mt-3 text-gray-400 text-sm">
            Takes less than 30 seconds.
          </p>
        </section>

        {/* Value Props */}
        <section className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {valueProps.map((prop) => (
            <div key={prop.title} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-teal flex items-center justify-center mb-4">
                <prop.icon className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                {prop.title}
              </h3>
              <p className="mt-2 text-gray-500 text-xs leading-relaxed">
                {prop.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Comparison Table */}
        <section className="mt-20 bg-white rounded-2xl shadow-sm px-6 py-10 sm:px-12 sm:py-12">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto] items-end gap-x-6 pb-4 border-b border-gray-100">
            <div />
            <div className="text-center w-32">
              <span className="text-lg font-bold italic text-teal">
                Skillmatch
              </span>
            </div>
            <div className="text-center w-32">
              <span className="text-sm font-medium text-gray-400">
                Traditional platforms
              </span>
            </div>
          </div>

          {/* Table rows */}
          {comparisonRows.map((row) => (
            <div
              key={row}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 py-3.5 border-b border-gray-50 last:border-b-0"
            >
              <span className="text-sm text-gray-700">{row}</span>
              <div className="flex justify-center w-32">
                <div className="w-6 h-6 rounded-full bg-green-light flex items-center justify-center">
                  <Check className="w-4 h-4 text-green" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex justify-center w-32">
                <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                  <X className="w-4 h-4 text-red-400" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Footer tagline */}
        <p className="mt-14 text-center text-gray-500 text-base font-medium">
          Skillmatch doesn&apos;t just find better candidates — it helps create
          them.
        </p>
      </main>
    </div>
  );
}
