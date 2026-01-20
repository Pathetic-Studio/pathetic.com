import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Pathetic - how we handle your data",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-muted-foreground">Last updated: January 2025</p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">What We Collect</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Email address</strong> - when you create an account
            </li>
            <li>
              <strong>Payment information</strong> - processed securely by Stripe. We never see or store your card details.
            </li>
            <li>
              <strong>Generated images</strong> - the memes you create using our service
            </li>
            <li>
              <strong>Usage data</strong> - how you interact with our service (pages visited, features used)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Why We Collect It</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>To provide and maintain our service</li>
            <li>To process your payments</li>
            <li>To improve our product and user experience</li>
            <li>To communicate with you about your account</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Third Parties</h2>
          <p className="mb-4">We work with trusted third parties to provide our service:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Stripe</strong> - payment processing
            </li>
            <li>
              <strong>Supabase</strong> - authentication and database
            </li>
            <li>
              <strong>Google</strong> - OAuth login (if you sign in with Google)
            </li>
            <li>
              <strong>Google Gemini</strong> - AI image generation
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Data Retention</h2>
          <p>
            We keep your data for as long as you have an account with us. If you want your data deleted, just ask and we&apos;ll remove it.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Your Rights</h2>
          <p>You can:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Request a copy of your data</li>
            <li>Request deletion of your data</li>
            <li>Update your account information</li>
          </ul>
          <p className="mt-4">
            To make any of these requests, email us at{" "}
            <a href="mailto:catty@pathetic.com" className="text-primary underline">
              catty@pathetic.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Cookies</h2>
          <p>
            We use essential cookies to keep you logged in and make the site work properly. We don&apos;t use tracking cookies for advertising.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Contact</h2>
          <p>
            Questions about this policy? Email us at{" "}
            <a href="mailto:catty@pathetic.com" className="text-primary underline">
              catty@pathetic.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
