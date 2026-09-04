const safePathSegment = /^[A-Za-z0-9._~-]+$/;

export function getSiteBasePath(value: string | undefined): string {
  const candidate = value?.trim();

  if (!candidate || candidate === "/") {
    return "";
  }

  if (
    !candidate.startsWith("/") ||
    candidate.endsWith("/") ||
    candidate.includes("//") ||
    candidate.includes("?") ||
    candidate.includes("#")
  ) {
    return "";
  }

  const segments = candidate.slice(1).split("/");
  const isSafe = segments.every(
    (segment) =>
      segment !== "." &&
      segment !== ".." &&
      safePathSegment.test(segment),
  );

  return isSafe ? candidate : "";
}

export function withSiteBasePath(
  path: string,
  basePath = getSiteBasePath(process.env.NEXT_PUBLIC_BASE_PATH),
): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(`Site asset paths must start with one slash: ${path}`);
  }

  return `${basePath}${path}`;
}
