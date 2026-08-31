// components/page-loader-section.tsx
"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { setIntroHandoffPending } from "@/components/header/intro-handoff";

import ImageExplodeLoader from "@/components/effects/image-explode-loader";
import {
  getLeftNavController,
  getMobileNavController,
  getMobileSocialNavController,
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
    usePatheticIntroPreset?: boolean | null;
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
const HOME_LOADER_PENDING_ATTR = "data-home-loader-pending";
const HOME_LOADER_PENDING_EVENT = "home-loader-pending-change";

const LOGO_FLIP_DONE_ATTR = "data-logo-flip-done";
const LOGO_FLIP_EVENT = "logo-flip-done-change";

const HEADER_LOGO_NATIVE_SELECTOR = '[data-header-logo-native="true"]';

const PATHETIC_INTRO_TITLE = "Who controls the Memes controls the Universe";
const PATHETIC_INTRO_SPRITES: SpriteImage[] = [
  { _key: "intro-red-boot", url: "/images/page-loader/red-boot.webp" },
  { _key: "intro-silver-ring", url: "/images/page-loader/silver-ring.webp" },
  { _key: "intro-phone-case", url: "/images/page-loader/phone-case.webp" },
  { _key: "intro-silver-ipod", url: "/images/page-loader/silver-ipod.webp" },
  { _key: "intro-city-bike", url: "/images/page-loader/city-bike.webp" },
  { _key: "intro-coffee-brick", url: "/images/page-loader/coffee-brick.webp" },
  { _key: "intro-flowers", url: "/images/page-loader/flowers.webp" },
];

// Put loader safely above *anything* in header/nav while playing.
const LOADER_Z = 20000;
const LOADER_OVERLAY_Z = 20001;

function setLoaderPlayingFlag(on: boolean) {
  if (typeof document === "undefined") return;

  if (on) document.documentElement.setAttribute(LOADER_FLAG_ATTR, "true");
  else document.documentElement.removeAttribute(LOADER_FLAG_ATTR);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOADER_EVENT, { detail: { on } }));
  }
}

function setHomeLoaderPendingFlag(on: boolean) {
  if (typeof document === "undefined") return;

  if (on) document.documentElement.setAttribute(HOME_LOADER_PENDING_ATTR, "true");
  else document.documentElement.removeAttribute(HOME_LOADER_PENDING_ATTR);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(HOME_LOADER_PENDING_EVENT, { detail: { on } }),
    );
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
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
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
    if (body.dataset.loaderScrollLock === "true") return;
    body.dataset.loaderScrollLock = "true";
    const scrollY = window.scrollY || window.pageYOffset || 0;
    body.dataset.loaderScrollY = `${scrollY}`;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflowY = "scroll";

    html.style.overflowY = "scroll";
    html.style.height = "100%";
  } else {
    if (body.dataset.loaderScrollLock !== "true") return;
    if (body.dataset.loaderScrollLock) delete body.dataset.loaderScrollLock;
    const scrollY = Number.parseInt(body.dataset.loaderScrollY ?? "0", 10) || 0;

    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.overflowY = "";

    html.style.overflowY = "";
    html.style.height = "";

    if (body.dataset.loaderScrollY) delete body.dataset.loaderScrollY;
    window.scrollTo(0, scrollY);
  }
}

function getVisibleHeaderLogoTarget(): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-header-logo-main="true"]'));

  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }

  return els[0] ?? null;
}

