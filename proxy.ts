import { NextRequest, NextResponse } from "next/server";

import { getSafeReturnPath } from "./lib/safeReturnPath";

const PUBLIC_ROUTES = ["/", "/register"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasAccess = req.cookies.has("hrm_access");

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (!isPublic && !hasAccess) {
    const login = new URL("/", req.url);
    const intended = req.nextUrl.pathname + req.nextUrl.search;
    if (intended.length <= 1500) {
      login.searchParams.set("next", intended);
    }
    return NextResponse.redirect(login);
  }

  if (isPublic && hasAccess) {
    const next = getSafeReturnPath(req.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - api routes
     * - files with extensions (.png, .svg, .jpg, .ico, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\..*).*)",
  ],
};
