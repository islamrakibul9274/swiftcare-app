import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { roleHome } from "@/lib/policy";
export default auth((request) => {
  const path = request.nextUrl.pathname;
  const roots = [
    "/admin",
    "/director",
    "/tech",
    "/clients",
    "/schedule",
    "/settings",
    "/notifications",
  ];
  const protectedPath = roots.some(
    (p) => path === p || path.startsWith(p + "/"),
  );
  const user = request.auth?.user;
  if (protectedPath && !user?.id) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (user?.id) {
    if (
      ["/login", "/register"].includes(path) &&
      !(
        path === "/login" && request.nextUrl.searchParams.get("expired") === "1"
      )
    )
      return NextResponse.redirect(new URL(roleHome(user.role), request.url));
    if (protectedPath && user.forcePasswordChange && path !== "/settings")
      return NextResponse.redirect(
        new URL("/settings?required=1", request.url),
      );
    for (const [root, role] of [
      ["/admin", "ADMIN"],
      ["/director", "BCBA"],
      ["/tech", "RBT"],
    ])
      if ((path === root || path.startsWith(root + "/")) && user.role !== role)
        return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  return NextResponse.next();
});
export const config = {
  matcher: [
    "/admin/:path*",
    "/director/:path*",
    "/tech/:path*",
    "/clients/:path*",
    "/schedule/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/login",
    "/register",
  ],
};
