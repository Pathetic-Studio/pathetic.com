"use client";

import { useEffect, useRef } from "react";
import { TransitionRouter } from "next-transition-router";
import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import ScrollTrigger from "gsap/ScrollTrigger";

type AnchorNavigateDetail = {
    anchorId: string;
    offsetPercent?: number | null;
    href?: string;
};

function teleportToAnchor(anchorId: string, offsetPercent?: number | null) {
    const target = document.getElementById(anchorId);
    if (!target) return;

    const offsetPx =
        ((typeof offsetPercent === "number" ? offsetPercent : 0) / 100) *
        window.innerHeight;

    const smoother = ScrollSmoother.get();

    if (smoother) {
        const current = smoother.scrollTop();
        const rectTop = target.getBoundingClientRect().top;
        const y = current + rectTop - offsetPx;
        smoother.scrollTo(y, false); // instant jump
    } else {
        const rect = target.getBoundingClientRect();
        const y = rect.top + window.scrollY - offsetPx;
        window.scrollTo({ top: y, behavior: "auto" });
    }

    try {
        ScrollTrigger.refresh();
    } catch { }
}

export default function TransitionShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageRef = useRef<HTMLDivElement | null>(null);

    // one-shot flag to prevent any "scroll to top" in enter()
    const skipNextEnterScrollResetRef = useRef(false);

    // keep a handle so we can kill the anchor timeline cleanly
    const anchorTlRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        const onAnchorNavigate = (ev: Event) => {
            const el = pageRef.current;
            if (!el) return;

            const e = ev as CustomEvent<AnchorNavigateDetail>;
            const { anchorId, offsetPercent, href } = e.detail || ({} as any);
            if (!anchorId) return;

            // prevent TransitionRouter enter() from forcing top right after
            skipNextEnterScrollResetRef.current = true;

            // kill any existing fades on the page root
            gsap.killTweensOf(el);
            anchorTlRef.current?.kill();
            anchorTlRef.current = null;

            // Make sure we're visible before starting
            gsap.set(el, { opacity: 1 });

            // Tune these to taste
            const FADE_OUT = 0.55;
            const PAUSE_OUT = 0.12;
            const PAUSE_IN = 0.08;
            const FADE_IN = 0.55;

            const tl = gsap.timeline({
                defaults: { ease: "none", overwrite: "auto" },
            });

            // Fade out (slower)
            tl.to(el, { opacity: 0, duration: FADE_OUT });

            // Pause while hidden
            tl.to({}, { duration: PAUSE_OUT });

            // Teleport while hidden + update URL without native jump
            tl.add(() => {
                try {
                    const nextHref = href ?? `/#${anchorId}`;
                    window.history.replaceState(null, "", nextHref);
                } catch { }

                teleportToAnchor(anchorId, offsetPercent);
            });

            // Small pause after teleport (lets layout settle while hidden)
            tl.to({}, { duration: PAUSE_IN });

            // Fade in (slower)
            tl.to(el, { opacity: 1, duration: FADE_IN });

            anchorTlRef.current = tl;
        };

        window.addEventListener("app:anchor-navigate", onAnchorNavigate as EventListener);
        return () => {
            window.removeEventListener("app:anchor-navigate", onAnchorNavigate as EventListener);
            anchorTlRef.current?.kill();
            anchorTlRef.current = null;
        };
    }, []);

    return (
        <TransitionRouter
            auto
            leave={(next) => {
                const el = pageRef.current;
                if (!el) return next();

                // If an anchor timeline is mid-flight, kill it so router fade is clean
                anchorTlRef.current?.kill();
                anchorTlRef.current = null;

                gsap.killTweensOf(el);

                gsap.to(el, {
                    opacity: 0,
                    duration: 0.25,
                    ease: "none",
                    onComplete: next,
                });
            }}
            enter={(next) => {
                const el = pageRef.current;
                if (!el) return next();

                // Same: avoid competing tweens
                anchorTlRef.current?.kill();
                anchorTlRef.current = null;

                gsap.killTweensOf(el);
                gsap.set(el, { opacity: 0 });

                try {
                    const shouldSkip = skipNextEnterScrollResetRef.current;
                    const hasHash = !!window.location.hash;

                    if (!shouldSkip && !hasHash) {
                        window.scrollTo(0, 0);
                    }
                } catch {
                    // ignore
                } finally {
                    skipNextEnterScrollResetRef.current = false;
                }

                gsap.to(el, {
                    opacity: 1,
                    duration: 0.25,
                    ease: "none",
                    onComplete: next,
                });
            }}
        >
            <div id="page-transition-root" ref={pageRef}>
                {children}
            </div>
        </TransitionRouter>
    );
}
