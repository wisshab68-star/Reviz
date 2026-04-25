import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://revizai.app", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://revizai.app/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://revizai.app/try", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://revizai.app/sign-in", lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: "https://revizai.app/sign-up", lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
  ];
}
