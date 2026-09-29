// components/layout/transition-shell.tsx
"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  TransitionRouter,
  useTransitionRouter,
  useTransitionState,
} from "next-transition-router";
import gsap from "gsap";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import ScrollSmoother from "gsap/ScrollSmoother";
import ScrollTrigger from "gsap/ScrollTrigger";
import {
  prepareCaseStudyTransition,
  hasCaseStudyTransition,
  leaveCaseStudy,
  enterCaseStudy,
  cancelCaseStudyTransition,
} from "@/components/case-study/case-study-transition";
import {
  leaveForCaseIndex,
  enterCaseIndex,
  clearCaseIndexTransition,
} from "@/components/case-study/case-study-index-transition";

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
const INITIAL_HASH_PENDING_ATTR = "data-initial-hash-pending";
const INITIAL_HASH_READY_ATTR = "data-initial-hash-ready";
const INITIAL_HASH_READY_EVENT = "initial-hash-ready";

function markClientNav() {
  try {
    window.__APP_CAME_VIA_CLIENT_NAV__ = true;
  } catch {}
}

function isLoaderPlayingNow() {
  if (typeof document === "undefined") return false;
  return document.documentElement.hasAttribute(LOADER_FLAG_ATTR);
}

function teleportToAnchor(anchorId: string, offsetPercent?: number | null) {
  const target = document.getElementById(anchorId);
  if (!target) return;

  const offsetPx =
    typeof offsetPercent === "number"
      ? (offsetPercent / 100) * window.innerHeight
      : parseFloat(getComputedStyle(target).scrollMarginTop) || 0;

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
    ScrollTrigger.update();
  } catch {}
}

/** Finish pin layout and place the incoming page before its first visible frame. */
function enterAtScrollPosition(
  page: HTMLElement,
  next: () => void,
  anchorId?: string,
) {
  let frame = 0;
  let tween: gsap.core.Tween | undefined;
  let cancelled = false;
  let previousTop = Number.NaN;
  let previousHeight = 0;
  let stableFrames = 0;
  let restoredScroll: number | undefined;
  let positioned = false;
  const started = performance.now();
  const align = () => {
    if (anchorId) teleportToAnchor(anchorId);
    else if (restoredScroll !== undefined) {
      const smoother = ScrollSmoother.get();
      if (smoother) smoother.scrollTop(restoredScroll);
      else window.scrollTo(0, restoredScroll);
    }
    ScrollTrigger.update();
  };
  const onRefresh = () => {
    // ScrollSmoother's resize observer also refreshes after 200ms. Keep its
    // restored transform in sync through the fade, before the browser paints.
    if (positioned && !cancelled) align();
  };
  ScrollTrigger.addEventListener("refresh", onRefresh);
  const reveal = () => {
    tween = gsap.to(page, {
      opacity: 1,
      duration: 0.22,
      ease: "none",
      onComplete: () => {
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        next();
      },
    });
  };
  const place = () => {
    if (cancelled) return;
    const target = anchorId ? document.getElementById(anchorId) : null;
    const content = document.getElementById("smooth-content");
    const wrapper = document.getElementById("smooth-wrapper");
    if (wrapper) wrapper.scrollTop = 0;
    if (target || !anchorId) {
      const smoother = ScrollSmoother.get();
      restoredScroll ??= smoother?.scrollTop() ?? window.scrollY;
      const height = content?.scrollHeight ?? document.body.scrollHeight;
      const top = target
        ? target.getBoundingClientRect().top +
          (smoother?.scrollTop() ?? window.scrollY)
        : restoredScroll;
      const unchanged =
        Math.abs(top - previousTop) < 1 && height === previousHeight;
      stableFrames = unchanged ? stableFrames + 1 : 0;
      if (!unchanged) ScrollTrigger.refresh();
      align();
      positioned = true;
      // Scrubbed parallax should start at the destination too, instead of
      // catching up from the previous route during the incoming fade.
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.scrub && trigger.vars.id !== "ScrollSmoother") {
          const scrub = trigger.getTween();
          if (scrub) scrub.progress(1);
        }
      });
      previousTop = target
        ? target.getBoundingClientRect().top +
          (ScrollSmoother.get()?.scrollTop() ?? window.scrollY)
        : restoredScroll;
      previousHeight = content?.scrollHeight ?? document.body.scrollHeight;
    }
    // A short, bounded settle also handles streamed content and native mobile
    // scrolling. Once revealed, stop correcting so the user can scroll freely.
    if (stableFrames >= 3 || performance.now() - started >= 600) reveal();
    else frame = requestAnimationFrame(place);
  };
  // Let the destination's layout effects and scheduled pin refresh run first.
  frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(place);
  });
  return () => {
    cancelled = true;
    ScrollTrigger.removeEventListener("refresh", onRefresh);
    cancelAnimationFrame(frame);
    tween?.kill();
  };
}

