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

// When the animated image starts fading in
const IMAGE_FADE_START = "top 75%";

// When the type-on text should start animating
const TYPE_ON_START = "top 80%";

export default function SplitRowAnimated({
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
  const [activeIndex, setActiveIndex] = useState(0);

  const introHasContent =
    !!tagLine || !!title || !!body || (links && links.length > 0);

  const introPaddingClass =
    introPaddingClasses[
    (introPadding || "md") as keyof typeof introPaddingClasses
    ];

  const hasAnimatedCards =
    splitColumns?.some(
      (column) =>
        column._type === "split-cards-list-animated" &&
        (column as any).animateInRight,
    ) ?? false;

  const hasAnimatedImageLayers =
    splitColumns?.some(
      (column) =>
        column._type === "split-image-animate" &&
        (column as any).useCustomEffect,
    ) ?? false;

  // REFS FOR GSAP PIN + STAGGER
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const cardsEls = cardsRef.current
        ? Array.from(
          cardsRef.current.querySelectorAll<HTMLElement>("[data-card-item]"),
        )
        : [];

      if (!headerRef.current && !imageRef.current && cardsEls.length === 0) {
        return;
      }

      // PIN + SCRUB TIMELINE (cards and any synced image layers)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=200%",
          pin: true,
          scrub: true,
          anticipatePin: 1,
        },
      });

      // CARDS – scrubbed with scroll, diagonal stagger via transforms
      if (cardsEls.length) {
        if (hasAnimatedCards) {
          cardsEls.forEach((el, index) => {
            const xOffset = 32 * index; // diagonal to the right
            const yOffset = -24 * index; // step up each card

            // initial state: further right, same diagonal, invisible
            gsap.set(el, {
              x: xOffset + 120,
              y: yOffset,
              autoAlpha: 0,
              zIndex: 10 + index,
            });

            tl.to(
              el,
              {
                x: xOffset,
                autoAlpha: 1,
                duration: 0.7,
                ease: "power3.out",
              },
              index === 0 ? "-=0.1" : ">-=0.15",
            );

            if (hasAnimatedImageLayers) {
              tl.call(() => {
                setActiveIndex(index);
              });
            }
          });
        } else {
          // Simple stagger in from the right when not using the diagonal layout
          tl.from(
            cardsEls,
            {
              x: 80,
              duration: 0.5,
              ease: "power3.out",
              stagger: 0.12,
            },
            "-=0.3",
          );
        }
      }

      // IMAGE FADE-IN (triggered once, non-scrubbed)
      if (imageRef.current) {
        gsap.fromTo(
          imageRef.current,
          {
            autoAlpha: 0,
            y: 40,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: imageRef.current,
              start: IMAGE_FADE_START,
              once: true,
            },
          },
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [hasAnimatedCards, hasAnimatedImageLayers]);

  return (
    <SectionContainer color={color} padding={padding}>
      <div ref={sectionRef} className="relative bg-background overflow-visible">
        {introHasContent && (
          <div
            ref={headerRef}
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
              noGap ? "gap-0" : "gap-12 lg:gap-20",
            )}
          >
            {splitColumns.map((column) => {
              if (column._type === "split-cards-list-animated") {
                return (
                  <div
                    key={column._key}
                    ref={cardsRef}
                    className="flex flex-col overflow-visible"
                  >
                    <SplitCardsListAnimated
                      {...(column as any)}
                      color={color}
                      activeIndex={activeIndex}
                      onActiveIndexChange={setActiveIndex}
                    />
                  </div>
                );
              }

              if (column._type === "split-image-animate") {
                return (
                  <div
                    key={column._key}
                    ref={imageRef}
                    className="hidden lg:block self-start overflow-visible"
                  >
                    <SplitImageAnimate
                      {...(column as any)}
                      activeIndex={activeIndex}
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
