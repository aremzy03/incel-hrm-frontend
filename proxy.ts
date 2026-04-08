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
