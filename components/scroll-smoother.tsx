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
const INITIAL_HASH_PENDING_ATTR = "data-initial-hash-pending";
const INITIAL_HASH_READY_ATTR = "data-initial-hash-ready";
const INITIAL_HASH_READY_EVENT = "initial-hash-ready";

function setInitialHashReady(ready: boolean) {
  if (typeof document === "undefined") return;

  if (ready) {
    document.documentElement.setAttribute(INITIAL_HASH_READY_ATTR, "true");
  } else {
    document.documentElement.removeAttribute(INITIAL_HASH_READY_ATTR);
    document.documentElement.setAttribute(INITIAL_HASH_PENDING_ATTR, "true");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INITIAL_HASH_READY_EVENT, { detail: { ready } }));
  }
}

export default function SmoothScroller({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useViewportVars();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const savedTabScrollRef = useRef<number>(0);
  const isFirstPathMountRef = useRef(true);

  // NEW: we always run ScrollSmoother (so pins can share the same scroller on mobile),
  // but we disable smoothing on touch via smoothTouch: 0 and near-zero smooth on < lg.
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

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

  // Detect device breakpoints + touch
  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = () => {
      const touch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;

      const desktop = window.matchMedia("(min-width: 1024px)").matches;

      setIsTouch(touch);
      setIsDesktop(desktop);
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
          smoother.scrollTo(y, false);
        } else {
          try {
            target.scrollIntoView({ behavior: "auto", block: "start" });
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

  const stabilizeHashIfPresent = useCallback((durationMs = 900) => {
    if (typeof window === "undefined") return () => { };

    const hash = window.location.hash;
    if (!hash || hash === "#") return () => { };

    setInitialHashReady(false);

    let cancelled = false;
    let rafId = 0;
    let steadyFrames = 0;
    let startedAt = performance.now();

    const align = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return false;

      const target = document.getElementById(id);
      if (!target) return false;

      const rectTop = target.getBoundingClientRect().top;
      if (Math.abs(rectTop) <= 1) return true;

      const smoother = ScrollSmoother.get();
      if (smoother) {
        const current = smoother.scrollTop();
        smoother.scrollTo(current + rectTop, false);
      } else {
        window.scrollTo(0, window.scrollY + rectTop);
      }

      return false;
    };

    const tick = () => {
      if (cancelled) return;
      rafId = 0;

      const aligned = align();
      steadyFrames = aligned ? steadyFrames + 1 : 0;

      const elapsed = performance.now() - startedAt;
      if (elapsed < durationMs || steadyFrames < 4) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      try {
        ScrollTrigger.refresh();
      } catch { }

      setInitialHashReady(true);
    };

    rafId = requestAnimationFrame(tick);

    const fonts = (document as any).fonts;
    const fontReady =
      fonts?.ready?.then?.(() => {
        if (cancelled) return;
        startedAt = performance.now();
        steadyFrames = 0;
        if (!rafId) rafId = requestAnimationFrame(tick);
      }) ?? null;

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      void fontReady;
    };
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

      wrapper.setAttribute("data-smooth-active", "false");
      gsap.set(content, { clearProps: "transform" });

      try {
        ScrollTrigger.refresh();
      } catch { }

      return;
    }

    // Reduced motion: kill smoother and use native scroll
    if (prefersReduced) {
      try {
        ScrollSmoother.get()?.kill();
      } catch { }

      wrapper.setAttribute("data-smooth-active", "false");
      gsap.set(content, { clearProps: "transform" });
      return;
    }

    // IMPORTANT: we keep smoother ON for mobile/tablet too.
    // Desktop: smooth = 1
    // Mobile/tablet: smooth ~= 0 (no smoothing), but still uses the smoother scroller/wrapper.
    const smooth = isDesktop && !isTouch ? 1 : 0.001; // near-native
    const smoothTouch = 0; // NO smoothing on touch

    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch { }

    ScrollTrigger.config({
      autoRefreshEvents: "DOMContentLoaded,load,resize",
      ignoreMobileResize: true,
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
    let cleanupHashStabilizer: (() => void) | null = null;

    const pinTriggers: ScrollTrigger[] = [];
    let ro: ResizeObserver | null = null;

    let suppressRefresh = false;

    const getScrollY = () => {
      if (smoother) return smoother.scrollTop();
      return (
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        0
      );
    };

    const setScrollY = (y: number) => {
      if (smoother) smoother.scrollTo(y, false);
      else window.scrollTo(0, y);
    };

    const parsePinDurationToPx = (raw: string | null, section: HTMLElement) => {
      const natural =
        Math.max(section.scrollHeight, section.offsetHeight) ||
        window.innerHeight;

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

    // Keep existing desktop-only attribute pinning logic unchanged
    const setupPinning = () => {
      pinTriggers.forEach((t) => t.kill());
      pinTriggers.length = 0;

      ro?.disconnect();
      ro = null;

      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      if (!desktop) return;

      const pinnedSections =
        gsap.utils.toArray<HTMLElement>('[data-pin-to-viewport="true"]');
      pinnedSections.forEach((el) => (el.style.overflowAnchor = "none"));

      ro = new ResizeObserver(() => {
        if (suppressRefresh) return;
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
      pinnedSections.forEach((el) => {
        if (el.getAttribute("data-pin-resize-refresh") !== "false") {
          ro?.observe(el);
        }
      });

      pinnedSections.forEach((section) => {
        const startAttr = section.getAttribute("data-pin-start");
        const startValue =
          startAttr && startAttr.trim() !== "" ? startAttr : "top top";

        const pinSpacingAttr = section.getAttribute("data-pin-spacing");
        const pinSpacing =
          pinSpacingAttr === "false"
            ? false
            : pinSpacingAttr === "true"
              ? true
              : true;

        const pinTarget =
          section.querySelector<HTMLElement>('[data-pin-target="true"]') ||
          section;

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
    };

    const resumeOnVisible = () => {
      if (!smoother) {
        suppressRefresh = false;
        return;
      }

      const y = savedTabScrollRef.current || 0;

      requestAnimationFrame(() => {
        // Restore scroll first, then resume smoother.
        setScrollY(y);
        smoother?.paused(false);
        // Keep triggers in sync without forcing a full refresh that can shift scroll.
        ScrollTrigger.update();
        suppressRefresh = false;
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
        smooth,
        smoothTouch,
        effects: true,
        normalizeScroll: true,
      });

      wrapper.setAttribute("data-smooth-active", "true");

      setupPinning();

      requestAnimationFrame(() => {
        const hasHash = !!window.location.hash;
        const nativeHashScrollY =
          window.scrollY ||
          window.pageYOffset ||
          document.documentElement.scrollTop ||
          0;
        const skipInitialHashSync =
          isFirstPathMountRef.current && hasHash && nativeHashScrollY > 0;

        if (hasHash) {
          if (!skipInitialHashSync) scrollToHashIfPresent();
          if (isFirstPathMountRef.current) {
            cleanupHashStabilizer = stabilizeHashIfPresent();
          }
        } else {
          setInitialHashReady(true);
          setScrollY(0);
        }

        isFirstPathMountRef.current = false;

        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
    } catch (err) {
      console.error("[SmoothScroller] ScrollSmoother.create failed", err);

      wrapper.setAttribute("data-smooth-active", "false");

      setupPinning();
      ScrollTrigger.refresh();
      scrollToHashIfPresent();
      cleanupHashStabilizer = stabilizeHashIfPresent();
    }

    return () => {
      cleanupHashStabilizer?.();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);

      ro?.disconnect();
      pinTriggers.forEach((t) => t.kill());
      smoother?.kill();

      wrapper.setAttribute("data-smooth-active", "false");
    };
  }, [pathname, isDesktop, isTouch, suppressForLoader, scrollToHashIfPresent, stabilizeHashIfPresent]);

  // Keep DOM structure stable; toggle styles only.
  // With smoother always on (unless loader/reduced), wrapper is always the scroll container.
  const wrapperStyle: React.CSSProperties =
    suppressForLoader ? { height: "auto", overflow: "visible" } : { height: "var(--app-height, 100vh)" };

  const wrapperClass =
    suppressForLoader
      ? "relative overflow-visible overflow-x-hidden [overflow-anchor:none]"
      : "relative overflow-hidden overflow-x-hidden [overflow-anchor:none]";

  const contentClass =
    suppressForLoader
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
