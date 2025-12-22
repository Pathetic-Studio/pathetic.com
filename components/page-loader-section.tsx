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
      linkType?:
      | "internal"
      | "external"
      | "contact"
      | "anchor-link"
      | null;
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
  if (navType === "navigate" || navType === "reload" || navType === "prerender")
    return true;

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

function estimateTitleTypeDuration(text?: string | null) {
  const t = (text ?? "").trim();
  if (!t) return 0.6;
  return Math.max(0.8, Math.min(2.0, 0.8 + t.length * 0.045));
}

export default function PageLoaderSection({ data }: PageLoaderSectionProps) {
  const pathname = usePathname();

  const enabled = !!data.enabled;
  const oncePerSession = !!data.oncePerSession;
  const { tagLine, title, body, links, feature } = data;

  const shouldRender = pathname === "/" && enabled;

  const sprites = useMemo(
    () => ((feature?.images || []).filter((i) => i?.url) as SpriteImage[]),
    [feature?.images]
  );

  type LoaderState = "playing" | "skipped";

  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => setHydrated(true), []);

  const [loaderState, setLoaderState] = useState<LoaderState>("skipped");
  const [titleActive, setTitleActive] = useState(false);

  // Keep section pinned while we animate, so the hero cannot be affected by header layout changes.
  const [pin, setPin] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!shouldRender) return;

    const play = shouldPlayLoader(enabled, oncePerSession);
    setLoaderState(play ? "playing" : "skipped");
    setTitleActive(!play);

    if (play) {
      setLogoFlipDoneFlag(false);
      setPin(true);
    } else {
      setPin(false);
    }
  }, [hydrated, shouldRender, enabled, oncePerSession]);

  const sectionRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const logoWrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Reserve final TitleText height to avoid TitleText-specific shifts
  const titleMeasureRef = useRef<HTMLDivElement | null>(null);
  const [titleMinH, setTitleMinH] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (!hydrated) return;
    if (!shouldRender) return;
    if (!title) return;

    const el = titleMeasureRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const h = Math.ceil(r.height);
      if (h > 0) setTitleMinH(h);
    };

    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      ro.observe(el);
      return () => ro?.disconnect();
    }

    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [hydrated, shouldRender, title]);

  const isPlaying = hydrated && shouldRender && loaderState === "playing";
  const fixedPinned = hydrated && shouldRender && (isPlaying || pin);

  // While pinned, we keep the loader-playing flag ON so nav components can read it and avoid doing anything layout-y.
  useLayoutEffect(() => {
    if (!hydrated) return;
    setLoaderPlayingFlag(fixedPinned);
    return () => setLoaderPlayingFlag(false);
  }, [hydrated, fixedPinned]);

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
      setPin(false);
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

      if (siteHeader) gsap.set(siteHeader, { autoAlpha: 1, pointerEvents: "none" });

      const headerNative = document.querySelector<HTMLElement>(HEADER_LOGO_NATIVE_SELECTOR);
      if (headerNative) gsap.set(headerNative, { autoAlpha: 0 });

      if (contentRef.current) gsap.set(contentRef.current, { autoAlpha: 0, y: 16 });

      gsap.set(overlayEl, { autoAlpha: 0 });

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
      tl.to(overlayEl, { autoAlpha: 1, duration: 0.2 });

      // delay logo type-on by 1s
      tl.to({}, { duration: 1.0 });

      // logo type on
      if (paths.length) {
        tl.to(paths, { autoAlpha: 1, duration: 0.01, stagger: 0.04, ease: "none" });
      }

      tl.to({}, { duration: 0.7 });

      // move logo to header
      tl.add(() => {
        const target = getVisibleHeaderLogoTarget();
        if (!target) return;
        const tr = target.getBoundingClientRect();
        if (tr.width <= 0 || tr.height <= 0) return;

        const state = Flip.getState(logoWrapperEl);
        Flip.fit(logoWrapperEl, target, { absolute: true, scale: true });

        Flip.from(state, {
          duration: 0.8,
          ease: "power3.inOut",
          absolute: true,
          scale: true,
        });
      });

      tl.to({}, { duration: 0.8 });

      tl.add(() => {
        setLogoFlipDoneFlag(true);
        if (headerNative) gsap.set(headerNative, { autoAlpha: 1 });
      });

      if (siteHeader) tl.to(siteHeader, { pointerEvents: "auto", duration: 0 }, "<");

      // content in
      tl.add(() => setTitleActive(true), "<");
      if (contentRef.current) tl.to(contentRef.current, { autoAlpha: 1, y: 0, duration: 0.5 }, "<");

      // wait for title typing
      tl.to({}, { duration: titleTypeDur });

      // open nav + socials now (loader stays pinned + content is absolute inset-0 so it can't be pushed)
      tl.add(() => {
        void left?.open();
        void right?.open();
        void socials?.open();
      });

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

      // settle then unpin/unmount
      tl.to({}, { duration: 0.25 });
      tl.add(() => {
        setPin(false);
        setLoaderState("skipped");
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [isPlaying, oncePerSession, title]);

  if (!shouldRender) return null;

  return (
    <section
      ref={sectionRef}
      id={SECTION_ID}
      className={cn(
        "relative min-h-[100svh] overflow-hidden md:overflow-visible bg-background",
        fixedPinned && "fixed inset-0 z-[9998]"
      )}
      style={!hydrated ? { visibility: "hidden" } : undefined}
    >
      {/* Exploder */}
      <div id={EXPLODE_STAGE_ID} className="absolute inset-0 z-0 pointer-events-none" />
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ImageExplodeLoader containerId={EXPLODE_STAGE_ID} images={sprites as any} />
      </div>

      {/* While pinned: absolute inset-0 so nothing outside can push it */}
      <div
        className={cn(
          "relative z-10",
          fixedPinned ? "absolute inset-0" : "container min-h-[100svh]"
        )}
      >
        <div
          ref={contentRef}
          className={cn(
            fixedPinned
              ? "absolute inset-0 flex items-center justify-center text-center px-4"
              : "min-h-[100svh] flex flex-col justify-center py-20 text-center",
            !hydrated && "opacity-0"
          )}
        >
          {/* hidden measurer */}
          {title && (
            <div className="pointer-events-none opacity-0 absolute left-0 right-0 top-0 -z-10" aria-hidden="true">
              <div ref={titleMeasureRef} className="mx-auto">
                <TitleText
                  variant="stretched"
                  as="h2"
                  size="xl"
                  align="center"
                  maxChars={26}
                  animation="none"
                  animationSpeed={1.2}
                  textOutline
                >
                  {title}
                </TitleText>
              </div>
            </div>
          )}

          {/* Inner width constraint */}
          <div className={cn(fixedPinned ? "container" : "")}>
            {tagLine && (
              <h1 className="leading-[0] uppercase italic font-sans">
                <span className="text-base font-semibold opacity-50">{tagLine}</span>
              </h1>
            )}

            {title && (
              <div className="mx-auto w-full" style={titleMinH ? { minHeight: titleMinH } : undefined}>
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
              </div>
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
      </div>

      {/* Overlay logo */}
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
