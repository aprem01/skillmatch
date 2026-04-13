import type { Metadata } from "next";
import SEOContent from "@/components/SEOContent";

export const metadata: Metadata = {
  title: "Post a Job — Find Candidates by Skills",
  description:
    "Enter a job title, AI auto-generates the required skills for that role. Set employment type, shift, pay, and location. See qualified candidates in seconds.",
  alternates: { canonical: "https://skillmatch-red.vercel.app/post-job" },
};

export default function PostJobLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SEOContent
        title="Post a Job on Skillmatch"
        description="The Skillmatch Post a Job page lets you define a role and instantly find candidates matching the required skills. Type a role title like 'Sales Associate' or 'HVAC Assistant' — our AI returns variants (specialty breakouts) and auto-populates the required and optional skills for each variant. You configure employment type, shift, location, and pay. Click See Candidates to view ranked, anonymous candidates who match your requirements."
        bullets={[
          "Type a role title — AI returns 3-4 specialty variants",
          "Required skills auto-populate as teal pills",
          "Optional skills auto-populate as green pills — they boost match score but aren't required",
          "Tap any pill to toggle between required and optional",
          "Add your own skills with the input field below the basket",
          "Employment: Contract, Part-time, Full-time",
          "Shift: Day, Night, On-Call",
          "Location: On-site, Hybrid, Remote",
          "Pay: enter per year, month, or hour — auto-converted",
        ]}
        callToAction="Post your first job for free while in Beta."
      />
      {children}
    </>
  );
}
