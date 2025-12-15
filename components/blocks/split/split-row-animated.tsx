// components/blocks/split/split-row-animated.tsx
"use client";

import type React from "react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult, type ColorVariant } from "@/sanity.types";
import SplitContent from "./split-content";
import SplitCardsListAnimated from "./split-cards-list-animated";
import SplitImage from "./split-image";
import SplitImageAnimate from "./split-image-animate";
import SplitInfoList from "./split-info-list";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSectionId } from "@/lib/section-id";
import TitleText from "@/components/ui/title-text";

gsap.registerPlugin(ScrollTrigger);

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRowAnimated = Extract<Block, { _type: "split-row-animated" }>;
type SplitColumnAnimated = NonNullable<
  NonNullable<SplitRowAnimated["splitColumns"]>[number]
>;

const componentMap: {
  [K in Exclude<
    SplitColumnAnimated["_type"],
    "split-cards-list-animated" | "split-image-animate"
  >]: React.ComponentType<Extract<SplitColumnAnimated, { _type: K }>>;
} = {
  "split-content": SplitContent,
  "split-image": SplitImage,
  "split-info-list": SplitInfoList,
};

const introPaddingClasses: Record<
  NonNullable<SplitRowAnimated["introPadding"]>,
  string
> = {
  none: "pt-0",
  sm: "pt-8",
  md: "pt-12",
  lg: "pt-20",
};

// total pin distance; card triggers at 0 / 1/3 / 2/3 of this
const PIN_DISTANCE_VH = 300;

// manual nav offset for pin
const NAV_HEIGHT = 80;

// imageStage mapping (for SplitImageAnimate):
// 0 = off-screen / not entered
// 1 = base image only
// 2 = Effect 1
// 3 = Effect 2
// 4 = Effect 3

