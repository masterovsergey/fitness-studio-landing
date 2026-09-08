import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import {
  getFitnessServiceStatus,
  getFitnessServiceUrl,
} from "../lib/fitness-service.ts";

const outputRoot = new URL("../dist/client/", import.meta.url);
const basePath = "/fitness-studio-landing";

test("keeps static-page history navigation out of the server router", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");
  const script = html.match(/<script id="static-page-navigation">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, "static navigation guard is missing from the Pages HTML");

  const location = { pathname: `${basePath}/`, search: "", hash: "" };
  const history = { scrollRestoration: "manual" };
  let listener;
  runInNewContext(script, {
    window: {
      location,
      history,
      addEventListener(type, callback, options) {
        assert.equal(type, "popstate");
        assert.equal(options.capture, true);
        listener = callback;
      },
    },
  });
  assert.equal(typeof listener, "function");

  function navigate(url) {
    Object.assign(location, url);
    let serverNavigationBlocked = false;
    listener({
      stopImmediatePropagation() { serverNavigationBlocked = true; },
      preventDefault() { assert.fail("native history navigation must not be cancelled"); },
    });
    return serverNavigationBlocked;
  }

  assert.equal(navigate({ hash: "#service" }), true);
  assert.equal(history.scrollRestoration, "auto");
  assert.equal(navigate({ hash: "#top" }), true);
  assert.equal(navigate({ search: "?utm_source=demo", hash: "" }), true);
  assert.equal(navigate({ pathname: "/another-page/" }), false);
});

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
  assert.match(html, /Твоё расписание/i);
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
        .length >= 9,
      "connected client portal URL is missing from the main entry points",
    );
    assert.match(html, /Открыть личный кабинет/i);
    assert.doesNotMatch(html, /Появится после подключения сервиса/i);
    assert.doesNotMatch(html, /href="[^\"]*\/club\/#(?:profile|schedule)"/i);
  } else {
    assert.match(html, /Открыть демо-профиль/i);
    assert.match(html, /Настоящие бронирования и оплата пока не подключены/i);
    assert.match(html, /class="service-portal-link" href="\/fitness-studio-landing\/club\/#profile"/i);
    assert.match(html, /class="cabinet-link" href="\/fitness-studio-landing\/club\/#profile"/i);
    assert.match(html, /class="header-cta" href="\/fitness-studio-landing\/club\/#schedule"/i);
    assert.match(html, /class="mobile-booking" href="\/fitness-studio-landing\/club\/#schedule"/i);
    assert.equal((html.match(/href="\/fitness-studio-landing\/club\/#profile"/g) ?? []).length, 4);
    assert.equal((html.match(/href="\/fitness-studio-landing\/club\/#schedule"/g) ?? []).length, 5);
    assert.doesNotMatch(html, /Будущий личный кабинет|Появится после подключения сервиса|Личный кабинет подключён/i);
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
    "club",
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
