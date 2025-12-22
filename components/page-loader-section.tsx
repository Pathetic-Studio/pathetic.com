// components/page-loader-section.tsx
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { stegaClean } from "next-sanity";
import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import Flip from "gsap/Flip";

import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import TitleText from "@/components/ui/title-text";
import LogoAnimated from "@/components/logo-animated";
import { cn } from "@/lib/utils";

import ImageExplodeLoader from "@/components/effects/image-explode-loader";
import {
  getLeftNavController,
  getRightNavController,
  getSocialNavController,
} from "@/components/header/nav-anim-registry";

gsap.registerPlugin(ScrollSmoother, Flip);

type SpriteImage = {
  _key?: string;
  url?: string | null;
};

type PageLoaderSectionProps = {
  data: {
    enabled?: boolean | null;
    oncePerSession?: boolean | null;
    tagLine?: string | null;
    title?: string | null;
    body?: any;
    links?:
    | {
      _key?: string;
      title?: string | null;
      href?: string | null;
      target?: boolean | null;
      buttonVariant?: string | null;
      linkType?: "internal" | "external" | "contact" | "anchor-link" | null;
    }[]
    | null;
    feature?:
    | {
      type?: string | null;
      images?: SpriteImage[] | null;
    }
    | null;
  };
};

const SECTION_ID = "page-loader-section";
const EXPLODE_STAGE_ID = "page-explode-stage";
const SESSION_KEY = "pageLoaderPlayed";

const LOADER_FLAG_ATTR = "data-loader-playing";
const LOADER_EVENT = "loader-playing-change";

const LOGO_FLIP_DONE_ATTR = "data-logo-flip-done";
const LOGO_FLIP_EVENT = "logo-flip-done-change";

const HEADER_LOGO_NATIVE_SELECTOR = '[data-header-logo-native="true"]';

function setLoaderPlayingFlag(on: boolean) {
  if (typeof document === "undefined") return;

  if (on) document.documentElement.setAttribute(LOADER_FLAG_ATTR, "true");
  else document.documentElement.removeAttribute(LOADER_FLAG_ATTR);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOADER_EVENT, { detail: { on } }));
  }
}

function setLogoFlipDoneFlag(on: boolean) {
  if (typeof document === "undefined") return;

  if (on) document.documentElement.setAttribute(LOGO_FLIP_DONE_ATTR, "true");
  else document.documentElement.removeAttribute(LOGO_FLIP_DONE_ATTR);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOGO_FLIP_EVENT, { detail: { on } }));
  }
}

declare global {
  interface Window {
    __APP_CAME_VIA_CLIENT_NAV__?: boolean;
  }
}

function getNavType(): PerformanceNavigationTiming["type"] | null {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    return (nav?.type ?? null) as any;
  } catch {
    return null;
  }
}

function shouldPlayLoader(enabled: boolean, oncePerSession: boolean): boolean {
  if (typeof window === "undefined") return false;
  if (!enabled) return false;

  if (window.location.hash) return false;
  if (window.__APP_CAME_VIA_CLIENT_NAV__) return false;

  if (oncePerSession) {
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return false;
    } catch { }
    return true;
  }

  const navType = getNavType();
  if (navType === "back_forward") return false;
  if (navType === "navigate" || navType === "reload" || navType === "prerender") return true;

  return true;
}

function lockScroll(lock: boolean) {
  const body = document.body;
  const html = document.documentElement;

  if (lock) {
    body.dataset.loaderScrollLock = "true";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";
  } else {
    if (body.dataset.loaderScrollLock) delete body.dataset.loaderScrollLock;
    body.style.overflow = "";
    body.style.height = "";
    html.style.overflow = "";
    html.style.height = "";
  }
}

/**
 * DesktopNav is hidden below xl, so its logo may not exist at all.
 * This finds *any* header logo (desktop or mobile) that is actually visible (non-zero bounds).
 *
 * You MUST ensure your mobile header logo uses data-header-logo-main="true" too.
 */
function getVisibleHeaderLogoTarget(): HTMLElement | null {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>('[data-header-logo-main="true"]')
  );

  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }

  return els[0] ?? null;
}

// Rough estimate for how long TitleText's type-on takes so we can sync nav+buttons after it.
// Keep conservative so nav/buttons don’t jump early.
function estimateTitleTypeDuration(text?: string | null) {
  const t = (text ?? "").trim();
  if (!t) return 0.6;
  // base + per-char, clamped
  return Math.max(0.8, Math.min(2.0, 0.8 + t.length * 0.045));
}

