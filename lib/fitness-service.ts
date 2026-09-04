const blockedDomainSuffixes = [".localhost", ".local", ".internal", ".test"];
const sensitiveParameterName =
  /^(?:access[-_]?token|api[-_]?key|auth(?:orization)?|client[-_]?secret|code|credential|id[-_]?token|jwt|magic(?:[-_]?link)?|password|private[-_]?token|refresh[-_]?token|secret|session(?:[-_]?id)?|sig(?:nature)?|token)$/i;

function hasSensitiveParameters(url: URL): boolean {
  if ([...url.searchParams.keys()].some((name) => sensitiveParameterName.test(name))) {
    return true;
  }

  let decodedHash = url.hash;
  try {
    decodedHash = decodeURIComponent(decodedHash);
  } catch {
    return true;
  }

  return decodedHash.split(/[?&#/]/).some((part) => {
    const equalsIndex = part.indexOf("=");
    return (
      equalsIndex > 0 &&
      sensitiveParameterName.test(part.slice(0, equalsIndex))
    );
  });
}

export function getFitnessServiceUrl(
  value: string | undefined,
): string | undefined {
  const candidate = value?.trim();

  if (!candidate) {
    return undefined;
  }

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.replace(/\.$/, "").toLowerCase();
    const isIpAddress =
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.startsWith("[");
    const isLocalDomain =
      hostname === "localhost" ||
      blockedDomainSuffixes.some((suffix) => hostname.endsWith(suffix));
    const isPublicHttpsUrl =
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      hostname.includes(".") &&
      !isIpAddress &&
      !isLocalDomain &&
      !hasSensitiveParameters(url);

    return isPublicHttpsUrl ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function getFitnessServiceStatus(
  clientUrl: string | undefined,
  trainerUrl: string | undefined,
): string {
  if (clientUrl && trainerUrl) {
    return "Оба входа подключены: клиенты и команда могут перейти в приложения студии.";
  }

  if (clientUrl) {
    return "Приложение для клиентов подключено. Вход для тренеров добавим после выбора рабочего сервиса.";
  }

  if (trainerUrl) {
    return "Вход для тренеров подключён. Приложение для клиентов добавим после выбора сервиса записи и оплаты.";
  }

  return "Сервис пока не выбран. Места для входа уже подготовлены; реальные ссылки добавляются настройками публикации без переделки лендинга.";
}
