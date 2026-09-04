import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "../lib/public-site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const isIndexable = Boolean(
    siteUrl && process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true",
  );

  if (!siteUrl || !isIndexable) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: new URL("sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