export default function PageLoaderSection({ data }: PageLoaderSectionProps) {
  const pathname = usePathname();

  const enabled = !!data.enabled;
  const oncePerSession = !!data.oncePerSession;
  const { tagLine, title, body, links, feature } = data;

  // IMPORTANT: keep hooks unconditional; never early-return above this point
  const shouldRender = pathname === "/" && enabled;

  const sprites = useMemo(
    () => ((feature?.images || []).filter((i) => i?.url) as SpriteImage[]),
    [feature?.images]
  );

  type LoaderState = "playing" | "skipped";

  // useLayoutEffect hydration gate = avoids 1-frame “wrong initial state” paint
  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => setHydrated(true), []);

  const [loaderState, setLoaderState] = useState<LoaderState>("skipped");
  const [titleActive, setTitleActive] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!shouldRender) return;

    const play = shouldPlayLoader(enabled, oncePerSession);
    setLoaderState(play ? "playing" : "skipped");
    setTitleActive(!play);

    if (play) setLogoFlipDoneFlag(false);
  }, [hydrated, shouldRender, enabled, oncePerSession]);

  const sectionRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const logoWrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const isPlaying = hydrated && shouldRender && loaderState === "playing";

  // IMPORTANT: useLayoutEffect so the html attr is correct before paint on state changes.
  useLayoutEffect(() => {
    if (!hydrated) return;
    setLoaderPlayingFlag(isPlaying);
    return () => setLoaderPlayingFlag(false);
  }, [hydrated, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    lockScroll(true);

    const smoother = ScrollSmoother.get();
    const wasPaused = smoother ? (smoother as any).paused?.() : false;

    try {
      if (smoother && (smoother as any).paused) (smoother as any).paused(true);
    } catch { }

    return () => {
      try {
        if (smoother && (smoother as any).paused) (smoother as any).paused(!!wasPaused);
      } catch { }
      lockScroll(false);
      setLogoFlipDoneFlag(false);
    };
  }, [isPlaying]);

  useLayoutEffect(() => {
    if (!isPlaying) return;

    const overlayEl = overlayRef.current;
    const logoWrapperEl = logoWrapperRef.current;
    if (!overlayEl || !logoWrapperEl) return;

    const ctx = gsap.context(() => {
      const siteHeader = document.getElementById("site-header-root");

      const left = getLeftNavController();
      const right = getRightNavController();
      const socials = getSocialNavController();

      // Force nav closed before anything paints.
      left?.setOpenImmediate(false);
      right?.setOpenImmediate(false);
      socials?.setOpenImmediate(false);

      // Header must be laid out so logo bounds exist.
      // Keep it visible, but non-interactive during loader.
      if (siteHeader) gsap.set(siteHeader, { autoAlpha: 1, pointerEvents: "none" });

      // Hide native header logo until our overlay logo "arrives"
      const headerNative = document.querySelector<HTMLElement>(HEADER_LOGO_NATIVE_SELECTOR);
      if (headerNative) gsap.set(headerNative, { autoAlpha: 0 });

      if (contentRef.current) gsap.set(contentRef.current, { autoAlpha: 0, y: 32 });

      // overlay starts hidden, then fades in
      gsap.set(overlayEl, { autoAlpha: 0 });

      // Reset overlay logo transform baseline
      gsap.set(logoWrapperEl, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        transformOrigin: "50% 50%",
        clearProps: "transform",
      });

      const btns = gsap.utils.toArray<HTMLElement>(
        contentRef.current?.querySelectorAll("[data-loader-btn]") ?? []
      );
      if (btns.length) gsap.set(btns, { scale: 0, transformOrigin: "center center" });

      // "type on": reveal svg paths
      const svgEl = logoWrapperEl.querySelector("svg");
      const paths = gsap.utils.toArray<SVGPathElement>(svgEl?.querySelectorAll("path") ?? []);
      if (paths.length) gsap.set(paths, { autoAlpha: 0 });

      const titleTypeDur = estimateTitleTypeDuration(title);

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          if (oncePerSession) {
            try {
              window.sessionStorage.setItem(SESSION_KEY, "true");
            } catch { }
          }
        },
      });

      // overlay in
      tl.to(overlayEl, { autoAlpha: 1, duration: 0.2, ease: "power2.out" });

      // type on (logo)
      if (paths.length) {
        tl.to(paths, {
          autoAlpha: 1,
          duration: 0.01,
          stagger: 0.04,
          ease: "none",
        });
      }

      // PAUSE after logo animates on (your request)
      tl.to({}, { duration: 0.7 });

      // ===== MOVE LOGO TO HEADER =====
      tl.add(() => {
        const target = getVisibleHeaderLogoTarget();
        if (!target) return;

        const tr = target.getBoundingClientRect();
        if (tr.width <= 0 || tr.height <= 0) return;

        const state = Flip.getState(logoWrapperEl);

        Flip.fit(logoWrapperEl, target, { absolute: true, scale: true });

        const tween = Flip.from(state, {
          duration: 0.8,
          ease: "power3.inOut",
          absolute: true,
          scale: true,
        });

        // Fallback if Flip returns null (rare)
        if (!tween) {
          const sr = logoWrapperEl.getBoundingClientRect();
          const dx = tr.left + tr.width / 2 - (sr.left + sr.width / 2);
          const dy = tr.top + tr.height / 2 - (sr.top + sr.height / 2);
          const sc = sr.width ? tr.width / sr.width : 0.35;

          gsap.to(logoWrapperEl, {
            duration: 0.8,
            ease: "power3.inOut",
            x: `+=${dx}`,
            y: `+=${dy}`,
            scale: sc,
          });
        }
      });

      // keep timeline time aligned with move duration
      tl.to({}, { duration: 0.8 });

      // Arrived: reveal native header logo (and mark flip done)
      tl.add(() => {
        setLogoFlipDoneFlag(true);
        if (headerNative) gsap.set(headerNative, { autoAlpha: 1 });
      });

      // Re-enable header interactions immediately after arrival
      if (siteHeader) tl.to(siteHeader, { pointerEvents: "auto", duration: 0 }, "<");

      // Start title typing + content in FIRST
      tl.add(() => setTitleActive(true), "<");

      if (contentRef.current) {
        tl.to(contentRef.current, { autoAlpha: 1, y: 0, duration: 0.6 }, "<");
      }

      // Wait for the title to finish typing, then bring nav + buttons together (your request)
      tl.to({}, { duration: titleTypeDur });

      tl.add(() => {
        void left?.open();
        void right?.open();
        void socials?.open();
      }, "<");

      if (btns.length) {
        tl.to(
          btns,
          {
            scale: 1,
            duration: 0.8,
            ease: "elastic.out(1, 1)",
            stagger: { each: 0.06, from: "start" },
            clearProps: "transform",
          },
          "<"
        );
      }

      tl.add(() => setLoaderState("skipped"), "<");
    }, sectionRef);

    return () => ctx.revert();
  }, [isPlaying, oncePerSession, title]);

  // The only return guard is here, after hooks.
  if (!shouldRender) return null;

  return (
    <section
      ref={sectionRef}
      id={SECTION_ID}
      className={cn(
        "relative min-h-[100svh] overflow-hidden md:overflow-visible bg-background",
        isPlaying && "fixed inset-0 z-[9998]"
      )}
      style={!hydrated ? { visibility: "hidden" } : undefined}
    >
      {/* Exploder always-on, scoped to this section */}
      <div id={EXPLODE_STAGE_ID} className="absolute inset-0 z-0 pointer-events-none" />
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ImageExplodeLoader containerId={EXPLODE_STAGE_ID} images={sprites as any} />
      </div>

      <div className="container relative z-10 min-h-[100svh]">
        <div
          ref={contentRef}
          className={cn(
            "min-h-[100svh] flex flex-col justify-center py-20 text-center",
            isPlaying && "opacity-0 translate-y-8",
            !hydrated && "opacity-0"
          )}
        >
          {tagLine && (
            <h1 className="leading-[0] uppercase italic font-sans">
              <span className="text-base font-semibold opacity-50">{tagLine}</span>
            </h1>
          )}

          {title && (
            <TitleText
              variant="stretched"
              as="h2"
              size="xl"
              align="center"
              maxChars={26}
              animation={titleActive ? "typeOn" : "none"}
              animationSpeed={1.2}
              textOutline
            >
              {title}
            </TitleText>
          )}

          {body && (
            <div className="text-lg lg:text-2xl mt-6 max-w-2xl mx-auto">
              <PortableTextRenderer value={body} />
            </div>
          )}

          {links && links.length > 0 && (
            <div className="z-10 mt-10 flex flex-wrap gap-4 justify-center">
              {links.map((link) => (
                <Button
                  key={link._key ?? link.title ?? ""}
                  data-loader-btn
                  link={link}
                  variant={stegaClean((link.buttonVariant as any) ?? "default") as any}
                  size="lg"
                  style={isPlaying ? { transform: "scale(0)" } : undefined}
                >
                  {link.title}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isPlaying && (
        <div
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 z-[9999] flex items-center justify-center"
          style={{ opacity: 0, visibility: "visible" }}
          aria-hidden="true"
        >
          <div
            ref={logoWrapperRef}
            className="flex items-center justify-center will-change-transform"
            style={{ opacity: 1, visibility: "visible" }}
          >
            <LogoAnimated className="w-[min(80vw,720px)] text-black dark:text-foreground" />
          </div>
        </div>
      )}
    </section>
  );
}
