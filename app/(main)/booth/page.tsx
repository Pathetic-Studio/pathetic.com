//app/(main)/meme-booth/page.tsx
import type { Metadata } from "next";
import PasswordProtectedBoothContent from "@/components/meme-booth/password-protected-booth-content";

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
    const page = await getPageData();

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
        <PasswordProtectedBoothContent
            page={page}
            showNewsletterModalOnView={showNewsletterModalOnView}
        />
    );
}
