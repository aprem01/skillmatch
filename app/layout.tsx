import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#00BFA5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Skillmatch — Find the best candidates for any job, instantly",
  description:
    "Enter a job title or skills — we'll match you with the best candidates in seconds. Based on real skills, not resumes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script src="/native-bridge.js" defer />
      </head>
      <body className="font-sans antialiased bg-coolgray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
