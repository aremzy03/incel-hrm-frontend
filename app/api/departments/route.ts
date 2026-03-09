import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/**
 * Public endpoint — no auth cookie required.
 * Called from the registration page so unauthenticated users can
 * pick a department before they have an account.
 * The Django /api/v1/departments/ endpoint should allow unauthenticated
 * GET access for this flow to work.
 */
export async function GET() {
  const res = await fetch(`${API_URL}/departments/`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const data = await res.json().catch(() => ({ results: [] }));
  return NextResponse.json(data);
}
