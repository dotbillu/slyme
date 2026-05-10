import { Network } from "lucide-react";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/signin") || pathname.startsWith("/signup");

  const isProtected =
    pathname === "/get-started" ||
    pathname.startsWith("/network") ||
    pathname.startsWith("/create");

  if (!token && isProtected && !isAuthPage) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/signin",
    "/signup",
    "/get-started",
    "/create/:path",
    "/network/:path",
  ],
};
