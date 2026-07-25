import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 简单的 token 检查，不依赖 Prisma/NextAuth，避免 Edge Runtime 问题
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";
  const isApiAdminRoute = pathname.startsWith("/api/admin");
  const isAuthApi = pathname.startsWith("/api/auth");

  // 允许认证 API 通过
  if (isAuthApi) return NextResponse.next();

  // 管理端路由需要登录
  if ((isAdminRoute || isApiAdminRoute) && !isLoginPage) {
    // 检查 next-auth 的 session token cookie
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!sessionToken) {
      if (isApiAdminRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 已登录用户访问登录页，重定向到管理后台
  if (isLoginPage) {
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value;
    if (sessionToken) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/auth/:path*"],
};
