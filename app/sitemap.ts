import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.novasproutlearning.com";

const routes = [
  "",
  "/math-tutoring",
  "/science-tutoring",
  "/coding-data-skills",
  "/study-skills",
  "/pricing",
  "/contact",
  "/become-a-tutor",
  "/resources",
  "/ai-lesson-generator",
  "/human-tutoring",
  "/privacy",
  "/terms",
  "/refund-policy"
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/ai-lesson-generator" ? 0.95 : route === "/pricing" ? 0.9 : 0.7
  }));
}
