// app/(main)/meme-booth/page.tsx
import type { Metadata } from "next";
import MemeBoothShell from "@/components/meme-booth/meme-booth-shell";
import { fetchMemeBooth } from "@/sanity/lib/fetch";

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

    return (
        <main className="mx-auto max-w-4xl pt-32 px-4">
            <header className="mb-8 text-center">
                <h1 className="text-5xl font-semibold uppercase">
                    {page?.title || "Meme Booth"}
                </h1>

                {page?.subtitle && (
                    <p className="mt-1 text-2xl text-muted-foreground">
                        {page.subtitle}
                    </p>
                )}
            </header>

            {/* Client-only, dynamic, no SSR */}
            <MemeBoothShell />
        </main>
    );
}
