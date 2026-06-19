import { ClerkProvider } from "@clerk/nextjs";

import { clerkConfigured } from "@/lib/auth";

// Dashboard is always dynamic (per-request auth) so it never prerenders the
// ClerkProvider at build time. ClerkProvider is scoped here (not the root
// layout) so marketing + tenant venue sites stay Clerk-free.
export const dynamic = "force-dynamic";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!clerkConfigured) return <>{children}</>;
  return <ClerkProvider dynamic>{children}</ClerkProvider>;
}
