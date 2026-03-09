import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(req: NextRequest) {
  const body = await req.json();

  const loginRes = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({}));
    return NextResponse.json(err, { status: loginRes.status });
  }

  const tokens = await loginRes.json();

  const meRes = await fetch(`${API_URL}/auth/me/`, {
    headers: { Authorization: `Bearer ${tokens.access}` },
  });

  if (!meRes.ok) {
    return NextResponse.json(
      { detail: "Failed to fetch user profile." },
      { status: 500 }
    );
  }

  const user = await meRes.json();

  const jar = await cookies();
  jar.set("hrm_access", tokens.access, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 5, // 5 minutes
  });
  jar.set("hrm_refresh", tokens.refresh, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24, // 1 day
  });

  return NextResponse.json({ user });
}
