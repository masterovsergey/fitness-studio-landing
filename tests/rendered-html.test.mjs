import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  getFitnessServiceStatus,
  getFitnessServiceUrl,
} from "../lib/fitness-service.ts";
import { getPublicSiteUrl } from "../lib/public-site-url.ts";
import {
  getSiteBasePath,
  withSiteBasePath,
} from "../lib/site-paths.ts";
import { createStaticSearchFiles } from "../scripts/static-search-files.mjs";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the loft fitness landing structure", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(
    response.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assert.equal(
    response.headers.get("permissions-policy"),
    "camera=(), microphone=(), geolocation=()",
  );
  assert.match(
    response.headers.get("content-security-policy-report-only") ?? "",
    /default-src 'self'/,
  );

  const html = await response.text();
  assert.match(html, /<title>Фитнес-студия — сила в своём ритме<\/title>/i);
  assert.match(html, /<span>Сила<\/span>\s*<span class="hero-line-two">в своём/i);
  assert.match(html, /Не конвейер/i);
  assert.match(html, /Разные задачи/i);
  assert.match(html, /Личный кабинет/i);
  assert.match(html, /Один маршрут/i);
  assert.match(html, /Два понятных входа/i);
  assert.match(html, /Приложение для клиентов/i);
  assert.match(html, /Приложение для тренеров/i);
  assert.match(html, /Сервис пока не выбран/i);
  assert.match(html, /Люди определяют/i);
  assert.match(html, /Материалы,/i);
  assert.match(html, /Всё, что важно/i);
  assert.equal((html.match(/class="direction-card"/g) ?? []).length, 6);
  assert.equal((html.match(/class="trainer-card"/g) ?? []).length, 6);
  assert.equal((html.match(/class="booking-flow"/g) ?? []).length, 1);
  assert.equal((html.match(/class="service-portal"/g) ?? []).length, 2);
  assert.equal((html.match(/<details>/g) ?? []).length, 6);
  assert.match(html, /Персонажи вымышлены/i);
  assert.match(html, /Изображение показывает визуальную концепцию/i);
  assert.match(html, /Рабочая версия/i);
  assert.doesNotMatch(html, /Название появится позже|Состав программы уточняется|Цена после утверждения/i);
  assert.doesNotMatch(html, /Отзывы\.<br\/>Только <em>настоящие/i);
  assert.doesNotMatch(html, /property="og:image"/i);
  assert.match(html, /name="robots" content="noindex, nofollow"/i);
  assert.doesNotMatch(html, /127\.0\.0\.1|localhost/i);
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /<button[^>]*\bdisabled\b/i);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), `missing anchor target: #${match[1]}`);
  }
  assert.doesNotMatch(html, /AURUM|MELUNIS|RED LOCKERS|бокс|boxing/i);
});

