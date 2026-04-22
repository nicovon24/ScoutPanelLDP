const DEFAULT_LOCAL_API = "http://localhost:4000/api";
const SAME_ORIGIN_API_PATH = "/api";

type ResolveApiBaseUrlOptions = {
  windowOrigin?: string;
  isProduction?: boolean;
  allowCrossOriginInProd?: boolean;
};

function normalizeApiUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function getAbsoluteOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
    return null;
  } catch {
    return null;
  }
}

export function resolveApiBaseUrl(
  apiUrlFromEnv?: string,
  options: ResolveApiBaseUrlOptions = {},
): string {
  const envUrl = normalizeApiUrl(apiUrlFromEnv);
  const windowOrigin =
    options.windowOrigin ?? (typeof window !== "undefined" ? window.location.origin : undefined);
  const isProduction = options.isProduction ?? process.env.NODE_ENV === "production";
  const allowCrossOriginInProd =
    options.allowCrossOriginInProd ??
    process.env.NEXT_PUBLIC_ALLOW_CROSS_ORIGIN_API === "true";

  if (!windowOrigin) {
    return envUrl ?? DEFAULT_LOCAL_API;
  }

  if (!envUrl) {
    return isProduction ? SAME_ORIGIN_API_PATH : DEFAULT_LOCAL_API;
  }

  const envOrigin = getAbsoluteOrigin(envUrl);
  const isCrossOrigin = Boolean(envOrigin && envOrigin !== windowOrigin);
  if (isProduction && isCrossOrigin && !allowCrossOriginInProd) {
    return SAME_ORIGIN_API_PATH;
  }

  return envUrl;
}
