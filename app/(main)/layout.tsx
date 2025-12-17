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

import TransitionShell from "@/components/layout/transition-shell";
import { HeaderNavOverridesProvider } from "@/components/header/nav-overrides";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const draft = await draftMode();

    const loaderDoc = await fetchPageLoader();
    const loaderEnabled = loaderDoc?.enabled ?? false;

    return (
        <HeaderNavOverridesProvider>
            <ContactModalProvider>
                <Header />
                <ContactModal />
                <NewsletterModal />

                <MainLayoutShell>
                    <main className="overflow-x-hidden md:overflow-visible">
                        <TransitionShell>
                            {loaderEnabled && loaderDoc && <PageLoaderSection data={loaderDoc} />}
                            {children}
                        </TransitionShell>
                    </main>

                    <SanityLive />

                    {draft.isEnabled && (
                        <>
                            <DisableDraftMode />
                            <VisualEditing />
                            <DisableDraftMode />
                        </>
                    )}

                    <Footer />
                </MainLayoutShell>
            </ContactModalProvider>
        </HeaderNavOverridesProvider>
    );
}
