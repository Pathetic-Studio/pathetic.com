// components/layout/smooth-scroller.tsx
"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";
import { useViewportVars } from "@/components/hooks/use-viewport-vars";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

const LOADER_FLAG_ATTR = "data-loader-playing";
const LOADER_EVENT = "loader-playing-change";

export default function SmoothScroller({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useViewportVars();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const savedTabScrollRef = useRef<number>(0);

  const [enableSmooth, setEnableSmooth] = useState(false);
  const [suppressForLoader, setSuppressForLoader] = useState(false);

  // Track loader flag without changing DOM structure
  useEffect(() => {
    if (typeof window === "undefined") return;

    const read = () => document.documentElement.hasAttribute(LOADER_FLAG_ATTR);
    const apply = () => setSuppressForLoader(read());

    apply();

    const onEvt = () => apply();
    window.addEventListener(LOADER_EVENT, onEvt as any);
    return () => window.removeEventListener(LOADER_EVENT, onEvt as any);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = () => {
      const isTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      setEnableSmooth(isDesktop && !isTouch);
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const scrollToHashIfPresent = useCallback(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash || hash === "#") return;

    const id = decodeURIComponent(hash.slice(1));
    if (!id) return;

    const target = document.getElementById(id);
    if (!target) return;

    const smoother = ScrollSmoother.get();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (smoother) {
          const current = smoother.scrollTop();
          const rectTop = target.getBoundingClientRect().top;
          const y = current + rectTop;
          smoother.scrollTo(y, true);
        } else {
          try {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch {
            const rect = target.getBoundingClientRect();
            window.scrollTo({ top: rect.top + window.scrollY });
          }
        }

        try {
          ScrollTrigger.refresh();
        } catch { }
      });
    });
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    // If loader is playing: kill smoother + remove transforms (DO NOT touch opacity)
    if (suppressForLoader) {
      try {
        ScrollSmoother.get()?.kill();
      } catch { }

      gsap.set(content, { clearProps: "transform" });

      try {
        ScrollTrigger.refresh();
      } catch { }

      return;
    }

    // No smooth on mobile/touch or reduced motion
    if (!enableSmooth || prefersReduced) {
      try {
        ScrollSmoother.get()?.kill();
      } catch { }
      gsap.set(content, { clearProps: "transform" });
      return;
    }

    // Smooth mode
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch { }

    ScrollTrigger.config({
      autoRefreshEvents: "DOMContentLoaded,load,resize",
    });

    wrapper.style.overflowAnchor = "none";
    content.style.overflowAnchor = "none";
    document.documentElement.style.overflowAnchor = "none";
    document.body.style.overflowAnchor = "none";

    // Kill any prior smoother
    try {
      ScrollSmoother.get()?.kill();
    } catch { }

    let smoother: ScrollSmoother | null = null;

    const pinTriggers: ScrollTrigger[] = [];
    let ro: ResizeObserver | null = null;

    let suppressRefresh = false;

    const getScrollY = () => {
      if (smoother) return smoother.scrollTop();
      return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    };

    const setScrollY = (y: number) => {
      if (smoother) smoother.scrollTo(y, false);
      else window.scrollTo(0, y);
    };

    const parsePinDurationToPx = (raw: string | null, section: HTMLElement) => {
      const natural = Math.max(section.scrollHeight, section.offsetHeight) || window.innerHeight;

      if (!raw) return natural;

      const value = raw.trim();
      if (!value) return natural;

      if (/^-?\d+(\.\d+)?$/.test(value)) {
        const factor = parseFloat(value);
        if (Number.isNaN(factor)) return natural;
        return Math.max(factor * window.innerHeight, 0);
      }

      if (value.endsWith("vh")) {
        const num = parseFloat(value.slice(0, -2));
        if (Number.isNaN(num)) return natural;
        return Math.max((num / 100) * window.innerHeight, 0);
      }

      if (value.endsWith("px")) {
        const num = parseFloat(value.slice(0, -2));
        if (Number.isNaN(num)) return natural;
        return Math.max(num, 0);
      }

      if (value.endsWith("%")) {
        const num = parseFloat(value.slice(0, -1));
        if (Number.isNaN(num)) return natural;
        return Math.max((num / 100) * natural, 0);
      }

      return natural;
    };

    const setupPinning = () => {
      pinTriggers.forEach((t) => t.kill());
      pinTriggers.length = 0;

      ro?.disconnect();
      ro = null;

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (!isDesktop) return;

      const pinnedSections = gsap.utils.toArray<HTMLElement>('[data-pin-to-viewport="true"]');
      pinnedSections.forEach((el) => (el.style.overflowAnchor = "none"));

      ro = new ResizeObserver(() => {
        if (suppressRefresh) return;
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
      pinnedSections.forEach((el) => ro?.observe(el));

      pinnedSections.forEach((section) => {
        const startAttr = section.getAttribute("data-pin-start");
        const startValue = startAttr && startAttr.trim() !== "" ? startAttr : "top top";

        const pinSpacingAttr = section.getAttribute("data-pin-spacing");
        const pinSpacing =
          pinSpacingAttr === "false" ? false : pinSpacingAttr === "true" ? true : true;

        const pinTarget =
          section.querySelector<HTMLElement>('[data-pin-target="true"]') || section;

        const trigger = ScrollTrigger.create({
          trigger: section,
          start: startValue,
          end: () => {
            const durationAttr = section.getAttribute("data-pin-duration");
            const px = parsePinDurationToPx(durationAttr, section);
            return `+=${px}`;
          },
          pin: pinTarget,
          pinSpacing,
          anticipatePin: pinSpacing ? 1 : 0,
          pinReparent: true,
          invalidateOnRefresh: true,
        });

        pinTriggers.push(trigger);
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const freezeOnHidden = () => {
      savedTabScrollRef.current = getScrollY();
      suppressRefresh = true;

      smoother?.paused(true);
      ScrollTrigger.getAll().forEach((t) => t.disable(false));
    };

    const resumeOnVisible = () => {
      if (!smoother) {
        suppressRefresh = false;
        return;
      }

      const y = savedTabScrollRef.current || 0;

      requestAnimationFrame(() => {
        ScrollTrigger.getAll().forEach((t) => t.enable(false));
        ScrollTrigger.refresh();

        requestAnimationFrame(() => {
          setScrollY(y);
          smoother?.paused(false);
          ScrollTrigger.refresh();
          suppressRefresh = false;
        });
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") freezeOnHidden();
      else resumeOnVisible();
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        savedTabScrollRef.current = 0;
        requestAnimationFrame(() => {
          setScrollY(0);
          ScrollTrigger.refresh();
        });
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);

    try {
      smoother = ScrollSmoother.create({
        wrapper,
        content,
        smooth: 1,
        smoothTouch: 0,
        effects: true,
        normalizeScroll: true,
      });

      setupPinning();

      requestAnimationFrame(() => {
        if (window.location.hash) scrollToHashIfPresent();
        else setScrollY(0);

        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
    } catch (err) {
      console.error("[SmoothScroller] ScrollSmoother.create failed", err);
      setupPinning();
      ScrollTrigger.refresh();
      scrollToHashIfPresent();
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);

      ro?.disconnect();
      pinTriggers.forEach((t) => t.kill());
      smoother?.kill();
    };
  }, [pathname, enableSmooth, suppressForLoader, scrollToHashIfPresent]);

  useEffect(() => {
    // If smooth is disabled (mobile) OR loader is suppressing, still honor hash jumps
    if (enableSmooth && !suppressForLoader) return;
    scrollToHashIfPresent();
  }, [pathname, enableSmooth, suppressForLoader, scrollToHashIfPresent]);

  // Keep DOM structure stable; toggle styles only.
  const wrapperStyle: React.CSSProperties =
    suppressForLoader || !enableSmooth ? { height: "auto", overflow: "visible" } : { height: "var(--app-height, 100vh)" };

  const wrapperClass =
    suppressForLoader || !enableSmooth
      ? "relative overflow-visible overflow-x-hidden [overflow-anchor:none]"
      : "relative overflow-hidden overflow-x-hidden [overflow-anchor:none]";

  const contentClass =
    suppressForLoader || !enableSmooth
      ? "min-h-[100vh] [overflow-anchor:none]"
      : "min-h-[var(--app-height,100vh)] will-change-transform [transform:translate3d(0,0,0)] [overflow-anchor:none]";

  return (
    <div id="smooth-wrapper" ref={wrapperRef} className={wrapperClass} style={wrapperStyle}>
      <div id="smooth-content" ref={contentRef} className={contentClass}>
        {children}
      </div>
    </div>
  );
}
