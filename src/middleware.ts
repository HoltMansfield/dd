import { NextRequest, NextResponse } from "next/server";

// require authentication
const protectedPaths = ["/secure-page", "/dashboard", "/profile", "/settings"];

// no auth required
const authPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session_user");
  const isAuthenticated = !!sessionCookie?.value;

  // Check if the current path requires authentication
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // Check if the current path is an auth page (login/register)
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // Redirect unauthenticated users away from protected pages
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    // Add the attempted URL as a redirect parameter
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages to home
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow the request to continue
  return NextResponse.next();
}

// Configure which paths this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
