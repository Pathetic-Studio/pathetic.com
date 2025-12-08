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
import { BackgroundPanel } from "@/components/ui/background-panel";
import TitleText from "@/components/ui/title-text";
import { getSectionId } from "@/lib/section-id";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRow = Extract<Block, { _type: "grid-row" }>;
type GridColumn = NonNullable<NonNullable<GridRow["columns"]>[number]>;

// Extend feature with local-only helpers
type FeatureWithExtras = NonNullable<GridRow["feature"]> & {
  enableClickToAddEyes?: boolean | null;
  titleAnimation?: "none" | "typeOn" | null;
  titleAnimationSpeed?: number | null;
};

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

export default function GridRow({
  _key,
  anchor,
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
  background,
  // custom overrides
  gridPaddingTop,
  gridPaddingBottom,
  gridPaddingLeft,
  gridPaddingRight,
  gridRowGap,
  gridColumnGap,
  // new boolean from Sanity
  pinToViewport,
}: GridRow) {
  const color = stegaClean(colorVariant);

  const sectionId = getSectionId(
    "grid-row",
    _key,
    anchor?.anchorId ?? null
  );

  const gridColsValue = stegaClean(gridColumns);
  const isPinned = Boolean(pinToViewport);

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

  const featureWithExtras = feature as FeatureWithExtras | null;

  const hasIntroOrGridTitle = introHasContent || !!gridTitle;

  // Title animation configuration coming from feature
  const titleAnimation = featureWithExtras?.titleAnimation ?? "none";
  const titleTypeOnEnabled = titleAnimation === "typeOn";
  const titleAnimationSpeed = featureWithExtras?.titleAnimationSpeed ?? 1.2;

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

  let containerStyle: React.CSSProperties | undefined;
  if (typeof anchor?.defaultOffsetPercent === "number") {
    containerStyle = {
      "--section-anchor-offset": String(anchor.defaultOffsetPercent),
    } as React.CSSProperties;
  }

  return (
    <section
      id={sectionId}
      data-pin-to-viewport={isPinned ? "true" : undefined}
      className={cn(
        "relative overflow-x-hidden lg:overflow-visible",
        isPinned && "min-h-screen",
      )}
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
          enableClickToAdd={Boolean(featureWithExtras?.enableClickToAddEyes)}
        />
      )}

      <SectionContainer
        id={sectionId}
        color={color}
        padding={padding}
        data-section-anchor-id={anchor?.anchorId || undefined}
        style={containerStyle}
      >
        <div
          className={cn(
            "relative",
            isPinned && "min-h-screen flex flex-col justify-end",
          )}
        >
          <div className="relative overflow-x-hidden lg:overflow-visible">
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
                    !hasIntroOrGridTitle && "pt-12",
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
        </div>
      </SectionContainer>
    </section>
  );
}
