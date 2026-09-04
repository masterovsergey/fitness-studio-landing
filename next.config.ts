import type { NextConfig } from "next";
import { getSiteBasePath } from "./lib/site-paths";

const isDevelopment = process.env.NODE_ENV !== "production";
const isPagesBuild = process.env.FITNESS_PAGES_BUILD === "true";
const configuredPagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
const pagesBasePath = getSiteBasePath(configuredPagesBasePath);

if (
  isPagesBuild &&
  (!configuredPagesBasePath || configuredPagesBasePath !== pagesBasePath)
) {
  throw new Error(
    "GitHub Pages build requires NEXT_PUBLIC_BASE_PATH such as /fitness-studio-landing.",
  );
}

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "script-src-attr 'none'",
  `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-XSS-Protection", value: "0" },
];

const nextConfig: NextConfig = isPagesBuild
  ? {
      trailingSlash: true,
      basePath: pagesBasePath,
    }
  : {
      async headers() {
        return [
          {
            source: "/",
            headers: securityHeaders,
          },
          {
            source: "/:path*",
            headers: securityHeaders,
          },
        ];
      },
    };

export default nextConfig;
