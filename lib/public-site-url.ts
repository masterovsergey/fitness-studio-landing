const blockedDomainSuffixes = [".localhost", ".local", ".internal", ".test"];

export function getPublicSiteUrl(value: string | undefined): URL | undefined {
  const candidate = value?.trim();

  if (!candidate) {
    return undefined;
  }

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.replace(/\.$/, "").toLowerCase();
    const isIpAddress =
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) ||
      hostname.startsWith("[");
    const isLocalDomain =
      hostname === "localhost" ||
      blockedDomainSuffixes.some((suffix) => hostname.endsWith(suffix));
    const isPublicHttpsOrigin =
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      hostname.includes(".") &&
      !isIpAddress &&
      !isLocalDomain;

    if (!isPublicHttpsOrigin) {
      return undefined;
    }

    url.search = "";
    url.hash = "";
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;

    return url;
  } catch {
    return undefined;
  }
}
