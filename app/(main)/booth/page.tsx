//app/(main)/meme-booth/page.tsx
import type { Metadata } from "next";
import MemeBoothShell from "@/components/meme-booth/meme-booth-shell";
import TitleText from "@/components/ui/title-text";
import BoothProviders from "@/components/meme-booth/booth-providers";
import CreditBalance from "@/components/meme-booth/credits/credit-balance";
import QuickBuyButton from "@/components/meme-booth/credits/quick-buy-button";

// Check if Sanity is configured
const isSanityConfigured = !!(
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
    process.env.NEXT_PUBLIC_SANITY_DATASET
);

// Default page data when Sanity is not configured
const defaultPageData = {
    title: "MEME BOOTH",
    subtitle: "Generate your starter pack",
    showNewsletterModalOnView: false,
};

async function getPageData() {
    if (!isSanityConfigured) {
        return defaultPageData;
    }

    try {
        const { fetchMemeBooth } = await import("@/sanity/lib/fetch");
        const page = await fetchMemeBooth();
        return page || defaultPageData;
    } catch {
        return defaultPageData;
    }
}

export async function generateMetadata(): Promise<Metadata> {
    const page = await getPageData() as any;

    const title = page?.meta_title || page?.title || "Meme Booth";
    const description =
        page?.meta_description || page?.subtitle || "Generate memes in the booth.";

    const ogImageUrl = page?.ogImage?.asset?.url || undefined;
    const noindex = page?.noindex ?? false;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
        },
        robots: noindex
            ? {
                index: false,
                follow: true,
            }
            : undefined,
    };
}

export default async function MemeBoothPage() {
    const page = await getPageData();

    const showNewsletterModalOnView = page?.showNewsletterModalOnView ?? false;

    return (
        <BoothProviders>
            <main className="relative mx-auto max-w-4xl py-32 px-4">
                <header className="mb-8 text-center">
                    {page?.title && (
                        <TitleText
                            as="h1"
                            variant="stretched"
                            size="lg"
                            align="center"
                            maxChars={32}
                            animation="typeOn"
                            animationSpeed={1.2}
                        >
                            {page.title}
                        </TitleText>
                    )}

                    {page?.subtitle && (
                        <p className="mt-1 text-2xl text-muted-foreground">
                            {page.subtitle}
                        </p>
                    )}
                </header>

                <MemeBoothShell showNewsletterModalOnView={showNewsletterModalOnView} />

                <div className="mt-6 flex flex-col items-center gap-3">
                    <CreditBalance />
                    <QuickBuyButton />
                </div>
            </main>
        </BoothProviders>
    );
}
