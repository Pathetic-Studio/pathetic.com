//components/blocks/grid/grid-row-image.tsx
"use client";

import type React from "react";
import type { CSSProperties } from "react";
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
import { getSectionId } from "@/lib/section-id";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRowImageBlock = Extract<Block, { _type: "grid-row-image" }>;
type Item = NonNullable<NonNullable<GridRowImageBlock["items"]>[number]>;
type LinkItem = NonNullable<NonNullable<GridRowImageBlock["links"]>[number]>;

const introPaddingClasses: Record<
  NonNullable<GridRowImageBlock["introPadding"]>,
  string
> = {
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

function getGridColsClass(gridType: GridRowImageBlock["gridType"]) {
  if (gridType === "2") return "lg:grid lg:grid-cols-2";
  if (gridType === "3") return "lg:grid lg:grid-cols-3";
  if (gridType === "4") return "lg:grid lg:grid-cols-4";
  // custom
  return "lg:grid lg:grid-cols-4 auto-rows-[minmax(8rem,_auto)]";
}

function getItemLayoutClasses(
  gridType: GridRowImageBlock["gridType"],
  item: Item,
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

export default function GridRowImage({
  _key,
  anchor,
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
  gridColumns, // unused
  items,

  rowGap,
  columnGap,
  mobileHorizontalTrack,
}: GridRowImageBlock) {
  const color = stegaClean(colorVariant);

  const sectionId = getSectionId(
    "grid-row-image",
    _key,
    anchor?.anchorId ?? null
  );

  const resolvedGridType = (gridType || "3") as GridRowImageBlock["gridType"];

  const introHasContent =
    !!tagLine || !!title || !!body || (links && links.length > 0);

  const introPaddingKey = (introPadding || "md") as NonNullable<
    GridRowImageBlock["introPadding"]
  >;
  const introPaddingClass = introPaddingClasses[introPaddingKey];

  const mouseTrailEnabled = feature?.type === "mouseTrail";
  const rotatingImagesEnabled = feature?.type === "rotatingImages";
  const eyeFollowEnabled = feature?.type === "eyeFollow";


  const gridStyle: CSSProperties = {};
  if (rowGap) {
    gridStyle.rowGap = rowGap;
  }
  if (columnGap) {
    gridStyle.columnGap = columnGap;
  }

  let containerStyle: React.CSSProperties | undefined;
  if (typeof anchor?.defaultOffsetPercent === "number") {
    containerStyle = {
      "--section-anchor-offset": String(anchor.defaultOffsetPercent),
    } as React.CSSProperties;
  }

  const useHorizontalTrack = !!mobileHorizontalTrack;

  const titleAnimationSpeed = 1.2;

  return (
    <section
      id={sectionId}
      className="relative overflow-x-hidden lg:overflow-visible"
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

      <SectionContainer
        id={sectionId}
        color={color}
        padding={padding}
        data-section-anchor-id={anchor?.anchorId || undefined}
        style={containerStyle}
      >
        <div className="relative">
          <div className="relative overflow-x-hidden lg:overflow-visible">
            {/* New shared background panel (same system as grid-row) */}
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
                      variant="stretched"            // or "normal"
                      as="h2"
                      stretchScaleX={0.6}            // your horizontal squish
                      overallScale={1.4}            // bump overall size without font-size
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

                  {links && links.length > 0 && (
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
                  )}
                </div>
              )}

              {items && items.length > 0 && (
                <div
                  className={cn(
                    useHorizontalTrack ? "lg:container pb-16" : "container pb-16",
                  )}
                >
                  <div
                    className={cn(
                      useHorizontalTrack
                        ? // Horizontal track on mobile: left padding, reduced width, bigger gap
                        "flex overflow-x-auto snap-x snap-mandatory pb-4 gap-14 sm:gap-12 md:gap-12 pl-20 sm:pl-12 md:pl-16 pr-8 sm:pr-10 md:pr-12 lg:pl-0 lg:pr-0 lg:overflow-visible lg:snap-none"
                        : // Default stacked grid on mobile
                        "grid grid-cols-1 gap-6",
                      getGridColsClass(resolvedGridType),
                    )}
                    style={gridStyle}
                  >
                    {items.map((item: Item) => {
                      const Component = componentMap[item._type];
                      if (!Component) {
                        console.warn(
                          `No component implemented for grid-row-image item type: ${item._type}`,
                        );
                        return <div data-type={item._type} key={item._key} />;
                      }

                      const layoutClasses = getItemLayoutClasses(
                        resolvedGridType,
                        item,
                      );

                      return (
                        <div
                          key={item._key}
                          className={cn(
                            "relative",
                            layoutClasses,
                            useHorizontalTrack &&
                            "snap-center shrink-0 w-[80%] md:w-[50%] lg:w-auto",
                          )}
                        >
                          <Component {...(item as any)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
