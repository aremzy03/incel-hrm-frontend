import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET() {
  const jar = await cookies();
  const access = jar.get("hrm_access")?.value;

  if (!access) {
    return NextResponse.json(
      { detail: "Not authenticated." },
      { status: 401 }
    );
  }

  const res = await fetch(`${API_URL}/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status });
  }

  const user = await res.json();
  return NextResponse.json({ user });
}
