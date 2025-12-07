// components/blocks/grid/grid-row.tsx
"use client";

import type React from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult } from "@/sanity.types";
import GridCard from "./grid-card";
import PricingCard from "./pricing-card";
import GridPost from "./grid-post";
import GridTextBlock from "./grid-text-block";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import MouseTrail from "@/components/effects/mouse-trail";
import RotatingImages from "@/components/effects/rotating-images";
import EyeFollow from "@/components/effects/eye-follow";
import { urlFor } from "@/sanity/lib/image";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRow = Extract<Block, { _type: "grid-row" }>;
type GridColumn = NonNullable<NonNullable<GridRow["columns"]>[number]>;

// Local helper type to include the new boolean
type FeatureWithClick = NonNullable<GridRow["feature"]> & {
  enableClickToAddEyes?: boolean | null;
};

// Map grid column types to components
const componentMap: {
  [K in GridColumn["_type"]]: React.ComponentType<
    Extract<GridColumn, { _type: K }>
  >;
} = {
  "grid-card": GridCard,
  "pricing-card": PricingCard,
  "grid-post": GridPost,
  "grid-text-block": GridTextBlock,
};

const introPaddingClasses: Record<
  NonNullable<GridRow["introPadding"]>,
  string
> = {
  none: "py-0",
  sm: "py-8",
  md: "py-12",
  lg: "py-40",
};

// ----- INSET HELPERS -----

