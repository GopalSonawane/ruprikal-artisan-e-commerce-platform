import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  // Check if accessing admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // If not logged in, redirect to login
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if user is admin
    try {
      const bearerToken = request.cookies.get("better-auth.session_token")?.value;
      const apiUrl = new URL("/api/user-profiles", request.url);
      apiUrl.searchParams.set("userId", session.user.id);
      
      const profileRes = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          Cookie: request.headers.get("cookie") || "",
        },
      });
      
      if (profileRes.ok) {
        const profiles = await profileRes.json();
        const userProfile = profiles.find((p: any) => p.userId === session.user.id);
        
        if (!userProfile?.isAdmin) {
          // Not an admin, redirect to homepage
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    } catch (error) {
      console.error("Admin check error:", error);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};