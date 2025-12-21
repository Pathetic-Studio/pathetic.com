//components/meme-booth/panel/ui/loader-overlay.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import LoadingBar from "./loading-bar";

type Props = {
    active: boolean;
    messages: { at: number; text: string }[];
    onHidden?: () => void; // called after loader finishes and overlay fades out
};

export default function LoaderOverlay({ active, messages, onHidden }: Props) {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const [showOverlay, setShowOverlay] = useState(false);

    // When a run starts, show overlay. When the run ends, we wait for LoadingBar's onComplete.
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;

        if (active) {
            setShowOverlay(true);
            gsap.killTweensOf(el);
            gsap.to(el, {
                autoAlpha: 1,
                duration: 0.25,
                ease: "power2.out",
            });
        }
    }, [active]);

    const handleBarComplete = () => {
        const el = wrapRef.current;
        if (!el) {
            setShowOverlay(false);
            onHidden?.();
            return;
        }

        // Now fade the overlay itself, THEN reveal the image via onHidden
        gsap.killTweensOf(el);
        gsap.to(el, {
            autoAlpha: 0,
            duration: 0.25,
            ease: "power2.out",
            onComplete: () => {
                setShowOverlay(false);
                onHidden?.();
            },
        });
    };

    // If not active and we aren't currently showing the overlay, render nothing
    if (!showOverlay && !active) return null;

    return (
        <div
            ref={wrapRef}
            className="pointer-events-none absolute inset-0 z-20 opacity-0"
            aria-hidden={!active}
        >
            {/* color overlay */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-[4px]" />

            {/* loader */}
            <div className="relative flex h-full w-full items-center justify-center">
                <div className="w-full px-10">
                    <LoadingBar
                        active={active}
                        label="Cooking your meme…"
                        messages={messages}
                        onComplete={handleBarComplete}
                    />
                </div>
            </div>
        </div>
    );
}
