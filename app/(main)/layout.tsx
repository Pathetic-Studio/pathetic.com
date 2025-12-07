// app/(main)/layout.tsx
import Header from "@/components/header";
import Footer from "@/components/footer";
import { DisableDraftMode } from "@/components/disable-draft-mode";
import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";
import { SanityLive } from "@/sanity/lib/live";
import PageLoader from "@/components/page-loader";
import MainLayoutShell from "@/components/main-layout-shell";

import { ContactModalProvider } from "@/components/contact/contact-modal-context";
import ContactModal from "@/components/contact/contact-modal";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const draft = await draftMode();

  const loaderEnabled = false;        // switch to true to enable loader
  const loaderOncePerSession = false; // switch to true to show only once per session

  return (
    <>
      {/* OUTSIDE smooth scroll */}
      <PageLoader
        enabled={loaderEnabled}
        oncePerSession={loaderOncePerSession}
        imageSources={[
          "/loader-img-1.png",
          "/loader-img-2.png",
          "/loader-img-3.png",
        ]}
      />

      <ContactModalProvider>
        {/* OUTSIDE smooth scroll */}
        <Header />

        {/* Modal sits at root so it can overlay everything */}
        <ContactModal />

        {/* INSIDE smooth scroll */}
        <MainLayoutShell>
          <main>{children}</main>

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
    </>
  );
}
