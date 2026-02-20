import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VALID_SPORTS = ["cricket", "soccer", "basketball", "football", "tennis"];

// Paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/register"];

function isPublicPath(pathname: string): boolean {
  // Root-level public paths
  if (PUBLIC_PATHS.includes(pathname)) return true;

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  // Sport home pages (e.g. /cricket, /soccer)
  if (VALID_SPORTS.includes(firstSegment) && segments.length === 1) return true;

  // Sport players pages (e.g. /cricket/players, /cricket/players/123)
  if (VALID_SPORTS.includes(firstSegment) && segments[1] === "players") return true;

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = request.cookies.get("firebase-auth-token");

  if (!hasSession && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|sw\\.js|workbox-|manifest\\.json|icons/|apple-touch-icon).*)",
  ],
};
