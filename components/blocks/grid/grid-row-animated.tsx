// components/blocks/grid/grid-row-animated.tsx
"use client";

import React, { useLayoutEffect, useRef, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
import {
  GRID_ROW_ANIMATED_PARALLAX,
  type GridCardParallaxConfig,
} from "./grid-row-animated-parallax"; // NEW

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRowAnimated = Extract<Block, { _type: "grid-row-animated" }>;

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
  const gridColsValue = stegaClean(gridColumns);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const gridColsClass =
    gridColsValue === "grid-cols-2"
      ? "lg:grid-cols-2"
      : gridColsValue === "grid-cols-3"
        ? "lg:grid-cols-3"
        : gridColsValue === "grid-cols-4"
          ? "lg:grid-cols-4"
          : "lg:grid-cols-3";

  const introHasContent =
    !!tagLine || !!title || !!body || (links && links.length > 0);

  const introPaddingKey = (introPadding || "md") as NonNullable<
    GridRowAnimated["introPadding"]
  >;
  const introPaddingClass = introPaddingClasses[introPaddingKey];

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".animated-card");

      if (!cards.length) return;

      // Cards start hidden and translated
      gsap.set(cards, { opacity: 0, y: 40 });

      // REMOVE this: we now handle initial state via CSS/inline style in CaptionBubble
      // gsap.set(".caption-bubble", { opacity: 0, scale: 0.8, y: 8 });

      ScrollTrigger.batch(cards, {
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
  }, []);


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
    "animated-card relative opacity-0 translate-y-10 will-change-transform";

  return (
    <section
      id={`_gridrow-animated-${_key}`}
      className="relative overflow-visible"
    >
      <SectionContainer color={color} padding={padding}>
        <div
          ref={rootRef}
          className="relative overflow-x-hidden lg:overflow-visible"
        >
          <BackgroundPanel background={background as any} />

          <div className="relative z-20">
            {introHasContent && (
              <div className={cn("container text-center", introPaddingClass)}>
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
                    size="xxl"
                    align="center"
                    maxChars={21}
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

                        if (column._type === "grid-card") {
                          return (
                            <div
                              key={column._key}
                              className="relative"
                              style={offsetStyle}
                            >
                              <div className={animatedCardClass}>
                                <GridCard
                                  {...(column as any)}
                                  color={color}
                                />
                              </div>
                            </div>
                          );
                        }

                        if (column._type === "grid-card-animated") {
                          animatedCardIndex += 1;
                          const parallaxConfig: GridCardParallaxConfig | undefined =
                            GRID_ROW_ANIMATED_PARALLAX[animatedCardIndex];

                          return (
                            <div
                              key={column._key}
                              className="relative"
                              style={offsetStyle}
                            >
                              <div className={animatedCardClass}>
                                <GridCardAnimated
                                  {...(column as any)}
                                  color={color}
                                  parallaxConfig={parallaxConfig}
                                />
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={column._key}
                            className="relative"
                            style={offsetStyle}
                          >
                            <div className={animatedCardClass}>
                              <div data-type={column._type} />
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
