//app/(main)/meme-booth/layout.tsx
import { ReactNode } from "react";
import { HeaderNavOverridesSetter } from "@/components/header/nav-overrides";

// Check if Sanity is configured
const isSanityConfigured = !!(
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
    process.env.NEXT_PUBLIC_SANITY_DATASET
);

async function getBoothConfig() {
    if (!isSanityConfigured) {
        return null;
    }

    try {
        const { fetchMemeBooth } = await import("@/sanity/lib/fetch");
        return await fetchMemeBooth();
    } catch {
        return null;
    }
}

export default async function MemeBoothLayout({
    children,
}: {
    children: ReactNode;
}) {
    const memeBooth = await getBoothConfig();

    return (
        <>
            <HeaderNavOverridesSetter
                value={{
                    // Desktop
                    showDesktopRightLinks: memeBooth?.showDesktopRightLinks ?? true,
                    leftNavReplace: (memeBooth?.leftNavReplace ?? []) as any[],

                    // Mobile
                    showMobileBottomLinks: memeBooth?.showMobileBottomLinks ?? true,
                    mobileTopReplace: (memeBooth?.mobileTopReplace ?? []) as any[],
                }}
            />
            {children}
        </>
    );
}
