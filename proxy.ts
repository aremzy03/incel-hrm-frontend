import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/register"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasAccess = req.cookies.has("hrm_access");

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (!isPublic && !hasAccess) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isPublic && hasAccess) {
    return NextResponse.redirect(new URL("/leave", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)"],
};
