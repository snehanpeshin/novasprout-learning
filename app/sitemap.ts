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
  "/privacy",
  "/refund-policy"
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.includes("tutoring") || route === "/contact" ? 0.85 : 0.7
  }));
}
