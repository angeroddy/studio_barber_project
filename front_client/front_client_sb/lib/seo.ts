export const SITE_NAME = "Studio Barber Grenoble";

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseBaseUrl(rawValue?: string): string | null {
  if (!rawValue) {
    return null;
  }

  const cleaned = stripWrappingQuotes(rawValue.trim());
  if (!cleaned) {
    return null;
  }

  const withProtocol = (() => {
    if (/^https?:\/\//i.test(cleaned)) {
      return cleaned;
    }

    if (cleaned.startsWith("//")) {
      return `https:${cleaned}`;
    }

    const useHttp = cleaned.startsWith("localhost") || cleaned.startsWith("127.");
    return `${useHttp ? "http" : "https"}://${cleaned}`;
  })();

  try {
    const url = new URL(withProtocol);
    return normalizeBaseUrl(url.origin);
  } catch {
    return null;
  }
}

export function getSiteUrl(): string {
  const explicitUrl = parseBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicitUrl) {
    return explicitUrl;
  }

  const vercelUrl = parseBaseUrl(process.env.VERCEL_URL);
  if (vercelUrl) {
    return vercelUrl;
  }

  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  return new URL(getSiteUrl());
}

export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
