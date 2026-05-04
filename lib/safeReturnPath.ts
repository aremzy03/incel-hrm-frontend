/** Default landing route after authentication. */
export const DEFAULT_AFTER_LOGIN = "/leave";

const MAX_RETURN_LEN = 2000;

/**
 * Returns a same-origin relative path safe for redirects (open-redirect safe).
 * Falls back to {@link DEFAULT_AFTER_LOGIN} when the value is missing or unsafe.
 */
export function getSafeReturnPath(
  candidate: string | null | undefined
): string {
  if (candidate == null || candidate === "") return DEFAULT_AFTER_LOGIN;

  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate.trim());
  } catch {
    return DEFAULT_AFTER_LOGIN;
  }

  if (decoded.length > MAX_RETURN_LEN) return DEFAULT_AFTER_LOGIN;
  if (!decoded.startsWith("/")) return DEFAULT_AFTER_LOGIN;
  if (decoded.startsWith("//")) return DEFAULT_AFTER_LOGIN;
  if (decoded.includes("://")) return DEFAULT_AFTER_LOGIN;
  if (decoded.startsWith("\\")) return DEFAULT_AFTER_LOGIN;

  const pathOnly = decoded.split(/[?#]/)[0] ?? "";
  if (pathOnly === "/" || pathOnly === "/register") {
    return DEFAULT_AFTER_LOGIN;
  }

  return decoded;
}
