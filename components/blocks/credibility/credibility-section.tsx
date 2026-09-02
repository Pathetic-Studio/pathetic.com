"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stegaClean } from "next-sanity";
import type { ColorVariant, PAGE_QUERYResult } from "@/sanity.types";
import TitleText from "@/components/ui/title-text";
import { TYPE_ON_SPEEDS } from "@/components/ui/type-on-text";
import { BackgroundPanel } from "@/components/ui/background-panel";
import { getSectionSurfaceClass } from "@/components/blocks/shared/section-surface";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type CredibilityBlock = Extract<PageBlock, { _type: "credibility-section" }>;
type CredibilityLogo = NonNullable<CredibilityBlock["leftLogos"]>[number];

const CREDIBILITY_HEADLINE =
  "FROM STARTUPS\nDISRUPTING\nINCUMBENTS\nTO\nCATEGORY LEADERS\nDISRUPTING\nTHEMSELVES.";

function resolveCredibilityHeadline(value?: string | null) {
  const cleanValue = value ? stegaClean(value).trim() : "";
  const isLegacyHeadline =
    /from startups/i.test(cleanValue) &&
    /(big guys|not to get disrupted|trying to disrupt)/i.test(cleanValue);

  return !cleanValue || isLegacyHeadline ? CREDIBILITY_HEADLINE : cleanValue;
}

function getLogoCoordinate(index: number, total: number, direction: 1 | -1) {
  const progress = total <= 1 ? 0.5 : (index + 0.5) / total;
  const y = 1 - progress * 2;
  const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
  const angle = index * 2.399963 * direction + 0.35;

  return {
    x: Math.cos(angle) * ringRadius,
    y,
    z: Math.sin(angle) * ringRadius,
  };
}

