import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://www.revizai.app", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://www.revizai.app/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://www.revizai.app/try", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.revizai.app/sign-in", lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: "https://www.revizai.app/sign-up", lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
  ];
}
