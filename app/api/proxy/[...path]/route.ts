import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

async function refreshAccessToken(
  refreshToken: string
): Promise<string | null> {
  const res = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access ?? null;
}

async function proxyRequest(
  req: NextRequest,
  params: { path: string[] }
): Promise<NextResponse> {
  const jar = await cookies();
  let accessToken = jar.get("hrm_access")?.value;
  const refreshToken = jar.get("hrm_refresh")?.value;

  const targetPath = params.path.join("/");
  const url = new URL(req.url);
  const queryString = url.search;
  const targetUrl = `${API_URL}/${targetPath}/${queryString}`;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.text()
      : undefined;

  let res = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  if (res.status === 401 && refreshToken) {
    const newAccess = await refreshAccessToken(refreshToken);
    if (newAccess) {
      jar.set("hrm_access", newAccess, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 5,
      });
      headers["Authorization"] = `Bearer ${newAccess}`;
      res = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
      });
    } else {
      jar.delete("hrm_access");
      jar.delete("hrm_refresh");
      return NextResponse.json(
        { detail: "Session expired. Please log in again." },
        { status: 401 }
      );
    }
  }

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}
