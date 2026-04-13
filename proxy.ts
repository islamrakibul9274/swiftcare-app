// proxy.ts (Ensure this is the ONLY interception file in your root)
import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;

  const protectedRoutes = ["/admin", "/director", "/tech"];
  const isProtectedRoute = protectedRoutes.some(route => nextUrl.pathname.startsWith(route));

  // 1. If not logged in and trying to access a protected route -> Login
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 2. Role-Based Redirects for Entry Pages
 // Now /login and /register will still redirect logged-in users to their portal,
// but the homepage (/) is now accessible to everyone.
const isGenericRoute = ["/login", "/register"].includes(nextUrl.pathname);

  if (isLoggedIn && isGenericRoute) {
    if (userRole === "ADMIN") return NextResponse.redirect(new URL("/admin", nextUrl));
    if (userRole === "BCBA") return NextResponse.redirect(new URL("/director", nextUrl));
    if (userRole === "RBT") return NextResponse.redirect(new URL("/tech", nextUrl));
  }

  // 3. Strict Access Control (The Bouncer)
  if (isLoggedIn) {
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
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};