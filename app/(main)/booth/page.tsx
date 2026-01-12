//app/(main)/meme-booth/page.tsx
import type { Metadata } from "next";
import { fetchMemeBooth } from "@/sanity/lib/fetch";
import PasswordProtectedBoothContent from "@/components/meme-booth/password-protected-booth-content";

export async function generateMetadata(): Promise<Metadata> {
    const page = await fetchMemeBooth();

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
    const page = await fetchMemeBooth();

    const showNewsletterModalOnView = page?.showNewsletterModalOnView ?? false;

    return (
        <PasswordProtectedBoothContent 
            page={page} 
            showNewsletterModalOnView={showNewsletterModalOnView} 
        />
    );
}
