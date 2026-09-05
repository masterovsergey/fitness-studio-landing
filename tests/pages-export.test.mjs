import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import test from "node:test";
import {
  getFitnessServiceStatus,
  getFitnessServiceUrl,
} from "../lib/fitness-service.ts";

const outputRoot = new URL("../dist/client/", import.meta.url);
const basePath = "/fitness-studio-landing";

test("creates a complete GitHub Pages artifact", async () => {
  await Promise.all([
    access(new URL("index.html", outputRoot)),
    access(new URL("404.html", outputRoot)),
    access(new URL(".nojekyll", outputRoot)),
    access(new URL("robots.txt", outputRoot)),
    access(new URL("sitemap.xml", outputRoot)),
  ]);

  const html = await readFile(new URL("index.html", outputRoot), "utf8");
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/masterovsergey\.github\.io\/fitness-studio-landing\/"/i,
  );
  assert.match(html, /name="robots" content="noindex, nofollow"/i);
  assert.match(
    html,
    /\/fitness-studio-landing\/images\/loft-hero-v2\.webp/i,
  );
  assert.match(
    html,
    /\/fitness-studio-landing\/fonts\/Manrope-Regular\.ttf/i,
  );
  assert.match(html, /id="service"/i);
  assert.match(html, /Запись и оплата/i);
  assert.match(html, /Личный кабинет/i);
  assert.doesNotMatch(
    html,
    /Приложение для тренеров|Для команды|Вход для тренеров|Сервис для тренеров/i,
  );
  const clientPortalUrl = getFitnessServiceUrl(
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL,
  );
  const expectedServiceStatus = getFitnessServiceStatus(clientPortalUrl);
  assert.ok(
    html.includes(expectedServiceStatus),
    `missing service status: ${expectedServiceStatus}`,
  );
  if (clientPortalUrl) {
    const escapedPortalUrl = clientPortalUrl
      .replaceAll("&", "&amp;")
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      html,
      new RegExp(
        `class="service-portal-link" href="${escapedPortalUrl}"`,
        "i",
      ),
    );
    assert.ok(
      (html.match(new RegExp(`href="${escapedPortalUrl}"`, "gi")) ?? [])
        .length >= 4,
      "connected client portal URL is missing from the main entry points",
    );
    assert.match(html, /Открыть личный кабинет/i);
    assert.doesNotMatch(html, /Появится после подключения сервиса/i);
  } else {
    assert.match(html, /Появится после подключения сервиса/i);
    assert.doesNotMatch(html, /Открыть личный кабинет/i);
    assert.doesNotMatch(html, /class="service-portal-link"/i);
  }

  const [robots, sitemap] = await Promise.all([
    readFile(new URL("robots.txt", outputRoot), "utf8"),
    readFile(new URL("sitemap.xml", outputRoot), "utf8"),
  ]);
  assert.match(robots, /Disallow: \/$/m);
  assert.doesNotMatch(sitemap, /<loc>/i);

  for (const match of html.matchAll(/\b(?:href|src|srcset)="(\/[^\"]*)"/gi)) {
    assert.ok(
      match[1].startsWith(`${basePath}/`),
      `root-relative URL misses the Pages base path: ${match[1]}`,
    );
  }

  const assetNames = await readdir(new URL("assets/", outputRoot));
  assert.ok(assetNames.some((name) => name.endsWith(".css")));

  const rootNames = (await readdir(outputRoot)).sort();
  assert.deepEqual(rootNames, [
    ".nojekyll",
    "404.html",
    "assets",
    "favicon.svg",
    "fonts",
    "images",
    "index.html",
    "og-loft-v2-1200.png",
    "robots.txt",
    "sitemap.xml",
  ]);
  assert.deepEqual((await readdir(new URL("fonts/", outputRoot))).sort(), [
    "CormorantGaramond-Italic.ttf",
    "CormorantGaramond-Regular.ttf",
    "Manrope-Regular.ttf",
    "Manrope-SemiBold.ttf",
    "OFL.txt",
  ]);
  assert.deepEqual((await readdir(new URL("images/", outputRoot))).sort(), [
    "loft-hero-v2-mobile.webp",
    "loft-hero-v2.webp",
    "loft-space-v2-mobile.webp",
    "loft-space-v2.webp",
    "trainers",
  ]);
  assert.deepEqual(
    (await readdir(new URL("images/trainers/", outputRoot))).sort(),
    [
      "trainer-01-v3.webp",
      "trainer-02-v3.webp",
      "trainer-03-v3.webp",
      "trainer-04-v3.webp",
      "trainer-05-v3.webp",
      "trainer-06-v3.webp",
    ],
  );
  assert.doesNotMatch(html, /(?:src|srcset)="\/images\//i);
  assert.doesNotMatch(html, /url\(["']?\/fonts\//i);
  assert.doesNotMatch(html, /MELUNIS|client-estimate|chrome-profile/i);
});
