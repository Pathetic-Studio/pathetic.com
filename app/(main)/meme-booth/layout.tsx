//app/(main)/meme-booth/layout.tsx
import { ReactNode } from "react";
import { fetchMemeBooth } from "@/sanity/lib/fetch";
import { HeaderNavOverridesSetter } from "@/components/header/nav-overrides";

export default async function MemeBoothLayout({
    children,
}: {
    children: ReactNode;
}) {
    const memeBooth = await fetchMemeBooth();

    return (
        <>
            <HeaderNavOverridesSetter
                value={{
                    showDesktopRightLinks: memeBooth?.showDesktopRightLinks ?? true,
                    leftNavReplace: (memeBooth?.leftNavReplace ?? []) as any[],
                }}
            />
            {children}
        </>
    );
}
