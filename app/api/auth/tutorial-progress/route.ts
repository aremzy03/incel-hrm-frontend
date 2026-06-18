import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeader(): Promise<string | null> {
  const jar = await cookies();
  return jar.get("hrm_access")?.value ?? null;
}

export async function GET() {
  const access = await getAuthHeader();
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/auth/me/tutorial-progress/`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const access = await getAuthHeader();
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const res = await fetch(`${API_URL}/auth/me/tutorial-progress/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
