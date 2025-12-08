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

  // Simple desktop check – used only to decide if we apply inline CMS padding
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 1024) {
      setIsDesktop(true);
    }
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

      gsap.set(cards, { opacity: 0, y: 40 });
      gsap.set(".caption-bubble", { opacity: 0, scale: 0.8, y: 8 });

      ScrollTrigger.batch(cards, {
        start: "top 75%",
        once: true,
        onEnter: (batch) => {
          batch.forEach((card, index) => {
            const caption = card.querySelector<HTMLElement>(".caption-bubble");

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
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  duration: 0.4,
                },
                "-=0.25",
              );
            }
          });
        },
      });

      ScrollTrigger.refresh();
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // Clean CMS values
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

  // Only apply CMS inline padding and gaps on desktop.
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

  // Base grid padding:
  // - Mobile/tablet: always use this.
  // - Desktop: if custom padding/gap exists, drop Tailwind padding at lg and
  //   let inline desktop padding handle it.
  const baseGridPaddingClasses =
    hasCustomGridPadding || hasCustomGridGap
      ? "px-4 py-6 sm:px-6 sm:py-8 lg:px-0 lg:py-0"
      : "px-4 py-8 sm:px-8 sm:py-10 lg:p-12";

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
          {/* Background */}
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
                    animation="typeOn"        // hard-coded ON
                    animationSpeed={1.2}     // tweak as needed
                    as="h2"
                    stretchScaleX={0.55}     // horizontal squish
                    overallScale={2}         // bump overall size
                    align="center"
                    maxChars={26}
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
                <h3 className="text-4xl font-sans font-semibold uppercase max-w-1/3">
                  {gridTitle}
                </h3>
              </div>
            )}

            {columns && columns.length > 0 && (
              <div
                className={cn(
                  "grid grid-cols-1 gap-6 relative z-10",
                  baseGridPaddingClasses,
                  gridColsClass,
                )}
                style={gridStyle}
              >
                {columns.map(
                  (
                    column: NonNullable<GridRowAnimated["columns"]>[number],
                    index: number,
                  ) => {
                    const offsetStyle: CSSProperties = {
                      marginTop: `${index * HEIGHT_STAGGER_PX}px`,
                    };

                    if (column._type === "grid-card") {
                      return (
                        <div
                          key={column._key}
                          className="relative"
                          style={offsetStyle}
                        >
                          <div className="animated-card relative">
                            <GridCard {...(column as any)} color={color} />
                          </div>
                        </div>
                      );
                    }

                    if (column._type === "grid-card-animated") {
                      return (
                        <div
                          key={column._key}
                          className="relative"
                          style={offsetStyle}
                        >
                          <div className="animated-card relative">
                            <GridCardAnimated
                              {...(column as any)}
                              color={color}
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
                        <div className="animated-card relative">
                          <div data-type={column._type} />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
