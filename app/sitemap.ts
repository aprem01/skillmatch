import type { MetadataRoute } from "next";

const BASE = "https://skillmatch-red.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/post-job`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE}/candidates`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