test("keeps placeholders honest and uses only the new image direction", async () => {
  const [
    page,
    mobileNavigation,
    layout,
    css,
    packageJson,
    gitignore,
    pnpmWorkspace,
  ] = await Promise.all([
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(
        new URL("../components/mobile-navigation.tsx", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../.gitignore", import.meta.url), "utf8"),
      readFile(new URL("../pnpm-workspace.yaml", import.meta.url), "utf8"),
    ]);

  assert.match(page, /Рабочая версия/);
  assert.match(page, /Персонажи вымышлены/);
  assert.match(page, /готовое пространство может отличаться/);
  assert.match(page, /getFitnessServiceStatus/);
  assert.match(page, /NEXT_PUBLIC_CLIENT_PORTAL_URL/);
  assert.match(page, /NEXT_PUBLIC_TRAINER_PORTAL_URL/);
  assert.match(page, /Точный порядок первого посещения/);
  assert.match(page, /Точный список вещей и требования к экипировке/);
  assert.doesNotMatch(page, /Удобную спортивную форму|чистую сменную обувь/);
  assert.doesNotMatch(page, /Название появится позже|Состав программы уточняется|Цена после утверждения/);
  assert.match(page, /<MobileNavigation clientPortalUrl=\{clientPortalUrl\} \/>/);
  assert.equal((page.match(/className="direction-card"/g) ?? []).length, 1);
  assert.match(page, /className="direction-card"[\s\S]*href="#booking"/);
  assert.doesNotMatch(page, /className="schedule-link"|className="price-grid"|className="reviews-section"/);
  assert.equal((page.match(/trainer-\d{2}-v3\.webp/g) ?? []).length, 6);
  assert.match(page, /width="900" height="1200"/);
  assert.match(page, /loft-hero-v2\.webp/);
  assert.match(page, /loft-hero-v2-mobile\.webp/);
  assert.match(page, /loft-space-v2\.webp/);
  assert.match(page, /loft-space-v2-mobile\.webp/);
  assert.doesNotMatch(page, /loft-(?:hero|space)-v1\.webp|trainer-\d{2}\.webp/);
  assert.doesNotMatch(page, /hero-studio|restore-\d|reception-\d|community-\d/i);
  assert.doesNotMatch(page, /AURUM|MELUNIS|RED LOCKERS|Жуковск|бокс|boxing/i);
  assert.doesNotMatch(page, /₽|руб(?:\.|л|лей)|Скоро открытие/i);
  assert.match(mobileNavigation, /#booking/);
  assert.match(mobileNavigation, /#service/);
  assert.match(mobileNavigation, /Личный кабинет/);
  assert.match(mobileNavigation, /#space/);
  assert.match(mobileNavigation, /#team/);
  assert.doesNotMatch(mobileNavigation, /#schedule|#prices/);
  assert.match(mobileNavigation, /aria-expanded=\{isOpen\}/);
  assert.match(mobileNavigation, /hidden=\{!isOpen\}/);
  assert.doesNotMatch(mobileNavigation, /removeAttribute\("open"\)/);

  assert.match(layout, /NEXT_PUBLIC_SITE_URL/);
  assert.match(layout, /new URL\("og-loft-v2-1200\.png", publicSiteUrl\)/);
  assert.match(layout, /withSiteBasePath\("\/fonts"\)/);
  assert.match(layout, /withSiteBasePath\("\/favicon\.svg"\)/);
  assert.match(layout, /Фитнес-студия — сила в своём ритме/);
  assert.match(layout, /NEXT_PUBLIC_SITE_INDEXABLE/);
  assert.doesNotMatch(layout, /MELUNIS|RED LOCKERS|Pilates|Пилатес/i);
  assert.doesNotMatch(layout, /http:\/\/127\.0\.0\.1/);

  assert.match(css, /--coal:\s*#141311/);
  assert.match(css, /--bone:\s*#f0ebe2/);
  assert.match(css, /--copper:\s*#a56b46/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.mobile-booking/);
  assert.match(css, /\.booking-section/);
  assert.match(css, /\.booking-lead/);
  assert.match(css, /\.service-access/);
  assert.match(css, /\.service-portals/);
  assert.match(css, /\.service-portal-status/);
  assert.match(css, /\.final-section/);
  assert.match(css, /\.direction-arrow/);
  assert.doesNotMatch(css, /\.booking-copy\s*>\s*p\s*\{/);
  assert.doesNotMatch(css, /\.(?:advantages|journey|schedule|prices|reviews|visit|contacts|map-placeholder|device-stage|phone-frame)(?:-|\s|\{|:)/);
  assert.match(css, /max-height:\s*calc\(100svh - var\(--header-height\)\)/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /\.direction-card:hover[\s\S]*background:\s*var\(--copper-deep\)/);
  assert.match(css, /\.trainer-card figure\s*\{[\s\S]*?aspect-ratio:\s*3 \/ 4/);
  assert.doesNotMatch(css, /saturate\(0\.72\)/);
  assert.doesNotMatch(css, /url\(["']?\/fonts\//);
  assert.doesNotMatch(packageJson, /WRANGLER_LOG_PATH=/);
  const parsedPackage = JSON.parse(packageJson);
  assert.equal(parsedPackage.scripts.dev, "vinext dev --hostname 127.0.0.1");
  assert.match(parsedPackage.scripts["build:pages"], /build-pages\.mjs/);
  assert.match(parsedPackage.scripts["lint:platform"], /\bbuild\b/);
  assert.doesNotMatch(gitignore, /^build\/$/m);
  assert.match(gitignore, /^\/docs\/$/m);
  assert.match(gitignore, /^\/tmp\/$/m);
  assert.match(gitignore, /^\/public\/\*$/m);
  for (const dependency of ["esbuild", "sharp", "unrs-resolver", "workerd"]) {
    assert.match(
      pnpmWorkspace,
      new RegExp(`^\\s{2}${dependency}: false$`, "m"),
    );
  }
  assert.doesNotMatch(pnpmWorkspace, /^\s+\S+: true$/m);

  await Promise.all([
    access(new URL("../public/images/loft-hero-v2.webp", import.meta.url)),
    access(new URL("../public/images/loft-hero-v2-mobile.webp", import.meta.url)),
    access(new URL("../public/images/loft-space-v2.webp", import.meta.url)),
    access(new URL("../public/images/loft-space-v2-mobile.webp", import.meta.url)),
    access(new URL("../public/images/trainers/trainer-01-v3.webp", import.meta.url)),
    access(new URL("../public/images/trainers/trainer-02-v3.webp", import.meta.url)),
    access(new URL("../public/images/trainers/trainer-03-v3.webp", import.meta.url)),
    access(new URL("../public/images/trainers/trainer-04-v3.webp", import.meta.url)),
    access(new URL("../public/images/trainers/trainer-05-v3.webp", import.meta.url)),
    access(new URL("../public/images/trainers/trainer-06-v3.webp", import.meta.url)),
    access(new URL("../public/og-loft-v2-1200.png", import.meta.url)),
    access(new URL("../public/fonts/OFL.txt", import.meta.url)),
  ]);

  assert.equal(projectRoot.protocol, "file:");
});

test("accepts only a public HTTPS origin for social metadata", () => {
  const rejected = [
    undefined,
    "",
    "not a URL",
    "http://studio.example.org",
    "https://localhost",
    "https://localhost.",
    "https://127.0.0.1",
    "https://127.0.0.2",
    "https://0.0.0.0",
    "https://[::1]",
    "https://studio.local",
    "https://studio.internal",
    "https://user:password@studio.example.org",
  ];

  for (const value of rejected) {
    assert.equal(getPublicSiteUrl(value), undefined, `expected rejection: ${value}`);
  }

  assert.equal(
    getPublicSiteUrl("https://studio.example.org/path?draft=1")?.toString(),
    "https://studio.example.org/path/",
  );
});

test("validates future fitness-service links without discarding their paths", () => {
  const rejected = [
    undefined,
    "",
    "http://booking.example.org/login",
    "https://localhost/login",
    "https://127.0.0.1/login",
    "https://user:password@booking.example.org/login",
    "https://booking.example.org/login?token=public-leak",
    "https://booking.example.org/login?access_token=public-leak",
    "https://booking.example.org/login?client_secret=public-leak",
    "https://booking.example.org/login?private_token=public-leak",
    "https://booking.example.org/#/login?session_id=public-leak",
    "https://booking.example.org/#token%3Dpublic-leak",
    "https://booking.example.org/#client_secret=public-leak",
    "https://booking.example.org/#/login?private_token=public-leak",
  ];

  for (const value of rejected) {
    assert.equal(getFitnessServiceUrl(value), undefined);
  }

  assert.equal(
    getFitnessServiceUrl("https://booking.example.org/client?studio=42"),
    "https://booking.example.org/client?studio=42",
  );
  assert.equal(
    getFitnessServiceUrl("https://booking.example.org/#/client/login"),
    "https://booking.example.org/#/client/login",
  );
});

test("describes all fitness-service connection states honestly", () => {
  assert.match(getFitnessServiceStatus(undefined, undefined), /Сервис пока не выбран/);
  assert.match(
    getFitnessServiceStatus("https://booking.example/client", undefined),
    /для клиентов подключено/,
  );
  assert.match(
    getFitnessServiceStatus(undefined, "https://booking.example/trainer"),
    /для тренеров подключён/,
  );
  assert.match(
    getFitnessServiceStatus(
      "https://booking.example/client",
      "https://booking.example/trainer",
    ),
    /Оба входа подключены/,
  );
});

test("creates robots and sitemap files for both publication modes", () => {
  const hidden = createStaticSearchFiles(
    "https://masterovsergey.github.io/fitness-studio-landing/",
    false,
  );
  assert.match(hidden.robots, /Disallow: \/$/m);
  assert.doesNotMatch(hidden.sitemap, /<loc>/);

  const publicFiles = createStaticSearchFiles(
    "https://masterovsergey.github.io/fitness-studio-landing/",
    true,
  );
  assert.match(publicFiles.robots, /Allow: \/fitness-studio-landing\/$/m);
  assert.match(
    publicFiles.robots,
    /Sitemap: https:\/\/masterovsergey\.github\.io\/fitness-studio-landing\/sitemap\.xml/,
  );
  assert.match(
    publicFiles.sitemap,
    /<loc>https:\/\/masterovsergey\.github\.io\/fitness-studio-landing\/<\/loc>/,
  );
});

test("normalizes and applies a safe GitHub Pages base path", () => {
  assert.equal(getSiteBasePath(undefined), "");
  assert.equal(getSiteBasePath("/"), "");
  assert.equal(
    getSiteBasePath("/fitness-studio-landing"),
    "/fitness-studio-landing",
  );
  assert.equal(getSiteBasePath("fitness-studio-landing"), "");
  assert.equal(getSiteBasePath("/fitness-studio-landing/"), "");
  assert.equal(getSiteBasePath("/../private"), "");
  assert.equal(
    withSiteBasePath("/images/hero.webp", "/fitness-studio-landing"),
    "/fitness-studio-landing/images/hero.webp",
  );
  assert.throws(() => withSiteBasePath("images/hero.webp"));
});
