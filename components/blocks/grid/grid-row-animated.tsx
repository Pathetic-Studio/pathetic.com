// components/blocks/grid/grid-row-animated.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";
import { stegaClean } from "next-sanity";
import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PAGE_QUERYResult } from "@/sanity.types";
import GridCard from "./grid-card";
import GridCardAnimated from "./grid-card-animated";
import { BackgroundPanel } from "@/components/ui/background-panel";
import TitleText from "@/components/ui/title-text";
import { TYPE_ON_SPEEDS } from "@/components/ui/type-on-text";
import {
  DISPLAY_OUTLINE_WIDTHS,
  TEXT_STYLES,
  TEXT_WIDTHS,
} from "@/components/ui/text-styles";
import {
  GRID_ROW_ANIMATED_PARALLAX,
  type GridCardParallaxConfig,
} from "./grid-row-animated-parallax"; // NEW

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRowAnimated = Extract<
  Block,
  { _type: "grid-row-animated" } | { _type: "belief-section" }
>;

const introPaddingClasses: Record<
  NonNullable<GridRowAnimated["introPadding"]>,
  string
> = {
  none: "py-0",
  sm: "py-8",
  md: "py-12",
  lg: "py-40",
};

const CARD_STAGGER = 0.18;
const CARD_DURATION = 0.7;
const HEIGHT_STAGGER_PX = 120;
const BELIEF_CARD_FLOAT_EFFECTS = [
  { speed: 0.99, lag: 0.06, captionSpeed: 1.015, captionLag: 0.06 },
  { speed: 1.01, lag: 0.08, captionSpeed: 0.99, captionLag: 0.08 },
  { speed: 0.985, lag: 0.1, captionSpeed: 1.02, captionLag: 0.05 },
] as const;
const BELIEF_CAPTION_WIDTHS_REM = [12.75, 12, 12.75] as const;

function getActiveScroller(): Window | HTMLElement {
  if (typeof window === "undefined") return {} as Window;

  try {
    const smoother = ScrollSmoother.get();
    const wrapper = smoother?.wrapper?.();
    if (wrapper) return wrapper as HTMLElement;
  } catch { }

  const wrapper = document.getElementById("smooth-wrapper");
  if (wrapper?.getAttribute("data-smooth-active") === "true") {
    return wrapper;
  }

  return window;
}

