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
import { TEXT_STYLES, TEXT_WIDTHS } from "@/components/ui/text-styles";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRow = Extract<Block, { _type: "grid-row" }>;
type GridColumn = NonNullable<NonNullable<GridRow["columns"]>[number]>;

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
  // pinning (from Sanity)
  pinToViewport,
  pinDuration,
}: GridRow) {
  const pinOnDesktopOnly = true;

  const color = stegaClean(colorVariant);
  const sectionId = getSectionId("grid-row", _key, anchor?.anchorId ?? null);

  const mouseTrailContainerId = `${sectionId}-mouse-trail`;

  const gridColsValue = stegaClean(gridColumns);
  const isPinnedFromCms = Boolean(pinToViewport);
  const shouldPin = isPinnedFromCms && pinOnDesktopOnly;

  const rawPinDuration = stegaClean(pinDuration as any);
  const pinDurationValue =
    typeof rawPinDuration === "string" && rawPinDuration.trim() !== ""
      ? rawPinDuration.trim()
      : undefined;

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

  const titleAnimation = featureWithExtras?.titleAnimation ?? "none";
  const titleTypeOnEnabled = titleAnimation === "typeOn";
  const titleAnimationSpeed = featureWithExtras?.titleAnimationSpeed ?? 1.2;

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
      data-pin-to-viewport={shouldPin ? "true" : undefined}
      data-pin-duration={
        shouldPin && pinDurationValue ? pinDurationValue : undefined
      }
      data-pin-start={shouldPin ? "bottom bottom" : undefined}
      // keep overlay behaviour
      data-pin-spacing={shouldPin ? "false" : undefined}
      className={cn(
        // IMPORTANT: don’t let the section itself create a clipping context
        "relative overflow-x-hidden overflow-y-visible lg:overflow-visible",
        // section sits behind, next section can overlay
        shouldPin && "lg:z-0",
      )}
    >
      {rotatingImagesEnabled && (
        <RotatingImages containerId={sectionId} images={feature?.images as any} />
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
        {/* Pin THIS element (not the whole section) */}
        <div
          data-pin-target="true"
          className="relative overflow-visible"
        >
          {/* This is the actual visual container the trail should align to */}
          <div
            id={mouseTrailContainerId}
            className="relative overflow-x-hidden overflow-y-visible lg:overflow-visible"
          >
            <BackgroundPanel background={background as any} />

            {mouseTrailEnabled && (
              <div className="pointer-events-none absolute inset-0 z-10">
                <MouseTrail containerId={sectionId} images={feature?.images as any} />
              </div>
            )}

            <div className="relative py-8 z-20">
              {introHasContent && (
                <div className={cn("container text-center", introPaddingClass)}>
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
                      size="xl"
                      align="center"
                      maxChars={26}
                      animation={"typeOn"}
                      animationSpeed={
                        titleTypeOnEnabled ? titleAnimationSpeed : 1.2
                      }
                    >
                      {title}
                    </TitleText>
                  )}

                  {body && (
                    <div className={`mx-auto mt-6 ${TEXT_STYLES.bodyLarge} ${TEXT_WIDTHS.body}`}>
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
                            target={link.target ? "blank" : undefined}
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
                <div className="relative z-10 mt-8 mb-8 text-center flex justify-center">
                  <TitleText
                    variant="stretched"
                    as="h4"
                    size="md"
                    align="center"
                    maxChars={36}
                    animation={"none"}
                    animationSpeed={1.2}
                  >
                    {gridTitle}
                  </TitleText>
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
                      return <div data-type={column._type} key={column._key} />;
                    }

                    return (
                      <Component
                        {...(column as any)}
                        color={color}
                        key={column._key}
                      />
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
