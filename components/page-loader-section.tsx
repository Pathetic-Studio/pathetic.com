// components/page-loader-section.tsx
"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  memo,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { stegaClean } from "next-sanity";
import { gsap } from "gsap";

import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import TitleText from "@/components/ui/title-text";
import ImageExplode from "@/components/effects/image-explode";
import LogoAnimated from "@/components/logo-animated";
import { cn } from "@/lib/utils";

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
    sectionHeightMobile?: "auto" | "50vw" | "full" | "custom" | null;
    sectionHeightDesktop?: "auto" | "50vw" | "full" | "custom" | null;
    customHeightMobile?: string | null;
    customHeightDesktop?: string | null;
    feature?:
    | {
      type?: string | null;
      images?: SpriteImage[] | null;
    }
    | null;
  };
};

const SECTION_ID = "page-loader-section";
const SESSION_KEY = "pageLoaderPlayed";

function getVisibleHeaderLogo(): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>('[data-header-logo-main="true"]'),
  );

  if (!candidates.length) return null;

  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return el;
    }
  }

  return candidates[0] ?? null;
}

// Memo wrapper so ImageExplode does not re-init when other state (like titleActive)
// updates later in the timeline.
const ExplodeBackground = memo(function ExplodeBackground({
  sprites,
}: {
  sprites: SpriteImage[];
}) {
  if (!sprites.length) return null;
  return <ImageExplode containerId={SECTION_ID} images={sprites as any} />;
});

