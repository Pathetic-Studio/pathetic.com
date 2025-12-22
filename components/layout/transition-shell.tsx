// components/layout/transition-shell.tsx
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

declare global {
    interface Window {
        __APP_CAME_VIA_CLIENT_NAV__?: boolean;
    }
}

const LOADER_FLAG_ATTR = "data-loader-playing";
const LOADER_EVENT = "loader-playing-change";

function markClientNav() {
    try {
        window.__APP_CAME_VIA_CLIENT_NAV__ = true;
    } catch { }
}

function isLoaderPlayingNow() {
    if (typeof document === "undefined") return false;
    return document.documentElement.hasAttribute(LOADER_FLAG_ATTR);
}

function teleportToAnchor(anchorId: string, offsetPercent?: number | null) {
    const target = document.getElementById(anchorId);
    if (!target) return;

    const offsetPx =
        ((typeof offsetPercent === "number" ? offsetPercent : 0) / 100) * window.innerHeight;

    const smoother = ScrollSmoother.get();

    if (smoother) {
        const current = smoother.scrollTop();
        const rectTop = target.getBoundingClientRect().top;
        const y = current + rectTop - offsetPx;
        smoother.scrollTo(y, false);
    } else {
        const rect = target.getBoundingClientRect();
        const y = rect.top + window.scrollY - offsetPx;
        window.scrollTo({ top: y, behavior: "auto" });
    }

    try {
        ScrollTrigger.refresh();
    } catch { }
}

export default function TransitionShell({ children }: { children: React.ReactNode }) {
    const pageRef = useRef<HTMLDivElement | null>(null);

    const skipNextEnterScrollResetRef = useRef(false);
    const anchorTlRef = useRef<gsap.core.Timeline | null>(null);

    // IMPORTANT:
    // Prevent "initial mount" enter animation. This is the #1 cause of flashes
    // when combined with a home loader.
    const isFirstEnterRef = useRef(true);

    // If loader starts while a transition tween is running, force wrapper visible.
    useEffect(() => {
        const el = pageRef.current;
        if (!el) return;

        const onLoaderEvt = (ev: Event) => {
            const e = ev as CustomEvent<{ on?: boolean }>;
            const on = !!e.detail?.on;
            if (!on) return;

            anchorTlRef.current?.kill();
            anchorTlRef.current = null;

            gsap.killTweensOf(el);
            gsap.set(el, { opacity: 1 });
        };

        window.addEventListener(LOADER_EVENT, onLoaderEvt as any);
        return () => window.removeEventListener(LOADER_EVENT, onLoaderEvt as any);
    }, []);

    useEffect(() => {
        const onAnchorNavigate = (ev: Event) => {
            const el = pageRef.current;
            if (!el) return;

            const e = ev as CustomEvent<AnchorNavigateDetail>;
            const { anchorId, offsetPercent, href } = e.detail || ({} as any);
            if (!anchorId) return;

            // anchor navigation counts as client navigation
            markClientNav();

            skipNextEnterScrollResetRef.current = true;

            gsap.killTweensOf(el);
            anchorTlRef.current?.kill();
            anchorTlRef.current = null;

            gsap.set(el, { opacity: 1 });

            const FADE_OUT = 0.55;
            const PAUSE_OUT = 0.12;
            const PAUSE_IN = 0.08;
            const FADE_IN = 0.55;

            const tl = gsap.timeline({ defaults: { ease: "none", overwrite: "auto" } });

            tl.to(el, { opacity: 0, duration: FADE_OUT });
            tl.to({}, { duration: PAUSE_OUT });

            tl.add(() => {
                try {
                    const nextHref = href ?? `/#${anchorId}`;
                    window.history.replaceState(null, "", nextHref);
                } catch { }

                teleportToAnchor(anchorId, offsetPercent);
            });

            tl.to({}, { duration: PAUSE_IN });
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
                // any page transition = client nav
                markClientNav();

                const el = pageRef.current;
                if (!el) return next();

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

                anchorTlRef.current?.kill();
                anchorTlRef.current = null;

                gsap.killTweensOf(el);

                // HARD STOP: never animate the initial mount.
                if (isFirstEnterRef.current) {
                    isFirstEnterRef.current = false;
                    gsap.set(el, { opacity: 1 });
                    return next();
                }

                // If loader is active, do NOT run enter fade-in.
                if (isLoaderPlayingNow()) {
                    gsap.set(el, { opacity: 1 });
                    return next();
                }

                gsap.set(el, { opacity: 0 });

                try {
                    const shouldSkip = skipNextEnterScrollResetRef.current;
                    const hasHash = !!window.location.hash;

                    if (!shouldSkip && !hasHash) {
                        window.scrollTo(0, 0);
                    }
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
