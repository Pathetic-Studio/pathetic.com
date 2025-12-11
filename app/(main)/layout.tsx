// app/(main)/layout.tsx
import Header from "@/components/header";
import Footer from "@/components/footer";
import { DisableDraftMode } from "@/components/disable-draft-mode";
import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";
import { SanityLive } from "@/sanity/lib/live";
import MainLayoutShell from "@/components/main-layout-shell";

import { ContactModalProvider } from "@/components/contact/contact-modal-context";
import ContactModal from "@/components/contact/contact-modal";
import NewsletterModal from "@/components/newsletter/newsletter-modal";

import { fetchPageLoader } from "@/sanity/lib/fetch-page-loader";
import PageLoaderSection from "@/components/page-loader-section";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const draft = await draftMode();

  const loaderDoc = await fetchPageLoader();
  const loaderEnabled = loaderDoc?.enabled ?? false;

  return (
    <ContactModalProvider>
      <Header />
      <ContactModal />
      <NewsletterModal />

      <MainLayoutShell>
        <main className="overflow-x-hidden md:overflow-visible">
          {/* This is now both loader + landing section */}
          {loaderEnabled && loaderDoc && (
            <PageLoaderSection data={loaderDoc} />
          )}

          {children}
        </main>

        <SanityLive />

        {draft.isEnabled && (
          <>
            <DisableDraftMode />
            <VisualEditing />
          </>
        )}

        <Footer />
      </MainLayoutShell>
    </ContactModalProvider>
  );
}
