import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      // AI crawlers
      { userAgent: "GPTBot", allow: "/", disallow: ["/api/"] },
      { userAgent: "ChatGPT-User", allow: "/", disallow: ["/api/"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/api/"] },
      { userAgent: "Claude-Web", allow: "/", disallow: ["/api/"] },
      { userAgent: "anthropic-ai", allow: "/", disallow: ["/api/"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/api/"] },
      { userAgent: "Perplexity-User", allow: "/", disallow: ["/api/"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/api/"] },
      { userAgent: "CCBot", allow: "/", disallow: ["/api/"] },
      { userAgent: "Amazonbot", allow: "/", disallow: ["/api/"] },
      { userAgent: "Applebot-Extended", allow: "/", disallow: ["/api/"] },
      { userAgent: "Bytespider", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: "https://skillmatch-red.vercel.app/sitemap.xml",
    host: "https://skillmatch-red.vercel.app",
  };
}
