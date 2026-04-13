import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/admin", "/director", "/tech"];

export default async function proxy(req: NextRequest) {
  const { nextUrl } = req;

  // Securely decode the session token without triggering Node.js database modules
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;
  const userRole = token?.role as string;

  const isProtectedRoute = protectedRoutes.some(route => nextUrl.pathname.startsWith(route));

  // 1. If not logged in and trying to access a protected route, redirect to login
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 2. Role-Based Routing Logic
  if (isLoggedIn) {
    // REMOVED "/" from here so users can visit the homepage!
    const isGenericRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/register" || nextUrl.pathname === "/dashboard";

    if (isGenericRoute) {
      if (userRole === "ADMIN") return NextResponse.redirect(new URL("/admin", nextUrl));
      if (userRole === "BCBA") return NextResponse.redirect(new URL("/director", nextUrl));
      if (userRole === "RBT") return NextResponse.redirect(new URL("/tech", nextUrl));
    }

    // 3. Strict Access Control
    if (nextUrl.pathname.startsWith("/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
    if (nextUrl.pathname.startsWith("/director") && userRole !== "BCBA") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
    if (nextUrl.pathname.startsWith("/tech") && userRole !== "RBT") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};