import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { DashboardNav } from "@/components/dashboard/nav";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { clerkConfigured } from "@/lib/auth";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defence in depth: the proxy already auth-gates the app host, but the
  // dashboard must never render for an unauthenticated principal.
  if (clerkConfigured) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) return redirectToSignIn();
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <DashboardNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <span className="text-sm text-muted-foreground">Owner dashboard</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {clerkConfigured ? (
              <>
                <OrganizationSwitcher
                  hidePersonal
                  afterCreateOrganizationUrl="/"
                  afterSelectOrganizationUrl="/"
                  afterLeaveOrganizationUrl="/"
                />
                <UserButton />
              </>
            ) : (
              <span className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                Clerk not configured
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
