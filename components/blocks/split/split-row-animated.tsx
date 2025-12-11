"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult } from "@/sanity.types";
import SplitContent from "./split-content";
import SplitCardsListAnimated from "./split-cards-list-animated";
import SplitImage from "./split-image";
import SplitImageAnimate from "./split-image-animate";
import SplitInfoList from "./split-info-list";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TypeOnText from "@/components/ui/type-on-text";
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

const IMAGE_FADE_START = "top 75%";
const TYPE_ON_START = "top 80%";

// imageStage mapping (for useCustomEffect):
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
  const color = stegaClean(colorVariant);

  const sectionId = getSectionId(
    "split-row-animated",
    _key,
    anchor?.anchorId ?? null,
  );

  const introHasContent =
    !!tagLine || !!title || !!body || (links && links.length > 0);

  const introPaddingClass =
    introPaddingClasses[
    (introPadding || "md") as keyof typeof introPaddingClasses
    ];

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  // which card is "active" (drives the effect)
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // whether the image has actually animated into view
  const [hasImageEntered, setHasImageEntered] = useState(false);

  // numeric stage for SplitImageAnimate
  const [imageStage, setImageStage] = useState(0);

  let containerStyle: React.CSSProperties | undefined;
  if (typeof anchor?.defaultOffsetPercent === "number") {
    containerStyle = {
      "--section-anchor-offset": String(anchor.defaultOffsetPercent),
    } as React.CSSProperties;
  }

  // Derive imageStage whenever image enters and/or active card changes
  useEffect(() => {
    if (!hasImageEntered) {
      setImageStage(0);
      return;
    }

    const clampedIndex = Math.max(0, Math.min(activeCardIndex, 2));
    setImageStage(2 + clampedIndex);
  }, [hasImageEntered, activeCardIndex]);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const imageEl = imageRef.current;
    const cardsContainer = cardsRef.current;

    if (!sectionEl) return;

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

          // IMAGE ANIMATION
          if (imageEl) {
            gsap.fromTo(
              imageEl,
              { autoAlpha: 0, y: 40, scale: 0.9 },
              {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: imageEl,
                  start: "top 85%",
                  toggleActions: "play none none none",
                  onEnter: () => {
                    setHasImageEntered(true);
                  },
                },
              },
            );
          } else {
            if (cardsEls.length && isDesktop) {
              const firstCard = cardsEls[0];
              gsap.fromTo(
                firstCard,
                { autoAlpha: 0, y: 40 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.8,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: firstCard,
                    start: IMAGE_FADE_START,
                    once: true,
                  },
                },
              );
            }
          }

          if (!cardsEls.length) {
            if (imageEl) {
              gsap.fromTo(
                imageEl,
                { autoAlpha: 0, y: 40 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.8,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: imageEl,
                    start: IMAGE_FADE_START,
                    once: true,
                  },
                },
              );
            }
            return;
          }

          const animateDiagonal = isDesktop && hasAnimatedCards;

          // DESKTOP: diagonal stagger, hover active
          if (isDesktop) {
            const cardStartDesktop = "top 85%";

            cardsEls.forEach((el, index) => {
              const xOffset = animateDiagonal ? 32 * index : 0;
              const yOffset = animateDiagonal ? -24 * index : 0;

              gsap.fromTo(
                el,
                {
                  x: xOffset + 120,
                  y: yOffset,
                  autoAlpha: 0,
                  zIndex: 10 + index,
                },
                {
                  x: xOffset,
                  y: yOffset,
                  autoAlpha: 1,
                  duration: 0.6,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: el,
                    start: cardStartDesktop,
                    toggleActions: "play none none none",
                  },
                },
              );
            });

            return;
          }

          // MOBILE/TABLET: pinned section + cards scrolling up from bottom and stacking
          if (isMobile) {
            const totalCards = cardsEls.length;
            if (!totalCards) return;

            const getMobileEnd = () => {
              const viewport = window.innerHeight || 0;
              const perCardScroll = Math.max(viewport * 0.8, 1);
              const total = perCardScroll * totalCards;
              return "+=" + total;
            };

            // Initial positions: first card in place, others below
            cardsEls.forEach((el, index) => {
              const initialY = index === 0 ? 0 : 80;
              gsap.set(el, { opacity: 1, y: initialY });
            });

            // Pin the whole section
            ScrollTrigger.create({
              trigger: sectionEl,
              start: "top top",
              end: getMobileEnd,
              pin: true,
              pinSpacing: true,
            });

            // Use scroll progress to:
            // - move each card from bottom (y=80) up into place (y=0)
            // - determine which card is active (on top) for the image state
            ScrollTrigger.create({
              trigger: sectionEl,
              start: "top top",
              end: getMobileEnd,
              onUpdate: (self) => {
                const progress = self.progress;
                if (!totalCards) return;

                const perCard = 1 / totalCards;
                let active = 0;

                cardsEls.forEach((el, index) => {
                  const cardStart = perCard * index;
                  const cardEnd = perCard * (index + 1);

                  let t = (progress - cardStart) / (cardEnd - cardStart);
                  if (t < 0) t = 0;
                  if (t > 1) t = 1;

                  const y = (1 - t) * 80; // slide up from bottom
                  gsap.set(el, { y });

                  if (progress >= cardStart && progress < cardEnd) {
                    active = index;
                  } else if (progress >= 1 && index === totalCards - 1) {
                    active = totalCards - 1;
                  }
                });

                setActiveCardIndex(active);
              },
            });

            // Remove mobile-specific fade-in on cardsContainer (was here before)
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
                  animation={"typeOn"}
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

              {links && links.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                  {links.map((link) => (
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
                    className="flex flex-col overflow-visible order-2 lg:order-1"
                  >
                    <SplitCardsListAnimated
                      {...(column as any)}
                      color={color}
                      activeIndex={activeCardIndex}
                      onHoverCard={(index) => setActiveCardIndex(index)}
                    />
                  </div>
                );
              }

              if (column._type === "split-image-animate") {
                return (
                  <div
                    key={column._key}
                    ref={imageRef}
                    className="self-start overflow-visible order-1 lg:order-1  lg:mb-0 opacity-0 translate-y-6 will-change-transform"
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