export default function PageLoaderSection({ data }: PageLoaderSectionProps) {
  const pathname = usePathname();

  const enabled = !!data.enabled;
  const oncePerSession = !!data.oncePerSession;
  const usePatheticIntroPreset = data.usePatheticIntroPreset !== false;
  const { tagLine, body, links, feature } = data;
  const title = usePatheticIntroPreset ? PATHETIC_INTRO_TITLE : data.title;

  const shouldRender = pathname === "/" && enabled;

  const sprites = useMemo(
    () =>
      usePatheticIntroPreset
        ? PATHETIC_INTRO_SPRITES
        : ((feature?.images || []).filter((i) => i?.url) as SpriteImage[]),
    [feature?.images, usePatheticIntroPreset]
  );

  type LoaderState = "playing" | "skipped";

  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => setHydrated(true), []);

  const [loaderState, setLoaderState] = useState<LoaderState>("skipped");
  const [titleActive, setTitleActive] = useState(false);

  const [explodeReady, setExplodeReady] = useState(false);
  const [pin, setPin] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const logoWrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const loaderTlRef = useRef<gsap.core.Timeline | null>(null);

  const titleMeasureRef = useRef<HTMLDivElement | null>(null);
  const [titleMinH, setTitleMinH] = useState<number | undefined>(undefined);
  const handleExplodeReady = useCallback(() => setExplodeReady(true), []);

  // IMPORTANT: decide "playing vs skipped" in a layout effect to avoid FOUC.
  useLayoutEffect(() => {
    if (!hydrated) return;
    if (!shouldRender) {
      setHomeLoaderPendingFlag(false);
      return;
    }

    const play = shouldPlayLoader(enabled, oncePerSession);

    setHomeLoaderPendingFlag(play);
    setLoaderState(play ? "playing" : "skipped");
    setTitleActive(!play);
    setIntroHandoffPending(play);

    if (play) {
      setLogoFlipDoneFlag(false);
      setPin(true);
      setExplodeReady(false);
    } else {
      setPin(false);
      setExplodeReady(false);
    }
  }, [hydrated, shouldRender, enabled, oncePerSession]);

  useEffect(() => {
    if (!hydrated) return;
    if (!shouldRender) return;
    if (loaderState !== "playing") return;

    getMobileNavController()?.setOpenImmediate(false);
    getMobileSocialNavController()?.setOpenImmediate(false);
  }, [hydrated, shouldRender, loaderState]);

  useEffect(() => {
    return () => {
      setIntroHandoffPending(false);
      setHomeLoaderPendingFlag(false);
    };
  }, []);

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

  // Never let a failed image load or interrupted physics callback leave the
  // document pinned. The first timer advances the normal sequence; the second
  // is a final release valve for any unexpected animation interruption.
  useEffect(() => {
    if (!isPlaying || explodeReady) return;
    const timer = window.setTimeout(() => setExplodeReady(true), 4500);
    return () => window.clearTimeout(timer);
  }, [explodeReady, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      if (oncePerSession) {
        try {
          window.sessionStorage.setItem(SESSION_KEY, "true");
        } catch { }
      }
      setTitleActive(true);
      setIntroHandoffPending(false);
      setHomeLoaderPendingFlag(false);
      setPin(false);
      setLoaderState("skipped");
    }, 8500);

    return () => window.clearTimeout(timer);
  }, [isPlaying, oncePerSession]);

  useEffect(() => {
    if (!hydrated || isPlaying) return;
    if (document.body.dataset.loaderScrollLock === "true") lockScroll(false);
  }, [hydrated, isPlaying]);

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

  // Build the loader timeline ONCE per play.
  useLayoutEffect(() => {
    if (!isPlaying) return;

    const overlayEl = overlayRef.current;
    const logoWrapperEl = logoWrapperRef.current;
    const contentEl = contentRef.current;
    if (!overlayEl || !logoWrapperEl || !contentEl) return;

    const ctx = gsap.context(() => {
      const siteHeader = document.getElementById("site-header-root");

      // Prevent nav overlay/backdrop from covering loader content:
      // push header behind loader while playing.
      const prevHeaderZ = siteHeader?.style.zIndex ?? "";
      const prevHeaderPE = siteHeader?.style.pointerEvents ?? "";
      if (siteHeader) {
        gsap.set(siteHeader, { zIndex: LOADER_Z - 5, pointerEvents: "none", autoAlpha: 1 });
      }

      getLeftNavController()?.setOpenImmediate(false);
      getRightNavController()?.setOpenImmediate(false);
      getSocialNavController()?.setOpenImmediate(false);

      const headerNative = document.querySelector<HTMLElement>(HEADER_LOGO_NATIVE_SELECTOR);
      if (headerNative) gsap.set(headerNative, { autoAlpha: 0 });

      // Hide loader content immediately (layout effect) with GSAP, not React inline styles.
      gsap.set(contentEl, { autoAlpha: 0, y: 16 });

      const btns = gsap.utils.toArray<HTMLElement>(contentEl.querySelectorAll("[data-loader-btn]") ?? []);
      if (btns.length) gsap.set(btns, { scale: 0, transformOrigin: "center center" });

      gsap.set(overlayEl, { autoAlpha: 0 });

      gsap.set(logoWrapperEl, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        transformOrigin: "50% 50%",
        clearProps: "transform",
      });

      const svgEl = logoWrapperEl.querySelector("svg");
      const paths = gsap.utils.toArray<SVGPathElement>(svgEl?.querySelectorAll("path") ?? []);
      if (paths.length) gsap.set(paths, { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onInterrupt: () => {
          if (siteHeader) {
            siteHeader.style.zIndex = prevHeaderZ;
            siteHeader.style.pointerEvents = prevHeaderPE;
          }
        },
      });

      loaderTlRef.current = tl;

      // overlay in
      tl.to(overlayEl, { autoAlpha: 1, duration: 0.2 });

      // WAIT HERE until ImageExplodeLoader signals completion
      tl.addPause("wait-exploder");

      // logo type on
      if (paths.length) {
        tl.to(paths, { autoAlpha: 1, duration: 0.01, stagger: 0.04, ease: "none" });
      }

      // The image burst hands straight into the large mark. Keep only a very
      // short read beat before it travels into the header.
      tl.to({}, { duration: 0.18 });

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

      tl.to({}, { duration: 0.72 });

      tl.add(() => {
        setLogoFlipDoneFlag(true);
        if (headerNative) gsap.set(headerNative, { autoAlpha: 1 });
      });

      tl.add(() => {
        if (siteHeader) {
          siteHeader.style.zIndex = prevHeaderZ;
          siteHeader.style.pointerEvents = prevHeaderPE;
        }

        if (oncePerSession) {
          try {
            window.sessionStorage.setItem(SESSION_KEY, "true");
          } catch { }
        }

        setTitleActive(true);
        setIntroHandoffPending(false);
        setHomeLoaderPendingFlag(false);
        setPin(false);
        setLoaderState("skipped");
      }, "<");
    }, sectionRef);

    return () => {
      loaderTlRef.current = null;
      ctx.revert();
    };
  }, [isPlaying, oncePerSession, title]);

  // Resume timeline when exploder finishes
  useEffect(() => {
    if (!isPlaying) return;
    if (!explodeReady) return;
    loaderTlRef.current?.play();
  }, [isPlaying, explodeReady]);

  if (!shouldRender) return null;

  return (
    <section
      ref={sectionRef}
      id={SECTION_ID}
      className={cn(
        "relative min-h-[100svh] overflow-hidden md:overflow-visible bg-background",
        fixedPinned && "fixed inset-0"
      )}
      style={{
        ...(hydrated ? {} : { visibility: "hidden" }),
        ...(fixedPinned ? { zIndex: LOADER_Z, isolation: "isolate" as any } : {}),
      }}
    >
      {/* Exploder */}
      <div id={EXPLODE_STAGE_ID} className="absolute inset-0 z-0 pointer-events-none" />
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ImageExplodeLoader
          containerId={EXPLODE_STAGE_ID}
          images={sprites as any}
          onAllItemsAnimatedIn={handleExplodeReady}
          appearStaggerEach={0.1}
          appearDuration={0.68}
        />
      </div>

      {/* Content */}
      <div className={cn("relative z-10", fixedPinned ? "absolute inset-0" : "")}>
        <div
          ref={contentRef}
          className={cn(
            fixedPinned
              ? "absolute inset-0 flex items-center justify-center text-center"
              : "min-h-[100svh] flex flex-col justify-center py-20 text-center"
          )}
        >
          {/* hidden measurer */}
          {title && (
            <div className="pointer-events-none opacity-0 absolute left-0 right-0 top-0 -z-10" aria-hidden="true">
              <div
                ref={titleMeasureRef}
                className="relative left-1/2 w-full -translate-x-1/2 lg:w-[min(92vw,80rem)]"
              >
                <TitleText
                  variant="stretched"
                  as="h2"
                  size="xl"
                  align="center"
                  maxChars={34}
                  animation="none"
                  animationSpeed={1.2}
                  textOutline
                  outlineColor="#ffffff"
                  outlineWidth={1.5}
                  outlinePosition="outside"
                  fontWeight="bold"
                  className="[&_h2]:tracking-[-.035em]"
                >
                  {title}
                </TitleText>
              </div>
            </div>
          )}

          <div className="container">
            {tagLine && (
              <h1 className="leading-[0] uppercase italic font-sans">
                <span className="text-base font-semibold opacity-50">{tagLine}</span>
              </h1>
            )}

            {title && (
              <div
                className="relative left-1/2 w-full -translate-x-1/2 lg:w-[min(92vw,80rem)]"
                style={titleMinH ? { minHeight: titleMinH } : undefined}
              >
                {titleActive && (
                  <TitleText
                    variant="stretched"
                    as="h2"
                    size="xl"
                    align="center"
                    maxChars={34}
                    animation="typeOn"
                    animationSpeed={1.2}
                    typeOnTrigger="immediate"
                    textOutline
                    outlineColor="#ffffff"
                    outlineWidth={1.5}
                    outlinePosition="outside"
                    fontWeight="bold"
                    className="[&_h2]:tracking-[-.035em]"
                  >
                    {title}
                  </TitleText>
                )}
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
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ opacity: 0, visibility: "visible", zIndex: LOADER_OVERLAY_Z }}
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
