// components/meme-booth/panel/ui/loading-bar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export type LoadingMessage = {
    at: number; // 0–0.9 in practice (because we map fake progress to 0..0.9)
    text: string;
};

type LoadingBarProps = {
    active: boolean; // true while the async job is running
    label?: string;
    height?: number; // px (visual bar height)
    onComplete?: () => void; // called AFTER it finishes to 100% and hides
    messages?: LoadingMessage[]; // staged copy
};

const DEFAULT_MESSAGES: LoadingMessage[] = [
    { at: 0.05, text: "Analyzing fit" },
    { at: 0.3, text: "Dissecting personality" },
    { at: 0.6, text: "Removing individuality" },
    { at: 0.85, text: "Clowning your whole life" },
    { at: 0.9, text: "Adding finishing touches" },
];

export default function LoadingBar({
    active,
    label = "Loading…",
    height = 10,
    onComplete,
    messages,
}: LoadingBarProps) {
    const barRef = useRef<HTMLDivElement | null>(null);
    const labelRef = useRef<HTMLDivElement | null>(null);

    // NOTE: keep this explicit so TS never loses the type
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const bar = barRef.current;
        const labelEl = labelRef.current;
        if (!bar || !labelEl) return;

        // kill old timeline (use local var to avoid TS "never" narrowing weirdness)
        const oldTl = tlRef.current;
        if (oldTl) {
            oldTl.kill();
            tlRef.current = null;
        }

        const stagedMessages = (messages && messages.length > 0 ? messages : DEFAULT_MESSAGES)
            .slice()
            .sort((a, b) => a.at - b.at);

        let currentMsgIndex = -1;

        const showMessage = (text: string) => {
            gsap.to(labelEl, {
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                    labelEl.textContent = text;
                    gsap.to(labelEl, {
                        opacity: 1,
                        duration: 0.2,
                    });
                },
            });
        };

        // initial label
        labelEl.textContent = label;

        if (active) {
            setVisible(true);

            // reset visuals
            gsap.set(bar, { width: "0%" });
            gsap.set(bar.parentElement, { opacity: 1 });

            const tl = gsap.timeline({
                onUpdate: () => {
                    // tl.progress() is 0–1 over the fake load
                    const p = tl.progress() * 0.9; // map to 0–0.9 for 0–90%

                    const nextIndex = stagedMessages.findIndex(
                        (m, i) => i > currentMsgIndex && p >= m.at
                    );

                    if (nextIndex !== -1) {
                        currentMsgIndex = nextIndex;
                        showMessage(stagedMessages[currentMsgIndex].text);
                    }
                },
            });

            // YOUR original timing + easing + steps (unchanged)
            tl.to(bar, {
                width: "20%",
                duration: 8,
                ease: "power1.inOut",
            });

            tl.to(bar, {
                width: "50%",
                duration: 8,
                ease: "power1.inOut",
            });

            tl.to(bar, {
                width: "70%",
                duration: 8,
                ease: "power2.in",
            });

            tl.to(bar, {
                width: "90%",
                duration: 12,
                ease: "power2.inOut",
            });

            tlRef.current = tl;
        } else if (visible) {
            // If the async job finishes early, stop the timeline at the current position
            const runningTl = tlRef.current;
            if (runningTl) {
                runningTl.kill();
                tlRef.current = null;
            }

            // Finish: current width → 100%, then hide and callback (your original)
            gsap.to(bar, {
                width: "100%",
                duration: 0.5,
                ease: "power2.out",
                onComplete: () => {
                    // quick fade-out of the whole bar after it fills
                    gsap.to(bar.parentElement, {
                        opacity: 0,
                        duration: 0.25,
                        onComplete: () => {
                            setVisible(false);
                            onComplete?.();
                            gsap.set(bar, { width: "0%" });
                            gsap.set(bar.parentElement, { opacity: 1 });
                        },
                    });
                },
            });
        }

        return () => {
            const t = tlRef.current;
            if (t) {
                t.kill();
                tlRef.current = null;
            }
        };
    }, [active, visible, onComplete, label, messages]);

    if (!visible && !active) return null;

    return (
        <div className="w-full mt-5">
            {/* Centered, larger text */}
            <div className="mb-3 text-center text-sm sm:text-base font-medium select-none">
                <div ref={labelRef} className="inline-block opacity-100">
                    {label}
                </div>
            </div>

            {/* Outer border with padding, inner bar inset */}
            <div className="w-full border border-border bg-muted " style={{ padding: 2 }}>
                <div className="w-full  overflow-hidden bg-background" style={{ height }}>
                    <div ref={barRef} className="h-full w-0 bg-foreground " />
                </div>
            </div>
        </div>
    );
}