// Capture cross-page Next links before next/link handles their click. The
// router's automatic bubbling listener cannot transition an already handled Link.
function NavigationLinks() {
  const router = useTransitionRouter();
  const { stage } = useTransitionState();
  const prefetched = useRef(new Map<string, number>());
  useEffect(() => {
    const resolve = (event: Event) => {
      const target = event.target;
      const link =
        target instanceof Element
          ? target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !link ||
        link.closest("[data-transition-ignore]") ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self") ||
        link.rel.split(/\s+/).includes("external")
      )
        return;
      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname === window.location.pathname
      )
        return;
      return `${url.pathname}${url.search}${url.hash}`;
    };
    const prefetch = (href: string) => {
      const route = href.split("#")[0];
      if (Date.now() - (prefetched.current.get(route) ?? 0) < 30_000) return;
      prefetched.current.set(route, Date.now());
      // Explicit intent fetches the complete dynamic route, including its data.
      router.prefetch(route, {
        kind: PrefetchKind.FULL,
        onInvalidate: () => {
          prefetched.current.delete(route);
        },
      });
    };
    const onIntent = (event: Event) => {
      const href = resolve(event);
      if (href) prefetch(href);
    };
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element).closest<HTMLAnchorElement>(
        "a[data-case-project-anchor]",
      );
      if (anchor) {
        const id = decodeURIComponent(new URL(anchor.href).hash.slice(1));
        const target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        // Native fragment scrolling moves the overflow-hidden smoother wrapper
        // itself. Keep that wrapper at zero and scroll its actual controller.
        const wrapper = document.getElementById("smooth-wrapper");
        if (wrapper) wrapper.scrollTop = 0;
        window.history.replaceState(window.history.state, "", anchor.href);
        const margin =
          parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const smoother = ScrollSmoother.get();
        if (smoother)
          smoother.scrollTo(smoother.offset(target, "top top") - margin, true);
        else
          window.scrollTo({
            top: scrollY + target.getBoundingClientRect().top - margin,
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
          });
        return;
      }
      const href = resolve(event);
      if (!href) return;
      event.preventDefault();
      if (stage !== "none" || hasCaseStudyTransition()) return;
      prefetch(href);
      const link = (event.target as Element).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (link) prepareCaseStudyTransition(link);
      router.push(href, { scroll: !href.includes("#") });
    };
    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("focusin", onIntent);
      document.removeEventListener("click", onClick, true);
    };
  }, [router, stage]);
  return null;
}

