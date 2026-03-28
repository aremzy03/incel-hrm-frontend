import type { NextRequest } from "next/server";

/**
 * Origins allowed to call mutating BFF routes (CSRF defense).
 * Set ALLOWED_ORIGINS (comma-separated) and/or NEXT_PUBLIC_APP_URL in production.
 */
export function getAllowedOrigins(): string[] {
  const fromList = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "";
  return [...new Set([...fromList, ...(app ? [app] : [])])];
}

/**
 * In production, require Origin or Referer to match the allowlist when non-empty.
 * If the allowlist is empty, enforcement is skipped (configure before go-live).
 */
export function isMutatingBffOriginAllowed(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const allowed = getAllowedOrigins();
  if (allowed.length === 0) return true;

  const origin = req.headers.get("origin");
  if (origin && allowed.includes(origin)) return true;

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (allowed.includes(refOrigin)) return true;
    } catch {
      return false;
    }
  }

  return false;
}
