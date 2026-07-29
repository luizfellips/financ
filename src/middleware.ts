import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { safeCallbackUrl } from "@/lib/safe-callback-url";
import {
  checkRateLimit,
  clientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

const LOGIN_RATE_PATHS = new Set([
  "/api/auth/callback/credentials",
  "/api/auth/signin",
  "/api/auth/signin/credentials",
]);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = !!request.auth;

  if (
    request.method === "POST" &&
    LOGIN_RATE_PATHS.has(pathname)
  ) {
    const result = checkRateLimit(`login:${clientIp(request)}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!result.ok) {
      return rateLimitResponse(result.retryAfterSec);
    }
  }

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/");

  if (!isLoggedIn && !isPublic && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      safeCallbackUrl(pathname + request.nextUrl.search),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (
    !isLoggedIn &&
    pathname.startsWith("/api/") &&
    pathname !== "/api/auth/register"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Não autenticado" },
      },
      { status: 401 },
    );
  }

  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isLoggedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
