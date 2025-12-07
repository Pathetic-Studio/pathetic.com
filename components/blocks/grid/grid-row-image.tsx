// components/blocks/grid/grid-row-image.tsx
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
import { urlFor } from "@/sanity/lib/image";

import ObjectDetectImage from "./object-detect-image";
import ImageCard from "./image-card";

// NOTE: match the pattern you use in blocks index
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
  // custom uses 4-column grid as a base
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

function buildInsetBackgroundStyle(
  insetBackground: NonNullable<GridRowImageBlock["insetBackground"]>,
): CSSProperties {
  const { style, image, color, fromColor, toColor, angle } = insetBackground;
  const styleObj: CSSProperties = {};

  if (style === "image" && image?.asset?._id) {
    styleObj.backgroundImage = `url(${urlFor(image).url()})`;
    styleObj.backgroundSize = "cover";
    styleObj.backgroundPosition = "center";
  }

  if (style === "solid" && color) {
    styleObj.background = color;
  }

  if (style === "gradient" && fromColor && toColor) {
    styleObj.backgroundImage = `linear-gradient(${angle ?? 135}deg, ${fromColor}, ${toColor})`;
  }

  return styleObj;
}

function buildInsetBoxStyle(
  insetBackground: NonNullable<GridRowImageBlock["insetBackground"]>,
): { style: CSSProperties; positionClasses: string } {
  const base = buildInsetBackgroundStyle(insetBackground);

  const {
    width,
    height,
    customWidth,
    customHeight,
    position = "center",
    behavior,
    placementMode,
    verticalOffsetPercent,
  } = insetBackground as any;

  // Size
  if (customWidth) {
    base.width = customWidth;
  } else if (width === "full") {
    base.width = "100%";
  } else {
    // inset preset
    base.width = "calc(100% - 4rem)";
  }

  if (customHeight) {
    base.height = customHeight;
  } else if (height === "full") {
    base.height = "100%";
  } else {
    base.height = "65vh";
  }

  // Vertical placement for full-height (absolute) behavior
  if (behavior !== "sticky") {
    if (
      placementMode === "custom" &&
      typeof verticalOffsetPercent === "number"
    ) {
      // top of inset box starts at X% from top of section
      base.top = `${verticalOffsetPercent}%`;
    } else {
      // fallback equivalent to approx `top-8`
      base.top = "2rem";
    }
  }

  // Horizontal position classes for absolute mode
  let positionClasses = "";
  if (position === "left") {
    positionClasses = "left-4";
  } else if (position === "right") {
    positionClasses = "right-4";
  } else {
    positionClasses = "left-1/2 -translate-x-1/2";
  }

  return { style: base, positionClasses };
}

export default function GridRowImage({
  _key,
  padding,
  colorVariant,
  feature,

  tagLine,
  title,
  body,
  links,
  introPadding,

  gridType,
  gridColumns, // currently unused
  insetBackground,
  items,

  rowGap,
  columnGap,
  mobileHorizontalTrack,
}: GridRowImageBlock) {
  const color = stegaClean(colorVariant);
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

  const sectionId = `_gridrow-image-${_key}`;

  const hasInset = insetBackground?.enabled && insetBackground.style;

  const gridStyle: CSSProperties = {};
  if (rowGap) {
    gridStyle.rowGap = rowGap;
  }
  if (columnGap) {
    gridStyle.columnGap = columnGap;
  }

  const useHorizontalTrack = !!mobileHorizontalTrack;

  return (
    <section id={sectionId} className="relative overflow-visible">
      {mouseTrailEnabled && (
        <MouseTrail containerId={sectionId} images={feature?.images as any} />
      )}

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
        {/* Wrapper to host inset background and content on different z-layers */}
        <div className="relative">
          {/* Inset background – FULL mode (absolute behind content) */}
          {hasInset && insetBackground?.behavior !== "sticky" && (() => {
            const { style, positionClasses } = buildInsetBoxStyle(
              insetBackground as any,
            );
            return (
              <div
                className={cn(
                  "pointer-events-none absolute z-0 overflow-hidden border border-border",
                  positionClasses,
                  insetBackground?.border === false && "border-none",
                )}
                style={style}
              />
            );
          })()}

          {/* Inset background – STICKY mode (flows with layout) */}
          {hasInset && insetBackground?.behavior === "sticky" && (() => {
            const { style } = buildInsetBoxStyle(insetBackground as any);
            const position = insetBackground.position || "center";

            const alignClass =
              position === "left"
                ? "mr-auto"
                : position === "right"
                  ? "ml-auto"
                  : "mx-auto";

            return (
              <div className="mb-10 mt-8">
                <div
                  className={cn(
                    "pointer-events-none sticky top-24 overflow-hidden border border-border",
                    alignClass,
                    insetBackground.border === false && "border-none",
                  )}
                  style={style}
                />
              </div>
            );
          })()}

          {/* All actual content above inset */}
          <div className="relative z-10">
            {/* Intro */}
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
                  <h2 className="mt-6 font-bold leading-[1.1] uppercase md:text-4xl lg:text-5xl lg:px-16">
                    {title}
                  </h2>
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

            {/* Grid / Horizontal track */}
            {items && items.length > 0 && (
              <div className="container pb-16">
                <div
                  className={cn(
                    useHorizontalTrack
                      ? // Mobile/tablet: horizontal scroll track
                      "flex gap-6 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 lg:overflow-visible lg:snap-none"
                      : // Default: normal stacked grid on mobile
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
                          "snap-center shrink-0 w-[80%] sm:w-[65%] md:w-[55%] lg:w-auto",
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
      </SectionContainer>
    </section>
  );
}
