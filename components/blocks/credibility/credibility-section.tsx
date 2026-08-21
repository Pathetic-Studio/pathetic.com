"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stegaClean } from "next-sanity";
import type { ColorVariant, PAGE_QUERYResult } from "@/sanity.types";
import TitleText from "@/components/ui/title-text";
import { BackgroundPanel } from "@/components/ui/background-panel";
import { getSectionSurfaceClass } from "@/components/blocks/shared/section-surface";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type CredibilityBlock = Extract<PageBlock, { _type: "credibility-section" }>;
type CredibilityLogo = NonNullable<CredibilityBlock["leftLogos"]>[number];

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
        "relative h-[210px] w-full [perspective:850px] sm:h-[240px] lg:absolute lg:top-1/2 lg:h-[min(23vw,320px)] lg:w-[min(23vw,320px)] lg:-translate-y-1/2",
        side === "left"
          ? "lg:left-[4vw] xl:left-[6vw]"
          : "lg:right-[4vw] xl:right-[6vw]",
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
              className="absolute left-1/2 top-1/2 h-[clamp(2rem,3.8vw,4rem)] w-[clamp(2rem,3.8vw,4rem)] transform-gpu will-change-transform"
            >
              <div
                data-credibility-logo
                data-logo-index={index}
                className="relative h-full w-full will-change-transform"
              >
                <Image
                  src={logo.asset!.url!}
                  alt={logo.alt || ""}
                  fill
                  sizes="(min-width: 1024px) 72px, 44px"
                  className="object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.16)]"
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
          const radius = Math.min(blob.clientWidth, blob.clientHeight) * 0.36;
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
              x: x * radius,
              y: baseY * radius,
              z: z * radius * 0.75,
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

      if (logoItems.length) {
        gsap.fromTo(
          logoItems,
          { autoAlpha: 0, scale: 0.2 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.9,
            stagger: { each: 0.05, from: "random" },
            ease: "back.out(1.6)",
            scrollTrigger: {
              trigger: root,
              start: "top 72%",
              once: true,
            },
            immediateRender: false,
          },
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
      className={cn(
        "relative isolate overflow-hidden",
        getSectionSurfaceClass(cleanColor),
        padding?.top ? "pt-16 xl:pt-20" : undefined,
        padding?.bottom ? "pb-16 xl:pb-20" : undefined,
      )}
    >
      <BackgroundPanel background={background} />

      <div className="relative mx-auto flex min-h-[780px] max-w-[1800px] flex-col items-center justify-center px-8 py-16 md:min-h-[680px] lg:h-[clamp(560px,43vw,680px)] lg:min-h-0 lg:px-8 lg:py-10">
        <svg
          aria-hidden="true"
          viewBox="0 0 1000 40"
          preserveAspectRatio="none"
          className="pointer-events-none absolute left-[10%] top-[58%] z-20 h-8 w-[80%] -translate-y-1/2 overflow-visible text-foreground lg:left-[29%] lg:top-1/2 lg:w-[46%]"
        >
          <path
            d="M20 20H980M20 20L34 8M20 20L34 32M980 20L966 8M980 20L966 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="relative z-30 mx-auto w-full max-w-[960px] text-center">
          {title && (
            <TitleText
              variant="stretched"
              as="h2"
              size="display-compact"
              align="center"
              maxChars={22}
              animation="none"
              className="whitespace-pre-line [text-wrap:wrap]"
              textColor={displayTextStyle?.fillColor?.hex || undefined}
              textOutline={Boolean(displayTextStyle?.outline)}
              outlineColor={displayTextStyle?.outlineColor?.hex || undefined}
              outlineWidth={displayTextStyle?.outlineWidth ?? undefined}
              outlinePosition={displayTextStyle?.outlinePosition ?? undefined}
              fontWeight={displayTextStyle?.fontWeight ?? undefined}
            >
              {stegaClean(title)}
            </TitleText>
          )}
        </div>

        <div className="relative z-10 mt-12 grid w-full grid-cols-2 gap-2 lg:contents">
          <LogoBlob logos={leftLogos} side="left" />
          <LogoBlob logos={rightLogos} side="right" />
        </div>
      </div>
    </section>
  );
}
