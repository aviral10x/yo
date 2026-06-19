// proxy.ts — Next.js 16 renamed `middleware` → `proxy` (Node.js runtime only;
// the edge runtime is NOT supported here). Multi-tenant host-based routing.
//
// Hosts:
//   <root> / www.<root> / localhost   → marketing (served at root, no rewrite)
//   app.<root> / app.localhost        → dashboard  (rewritten to /dashboard/*, auth-gated)
//   anything else (venue.<root> or a  → tenant site (rewritten to /s/<venue>/*)
//     fully custom domain)
//
// Security model:
//   - /api and /trpc are NEVER host-rewritten and NEVER Clerk-gated; their
//     handlers self-verify (Razorpay HMAC, Inngest signing key).
//   - /dashboard/* and /s/* are INTERNAL rewrite targets and are blocked (404)
//     as direct requests on every host, so the dashboard cannot be reached
//     unauthenticated on the apex host and one tenant cannot serve another's
//     site via /s/<other>.
//
// Graceful degradation: if Clerk env keys are absent we skip auth entirely and
// just do host routing, so the scaffold runs with zero third-party accounts.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { RESERVED_SUBDOMAINS } from "@/lib/constants";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "lvh.me:3000")
  .split(":")[0]
  .toLowerCase();

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

// API/trpc: served as-is on every host; handlers do their own auth.
function isApiPath(pathname: string): boolean {
  return (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/trpc" ||
    pathname.startsWith("/trpc/")
  );
}

// Internal rewrite targets — must never be addressable directly from any host.
function isInternalPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/s" ||
    pathname.startsWith("/s/")
  );
}

/** Derive the tenant slug/domain from a non-apex, non-app host. */
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

/** Internal rewrite target for a request, or null to serve at root (marketing). */
function resolveRewrite(req: NextRequest): URL | null {
  const url = req.nextUrl;
  const hostname = getHostname(req);
  const suffix = url.pathname === "/" ? "" : url.pathname;

  if (isApexHost(hostname)) return null; // marketing lives at root

  if (isAppHost(hostname)) {
    return new URL(`/dashboard${suffix}${url.search}`, req.url);
  }

  const venue = tenantFromHost(hostname);
  if (!venue) return null; // reserved/unknown host → marketing fallback
  return new URL(`/s/${encodeURIComponent(venue)}${suffix}${url.search}`, req.url);
}

function routeRequest(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  // Real API routes resolve on any host; never rewrite them.
  if (isApiPath(pathname)) return NextResponse.next();
  // Block direct access to internal rewrite targets (auth-bypass / cross-tenant).
  if (isInternalPath(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const rewrite = resolveRewrite(req);
  return rewrite ? NextResponse.rewrite(rewrite) : NextResponse.next();
}

// Dashboard pages that must NOT be auth-gated (sign-in/up live on app host).
const isPublicAppRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

const handler = clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      const { pathname } = req.nextUrl;
      // Protect dashboard PAGES on the app host. Skip API (self-verifying) and
      // the auth pages. Server actions / route handlers must STILL self-check.
      if (
        isAppHost(getHostname(req)) &&
        !isApiPath(pathname) &&
        !isPublicAppRoute(req)
      ) {
        await auth.protect();
      }
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
