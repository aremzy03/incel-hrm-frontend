const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const HRM_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const HRM_ACCESS_MAX_AGE = 60 * 60; // 1 hour, aligned with backend access token
export const HRM_REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type RefreshedTokens = { access: string; refresh?: string };

export async function fetchRefreshedTokens(
  refreshToken: string
): Promise<RefreshedTokens | null> {
  if (!API_URL) return null;
  const res = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access?: string; refresh?: string };
  if (!data.access) return null;
  return { access: data.access, refresh: data.refresh };
}

export function applyRefreshedTokensToJar(
  jar: {
    set: (name: string, value: string, options?: Record<string, unknown>) => void;
  },
  tokens: RefreshedTokens
) {
  jar.set("hrm_access", tokens.access, {
    ...HRM_COOKIE_OPTIONS,
    maxAge: HRM_ACCESS_MAX_AGE,
  });
  if (tokens.refresh) {
    jar.set("hrm_refresh", tokens.refresh, {
      ...HRM_COOKIE_OPTIONS,
      maxAge: HRM_REFRESH_MAX_AGE,
    });
  }
}
