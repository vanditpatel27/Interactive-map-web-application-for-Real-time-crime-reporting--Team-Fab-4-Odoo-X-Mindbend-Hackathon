import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuth } from "@/libs/auth";
import { ROLE_ADMIN, LOGIN_PATH } from "@/libs/const";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const redirectUrl = LOGIN_PATH + "?returnTo=" + encodeURIComponent(request.url)
  try {
    const user = await getAuth(request);

    const { pathname } = request.nextUrl;

    if (!user) return NextResponse.redirect(new URL(redirectUrl, request.url));

    if (pathname.includes("/admin") && user.role != ROLE_ADMIN) {
      const redirectUrl = "/?message=" + encodeURIComponent("You are not authorized to access this page.");
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    return NextResponse.next(); // If valid token, proceed to the next step
  } catch (error) {
    console.log("Middleware error:", error);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/admin/:path*", "/api/admin", "/user/:path*", "/api/user"],
};
