function normalizeSiteUrl(value) {
  const url = new URL(value);
  url.search = "";
  url.hash = "";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  return url;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function createStaticSearchFiles(value, isIndexable) {
  const siteUrl = normalizeSiteUrl(value);
  const sitemapUrl = new URL("sitemap.xml", siteUrl).toString();
  const robots = isIndexable
    ? [
        "User-agent: *",
        `Allow: ${siteUrl.pathname}`,
        `Sitemap: ${sitemapUrl}`,
        "",
      ].join("\n")
    : "User-agent: *\nDisallow: /\n";
  const sitemapEntry = isIndexable
    ? [
        "  <url>",
        `    <loc>${escapeXml(siteUrl.toString())}</loc>`,
        "    <changefreq>weekly</changefreq>",
        "    <priority>1.0</priority>",
        "  </url>",
      ].join("\n")
    : "";
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    sitemapEntry,
    "</urlset>",
    "",
  ]
    .filter((line, index, lines) => line || index === lines.length - 1)
    .join("\n");

  return { robots, sitemap };
}
