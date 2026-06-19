import { SignUp } from "@clerk/nextjs";

import { clerkConfigured } from "@/lib/auth";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      {clerkConfigured ? (
        <SignUp />
      ) : (
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Clerk is not configured. Add{" "}
          <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code>CLERK_SECRET_KEY</code> to <code>.env.local</code> to enable
          sign-up.
        </p>
      )}
    </div>
  );
}