function buildInsetBackgroundStyle(
  insetBackground: NonNullable<GridRow["insetBackground"]>,
): CSSProperties {
  const { style, image, color, fromColor, toColor, angle } =
    insetBackground as any;
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

/**
 * Build inset box style + flags.
 *
 * - Background box itself is always width: 100% (full bleed inside its wrapper).
 * - If "inset" (width !== "full" and no customWidth), the wrapper around the box gets padding
 *   to visually inset the background inside the section.
 * - Height:
 *   - customHeight → explicit
 *   - height === "full" → 100% of the bg container (which is full section height)
 *   - else → auto
 * - Vertical offset (non-sticky only):
 *   - custom placement → marginTop = verticalOffsetPercent%
 *   - else → no marginTop
 */
function buildInsetBoxStyle(
  insetBackground: NonNullable<GridRow["insetBackground"]>,
  options: { isSticky: boolean },
): { style: CSSProperties; alignClass: string; isInset: boolean } {
  const base = buildInsetBackgroundStyle(insetBackground);

  const {
    width,
    height,
    customWidth,
    customHeight,
    position = "center",
    placementMode,
    verticalOffsetPercent,
  } = insetBackground as any;

  const { isSticky } = options;

  // Background box width: full by default
  if (customWidth) {
    base.width = customWidth;
  } else {
    base.width = "100%";
  }

  const isInset = !customWidth && width !== "full";

  // Height
  if (customHeight) {
    base.height = customHeight;
  } else if (height === "full") {
    base.height = "100%";
  }

  // Vertical offset for non-sticky only: ONLY when explicitly custom
  if (!isSticky) {
    if (
      placementMode === "custom" &&
      typeof verticalOffsetPercent === "number"
    ) {
      base.marginTop = `${verticalOffsetPercent}%`;
    }
  }

  // Horizontal alignment (relevant mainly for sticky)
  let alignClass = "";
  if (position === "left") {
    alignClass = "mr-auto";
  } else if (position === "right") {
    alignClass = "ml-auto";
  } else {
    alignClass = "mx-auto";
  }

  return { style: base, alignClass, isInset };
}

// ----- COMPONENT -----

export default function GridRow({
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
  feature,
  insetBackground,
  // NEW: custom overrides
  gridPaddingTop,
  gridPaddingBottom,
  gridPaddingLeft,
  gridPaddingRight,
  gridRowGap,
  gridColumnGap,
}: GridRow) {
  const color = stegaClean(colorVariant);
  const gridColsValue = stegaClean(gridColumns);

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
    GridRow["introPadding"]
  >;
  const introPaddingClass = introPaddingClasses[introPaddingKey];

  const mouseTrailEnabled = feature?.type === "mouseTrail";
  const rotatingImagesEnabled = feature?.type === "rotatingImages";
  const eyeFollowEnabled = feature?.type === "eyeFollow";

  const featureWithClick = feature as FeatureWithClick | null;

  const sectionId = `_gridrow-${_key}`;
  const hasInset = insetBackground?.enabled && insetBackground.style;
  const hasIntroOrGridTitle = introHasContent || !!gridTitle;

  // Cleaned custom overrides
  const cleanGridPaddingTop = stegaClean(gridPaddingTop);
  const cleanGridPaddingBottom = stegaClean(gridPaddingBottom);
  const cleanGridPaddingLeft = stegaClean(gridPaddingLeft);
  const cleanGridPaddingRight = stegaClean(gridPaddingRight);
  const cleanGridRowGap = stegaClean(gridRowGap);
  const cleanGridColumnGap = stegaClean(gridColumnGap);

  const gridStyle: CSSProperties = {};

  if (cleanGridPaddingTop) gridStyle.paddingTop = cleanGridPaddingTop as string;
  if (cleanGridPaddingBottom)
    gridStyle.paddingBottom = cleanGridPaddingBottom as string;
  if (cleanGridPaddingLeft)
    gridStyle.paddingLeft = cleanGridPaddingLeft as string;
  if (cleanGridPaddingRight)
    gridStyle.paddingRight = cleanGridPaddingRight as string;

  if (cleanGridRowGap) gridStyle.rowGap = cleanGridRowGap as string;
  if (cleanGridColumnGap) gridStyle.columnGap = cleanGridColumnGap as string;

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
        <EyeFollow
          containerId={sectionId}
          eyes={feature?.eyes as any}
          enableClickToAdd={Boolean(featureWithClick?.enableClickToAddEyes)}
        />
      )}

      <SectionContainer color={color} padding={padding}>
        {/* Wrapper so bg + mouse trail + content can live on different z-layers */}
        <div className="relative overflow-x-hidden lg:overflow-visible">

          {/* Background layer: absolute, full width & height of the section content */}
          {hasInset && insetBackground?.behavior !== "sticky" && (
            <div className="pointer-events-none absolute inset-0 z-0">
              <div className="relative h-full w-full">
                {(() => {
                  const { style, isInset } = buildInsetBoxStyle(
                    insetBackground as any,
                    { isSticky: false },
                  );

                  return (
                    <div className={cn("h-full w-full", isInset && "p-8")}>
                      <div
                        className={cn(
                          "h-full w-full overflow-hidden border border-border",
                          insetBackground?.border === false && "border-none",
                        )}
                        style={style}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Inset background – STICKY mode (in normal flow, not absolute overlay) */}
          {hasInset && insetBackground?.behavior === "sticky" && (
            (() => {
              const { style, alignClass, isInset } = buildInsetBoxStyle(
                insetBackground as any,
                { isSticky: true },
              );

              return (
                <div className="mb-10">
                  <div
                    className={cn(
                      "pointer-events-none sticky top-24",
                      alignClass,
                    )}
                  >
                    <div className={cn(isInset && "p-8")}>
                      <div
                        className={cn(
                          "overflow-hidden border border-border",
                          insetBackground.border === false && "border-none",
                        )}
                        style={style}
                      />
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* Mouse trail ABOVE bg overlay, BELOW content */}
          {mouseTrailEnabled && (
            <div className="pointer-events-none absolute inset-0 z-10 overflow-x-hidden">
              <MouseTrail
                containerId={sectionId}
                images={feature?.images as any}
              />
            </div>
          )}


          {/* All actual content above bg + mouse trail */}
          <div className="relative z-20">
            {introHasContent && (
              <div
                className={cn(
                  "container text-center",
                  introPaddingClass,
                )}
              >
                {tagLine && (
                  <h1 className="leading-[0] uppercase italic font-sans">
                    <span className="text-base font-semibold opacity-50">
                      {tagLine}
                    </span>
                  </h1>
                )}

                {title && (
                  <h2 className="mt-6 font-bold leading-[1.1] uppercase md:text-4xl lg:text-6xl max-w-[26ch] mx-auto ">
                    {title}
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

            {gridTitle && (
              <div
                className={cn(
                  "relative z-10 mb-8 text-center flex justify-center",
                  !introHasContent && "pt-12",
                )}
              >
                <h3 className="text-2xl lg:text-4xl font-sans font-semibold uppercase max-w-[28ch] lg:max-w-[34ch]">
                  {gridTitle}
                </h3>
              </div>
            )}

            {columns && columns.length > 0 && (
              <div
                className={cn(
                  "grid grid-cols-1 gap-6 relative z-10 p-12",
                  gridColsClass,
                )}
                style={gridStyle}
              >
                {columns.map((column) => {
                  const Component = componentMap[column._type];
                  if (!Component) {
                    console.warn(
                      `No component implemented for grid column type: ${column._type}`,
                    );
                  }

                  return Component ? (
                    <Component
                      {...(column as any)}
                      color={color}
                      key={column._key}
                    />
                  ) : (
                    <div data-type={column._type} key={column._key} />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
