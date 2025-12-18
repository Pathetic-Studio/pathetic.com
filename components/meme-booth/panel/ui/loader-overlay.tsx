//components/meme-booth/panel/ui/loader-overlay.tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import LoadingBar from "@/components/ui/loading-bar";

type Props = {
    active: boolean;
    messages: { at: number; text: string }[];
};

export default function LoaderOverlay({ active, messages }: Props) {
    const wrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;

        gsap.to(el, {
            autoAlpha: active ? 1 : 0,
            duration: 0.25,
            ease: "power2.out",
        });
    }, [active]);

    return (
        <div
            ref={wrapRef}
            className="pointer-events-none absolute inset-0 z-20 opacity-0"
            aria-hidden={!active}
        >
            {/* color overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

            {/* loader */}
            <div className="relative flex h-full w-full items-center justify-center">
                <div className="w-full px-10">
                    <LoadingBar active={active} label="Cooking your meme…" messages={messages} />
                </div>
            </div>
        </div>
    );
}
