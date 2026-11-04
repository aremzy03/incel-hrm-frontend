import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  HRM_ACCESS_MAX_AGE,
  HRM_COOKIE_OPTIONS,
  HRM_REFRESH_MAX_AGE,
} from "@/lib/hrmSession";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    return NextResponse.json(
      { detail: "Token is required.", code: "INVALID_TOKEN" },
      { status: 400 }
    );
  }

  // Forward audit information (IP and User-Agent) to Django backend
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "";
  const userAgent = req.headers.get("user-agent") || "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (ip) {
    headers["X-Forwarded-For"] = ip;
  }
  if (userAgent) {
    headers["User-Agent"] = userAgent;
  }

  const exchangeRes = await fetch(`${API_URL}/auth/magic-link/exchange/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ token }),
  });

  if (!exchangeRes.ok) {
    const err = await exchangeRes.json().catch(() => ({
      detail: "Failed to exchange magic link token.",
    }));
    return NextResponse.json(err, { status: exchangeRes.status });
  }

  const data = await exchangeRes.json();

  const jar = await cookies();
  if (data.access) {
    jar.set("hrm_access", data.access, {
      ...HRM_COOKIE_OPTIONS,
      maxAge: HRM_ACCESS_MAX_AGE,
    });
  }
  if (data.refresh) {
    jar.set("hrm_refresh", data.refresh, {
      ...HRM_COOKIE_OPTIONS,
      maxAge: HRM_REFRESH_MAX_AGE,
    });
  }

  return NextResponse.json({
    access: data.access,
    refresh: data.refresh,
    destination_path: data.destination_path,
    user: data.user,
  });
}

