/**
 * frontend/middleware.ts
 * ======================
 * Edge-compatible Next.js Route Guard Middleware.
 * Decodes JWT claims from 'gechexpress_access' cookie to protect Admin, Seller, and Customer portals.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { JWTPayloadClaims } from "./features/auth/types";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get access token from cookie
  const rawCookie = request.cookies.get("gechexpress_access")?.value;
  const tokenCookie = rawCookie ? decodeURIComponent(rawCookie) : null;

  let claims: JWTPayloadClaims | null = null;
  let isAuthenticated = false;

  if (tokenCookie) {
    try {
      const decoded = decodeJwt(tokenCookie);
      // Check expiry
      if (decoded.exp && decoded.exp * 1000 > Date.now()) {
        claims = decoded as unknown as JWTPayloadClaims;
        isAuthenticated = true;
      }
    } catch {
      claims = null;
      isAuthenticated = false;
    }
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isSellerRoute = pathname.startsWith("/seller");
  const isCustomerRoute = pathname.startsWith("/customer");
  const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname.startsWith("/reset-password");

  // 2. Protect Admin Portal (/admin/*)
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isStaffOrSuper = claims?.is_staff || claims?.is_superuser || claims?.role === "ADMIN";
    if (!isStaffOrSuper) {
      // User is authenticated but NOT an admin -> redirect to storefront
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 3. Protect Seller Portal (/seller/*)
  if (isSellerRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (claims?.role !== "SELLER" && !claims?.is_staff && !claims?.is_superuser) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 4. Protect Customer Dashboard (/customer/*)
  if (isCustomerRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Auth routes (/login, /register) -> redirect already-logged-in users to their role portal
  if (isAuthRoute && isAuthenticated && claims) {
    if (claims.is_superuser || claims.is_staff || claims.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (claims.role === "SELLER") {
      return NextResponse.redirect(new URL("/seller", request.url));
    }
    return NextResponse.redirect(new URL("/customer/orders", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/customer/:path*",
    "/login",
    "/register",
    "/reset-password/:path*",
  ],
};