export default function PageLoaderSection({ data }: PageLoaderSectionProps) {
  const pathname = usePathname();
  const enabled = !!data.enabled;
  const { oncePerSession, tagLine, title, body, links, feature } = data;

  // Home page only and only when enabled
  if (pathname !== "/") return null;
  if (!enabled) return null;

  const sprites = (feature?.images || []).filter((i) => i?.url) as SpriteImage[];

  type LoaderState = "unknown" | "playing" | "skipped";

  const [loaderState, setLoaderState] = useState<LoaderState>("unknown");
  const [showExplode, setShowExplode] = useState(false);
  const [titleActive, setTitleActive] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const logoWrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Decide if loader should play
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) {
      setLoaderState("skipped");
      return;
    }

    if (oncePerSession) {
      const hasPlayed = window.sessionStorage.getItem(SESSION_KEY);
      if (hasPlayed) {
        // Loader already played this session: show explode and skip animation
        setShowExplode(true);
        setLoaderState("skipped");
        setTitleActive(true); // title can type immediately when skipping loader
        return;
      }
    }

    // First time this session: play loader
    setLoaderState("playing");
  }, [enabled, oncePerSession]);

  // Animation: ImageExplode first, then PATHEꓕIC typing, pause, move to header, reveal content + type-on title
  useLayoutEffect(() => {
    if (loaderState !== "playing") return;

    const overlayEl = overlayRef.current;
    const logoWrapperEl = logoWrapperRef.current;

    if (!overlayEl || !logoWrapperEl) return;

    const ctx = gsap.context(() => {
      const headerLogo = getVisibleHeaderLogo();
      const siteHeader = document.getElementById("site-header-root");

      // 1) Hide nav + generic content under the loader
      if (siteHeader) {
        gsap.set(siteHeader, { autoAlpha: 0 });
      }
      if (headerLogo) {
        gsap.set(headerLogo, { opacity: 0 });
      }

      if (contentRef.current) {
        gsap.set(contentRef.current, { autoAlpha: 0, y: 32 });
      }

      // 2) Overlay visible as logo layer
      gsap.set(overlayEl, {
        autoAlpha: 1,
      });

      // 3) Logo wrapper: centered in the section
      gsap.set(logoWrapperEl, {
        x: 0,
        y: 0,
        scale: 1,
        transformOrigin: "50% 50%",
      });

      // 4) PATHEꓕIC letters = <path> inside the SVG
      const svgEl = logoWrapperEl.querySelector("svg");
      const letterNodes =
        (svgEl?.querySelectorAll("path") as NodeListOf<SVGPathElement>) ?? [];

      // Hide letters initially
      gsap.set(letterNodes, { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          if (typeof window !== "undefined" && oncePerSession) {
            window.sessionStorage.setItem(SESSION_KEY, "true");
          }
        },
      });

      // 4.1) Trigger ImageExplode first (only once; memo wrapper prevents re-init on later state updates)
      tl.call(() => {
        setShowExplode(true);
      });

      // 4.2) Small delay so the explode visibly kicks in before logo typing
      tl.to({}, { duration: 0.3 });

      // 4.3) PATHEꓕIC typing-on (instant per letter, staggered)
      tl.to(letterNodes, {
        autoAlpha: 1,
        duration: 0,
        stagger: 0.05,
        ease: "none",
      });

      // 4.4) Hold big logo in the middle
      tl.to({}, { duration: 0.9 });

      // 5) Move logo into header logo position
      tl.to(logoWrapperEl, {
        duration: 0.8,
        ease: "power3.inOut",
        x: () => {
          const headerLogoEl = getVisibleHeaderLogo();
          const src = logoWrapperRef.current;
          if (!headerLogoEl || !src) return 0;

          const srcRect = src.getBoundingClientRect();
          const destRect = headerLogoEl.getBoundingClientRect();

          const srcCx = srcRect.left + srcRect.width / 2;
          const destCx = destRect.left + destRect.width / 2;

          return destCx - srcCx;
        },
        y: () => {
          const headerLogoEl = getVisibleHeaderLogo();
          const src = logoWrapperRef.current;
          if (!headerLogoEl || !src) return 0;

          const srcRect = src.getBoundingClientRect();
          const destRect = headerLogoEl.getBoundingClientRect();

          const srcCy = srcRect.top + srcRect.height / 2;
          const destCy = destRect.top + destRect.height / 2;

          return destCy - srcCy;
        },
        scale: () => {
          const headerLogoEl = getVisibleHeaderLogo();
          const src = logoWrapperRef.current;
          if (!headerLogoEl || !src) return 0.35;

          const srcRect = src.getBoundingClientRect();
          const destRect = headerLogoEl.getBoundingClientRect();

          if (!srcRect.width) return 0.35;
          return destRect.width / srcRect.width;
        },
      });

      // 6) Fade out overlay + fade in actual header
      tl.to(
        overlayEl,
        {
          autoAlpha: 0,
          duration: 0.4,
          ease: "power2.out",
        },
        "-=0.5",
      );

      if (headerLogo) {
        tl.to(
          headerLogo,
          { opacity: 1, duration: 0.4, ease: "power2.out" },
          "-=0.35",
        );
      }

      if (siteHeader) {
        tl.to(
          siteHeader,
          { autoAlpha: 1, duration: 0.5, ease: "power2.out" },
          "-=0.35",
        );
      }

      // 7) Fade in content, and trigger title type-on via state in the same phase
      tl.add(() => {
        setTitleActive(true);
      }, "-=0.35");

      if (contentRef.current) {
        tl.to(
          contentRef.current,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.3",
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [loaderState, oncePerSession]);

  return (
    <section
      ref={sectionRef}
      id={SECTION_ID}
      className="relative min-h-[100dvh] overflow-hidden md:overflow-visible bg-background"
    >
      {/* Background ImageExplode: mounted once via memoized wrapper so title type-on doesn't re-init it */}
      {showExplode && <ExplodeBackground sprites={sprites} />}

      {/* Foreground hero content (hidden by default while loader runs/decides) */}
      <div className="container relative z-10 min-h-[100dvh]">
        <div
          ref={contentRef}
          className={cn(
            "min-h-[100dvh] flex flex-col justify-center py-20 lg:pt-40 text-center",
            loaderState !== "skipped" && "opacity-0 translate-y-8",
          )}
        >
          {tagLine && (
            <h1 className="leading-[0] uppercase italic font-sans">
              <span className="text-base font-semibold opacity-50">
                {tagLine}
              </span>
            </h1>
          )}

          {title && (
            <TitleText
              variant="stretched"
              as="h2"
              stretchScaleX={0.55}
              overallScale={1.5}
              align="center"
              maxChars={32}
              animation={titleActive ? "typeOn" : "none"}
              animationSpeed={1.2}
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
                  key={link._key ?? link.title}
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

      {/* Transparent overlay with big typing logo centered in the section */}
      {loaderState === "playing" && (
        <div
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 z-[9999] flex items-center justify-center"
        >
          <div
            ref={logoWrapperRef}
            className="flex items-center justify-center will-change-transform"
          >
            <LogoAnimated className="w-[min(80vw,720px)] text-black dark:text-foreground" />
          </div>
        </div>
      )}
    </section>
  );
}
