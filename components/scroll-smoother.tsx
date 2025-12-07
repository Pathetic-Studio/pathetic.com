// components/scroll-smoother.tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

export default function SmoothScroller({ children }: { children: React.ReactNode }) {
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

    // kill any existing smoother (Next page transitions, hot reload, etc.)
    ScrollSmoother.get()?.kill();

    const smoother = ScrollSmoother.create({
      wrapper: wrapperRef.current!,
      content: contentRef.current!,
      smooth: 1,
      smoothTouch: 0.1,
      effects: true,
      normalizeScroll: true,
    });

    const refreshTimer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      window.clearTimeout(refreshTimer);
      smoother.kill();
    };
  }, []);

  return (
    <div
      id="smooth-wrapper"
      ref={wrapperRef}
      className="relative min-h-screen overflow-hidden"
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
