//app/(main)/layout.tsx
import Header from "@/components/header";
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

const HOME_LOADER_SESSION_KEY = "pageLoaderPlayed";
const HOME_LOADER_PENDING_ATTR = "data-home-loader-pending";
const LOADER_PLAYING_ATTR = "data-loader-playing";

function getHomeLoaderGateScript(oncePerSession: boolean) {
    return `(function(){try{var root=document.documentElement;var path=window.location.pathname.replace(/\\/+$/,"")||"/";var isHome=path==="/";var hasHash=!!window.location.hash;var cameViaClientNav=!!window.__APP_CAME_VIA_CLIENT_NAV__;var once=${oncePerSession ? "true" : "false"};var played=false;if(once){try{played=window.sessionStorage.getItem("${HOME_LOADER_SESSION_KEY}")==="true";}catch(e){}}var navType=null;try{var nav=performance.getEntriesByType("navigation")[0];navType=nav&&nav.type;}catch(e){}var navAllows=once?true:navType!=="back_forward";var shouldPlay=isHome&&!hasHash&&!cameViaClientNav&&!played&&navAllows;if(shouldPlay){root.setAttribute("${HOME_LOADER_PENDING_ATTR}","true");root.setAttribute("${LOADER_PLAYING_ATTR}","true");}else{root.removeAttribute("${HOME_LOADER_PENDING_ATTR}");root.removeAttribute("${LOADER_PLAYING_ATTR}");}}catch(e){}})();`;
}

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
                {loaderEnabled && loaderDoc && (
                    <script
                        dangerouslySetInnerHTML={{
                            __html: getHomeLoaderGateScript(!!loaderDoc.oncePerSession),
                        }}
                    />
                )}
                <Header />
                <ContactModal />
                <NewsletterModal />

                <MainLayoutShell>
                    <main className="overflow-x-hidden md:overflow-visible">
                        <TransitionShell>
                            {loaderEnabled && loaderDoc && <PageLoaderSection data={loaderDoc} />}
                            <div id="page-content-root">{children}</div>
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


                </MainLayoutShell>
            </ContactModalProvider>
        </HeaderNavOverridesProvider>
    );
}
