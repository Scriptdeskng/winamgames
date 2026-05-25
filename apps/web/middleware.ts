import { NextRequest, NextResponse } from "next/server";

const PLAYER_HOSTS = new Set(["winam.gg", "www.winam.gg"]);
const ADMIN_HOSTS = new Set(["admin.winam.gg"]);
const STATIC_PATHS = ["/_next", "/favicon.ico", "/manifest.json", "/robots.txt", "/sitemap.xml"];

function isStaticPath(pathname: string): boolean {
  return STATIC_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const { pathname, search } = request.nextUrl;

  if (isStaticPath(pathname) || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (PLAYER_HOSTS.has(host) && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.hostname = "admin.winam.gg";
    url.protocol = "https:";
    return NextResponse.redirect(url);
  }

  if (ADMIN_HOSTS.has(host) && pathname !== "/" && !pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  if (ADMIN_HOSTS.has(host) && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = search;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)"],
};
