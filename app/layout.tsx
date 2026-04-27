import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = "https://skillmatch-red.vercel.app";

export const viewport: Viewport = {
  themeColor: "#00BFA5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Skillmatch — Find the best candidates for any job, instantly",
    template: "%s | Skillmatch",
  },
  description:
    "Enter a job title or skills — we'll match you with the best candidates in seconds. No resumes to screen, no unqualified applicants. Based on real skills.",
  metadataBase: new URL(BASE_URL),
  applicationName: "Skillmatch",
  authors: [{ name: "Skillmatch" }],
  generator: "Next.js",
  keywords: [
    "hiring",
    "recruiting",
    "candidates",
    "employer",
    "skill-based hiring",
    "talent",
    "job posting",
    "applicant matching",
    "HR tech",
    "recruitment software",
    "skills assessment",
    "bias-free hiring",
    "anonymous hiring",
  ],
  creator: "Skillmatch",
  publisher: "Skillmatch",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Skillmatch — Find the best candidates for any job, instantly",
    description:
      "Post a job, see candidates ranked by skill match. No resumes, no unqualified applicants.",
    type: "website",
    url: BASE_URL,
    siteName: "Skillmatch",
    locale: "en_US",
    images: [
      {
        url: `${BASE_URL}/skillmatch-logo.png`,
        width: 1200,
        height: 630,
        alt: "Skillmatch — Skill-based candidate matching",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skillmatch — Find the best candidates for any job, instantly",
    description:
      "Post a job, see candidates ranked by skill match. No resumes, no unqualified applicants.",
    images: [`${BASE_URL}/skillmatch-logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "business",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Skillmatch",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/skillmatch-logo.png`,
        width: 180,
        height: 42,
      },
      description:
        "Skill-based employer hiring platform. Find candidates by real skills, not resumes. Anonymous candidate handles reduce bias.",
      sameAs: ["https://workpath-iota.vercel.app"],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Skillmatch",
      description:
        "Find the best candidates for any job, instantly. Based on real skills.",
      publisher: { "@id": `${BASE_URL}/#organization` },
    },
    {
      "@type": "WebApplication",
      name: "Skillmatch",
      url: BASE_URL,
      description:
        "AI-powered skill-based hiring platform. Post a role, get ranked anonymous candidates. Only pay when you unlock a candidate.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS",
      offers: [
        {
          "@type": "Offer",
          name: "Post a Job",
          price: "0",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "Unlock Candidate",
          description: "Pay-per-unlock pricing",
        },
      ],
      featureList: [
        "AI role classification",
        "Auto-generated skill taxonomy",
        "Candidates ranked by skill match",
        "Anonymous handles (bias reduction)",
        "Required vs optional skill toggle",
        "Auto pay-period conversion (year/month/hour)",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-coolgray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
