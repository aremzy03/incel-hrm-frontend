import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  HRM_ACCESS_MAX_AGE,
  HRM_COOKIE_OPTIONS,
  HRM_REFRESH_MAX_AGE,
} from "@/lib/hrmSession";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

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
    ...HRM_COOKIE_OPTIONS,
    maxAge: HRM_ACCESS_MAX_AGE,
  });
  jar.set("hrm_refresh", tokens.refresh, {
    ...HRM_COOKIE_OPTIONS,
    maxAge: HRM_REFRESH_MAX_AGE,
  });

  return NextResponse.json({ user });
}
