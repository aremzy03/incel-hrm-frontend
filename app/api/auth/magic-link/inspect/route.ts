import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { detail: "Token parameter is required." },
      { status: 400 }
    );
  }

  const inspectRes = await fetch(
    `${API_URL}/auth/magic-link/inspect/?token=${encodeURIComponent(token)}`,
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  const data = await inspectRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: inspectRes.status });
}

