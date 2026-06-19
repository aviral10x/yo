import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          VenuePilot (&ldquo;we&rdquo;) provides software for wedding venues to
          manage their online presence, enquiries, and bookings. This policy
          explains what we collect and how we use it. We process personal data in
          line with India&rsquo;s Digital Personal Data Protection Act, 2023.
        </p>

        <Section title="Information we collect">
          Account details (name, email, phone) for venue owners and staff; venue
          and booking data you enter; and enquiry details for couples who contact
          a venue through our platform. We collect this to operate the service.
        </Section>

        <Section title="How we use AI">
          We use AI models (including Anthropic&rsquo;s Claude, which may run via
          cloud providers such as AWS Bedrock) to draft replies, generate quotes,
          and produce growth audits. Inputs are used to generate the requested
          output and are not used to train third-party foundation models.
        </Section>

        <Section title="Sharing">
          We share data only with processors needed to run the service
          (hosting, payments, messaging, analytics) under contract, and as
          required by law. We do not sell personal data.
        </Section>

        <Section title="Your rights">
          You may request access, correction, or deletion of your personal data,
          and withdraw consent, by emailing us. We retain data only as long as
          needed to provide the service or meet legal obligations.
        </Section>

        <Section title="Contact">
          Questions? Email{" "}
          <a className="text-primary hover:underline" href="mailto:privacy@venuepilot.in">
            privacy@venuepilot.in
          </a>
          .
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
