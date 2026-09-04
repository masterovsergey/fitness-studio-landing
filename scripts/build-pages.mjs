import { spawn } from "node:child_process";
import { access, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createStaticSearchFiles } from "./static-search-files.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const vinextCli = fileURLToPath(
  new URL("../node_modules/vinext/dist/cli.js", import.meta.url),
);
const outputRoot = new URL("../dist/client/", import.meta.url);
const indexFile = new URL("index.html", outputRoot);
const notFoundFile = new URL("404.html", outputRoot);
const noJekyllFile = new URL(".nojekyll", outputRoot);
const cloudflareHeadersFile = new URL("_headers", outputRoot);
const robotsFile = new URL("robots.txt", outputRoot);
const sitemapFile = new URL("sitemap.xml", outputRoot);

async function keepOnly(directory, allowedNames) {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => !allowedNames.has(entry.name))
      .map((entry) =>
        rm(join(directory, entry.name), {
          force: true,
          recursive: entry.isDirectory(),
        }),
      ),
  );
}

async function prunePublicArtifact() {
  const outputPath = fileURLToPath(outputRoot);
  const fontsPath = join(outputPath, "fonts");
  const imagesPath = join(outputPath, "images");
  const trainersPath = join(imagesPath, "trainers");

  await keepOnly(
    outputPath,
    new Set([
      "assets",
      "favicon.svg",
      "fonts",
      "images",
      "og-loft-v2-1200.png",
    ]),
  );
  await keepOnly(
    fontsPath,
    new Set([
      "CormorantGaramond-Italic.ttf",
      "CormorantGaramond-Regular.ttf",
      "Manrope-Regular.ttf",
      "Manrope-SemiBold.ttf",
      "OFL.txt",
    ]),
  );
  await keepOnly(
    imagesPath,
    new Set([
      "loft-hero-v2-mobile.webp",
      "loft-hero-v2.webp",
      "loft-space-v2-mobile.webp",
      "loft-space-v2.webp",
      "trainers",
    ]),
  );
  await keepOnly(
    trainersPath,
    new Set([
      "trainer-01-v3.webp",
      "trainer-02-v3.webp",
      "trainer-03-v3.webp",
      "trainer-04-v3.webp",
      "trainer-05-v3.webp",
      "trainer-06-v3.webp",
    ]),
  );
}

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "/fitness-studio-landing";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  `https://masterovsergey.github.io${basePath}/`;

const buildEnvironment = {
  ...process.env,
  FITNESS_PAGES_BUILD: "true",
  NEXT_PUBLIC_BASE_PATH: basePath,
  NEXT_PUBLIC_SITE_URL: siteUrl,
  NEXT_PUBLIC_SITE_INDEXABLE:
    process.env.NEXT_PUBLIC_SITE_INDEXABLE?.trim() || "false",
};

const exitCode = await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [vinextCli, "build"], {
    cwd: projectRoot,
    env: buildEnvironment,
    stdio: "inherit",
  });

  child.once("error", reject);
  child.once("exit", (code, signal) => {
    if (signal) {
      reject(new Error(`GitHub Pages build stopped by signal ${signal}.`));
      return;
    }

    resolve(code ?? 1);
  });
});

if (exitCode !== 0) {
  process.exitCode = exitCode;
} else {
  const serverEntry = new URL(
    `../dist/server/index.js?pages-build=${Date.now()}`,
    import.meta.url,
  );
  const { default: handler } = await import(serverEntry.href);
  const request = new Request(siteUrl, {
    headers: { accept: "text/html" },
  });
  const executionContext = {
    waitUntil() {},
    passThroughOnException() {},
  };
  const response =
    typeof handler === "function"
      ? await handler(request, executionContext)
      : await handler.fetch(
          request,
          {
            ASSETS: {
              fetch: async () => new Response("Not found", { status: 404 }),
            },
          },
          executionContext,
        );

  if (!response.ok) {
    throw new Error(
      `Unable to prerender ${siteUrl}: HTTP ${response.status}.`,
    );
  }

  const html = await response.text();
  if (!/^<!doctype html>/i.test(html)) {
    throw new Error("The prerendered response is not a complete HTML document.");
  }

  const searchFiles = createStaticSearchFiles(
    siteUrl,
    buildEnvironment.NEXT_PUBLIC_SITE_INDEXABLE === "true",
  );
  await prunePublicArtifact();
  await writeFile(indexFile, html, "utf8");
  await writeFile(notFoundFile, html, "utf8");
  await writeFile(noJekyllFile, "", "utf8");
  await writeFile(robotsFile, searchFiles.robots, "utf8");
  await writeFile(sitemapFile, searchFiles.sitemap, "utf8");
  await rm(cloudflareHeadersFile, { force: true });
  await access(indexFile);
  console.log(
    `GitHub Pages artifact prepared in dist/client for ${siteUrl}`,
  );
}
