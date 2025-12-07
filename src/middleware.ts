import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_TIMEOUT_MS,
  MAX_SESSION_DURATION_MS,
  SESSION_TIMESTAMP_COOKIE,
  SESSION_CREATED_COOKIE,
} from "./lib/session-config";

// require authentication
const protectedPaths = [
  "/secure-page",
  "/dashboard",
  "/profile",
  "/settings",
  "/documents",
];

// no auth required
const authPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session_user");
  const sessionTimestamp = request.cookies.get(SESSION_TIMESTAMP_COOKIE);
  const sessionCreated = request.cookies.get(SESSION_CREATED_COOKIE);
  const isAuthenticated = !!sessionCookie?.value;

  // Block E2E routes unless in E2E environment
  if (pathname.startsWith("/e2e")) {
    if (process.env.NEXT_PUBLIC_APP_ENV !== "E2E") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Check session timeout for authenticated users
  if (isAuthenticated) {
    const now = Date.now();
    const lastActivity = sessionTimestamp?.value
      ? parseInt(sessionTimestamp.value, 10)
      : null;
    const sessionStart = sessionCreated?.value
      ? parseInt(sessionCreated.value, 10)
      : null;

    let shouldLogout = false;
    let logoutReason = "";

    // Check if session has exceeded inactivity timeout
    if (lastActivity && now - lastActivity > SESSION_TIMEOUT_MS) {
      shouldLogout = true;
      logoutReason = "Session expired due to inactivity";
    }

    // Check if session has exceeded maximum duration
    if (sessionStart && now - sessionStart > MAX_SESSION_DURATION_MS) {
      shouldLogout = true;
      logoutReason = "Session expired (maximum duration reached)";
    }

    if (shouldLogout) {
      console.log(`[Session Timeout] ${logoutReason}`);

      // Note: Session expiration audit logging happens in the login page
      // when it detects the timeout=true query parameter, since middleware
      // runs in Edge Runtime and cannot access database/crypto modules

      const response = NextResponse.redirect(
        new URL("/login?timeout=true", request.url)
      );
      // Clear session cookies
      response.cookies.delete("session_user");
      response.cookies.delete(SESSION_TIMESTAMP_COOKIE);
      response.cookies.delete(SESSION_CREATED_COOKIE);
      return response;
    }

    // Update last activity timestamp for valid sessions
    const response = NextResponse.next();
    response.cookies.set(SESSION_TIMESTAMP_COOKIE, now.toString(), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days (matches session cookie)
    });

    // Set session created timestamp if not already set
    if (!sessionStart) {
      response.cookies.set(SESSION_CREATED_COOKIE, now.toString(), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days (matches session cookie)
      });
    }

    // Continue with the updated response
    // Check if the current path requires authentication
    const isProtectedPath = protectedPaths.some((path) =>
      pathname.startsWith(path)
    );

    // Check if the current path is an auth page (login/register)
    const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

    // Redirect authenticated users away from auth pages to home
    if (isAuthPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  }

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
