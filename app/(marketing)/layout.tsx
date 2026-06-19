import Link from "next/link";

import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { appUrl } from "@/lib/urls";

const NAV = [
  { href: "/venues", label: "Browse venues" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/audit", label: "Free audit" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((i) => (
              <Button key={i.href} asChild variant="ghost" size="sm">
                <Link href={i.href}>{i.label}</Link>
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href={`${appUrl}/sign-in`}>Sign in</a>
            </Button>
            <Button asChild size="sm">
              <a href={`${appUrl}/sign-up`}>Get started</a>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                The owner operating system for wedding lawns and resorts in India.
                AI-first, built for independent venues.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { href: "/#features", label: "Features" },
                { href: "/#pricing", label: "Pricing" },
                { href: "/audit", label: "Free AI audit" },
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { href: "/#about", label: "About" },
                { href: "/contact", label: "Contact" },
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
              ]}
            />
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} VenuePilot. All rights reserved.</p>
            <a href="mailto:hello@venuepilot.in" className="hover:text-foreground">
              hello@venuepilot.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
