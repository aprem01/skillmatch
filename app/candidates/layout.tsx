import type { Metadata } from "next";
import SEOContent from "@/components/SEOContent";

export const metadata: Metadata = {
  title: "Ranked Candidates — Skill Match Results",
  description:
    "See candidates ranked by skill match percentage. Expand any candidate to see which required and optional skills they have. Unlock to contact.",
  alternates: { canonical: "https://skillmatch-red.vercel.app/candidates" },
};

export default function CandidatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SEOContent
        title="Your Candidate Matches on Skillmatch"
        description="The Skillmatch Candidates page shows a ranked list of workers who match your job's required skills. Each row displays: anonymous handle, overall match score (percentage based on required + optional skills), and a quick breakdown. Expand any candidate to see the full skill match — which required skills they have, which optional skills bump their score. Unlock a candidate to reveal their contact details and start the conversation."
        bullets={[
          "Candidates ranked by overall match score (required + optional)",
          "Anonymous handles reduce unconscious bias in initial screening",
          "Green checkmarks for required skills they have, red X for missing",
          "Optional skill matches highlighted separately",
          "Unlock a candidate to reveal contact details (pay-per-unlock)",
          "Once unlocked, send an invitation to interview or hire",
        ]}
      />
      {children}
    </>
  );
}