function LogoBlob({
  logos,
  side,
}: {
  logos?: CredibilityLogo[] | null;
  side: "left" | "right";
}) {
  const validLogos = (logos ?? []).filter((logo) => logo.asset?.url);
  const direction = side === "left" ? 1 : -1;

  return (
    <div
      data-credibility-blob={side}
      data-direction={direction}
      className={cn(
        "absolute inset-x-[5%] h-[11rem] [perspective:850px] sm:inset-x-[8%] sm:h-[13rem] lg:inset-x-auto lg:top-1/2 lg:h-[min(23vw,320px)] lg:w-[min(23vw,320px)] lg:-translate-y-1/2",
        side === "left"
          ? "top-[2.5rem] lg:left-[4vw] lg:top-1/2 xl:left-[6vw]"
          : "bottom-[2.5rem] lg:bottom-auto lg:right-[4vw] lg:top-1/2 xl:right-[6vw]",
      )}
    >
      <div className="absolute inset-0 [transform-style:preserve-3d]">
        {validLogos.map((logo, index) => {
          const coordinate = getLogoCoordinate(
            index,
            validLogos.length,
            direction,
          );

          return (
            <div
              key={logo._key}
              data-credibility-logo-position
              data-sphere-x={coordinate.x}
              data-sphere-y={coordinate.y}
              data-sphere-z={coordinate.z}
              className="absolute left-1/2 top-1/2 h-[clamp(2.6rem,8vw,4.5rem)] w-[clamp(2.6rem,8vw,4.5rem)] transform-gpu will-change-transform lg:h-[clamp(2rem,3.8vw,4rem)] lg:w-[clamp(2rem,3.8vw,4rem)]"
            >
              <div
                data-credibility-logo
                data-logo-index={index}
                className="relative h-full w-full will-change-transform"
                style={{ transform: "scale(0)" }}
              >
                <Image
                  src={logo.asset!.url!}
                  alt={logo.alt || ""}
                  fill
                  sizes="(min-width: 1024px) 72px, 44px"
                  className="object-contain"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CredibilitySection(props: CredibilityBlock) {
  const {
    _key,
    anchor,
    padding,
    colorVariant,
    background,
    displayTextStyle,
    title,
    leftLogos,
    rightLogos,
    rotationDuration,
  } = props;
  const rootRef = useRef<HTMLElement | null>(null);

  const cleanColor = (stegaClean(colorVariant) || "background") as ColorVariant;
  const cleanAnchor = stegaClean(anchor?.anchorId) || undefined;
  const duration = Math.min(90, Math.max(10, rotationDuration || 32));
  const resolvedTitle = resolveCredibilityHeadline(title);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let removeTicker: (() => void) | undefined;
    const context = gsap.context(() => {
      const logoItems = gsap.utils.toArray<HTMLElement>(
        "[data-credibility-logo]",
        root,
      );
      const blobs = gsap.utils.toArray<HTMLElement>(
        "[data-credibility-blob]",
        root,
      );
      const arrowPaths = gsap.utils.toArray<SVGPathElement>(
        "[data-credibility-arrow-path]",
        root,
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const startedAt = performance.now();

      const updateSpheres = () => {
        const elapsed = reduceMotion
          ? 0
          : (performance.now() - startedAt) / 1000;

        blobs.forEach((blob) => {
          const direction = Number(blob.dataset.direction || 1);
          const angle = elapsed * ((Math.PI * 2) / duration) * direction;
          const cosine = Math.cos(angle);
          const sine = Math.sin(angle);
          const touchLayout = window.innerWidth < 1024;
          const radiusX = touchLayout
            ? blob.clientWidth * 0.39
            : Math.min(blob.clientWidth, blob.clientHeight) * 0.36;
          const radiusY = touchLayout
            ? blob.clientHeight * 0.28
            : Math.min(blob.clientWidth, blob.clientHeight) * 0.36;
          const radiusZ = Math.min(blob.clientWidth, blob.clientHeight) * 0.36;
          const positions = gsap.utils.toArray<HTMLElement>(
            "[data-credibility-logo-position]",
            blob,
          );

          positions.forEach((position) => {
            const baseX = Number(position.dataset.sphereX || 0);
            const baseY = Number(position.dataset.sphereY || 0);
            const baseZ = Number(position.dataset.sphereZ || 0);
            const x = baseX * cosine + baseZ * sine;
            const z = -baseX * sine + baseZ * cosine;
            const depth = (z + 1) / 2;

            gsap.set(position, {
              xPercent: -50,
              yPercent: -50,
              x: x * radiusX,
              y: baseY * radiusY,
              z: z * radiusZ * 0.75,
              scale: 0.72 + depth * 0.34,
              opacity: 0.46 + depth * 0.54,
              zIndex: Math.round(10 + depth * 30),
              rotation: 0,
              rotationX: 0,
              rotationY: 0,
              force3D: true,
            });
          });
        });
      };

      updateSpheres();

      if (!reduceMotion) {
        gsap.ticker.add(updateSpheres);
        removeTicker = () => gsap.ticker.remove(updateSpheres);
      }

      if (reduceMotion) {
        gsap.set(logoItems, { autoAlpha: 1, scale: 1 });
        gsap.set(arrowPaths, { strokeDashoffset: 0 });
      } else {
        gsap.set(logoItems, {
          autoAlpha: 1,
          scale: 0,
          transformOrigin: "50% 50%",
        });
        if (arrowPaths.length) {
          gsap.set(arrowPaths, {
            strokeDasharray: 1,
            strokeDashoffset: 1,
          });
        }

        const entrance = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top 82%",
            once: true,
          },
        });

        if (arrowPaths.length) {
          entrance.to(
            arrowPaths,
            {
              strokeDashoffset: 0,
              duration: 0.34,
              ease: "power3.out",
            },
            0.14,
          );
        }

        entrance.to(
          logoItems,
          {
            scale: 1,
            duration: 0.42,
            stagger: { each: 0.035, from: "random" },
            ease: "back.out(1.85)",
            overwrite: "auto",
          },
          0.22,
        );
      }
    }, root);

    return () => {
      removeTicker?.();
      context.revert();
    };
  }, [duration]);

  return (
    <section
      ref={rootRef}
      id={cleanAnchor || `_credibility-${_key}`}
      data-typeon-trigger="true"
      className={cn(
        "relative isolate overflow-hidden",
        getSectionSurfaceClass(cleanColor),
        padding?.top ? "pt-16 xl:pt-20" : undefined,
        padding?.bottom ? "pb-16 xl:pb-20" : undefined,
      )}
    >
      <BackgroundPanel background={background} />

      <div className="relative mx-auto flex min-h-[790px] max-w-[1800px] flex-col items-center justify-center px-5 py-16 sm:min-h-[840px] sm:px-8 lg:h-[clamp(560px,43vw,680px)] lg:min-h-0 lg:px-8 lg:py-10">
        <svg
          data-credibility-arrow
          aria-hidden="true"
          viewBox="0 0 40 1000"
          preserveAspectRatio="none"
          className="pointer-events-none absolute left-1/2 top-[24%] z-20 h-[52%] w-8 -translate-x-1/2 overflow-visible text-foreground lg:hidden"
        >
          <path
            data-credibility-arrow-path
            pathLength="1"
            d="M20 20V980M20 20L8 34M20 20L32 34M20 980L8 966M20 980L32 966"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <svg
          data-credibility-arrow
          aria-hidden="true"
          viewBox="0 0 1000 40"
          preserveAspectRatio="none"
          className="pointer-events-none absolute left-[29%] top-1/2 z-20 hidden h-8 w-[46%] -translate-y-1/2 overflow-visible text-foreground lg:block"
        >
          <path
            data-credibility-arrow-path
            pathLength="1"
            d="M20 20H980M20 20L34 8M20 20L34 32M980 20L966 8M980 20L966 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="relative z-30 mx-auto w-full max-w-[22rem] text-center sm:max-w-[28rem] lg:max-w-[960px]">
          {resolvedTitle && (
            <TitleText
              variant="stretched"
              as="h2"
              size="display-compact"
              align="center"
              maxChars={22}
              animation="typeOn"
              animationSpeed={TYPE_ON_SPEEDS.rapid}
              typeOnStart="top 82%"
              typeOnDelay={0}
              className="whitespace-pre-line [text-wrap:wrap]"
              textColor={displayTextStyle?.fillColor?.hex || undefined}
              textOutline={Boolean(displayTextStyle?.outline)}
              outlineColor={displayTextStyle?.outlineColor?.hex || undefined}
              outlineWidth={displayTextStyle?.outlineWidth ?? undefined}
              outlinePosition={displayTextStyle?.outlinePosition ?? undefined}
              fontWeight={displayTextStyle?.fontWeight ?? undefined}
            >
              {resolvedTitle}
            </TitleText>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 lg:contents">
          <LogoBlob logos={leftLogos} side="left" />
          <LogoBlob logos={rightLogos} side="right" />
        </div>
      </div>
    </section>
  );
}