export default function GridRowAnimated(props: GridRowAnimated) {
  const {
    _key,
    padding,
    colorVariant,
    gridColumns,
    columns,
    tagLine,
    title,
    body,
    links,
    introPadding,
    gridTitle,
    background,
    // grid overrides from Sanity
    gridPaddingTop,
    gridPaddingBottom,
    gridPaddingLeft,
    gridPaddingRight,
    gridRowGap,
    gridColumnGap,
  } = props;

  const color = stegaClean(colorVariant);
  const isBeliefSection = props._type === "belief-section";
  const gridColsValue = stegaClean(gridColumns);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const gridColsClass =
    isBeliefSection
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : gridColsValue === "grid-cols-2"
      ? "lg:grid-cols-2"
      : gridColsValue === "grid-cols-3"
        ? "lg:grid-cols-3"
        : gridColsValue === "grid-cols-4"
          ? "lg:grid-cols-4"
          : "lg:grid-cols-3";

  const introHasContent =
    !!tagLine || !!title || !!body || (links && links.length > 0);
  const cleanTitle = title ? stegaClean(title) : "";
  const displayedTitle =
    isBeliefSection && isMobile
      ? cleanTitle.replace(/\s+BELIEVE\s*$/i, "\nBELIEVE")
      : title;

  const introPaddingKey = (introPadding || "md") as NonNullable<
    GridRowAnimated["introPadding"]
  >;
  const introPaddingClass = introPaddingClasses[introPaddingKey];

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(
        ".animated-card",
        rootRef.current,
      );

      if (!cards.length) return;

      // Cards start hidden and translated
      gsap.set(cards, { opacity: 0, y: 40 });

      // REMOVE this: we now handle initial state via CSS/inline style in CaptionBubble
      // gsap.set(".caption-bubble", { opacity: 0, scale: 0.8, y: 8 });

      const scroller = getActiveScroller();

      if (isBeliefSection) {
        const captions = cards
          .map((card) =>
            card.querySelector<HTMLElement>(".caption-bubble"),
          )
          .filter((caption): caption is HTMLElement => Boolean(caption));
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            scroller,
            start: "top 92%",
            once: true,
          },
        });

        timeline.to(
          cards,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.07,
            ease: "power3.out",
          },
          0,
        );
        if (captions.length) {
          timeline.to(
            captions,
            {
              autoAlpha: 1,
              duration: 0.2,
              stagger: 0.055,
              ease: "power3.out",
            },
            0.1,
          );
        }

        ScrollTrigger.refresh();
        return;
      }

      ScrollTrigger.batch(cards, {
        scroller,
        start: "top 75%",
        once: true,
        onEnter: (batch) => {
          batch.forEach((card, index) => {
            const caption =
              card.querySelector<HTMLElement>(".caption-bubble");

            const tl = gsap.timeline({
              defaults: { ease: "power3.out" },
              delay: index * CARD_STAGGER,
            });

            tl.to(card, {
              opacity: 1,
              y: 0,
              duration: CARD_DURATION,
            });

            if (caption) {
              tl.to(
                caption,
                {
                  autoAlpha: 1, // sets opacity + visibility
                  duration: 0.25,
                },
                "-=0.2",
              );
            }
          });
        },
      });

      ScrollTrigger.refresh();
    }, rootRef);

    return () => ctx.revert();
  }, [isBeliefSection]);

  const cleanGridPaddingTop = stegaClean(gridPaddingTop);
  const cleanGridPaddingBottom = stegaClean(gridPaddingBottom);
  const cleanGridPaddingLeft = stegaClean(gridPaddingLeft);
  const cleanGridPaddingRight = stegaClean(gridPaddingRight);
  const cleanGridRowGap = stegaClean(gridRowGap);
  const cleanGridColumnGap = stegaClean(gridColumnGap);

  const hasCustomGridPadding =
    !!cleanGridPaddingTop ||
    !!cleanGridPaddingBottom ||
    !!cleanGridPaddingLeft ||
    !!cleanGridPaddingRight;

  const hasCustomGridGap = !!cleanGridRowGap || !!cleanGridColumnGap;

  const gridStyle: CSSProperties = {};

  if (isDesktop) {
    if (cleanGridPaddingTop)
      gridStyle.paddingTop = cleanGridPaddingTop as string;
    if (cleanGridPaddingBottom)
      gridStyle.paddingBottom = cleanGridPaddingBottom as string;
    if (cleanGridPaddingLeft)
      gridStyle.paddingLeft = cleanGridPaddingLeft as string;
    if (cleanGridPaddingRight)
      gridStyle.paddingRight = cleanGridPaddingRight as string;

    if (cleanGridRowGap) gridStyle.rowGap = cleanGridRowGap as string;
    if (cleanGridColumnGap)
      gridStyle.columnGap = cleanGridColumnGap as string;
  }

  const baseGridPaddingClasses =
    hasCustomGridPadding || hasCustomGridGap
      ? "px-4 py-6 sm:px-6 sm:py-8 lg:px-0 lg:py-0"
      : "px-4 py-8 sm:px-8 sm:py-10 lg:p-12";

  const animatedCardClass =
    "animated-card relative opacity-0 will-change-transform";
  const beliefResponsiveLayoutClass = (index: number) => {
    if (!isBeliefSection) return "";
    if (index % 3 === 1) {
      return "mt-8 w-[86%] justify-self-end sm:mt-0 sm:w-[84%] sm:translate-y-20 lg:w-full lg:translate-y-0";
    }
    if (index % 3 === 2) {
      return "mt-8 w-[86%] justify-self-start translate-x-[4%] sm:mt-0 sm:w-[84%] sm:translate-x-[14%] lg:w-full lg:translate-x-0 lg:translate-y-0";
    }
    return "w-[86%] justify-self-start sm:w-[84%] lg:w-full";
  };

  return (
    <section
      id={`_gridrow-animated-${_key}`}
      data-typeon-trigger={isBeliefSection ? "true" : undefined}
      className="relative overflow-visible"
    >
      <SectionContainer color={color} padding={padding}>
        <div
          ref={rootRef}
          className="relative overflow-x-hidden lg:overflow-visible"
        >
          <BackgroundPanel background={background as any} />

          <div className={cn("relative z-20", isBeliefSection && "z-[30]")}>
            {introHasContent && (
              <div
                data-belief-intro={isBeliefSection ? "true" : undefined}
                data-speed={isBeliefSection && isDesktop ? 0.9 : undefined}
                data-lag={isBeliefSection && isDesktop ? 0.2 : undefined}
                className={cn(
                  "container text-center will-change-transform",
                  isBeliefSection
                    ? "pt-[clamp(13rem,23vw,20rem)] pb-[clamp(8rem,13vw,12rem)]"
                    : introPaddingClass,
                )}
              >
                {tagLine && (
                  <h1 className="leading-[0] uppercase italic font-sans">
                    <span className={`${TEXT_STYLES.eyebrow} opacity-50`}>
                      {tagLine}
                    </span>
                  </h1>
                )}

                {title && (
                  <TitleText
                    variant="stretched"
                    as="h2"
                    size={isBeliefSection ? "belief" : "xxl"}
                    align="center"
                    maxChars={isBeliefSection ? 0 : 21}
                    animation={"typeOn"}
                    animationSpeed={
                      isBeliefSection
                        ? TYPE_ON_SPEEDS.deliberate
                        : TYPE_ON_SPEEDS.standard
                    }
                    typeOnStart={isBeliefSection ? "top 90%" : undefined}
                    typeOnDelay={isBeliefSection ? 0 : undefined}
                    textColor={isBeliefSection ? "#ffffff" : undefined}
                    textOutline={isBeliefSection}
                    outlineColor="#050505"
                    outlineWidth={
                      isBeliefSection
                        ? DISPLAY_OUTLINE_WIDTHS.heavy
                        : DISPLAY_OUTLINE_WIDTHS.standard
                    }
                    outlinePosition="outside"
                    fontWeight="bold"
                    singleLine={isBeliefSection && !isMobile}
                    className={
                      isBeliefSection
                        ? "!w-full [&_h2]:whitespace-pre-line [&_h2]:leading-[.76] [&_h2]:tracking-[-.01em]"
                        : undefined
                    }
                  >
                    {displayedTitle}
                  </TitleText>
                )}

                {body && (
                  <div className={`mx-auto mt-6 ${TEXT_STYLES.bodyLarge} ${TEXT_WIDTHS.body}`}>
                    <PortableTextRenderer value={body} />
                  </div>
                )}

                {links && links.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-4 justify-center">
                    {links.map(
                      (
                        link: NonNullable<GridRowAnimated["links"]>[number],
                      ) => (
                        <Button
                          key={link._key || link.title}
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
                      ),
                    )}
                  </div>
                )}
              </div>
            )}

            {gridTitle && (
              <div
                className={cn(
                  "relative z-10 mb-8 text-center flex justify-center",
                  !introHasContent && "pt-12",
                )}
              >

                <TitleText
                  variant="stretched"
                  as="h3"
                  size="md"
                  align="center"
                  maxChars={26}
                  animation={"typeOn"}
                  animationSpeed={1.2}
                >
                  {gridTitle}
                </TitleText>

              </div>
            )}

            {columns && columns.length > 0 && (
              <div className="pb-40">
                <div
                  className={cn(
                    "grid grid-cols-1 gap-6 relative z-10",
                    isBeliefSection && "z-[40]",
                    isBeliefSection && "gap-y-8 sm:gap-x-8 sm:gap-y-24 lg:gap-y-0",
                    baseGridPaddingClasses,
                    gridColsClass,
                  )}
                  style={gridStyle}
                >
                  {(() => {
                    let animatedCardIndex = -1; // NEW: counts only grid-card-animated
                    return columns.map(
                      (
                        column: NonNullable<GridRowAnimated["columns"]>[number],
                        index: number,
                      ) => {
                        const offsetStyle: CSSProperties = isDesktop
                          ? {
                            marginTop:
                              index === 0 ? 0 : index * HEIGHT_STAGGER_PX,
                          }
                          : {};
                        const beliefFloatEffect = isBeliefSection
                          ? BELIEF_CARD_FLOAT_EFFECTS[
                              index % BELIEF_CARD_FLOAT_EFFECTS.length
                            ]
                          : undefined;

                        if (column._type === "grid-card") {
                          return (
                            <div
                              key={column._key}
                              className={cn(
                                "relative",
                                beliefResponsiveLayoutClass(index),
                              )}
                              style={offsetStyle}
                            >
                              <div
                                data-belief-card-float={
                                  isBeliefSection ? index : undefined
                                }
                                data-speed={isDesktop ? beliefFloatEffect?.speed : undefined}
                                data-lag={isDesktop ? beliefFloatEffect?.lag : undefined}
                                className="relative will-change-transform"
                              >
                                <div className={animatedCardClass}>
                                  <GridCard
                                    {...(column as any)}
                                    color={color}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (column._type === "grid-card-animated") {
                          animatedCardIndex += 1;
                          const parallaxConfig: GridCardParallaxConfig | undefined =
                            GRID_ROW_ANIMATED_PARALLAX[animatedCardIndex];
                          const resolvedParallaxConfig = isBeliefSection
                            ? isDesktop
                              ? {
                                ...parallaxConfig,
                                captionSpeed:
                                  beliefFloatEffect?.captionSpeed ?? 1,
                                captionLag:
                                  beliefFloatEffect?.captionLag ?? 0.2,
                              }
                              : undefined
                            : parallaxConfig;

                          return (
                            <div
                              key={column._key}
                              className={cn(
                                "relative",
                                beliefResponsiveLayoutClass(index),
                              )}
                              style={offsetStyle}
                            >
                              <div
                                data-belief-card-float={
                                  isBeliefSection ? index : undefined
                                }
                                data-speed={isDesktop ? beliefFloatEffect?.speed : undefined}
                                data-lag={isDesktop ? beliefFloatEffect?.lag : undefined}
                                className="relative will-change-transform"
                              >
                                <div className={animatedCardClass}>
                                  <GridCardAnimated
                                    {...(column as any)}
                                    color={color}
                                    parallaxConfig={resolvedParallaxConfig}
                                    captionDesktopWidthRem={
                                      isBeliefSection
                                        ? BELIEF_CAPTION_WIDTHS_REM[
                                            animatedCardIndex %
                                              BELIEF_CAPTION_WIDTHS_REM.length
                                          ]
                                        : undefined
                                    }
                                    captionCenterOnTouch={isBeliefSection}
                                    captionTouchIndex={animatedCardIndex}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={column._key}
                            className={cn(
                              "relative",
                              beliefResponsiveLayoutClass(index),
                            )}
                            style={offsetStyle}
                          >
                            <div
                              data-belief-card-float={
                                isBeliefSection ? index : undefined
                              }
                                data-speed={isDesktop ? beliefFloatEffect?.speed : undefined}
                                data-lag={isDesktop ? beliefFloatEffect?.lag : undefined}
                              className="relative will-change-transform"
                            >
                              <div className={animatedCardClass}>
                                <div data-type={column._type} />
                              </div>
                            </div>
                          </div>
                        );
                      },
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
