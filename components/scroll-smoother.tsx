// components/scroll-smoother.tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

export default function SmoothScroller({
  children,
}: {
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {
      // ignore
    }

    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    // Kill any existing smoother
    ScrollSmoother.get()?.kill();

    // Base fallback: allow scroll even if Smoother explodes
    wrapper.style.overflowY = "auto";
    wrapper.style.overflowX = "hidden";

    let smoother: ScrollSmoother | null = null;
    let refreshTimer: number | undefined;
    const pinTriggers: ScrollTrigger[] = [];

    // inside useLayoutEffect

    const setupPinning = () => {
      pinTriggers.forEach((t) => t.kill());
      pinTriggers.length = 0;

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (!isDesktop) {
        return;
      }

      const pinnedSections = gsap.utils.toArray<HTMLElement>(
        '[data-pin-to-viewport="true"]',
      );

      pinnedSections.forEach((section) => {
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${section.offsetHeight}`,
          pin: true,
          pinSpacing: false,
        });

        pinTriggers.push(trigger);
      });
    };

    try {
      if (isTouch) {
        // Touch/mobile: NO smoother, NO pinning at all
        content.style.transform = "none";
        // don't call setupPinning() here
      } else {
        smoother = ScrollSmoother.create({
          wrapper,
          content,
          smooth: 1,
          smoothTouch: 0.1,
          effects: true,
          normalizeScroll: true,
        });

        setupPinning();

        refreshTimer = window.setTimeout(() => {
          ScrollTrigger.refresh();
        }, 150);
      }
    } catch (err) {
      console.error("[SmoothScroller] ScrollSmoother.create failed", err);
      // Even if smoother fails, still try to set up pinning on native scroll
      setupPinning();
      refreshTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
    }

    return () => {
      if (refreshTimer !== undefined) {
        window.clearTimeout(refreshTimer);
      }
      pinTriggers.forEach((t) => t.kill());
      smoother?.kill();
    };
  }, []);

  return (
    <div
      id="smooth-wrapper"
      ref={wrapperRef}
      className="relative min-h-screen"
    >
      <div
        id="smooth-content"
        ref={contentRef}
        className="will-change-transform [transform:translate3d(0,0,0)]"
      >
        {children}
      </div>
    </div>
  );
}
