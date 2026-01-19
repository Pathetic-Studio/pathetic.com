// components/blocks/grid/grid-row-grab.tsx
"use client";

import type React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult } from "@/sanity.types";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import MouseTrail from "@/components/effects/mouse-trail";
import RotatingImages from "@/components/effects/rotating-images";
import EyeFollow from "@/components/effects/eye-follow";

import ObjectDetectImage from "./object-detect-image";
import ImageCard from "./image-card";
import { BackgroundPanel } from "@/components/ui/background-panel";
import TitleText from "@/components/ui/title-text";
import DraggableGridItem from "./draggable-grid-item";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRowGrabBlock = Extract<Block, { _type: "grid-row-grab" }>;
type Item = NonNullable<NonNullable<GridRowGrabBlock["items"]>[number]>;
type LinkItem = NonNullable<NonNullable<GridRowGrabBlock["links"]>[number]>;

type IntroPaddingKey = NonNullable<GridRowGrabBlock["introPadding"]>;

const introPaddingClasses: Record<IntroPaddingKey, string> = {
  none: "py-0",
  sm: "py-8",
  md: "py-12",
  lg: "py-40",
};

// IMPORTANT: derive the gap union from the Sanity type (and strip null)
type GapSize = NonNullable<GridRowGrabBlock["rowGapSize"]>;

/**
 * Base gaps apply to mobile/tablet.
 * Keep lg sizing for desktop.
 */
const rowGapClasses: Record<GapSize, string> = {
  default: "gap-y-6 lg:gap-y-6",
  lg: "gap-y-8 lg:gap-y-10",
  xl: "gap-y-10 lg:gap-y-14",
  xxl: "gap-y-12 lg:gap-y-20",
};

const colGapClasses: Record<GapSize, string> = {
  default: "gap-x-6 lg:gap-x-6",
  lg: "gap-x-8 lg:gap-x-10",
  xl: "gap-x-10 lg:gap-x-14",
  xxl: "gap-x-12 lg:gap-x-20",
};

const componentMap: {
  [K in Item["_type"]]: React.ComponentType<Extract<Item, { _type: K }>>;
} = {
  "object-detect-image": ObjectDetectImage,
  "image-card": ImageCard,
};

/**
 * Mobile: always 1 col
 * Tablet (md): 2 cols
 * Desktop (lg): respect CMS gridType (2/3/4)
 */
function getGridColsClass(gridType: GridRowGrabBlock["gridType"]) {
  if (gridType === "2") return "md:grid-cols-2 lg:grid-cols-2";
  if (gridType === "3") return "md:grid-cols-2 lg:grid-cols-3";
  return "md:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(8rem,_auto)]";
}

export default function GridRowGrab(props: GridRowGrabBlock) {
  const {
    _key,
    padding,
    colorVariant,
    feature,
    background,

    tagLine,
    title,
    body,
    links,
    introPadding,

    gridType,
    items,

    rowGapSize,
    columnGapSize,
  } = props;

  const color = stegaClean(colorVariant);
  const resolvedGridType = (gridType || "3") as GridRowGrabBlock["gridType"];

  const introHasContent =
    !!tagLine || !!title || !!body || (links && links.length > 0);

  const introPaddingKey = (introPadding ?? "md") as IntroPaddingKey;
  const introPaddingClass = introPaddingClasses[introPaddingKey];

  // rowGapSize/columnGapSize can be null from Sanity, so default safely
  const resolvedRowGap = (rowGapSize ?? "default") as GapSize;
  const resolvedColGap = (columnGapSize ?? "default") as GapSize;

  const mouseTrailEnabled = feature?.type === "mouseTrail";
  const rotatingImagesEnabled = feature?.type === "rotatingImages";
  const eyeFollowEnabled = feature?.type === "eyeFollow";

  const sectionId = `_gridrow-grab-${_key}`;

  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section
      id={sectionId}
      data-grab-container-section
      className="relative overflow-x-hidden overflow-y-visible lg:overflow-visible"
    >
      {rotatingImagesEnabled && (
        <RotatingImages containerId={sectionId} images={feature?.images as any} />
      )}

      {eyeFollowEnabled && (
        <EyeFollow containerId={sectionId} eyes={feature?.eyes as any} />
      )}

      <SectionContainer color={color} padding={padding}>
        <div className="relative">
          <div className="relative overflow-visible">
            <BackgroundPanel background={background as any} />

            {mouseTrailEnabled && (
              <div className="pointer-events-none absolute inset-0 z-10">
                <MouseTrail containerId={sectionId} images={feature?.images as any} />
              </div>
            )}

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
                    <div className="mt-6 mx-auto max-w-2xl text-lg">
                      <PortableTextRenderer value={body} />
                    </div>
                  )}

                  {links?.length ? (
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                      {links.map((link: LinkItem) => (
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
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {items?.length ? (
                <div className="container pb-16">
                  <div
                    data-grab-container-grid
                    className={cn(
                      "grid grid-cols-1 px-4 sm:px-5 md:px-6 overflow-visible",
                      rowGapClasses[resolvedRowGap],
                      colGapClasses[resolvedColGap],
                      getGridColsClass(resolvedGridType)
                    )}
                  >
                    {items.map((item, index) => {
                      const Component = componentMap[item._type];
                      if (!Component) return null;

                      const id = item._key || `item-${index}`;

                      return (
                        <DraggableGridItem
                          key={id}
                          id={id}
                          isActive={activeId === id}
                          onActivate={setActiveId}
                          className={cn(
                            // Mobile: keep the compact centered card width
                            "w-full mx-auto max-w-[13rem] sm:max-w-[15rem]",
                            // Tablet: let cards fill the 2-col grid nicely
                            "md:max-w-none md:mx-0",
                            "bg-background border border-border p-4 sm:p-5 md:p-6",
                            // Desktop: original transparent layout
                            "lg:max-w-none lg:mx-0 lg:bg-transparent lg:border-none lg:p-0"
                          )}
                        >
                          <Component {...(item as any)} showDetailsOnMobile />
                        </DraggableGridItem>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
