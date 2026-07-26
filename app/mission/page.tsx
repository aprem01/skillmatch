import SkillmatchHeader from "@/components/SkillmatchHeader";

export const metadata = {
  title: "Our Mission — Skilmatch",
  description:
    "Skilmatch helps employers hire the hourly workers whose skills actually fit — not the ones whose resumes were tuned for keyword parsers.",
};

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-skWhite flex flex-col">
      <SkillmatchHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pt-10 pb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3 leading-tight">
          Our Mission
        </h1>
        <p className="text-lg text-gray-500 mb-8 leading-relaxed">
          Hire the person who can actually do the job — not the one who
          knew what keywords to put in a resume.
        </p>

        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-5">
          <p>
            Skilmatch exists because the last twenty years of hiring
            technology optimized for one thing: sorting resumes. That
            worked for jobs where resumes correlate with capability. It
            has been a disaster for hourly and skilled-trade work, where
            most of the best candidates never had a resume at all.
          </p>

          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-3">
            What we do
          </h2>
          <p>
            You describe the role in plain English. We convert it into
            required skills, then match against a live pool of Chicago
            workers who have declared those exact skills — no resume
            parsing, no keyword gymnastics. Every candidate is
            skill-verified before we surface them.
          </p>

          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-3">
            Who we serve first
          </h2>
          <p>
            Home-care agencies, staffing firms, and independent
            employers hiring HHAs and caregivers in the Chicago metro.
            This is the vertical where the resume-first pipeline hurts
            most.
          </p>

          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-3">
            What we don&apos;t do
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>We don&apos;t sell you fake resume matches.</li>
            <li>We don&apos;t hide candidate contact behind hidden fees.</li>
            <li>We don&apos;t let candidates get harassed by unqualified messages.</li>
          </ul>

          <p>
            We&apos;re a Chicago beta. If a match landed and the worker
            was great, or if you got noise instead of signal, we want to
            know — the loop is how the product gets better.
          </p>
        </div>
      </main>
    </div>
  );
}
