import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.novasproutlearning.com";

const routes = [
  "",
  "/find-a-tutor",
  "/curriculum-demo",
  "/ai-lesson-generator",
  "/become-a-tutor",
  "/math-tutoring",
  "/science-tutoring",
  "/coding-data-skills",
  "/study-skills",
  "/pricing",
  "/resources",
  "/privacy",
  "/refund-policy"
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
