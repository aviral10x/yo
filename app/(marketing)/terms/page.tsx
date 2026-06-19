import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          These terms govern your use of VenuePilot. By creating an account you
          agree to them.
        </p>
        <Section title="The service">
          VenuePilot provides software to help venues get discovered, manage
          enquiries, collect deposits, and run events. Features and plans may
          change as the product evolves.
        </Section>
        <Section title="Your responsibilities">
          You are responsible for the accuracy of the content you publish, for
          obtaining consent to contact couples, and for complying with applicable
          law including payment and messaging regulations.
        </Section>
        <Section title="Payments">
          Subscriptions are billed monthly with a one-time onboarding fee.
          Pass-through costs (e.g. messaging or AI usage beyond included limits)
          may be billed separately. Payments are processed by Razorpay.
        </Section>
        <Section title="Acceptable use">
          Do not misuse the service, attempt to breach security, or use it to send
          unlawful or unsolicited messages.
        </Section>
        <Section title="Liability">
          The service is provided &ldquo;as is&rdquo;. To the extent permitted by
          law, our liability is limited to the fees you paid in the preceding
          three months.
        </Section>
        <Section title="Contact">
          Email{" "}
          <a className="text-primary hover:underline" href="mailto:hello@venuepilot.in">
            hello@venuepilot.in
          </a>{" "}
          with any questions.
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2">{children}</p>
    </div>
  );
}