export default function TransitionShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const currentPathRef = useRef(pathname);
  currentPathRef.current = pathname;
  const historyRevealPendingRef = useRef(false);

  useEffect(() => {
    const onHistoryNavigate = () => {
      if (window.location.pathname === currentPathRef.current) return;
      const page = pageRef.current;
      if (!page) return;
      markClientNav();
      historyRevealPendingRef.current = true;
      cancelCaseStudyTransition();
      clearCaseIndexTransition();
      gsap.killTweensOf(page);
      gsap.set(page, { opacity: 0 });
    };
    // Browser Back bypasses TransitionRouter's leave/enter callbacks. Hide its
    // incoming page until SmoothScroller restores the saved history position.
    window.addEventListener("popstate", onHistoryNavigate, true);
    return () =>
      window.removeEventListener("popstate", onHistoryNavigate, true);
  }, []);

  useLayoutEffect(() => {
    if (!historyRevealPendingRef.current || !pageRef.current) return;
    historyRevealPendingRef.current = false;
    return enterAtScrollPosition(pageRef.current, () => {});
  }, [pathname]);
  useEffect(
    () => () => {
      cancelCaseStudyTransition();
      clearCaseIndexTransition();
    },
    [],
  );

  const anchorTlRef = useRef<gsap.core.Timeline | null>(null);
  const initialHashRevealPendingRef = useRef(
    typeof document !== "undefined" &&
      document.documentElement.hasAttribute(INITIAL_HASH_PENDING_ATTR),
  );

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    if (!initialHashRevealPendingRef.current) return;

    let timeoutId: number | null = null;

    const reveal = () => {
      if (!initialHashRevealPendingRef.current) return;

      initialHashRevealPendingRef.current = false;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }

      gsap.killTweensOf(el);
      document.documentElement.removeAttribute(INITIAL_HASH_PENDING_ATTR);
      gsap.set(el, { opacity: 0 });
      gsap.to(el, {
        opacity: 1,
        duration: 0.55,
        ease: "none",
        overwrite: "auto",
      });
    };

    if (document.documentElement.hasAttribute(INITIAL_HASH_READY_ATTR)) {
      reveal();
      return;
    }

    const onReady = (ev: Event) => {
      const e = ev as CustomEvent<{ ready?: boolean }>;
      if (e.detail?.ready === false) return;
      reveal();
    };

    window.addEventListener(INITIAL_HASH_READY_EVENT, onReady as EventListener);

    timeoutId = window.setTimeout(() => {
      reveal();
    }, 1800);

    return () => {
      window.removeEventListener(
        INITIAL_HASH_READY_EVENT,
        onReady as EventListener,
      );
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

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
      if (!anchorId || !document.getElementById(anchorId)) return;

      // anchor navigation counts as client navigation
      markClientNav();

      gsap.killTweensOf(el);
      anchorTlRef.current?.kill();
      anchorTlRef.current = null;

      gsap.set(el, { opacity: 1 });

      const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? 0.08
        : 0.18;

      const tl = gsap.timeline({
        defaults: { ease: "none", overwrite: "auto" },
      });

      tl.to(el, { opacity: 0, duration });

      tl.add(() => {
        try {
          const nextHref = href ?? `/#${anchorId}`;
          window.history.replaceState(window.history.state, "", nextHref);
        } catch {}

        teleportToAnchor(anchorId, offsetPercent);
      });

      tl.to(el, { opacity: 1, duration: duration + 0.04 });

      anchorTlRef.current = tl;
    };

    window.addEventListener(
      "app:anchor-navigate",
      onAnchorNavigate as EventListener,
    );
    return () => {
      window.removeEventListener(
        "app:anchor-navigate",
        onAnchorNavigate as EventListener,
      );
      anchorTlRef.current?.kill();
      anchorTlRef.current = null;
    };
  }, []);

  return (
    <TransitionRouter
      leave={(next, _from, to) => {
        window.dispatchEvent(new Event("app:page-leave"));
        // any page transition = client nav
        markClientNav();

        const el = pageRef.current;
        if (!el) return next();

        anchorTlRef.current?.kill();
        anchorTlRef.current = null;

        gsap.killTweensOf(el);

        if (to && new URL(to, window.location.href).pathname === "/case-study")
          return leaveForCaseIndex(el, next);

        const caseLeave = leaveCaseStudy(el, next);
        if (caseLeave) return caseLeave;

        const tween = gsap.to(el, {
          opacity: 0,
          duration: 0.16,
          ease: "none",
          onComplete: next,
        });
        return () => tween.kill();
      }}
      enter={(next) => {
        const el = pageRef.current;
        if (!el) return next();

        anchorTlRef.current?.kill();
        anchorTlRef.current = null;

        gsap.killTweensOf(el);

        // If loader is active, do NOT run enter fade-in.
        if (isLoaderPlayingNow()) {
          cancelCaseStudyTransition();
          gsap.set(el, { opacity: 1 });
          return next();
        }

        gsap.set(el, { opacity: 0 });
        const wrapper = document.getElementById("smooth-wrapper");
        if (wrapper) wrapper.scrollTop = 0;

        if (!window.location.hash) {
          const smoother = ScrollSmoother.get();
          if (smoother) smoother.scrollTop(0);
          else window.scrollTo(0, 0);
        }

        const caseEnter = enterCaseStudy(el, next);
        if (caseEnter) return caseEnter;

        const indexEnter = enterCaseIndex(el, next);
        if (indexEnter) return indexEnter;

        if (window.location.hash) {
          try {
            return enterAtScrollPosition(
              el,
              next,
              decodeURIComponent(window.location.hash.slice(1)),
            );
          } catch {
            // An invalid URL fragment should still allow the page to enter.
          }
        }

        const tween = gsap.to(el, {
          opacity: 1,
          duration: 0.22,
          ease: "none",
          onComplete: next,
        });
        return () => tween.kill();
      }}
    >
      <NavigationLinks />
      <div id="page-transition-root" ref={pageRef}>
        {children}
      </div>
    </TransitionRouter>
  );
}
