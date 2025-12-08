// components/blocks/grid/grid-row-grab.tsx
"use client";

import type React from "react";
import type { CSSProperties } from "react";
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

// Explicit key type avoids TS index issues
type IntroPaddingKey = NonNullable<GridRowGrabBlock["introPadding"]>;

const introPaddingClasses: Record<IntroPaddingKey, string> = {
  none: "py-0",
  sm: "py-8",
  md: "py-12",
  lg: "py-40",
};

const colSpanClassMap: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
};

const colStartClassMap: Record<number, string> = {
  1: "lg:col-start-1",
  2: "lg:col-start-2",
  3: "lg:col-start-3",
  4: "lg:col-start-4",
};

const rowSpanClassMap: Record<number, string> = {
  1: "lg:row-span-1",
  2: "lg:row-span-2",
  3: "lg:row-span-3",
  4: "lg:row-span-4",
};

const componentMap: {
  [K in Item["_type"]]: React.ComponentType<Extract<Item, { _type: K }>>;
} = {
  "object-detect-image": ObjectDetectImage,
  "image-card": ImageCard,
};

function getGridColsClass(gridType: GridRowGrabBlock["gridType"]) {
  if (gridType === "2") return "lg:grid lg:grid-cols-2";
  if (gridType === "3") return "lg:grid lg:grid-cols-3";
  if (gridType === "4") return "lg:grid lg:grid-cols-4";
  return "lg:grid lg:grid-cols-4 auto-rows-[minmax(8rem,_auto)]";
}

function getItemLayoutClasses(
  gridType: GridRowGrabBlock["gridType"],
  item: Item
) {
  if (gridType !== "custom") return "";

  const layout = (item as any).layout;
  if (!layout) return "";

  const classes: string[] = [];

  if (layout.colSpan && colSpanClassMap[layout.colSpan]) {
    classes.push(colSpanClassMap[layout.colSpan]);
  }
  if (layout.colStart && colStartClassMap[layout.colStart]) {
    classes.push(colStartClassMap[layout.colStart]);
  }
  if (layout.rowSpan && rowSpanClassMap[layout.rowSpan]) {
    classes.push(rowSpanClassMap[layout.rowSpan]);
  }

  return classes.join(" ");
}

export default function GridRowGrab({
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
  gridColumns,
  items,

  rowGap,
  columnGap,
  mobileHorizontalTrack, // kept for schema compatibility
}: GridRowGrabBlock) {
  const color = stegaClean(colorVariant);
  const resolvedGridType = (gridType || "3") as GridRowGrabBlock["gridType"];

  const introHasContent =
    !!tagLine || !!title || !!body || (links && links.length > 0);

  const introPaddingKey = (introPadding ?? "md") as IntroPaddingKey;
  const introPaddingClass = introPaddingClasses[introPaddingKey];

  const mouseTrailEnabled = feature?.type === "mouseTrail";
  const rotatingImagesEnabled = feature?.type === "rotatingImages";
  const eyeFollowEnabled = feature?.type === "eyeFollow";

  const sectionId = `_gridrow-grab-${_key}`;

  const gridStyle: CSSProperties = {};
  if (rowGap) gridStyle.rowGap = rowGap;
  if (columnGap) gridStyle.columnGap = columnGap;

  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section
      id={sectionId}
      className="relative overflow-hidden lg:overflow-visible"
      data-grab-container
    >
      {rotatingImagesEnabled && (
        <RotatingImages
          containerId={sectionId}
          images={feature?.images as any}
        />
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
                <MouseTrail
                  containerId={sectionId}
                  images={feature?.images as any}
                />
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
                      stretchScaleX={0.6}
                      overallScale={1.3}
                      align="center"
                      maxChars={32}
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
                    className={cn(
                      // Mobile: single column, brought-in padding, cards narrower
                      "grid grid-cols-1 gap-6 px-4 sm:px-5 md:px-6",
                      // Desktop: actual grid
                      getGridColsClass(resolvedGridType)
                    )}
                    style={gridStyle}
                  >
                    {items.map((item, index) => {
                      const Component = componentMap[item._type];
                      if (!Component) return null;

                      const id = item._key || `item-${index}`;
                      const layoutClasses = getItemLayoutClasses(
                        resolvedGridType,
                        item
                      );

                      return (
                        <DraggableGridItem
                          key={id}
                          id={id}
                          isActive={activeId === id}
                          onActivate={setActiveId}
                          className={cn(
                            layoutClasses,
                            // Mobile: visible card box, narrower, centered
                            "max-w-md w-full mx-auto",
                            "bg-background border border-border rounded-3xl p-4 sm:p-5 md:p-6",
                            "space-y-4",
                            "lg:max-w-none lg:mx-0",
                            // Desktop: let inner component own layout
                            "lg:bg-transparent lg:border-none lg:p-0 lg:space-y-0"
                          )}
                        >
                          {/* 
                            Inner card component should use this to always show
                            body + button on mobile instead of only on hover.
                          */}
                          <Component
                            {...(item as any)}
                            showDetailsOnMobile
                          />
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
