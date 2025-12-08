// components/blocks/split/split-row.tsx
"use client";

import type React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult } from "@/sanity.types";
import SplitContent from "./split-content";
import SplitCardsList from "./split-cards-list";
import SplitImage from "./split-image";
import SplitImageAnimate from "./split-image-animate";
import SplitInfoList from "./split-info-list";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSectionId } from "@/lib/section-id";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitColumn = NonNullable<NonNullable<SplitRow["splitColumns"]>[number]>;

const componentMap: {
  [K in Exclude<
    SplitColumn["_type"],
    "split-cards-list" | "split-image-animate"
  >]: React.ComponentType<Extract<SplitColumn, { _type: K }>>;
} = {
  "split-content": SplitContent,
  "split-image": SplitImage,
  "split-info-list": SplitInfoList,
};

// static map so Tailwind picks up the classes
const introPaddingClasses: Record<
  NonNullable<SplitRow["introPadding"]>,
  string
> = {
  none: "py-0",
  sm: "py-8",
  md: "py-12",
  lg: "py-20",
};

export default function SplitRow({
  _key,
  anchor,

  padding,
  colorVariant,
  noGap,
  splitColumns,

  // Intro content
  tagLine,
  title,
  body,
  links,
  introPadding,
}: SplitRow) {
  const color = stegaClean(colorVariant);

  // shared index that both cards and image animate respond to
  const [activeIndex, setActiveIndex] = useState(0);

  const introHasContent =
    !!tagLine || !!title || !!body || (links && links.length > 0);

  const introPaddingClass =
    introPaddingClasses[
    (introPadding || "md") as keyof typeof introPaddingClasses
    ];

  const sectionId = getSectionId("split-row", _key, anchor?.anchorId ?? null);

  let containerStyle: React.CSSProperties | undefined;
  if (typeof anchor?.defaultOffsetPercent === "number") {
    containerStyle = {
      "--section-anchor-offset": String(anchor.defaultOffsetPercent),
    } as React.CSSProperties;
  }

  return (
    <SectionContainer

      color={color}
      padding={padding}
      data-section-anchor-id={anchor?.anchorId || undefined}

    >
      {/* Intro “hero-like” container */}
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
            <div className="text-lg mt-6 max-w-2xl mx-auto">
              <PortableTextRenderer value={body} />
            </div>
          )}

          {links && links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              {links.map((link) => (
                <Button
                  key={link.title}
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

      {/* Split grid below the intro */}
      {splitColumns && splitColumns.length > 0 && (
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-2",
            noGap ? "gap-0" : "gap-12 lg:gap-20"
          )}
        >
          {splitColumns.map((column) => {
            // GSAP-driven cards list: updates activeIndex as you scroll
            if (column._type === "split-cards-list") {
              return (
                <SplitCardsList
                  {...(column as any)}
                  key={column._key}
                  color={color}
                  activeIndex={activeIndex}
                  onActiveIndexChange={setActiveIndex}
                />
              );
            }

            // Image track responds to activeIndex (and GSAP scroll for movement)
            if (column._type === "split-image-animate") {
              return (
                <SplitImageAnimate
                  {...(column as any)}
                  key={column._key}
                  activeIndex={activeIndex}
                />
              );
            }

            const Component =
              componentMap[
              column._type as Exclude<
                SplitColumn["_type"],
                "split-cards-list" | "split-image-animate"
              >
              ];

            if (!Component) {
              console.warn(
                `No component implemented for split column type: ${column._type}`
              );
              return <div data-type={column._type} key={column._key} />;
            }

            return (
              <Component
                {...(column as any)}
                color={color}
                noGap={noGap}
                key={column._key}
              />
            );
          })}
        </div>
      )}
    </SectionContainer>
  );
}
