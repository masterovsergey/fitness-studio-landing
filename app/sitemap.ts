import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "../lib/public-site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getPublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const isIndexable = Boolean(
    siteUrl && process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true",
  );

  if (!siteUrl || !isIndexable) {
    return [];
  }

  return [
    {
      url: siteUrl.toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
