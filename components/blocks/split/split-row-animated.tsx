// components/blocks/split/split-row-animated.tsx
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

// Fallback image fade start
const IMAGE_FADE_START = "top 75%";

// When the type-on text should start animating
const TYPE_ON_START = "top 80%";

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
    anchor?.anchorId ?? null
  );

  // 0 = base, 1 = image scaled in, 2 = effect 1 on, 3 = effect 2 on
  const [imageStage, setImageStage] = useState(0);

  const introHasContent =
    !!tagLine || !!title || !!body || (links && links.length > 0);

  const introPaddingClass =
    introPaddingClasses[
    (introPadding || "md") as keyof typeof introPaddingClasses
    ];

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);


  let containerStyle: React.CSSProperties | undefined;
  if (typeof anchor?.defaultOffsetPercent === "number") {
    containerStyle = {
      "--section-anchor-offset": String(anchor.defaultOffsetPercent),
    } as React.CSSProperties;
  }


  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const imageEl = imageRef.current;
      const cardsEls = cardsRef.current
        ? Array.from(
          cardsRef.current.querySelectorAll<HTMLElement>("[data-card-item]"),
        )
        : [];

      const isDesktop =
        typeof window !== "undefined" ? window.innerWidth >= 1024 : true;

      const hasAnimatedCards =
        splitColumns?.some(
          (column) =>
            column._type === "split-cards-list-animated" &&
            (column as any).animateInRight,
        ) ?? false;

      // Desktop only gets diagonal; mobile/tablet = straight stack with gap
      const animateDiagonal = isDesktop && hasAnimatedCards;

      // Trigger position:
      // - Desktop: top of card hits vertical center ("top center")
      // - Mobile: top of card hits 10% from bottom -> "top 90%"
      const cardStart = isDesktop ? "top center" : "top 90%";

      // IMAGE: animate when its top hits vertical center (same on all viewports for now)
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
              start: "top center",
              toggleActions: "play none none none",
              onEnter: () => {
                // ensure stage at least 1 when image animates
                setImageStage((prev) => Math.max(prev, 1));
              },
            },
          },
        );
      }

      if (!cardsEls.length) {
        // fallback image fade if no cards
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

      // CARDS: each card animates when its own top hits the chosen start
      cardsEls.forEach((el, index) => {
        const xOffset = animateDiagonal ? 32 * index : 0;
        const yOffset = animateDiagonal ? -24 * index : 0;

        if (animateDiagonal) {
          // Desktop diagonal layout: final position is offset in both x and y
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
                start: cardStart,
                toggleActions: "play none none none",
                onEnter: () => {
                  // tie image effects to which card just entered
                  setImageStage((prev) => {
                    if (index === 0) return Math.max(prev, 1); // first card
                    if (index === 1) return Math.max(prev, 2); // second card => Effect 1
                    if (index === 2) return Math.max(prev, 3); // third card => Effect 2
                    return prev;
                  });
                },
              },
            },
          );
        } else {
          // Mobile/tablet: no diagonal, just straight stack with gap from CSS
          gsap.from(el, {
            x: 80,
            y: 0,
            autoAlpha: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: cardStart, // on mobile: "top 90%" (10% from bottom)
              toggleActions: "play none none none",
              onEnter: () => {
                setImageStage((prev) => {
                  if (index === 0) return Math.max(prev, 1);
                  if (index === 1) return Math.max(prev, 2);
                  if (index === 2) return Math.max(prev, 3);
                  return prev;
                });
              },
            },
          });
        }
      });
    }, sectionRef);

    return () => ctx.revert();
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
                <h2 className="mt-1 font-bold leading-[1.1] uppercase md:text-4xl lg:text-8xl scale-x-70">
                  {animateText ? (
                    <TypeOnText
                      text={title}
                      className=""
                      speed={1.2}
                      start={TYPE_ON_START}
                    />
                  ) : (
                    title
                  )}
                </h2>
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
                    />
                  </div>
                );
              }

              if (column._type === "split-image-animate") {
                return (
                  <div
                    key={column._key}
                    ref={imageRef}
                    className="self-start overflow-visible order-1 lg:order-1 mb-10 lg:mb-0"
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
