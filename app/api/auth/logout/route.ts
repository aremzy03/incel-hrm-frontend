import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const jar = await cookies();
  jar.delete("hrm_access");
  jar.delete("hrm_refresh");
  return NextResponse.json({ ok: true });
}
