// proxy.ts — Next.js 16 renamed `middleware` → `proxy` (Node.js runtime only).
// Two routing modes:
//
//  HOST MODE (custom domain with wildcard DNS — the production target):
//    <root> / www / localhost     → marketing (served at root)
//    app.<root>                   → dashboard (rewritten to /dashboard/*, auth-gated)
//    {venue}.<root> / custom      → tenant site (rewritten to /s/<venue>/*)
//    /dashboard and /s are INTERNAL targets, blocked (404) as direct requests.
//
//  PATH MODE (single domain — e.g. *.vercel.app which has no wildcard subdomains;
//  auto-on when the root domain is a vercel.app host, or NEXT_PUBLIC_PATH_ROUTING=1):
//    everything is served at its real path on ONE host — marketing at /,
//    dashboard at /dashboard/* (auth-gated), tenant sites at /s/<venue>. No
//    rewriting; the internal paths ARE the public paths.
//
// /api + /trpc are never rewritten or Clerk-gated (handlers self-verify).
// Graceful degradation: with no Clerk keys, auth is skipped entirely.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { RESERVED_SUBDOMAINS } from "@/lib/constants";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "lvh.me:3000")
  .split(":")[0]
  .toLowerCase();

// Single-domain path routing — no wildcard subdomains available.
const PATH_ROUTING =
  process.env.NEXT_PUBLIC_PATH_ROUTING === "1" ||
  ROOT_DOMAIN.includes("vercel.app");

const clerkConfigured = !!(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

function getHostname(req: NextRequest): string {
  return (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
}

function isAppHost(hostname: string): boolean {
  return hostname === `app.${ROOT_DOMAIN}` || hostname === "app.localhost";
}

function isApexHost(hostname: string): boolean {
  return (
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}` ||
    hostname === "localhost"
  );
}

function isApiPath(pathname: string): boolean {
  return (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/trpc" ||
    pathname.startsWith("/trpc/")
  );
}

function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

// Internal rewrite targets — blocked as direct requests in HOST mode only.
function isInternalPath(pathname: string): boolean {
  return isDashboardPath(pathname) || pathname === "/s" || pathname.startsWith("/s/");
}

/** Derive the tenant slug/domain from a non-apex, non-app host (HOST mode). */
function tenantFromHost(hostname: string): string | null {
  let venue: string;
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    venue = hostname.slice(0, hostname.length - `.${ROOT_DOMAIN}`.length);
  } else if (hostname.endsWith(".localhost")) {
    venue = hostname.slice(0, hostname.length - ".localhost".length);
  } else {
    venue = hostname; // fully custom domain — the host itself is the lookup key
  }
  if (!venue || RESERVED_SUBDOMAINS.has(venue)) return null;
  return venue;
}

/** HOST-mode rewrite target, or null to serve at root (marketing). */
function resolveRewrite(req: NextRequest): URL | null {
  const url = req.nextUrl;
  const hostname = getHostname(req);
  const suffix = url.pathname === "/" ? "" : url.pathname;

  if (isApexHost(hostname)) return null;
  if (isAppHost(hostname)) {
    return new URL(`/dashboard${suffix}${url.search}`, req.url);
  }
  const venue = tenantFromHost(hostname);
  if (!venue) return null;
  return new URL(`/s/${encodeURIComponent(venue)}${suffix}${url.search}`, req.url);
}

function routeRequest(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (isApiPath(pathname)) return NextResponse.next();

  // PATH mode: serve real paths directly on one host (no rewrite, no blocking).
  if (PATH_ROUTING) return NextResponse.next();

  // HOST mode: block direct access to internal targets, then host-rewrite.
  if (isInternalPath(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const rewrite = resolveRewrite(req);
  return rewrite ? NextResponse.rewrite(rewrite) : NextResponse.next();
}

const isPublicHostRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isPublicPathRoute = createRouteMatcher([
  "/dashboard/sign-in(.*)",
  "/dashboard/sign-up(.*)",
]);

/** Whether the request is a dashboard PAGE that must be authenticated. */
function shouldProtect(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;
  if (isApiPath(pathname)) return false;
  if (PATH_ROUTING) {
    return isDashboardPath(pathname) && !isPublicPathRoute(req);
  }
  return isAppHost(getHostname(req)) && !isPublicHostRoute(req);
}

const handler = clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      // Server actions / route handlers must STILL self-check auth.
      if (shouldProtect(req)) await auth.protect();
      return routeRequest(req);
    })
  : routeRequest;

export const proxy = handler;
export default handler;

// Clerk's recommended matcher: skip _next + static files; always run on API.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
