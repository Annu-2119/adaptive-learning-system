import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  const isProtectedRoute =
    path.startsWith("/student") ||
    path.startsWith("/instructor");

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  return NextResponse.next();
}