export default function SplitRowAnimated({
  _key,
  anchor,
  padding,
  colorVariant,
  noGap,
  splitColumns,
  // Intro content
  tagLine,
  title,
  body,
  links,
  introPadding,
  animateText,
  stickyIntro,
}: SplitRowAnimated) {
  const cleanedColor = stegaClean(colorVariant);
  const color = (cleanedColor ?? undefined) as ColorVariant | undefined;

  const sectionId = getSectionId(
    "split-row-animated",
    _key,
    anchor?.anchorId ?? null,
  );

  const safeLinks = links ?? [];
  const introHasContent =
    !!tagLine || !!title || !!body || safeLinks.length > 0;

  const introPaddingClass =
    introPaddingClasses[
    (introPadding || "md") as keyof typeof introPaddingClasses
    ];

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  // start with -1 so nothing is active until the pin starts
  const [activeCardIndex, setActiveCardIndex] = useState<number>(-1);
  const [imageStage, setImageStage] = useState<number>(0);

  // last scroll "stage" we applied (-1, 0, 1, 2)
  const lastStageRef = useRef<number>(-1);

  let containerStyle: CSSProperties | undefined;
  if (typeof anchor?.defaultOffsetPercent === "number") {
    containerStyle = {} as CSSProperties;
    (containerStyle as any)["--section-anchor-offset"] =
      String(anchor.defaultOffsetPercent);
  }

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const gridEl = gridRef.current;
    const imageEl = imageRef.current;
    const cardsContainer = cardsRef.current;

    if (!sectionEl) return;

    lastStageRef.current = -1;

    const ctx = gsap.context(() => {
      const cardsEls = cardsContainer
        ? Array.from(
          cardsContainer.querySelectorAll<HTMLElement>("[data-card-item]"),
        )
        : [];

      const hasAnimatedCards =
        splitColumns?.some(
          (column) =>
            column._type === "split-cards-list-animated" &&
            (column as any).animateInRight,
        ) ?? false;

      // oval container inside the image
      const ovalEl = imageEl
        ? (imageEl.querySelector("[data-oval-container]") as
          | HTMLElement
          | null)
        : null;

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: "(min-width: 1024px)",
          isMobile: "(max-width: 1023.98px)",
        },
        (context) => {
          const { isDesktop, isMobile } = context.conditions as {
            isDesktop: boolean;
            isMobile: boolean;
          };

          // NO CARDS: simple image reveal on scroll (both desktop + mobile)
          if (!cardsEls.length) {
            if (imageEl) {
              gsap.fromTo(
                imageEl,
                { autoAlpha: 0, y: 30 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.8,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: imageEl,
                    start: isDesktop ? "top 75%" : "top 85%",
                    toggleActions: "play none none none",
                  },
                },
              );
            }
            return;
          }

          // DESKTOP: pin whole grid and drive cards + imageStage by stages
          if (isDesktop) {
            if (!gridEl) return;

            const animateDiagonal = hasAnimatedCards;

            const enterCard = (index: number) => {
              const el = cardsEls[index];
              if (!el) return;

              const xOffset = animateDiagonal ? 32 * index : 0;
              const yOffset = animateDiagonal ? -24 * index : 0;

              gsap.fromTo(
                el,
                {
                  autoAlpha: 0,
                  x: xOffset + 120,
                  y: yOffset,
                },
                {
                  autoAlpha: 1,
                  x: xOffset,
                  y: yOffset,
                  duration: 0.6,
                  ease: "power3.out",
                },
              );
            };

            const exitCard = (index: number) => {
              const el = cardsEls[index];
              if (!el) return;

              const xOffset = animateDiagonal ? 32 * index : 0;
              const yOffset = animateDiagonal ? -24 * index : 0;

              gsap.to(el, {
                autoAlpha: 0,
                x: xOffset + 120,
                y: yOffset,
                duration: 0.4,
                ease: "power3.inOut",
              });
            };

            // initial card state: hidden, shifted right + diagonal
            cardsEls.forEach((el, index) => {
              const xOffset = animateDiagonal ? 32 * index : 0;
              const yOffset = animateDiagonal ? -24 * index : 0;

              gsap.set(el, {
                autoAlpha: 0,
                x: xOffset + 120,
                y: yOffset,
                zIndex: 10 + index,
                xPercent: 0,
                yPercent: 0,
              });
            });

            // initial oval: smaller
            if (ovalEl) {
              gsap.set(ovalEl, {
                scale: 0.9,
                transformOrigin: "50% 50%",
              });
            }

            // DESKTOP: image + FIRST CARD fade/slide in together, independent of pin
            if (imageEl) {
              gsap.set(imageEl, {
                autoAlpha: 0,
                y: 40,
              });

              ScrollTrigger.create({
                trigger: gridEl, // or imageEl if you prefer
                start: "top 80%", // tweak for earlier/later fade
                toggleActions: "play none none none",
                onEnter: () => {
                  // image in
                  gsap.to(imageEl, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out",
                  });

                  // first card in sync with image
                  if (cardsEls.length > 0) {
                    enterCard(0);
                    setActiveCardIndex(0);
                    setImageStage(2); // first effect
                  }
                },
              });
            }

            const applyStageChange = (
              prevStage: number,
              nextStage: number,
            ) => {
              if (prevStage === nextStage) return;

              // IMAGE IS NO LONGER CONTROLLED HERE – separate trigger handles fade-in

              // cards: only animate those that actually change
              if (nextStage > prevStage) {
                // going down
                for (
                  let i = Math.max(0, prevStage + 1);
                  i <= nextStage;
                  i++
                ) {
                  enterCard(i);
                }
              } else if (nextStage < prevStage) {
                // going up
                for (let i = prevStage; i > nextStage; i--) {
                  if (i >= 0) exitCard(i);
                }
              }

              // oval scale per stage (-1 = small, 0/1/2 = stepped up)
              if (ovalEl) {
                let targetScale = 0.9;
                if (nextStage === 0) targetScale = 1.0;
                else if (nextStage === 1) targetScale = 1.08;
                else if (nextStage >= 2) targetScale = 1.16;

                gsap.to(ovalEl, {
                  scale: targetScale,
                  duration: 0.8,
                  ease: "power3.out",
                });
              }

              // drive React state for active card + imageStage
              if (nextStage >= 0) {
                const clampedStage = Math.max(
                  0,
                  Math.min(nextStage, cardsEls.length - 1),
                );
                setActiveCardIndex(clampedStage);
                setImageStage(2 + clampedStage); // 2,3,4 for effects
              } else {
                setActiveCardIndex(-1);
                setImageStage(0);
              }
            };

            const pinDistancePx =
              (PIN_DISTANCE_VH / 100) * window.innerHeight;

            // convert 80px to percent for both axes
            const offsetXPx = 80;
            const offsetYPx = 80;
            const offsetXPercent = (offsetXPx / window.innerWidth) * 100;
            const offsetYPercent = (offsetYPx / window.innerHeight) * 100;

            ScrollTrigger.create({
              trigger: gridEl,
              // pin when grid center hits center minus nav height
              start: `center-=${NAV_HEIGHT} center`,
              end: `+=${pinDistancePx}`,
              pin: gridEl,
              pinSpacing: true,
              onUpdate: (self) => {
                const progress = self.progress; // 0 -> 1

                // stage logic
                let stage = -1;
                if (progress > 0 && progress < 1 / 3) {
                  stage = 0;
                } else if (progress >= 1 / 3 && progress < 2 / 3) {
                  stage = 1;
                } else if (progress >= 2 / 3) {
                  stage = 2;
                }

                if (stage !== lastStageRef.current) {
                  const prev = lastStageRef.current;
                  lastStageRef.current = stage;
                  applyStageChange(prev, stage);
                }

                // PER-CARD SCROLL OFFSET:
                // Each card, from its activation point to end of pin,
                // moves left 20px and up 20px linearly.
                cardsEls.forEach((el, index) => {
                  // card activation windows:
                  // card0: 0 -> 1
                  // card1: 1/3 -> 1
                  // card2: 2/3 -> 1
                  const startP =
                    index === 0 ? 0 : index === 1 ? 1 / 3 : 2 / 3;
                  const endP = 1;

                  if (progress <= startP) {
                    // not active in its window yet
                    gsap.set(el, { xPercent: 0, yPercent: 0 });
                    return;
                  }

                  const local =
                    (progress - startP) / (endP - startP || 1); // 0..1
                  const clamped = Math.max(0, Math.min(local, 1));

                  // move from 0 → -offsetXPercent and 0 → -offsetYPercent
                  const xPct = gsap.utils.interpolate(
                    0,
                    -offsetXPercent,
                    clamped,
                  );
                  const yPct = gsap.utils.interpolate(
                    0,
                    -offsetYPercent,
                    clamped,
                  );

                  gsap.set(el, {
                    xPercent: xPct,
                    yPercent: yPct,
                  });
                });
              },
            });

            return;
          }

          // MOBILE/TABLET: simple fade-in, no pin, no staging
          if (isMobile) {
            // make sure the image is actually visible on mobile
            if (imageEl) {
              gsap.fromTo(
                imageEl,
                { autoAlpha: 0, y: 30 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.6,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: imageEl,
                    start: "top 85%",
                    toggleActions: "play none none none",
                  },
                },
              );
            }

            cardsEls.forEach((el, index) => {
              gsap.fromTo(
                el,
                { autoAlpha: 0, y: 30 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: "power2.out",
                  scrollTrigger: {
                    trigger: el,
                    start: "top 90%",
                    toggleActions: "play none none none",
                  },
                },
              );
            });

            if (cardsEls.length > 0) {
              setActiveCardIndex(0);
              setImageStage(2); // first effect
            }
          }
        },
      );
    }, sectionEl);

    return () => {
      ctx.revert();
    };
  }, [splitColumns]);

  return (
    <SectionContainer
      id={sectionId}
      color={color}
      padding={padding}
      data-section-anchor-id={anchor?.anchorId || undefined}
      style={containerStyle}
    >
      <div ref={sectionRef} className="relative bg-background overflow-visible">
        {introHasContent && (
          <div
            className={cn(
              "text-center pt-8 lg:pt-20 pb-10",
              introPaddingClass,
              stickyIntro &&
              "lg:sticky lg:top-20 z-20 bg-background/80 backdrop-blur",
            )}
          >
            <div className="max-w-8xl mx-auto">
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
                  size="xl"
                  align="center"
                  maxChars={32}
                  animation={animateText ? "typeOn" : "none"}
                  animationSpeed={1.2}
                >
                  {title}
                </TitleText>
              )}

              {body && (
                <div className="text-lg mt-6 max-w-2xl mx-auto">
                  <PortableTextRenderer value={body} />
                </div>
              )}

              {safeLinks.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                  {safeLinks.map((link) => (
                    <Button
                      key={link.title}
                      variant={stegaClean(link?.buttonVariant)}
                      asChild
                    >
                      <Link
                        href={link.href || "#"}
                        target={link.target ? "_blank" : undefined}
                        rel={link.target ? "noopener" : undefined}
                      >
                        {link.title}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {splitColumns && splitColumns.length > 0 && (
          <div
            ref={gridRef}
            className={cn(
              "mt-4 grid grid-cols-1 lg:grid-cols-2 items-start max-w-6xl mx-auto w-full px-4 lg:px-8 overflow-visible",
              noGap ? "gap-0" : "gap-10 lg:gap-20",
            )}
          >
            {splitColumns.map((column) => {
              if (column._type === "split-cards-list-animated") {
                return (
                  <div
                    key={column._key}
                    ref={cardsRef}
                    className="flex flex-col overflow-visible order-2 px-6 lg:px-0 lg:order-1"
                  >
                    <SplitCardsListAnimated
                      {...(column as any)}
                      color={color}
                      activeIndex={activeCardIndex}
                      // scroll-driven only
                      onHoverCard={undefined}
                    />
                  </div>
                );
              }

              if (column._type === "split-image-animate") {
                return (
                  <div
                    key={column._key}
                    ref={imageRef}
                    className="self-start overflow-visible order-1 lg:order-1 lg:mb-0 opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-6 will-change-transform"
                  >
                    <SplitImageAnimate
                      {...(column as any)}
                      imageStage={imageStage}
                    />
                  </div>
                );
              }

              const Component =
                componentMap[
                column._type as Exclude<
                  SplitColumnAnimated["_type"],
                  "split-cards-list-animated" | "split-image-animate"
                >
                ];

              if (!Component) {
                console.warn(
                  `No component implemented for split column type: ${column._type}`,
                );
                return <div data-type={column._type} key={column._key} />;
              }

              return (
                <Component
                  {...(column as any)}
                  color={color}
                  noGap={noGap}
                  key={column._key}
                />
              );
            })}
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
