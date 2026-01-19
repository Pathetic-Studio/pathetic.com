// components/blocks/grid/grid-text-block.tsx
"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import PortableTextRenderer from "@/components/portable-text-renderer";
import PortableTitleText, {
  hasPortableTextValue,
} from "@/components/ui/portable-title-text";
import { PAGE_QUERYResult, ColorVariant } from "@/sanity.types";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
import type { PortableTextProps } from "@portabletext/react";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRow = Extract<Block, { _type: "grid-row" }>;
type GridColumn = NonNullable<NonNullable<GridRow["columns"]>>[number];
type GridTextBlockType = Extract<GridColumn, { _type: "grid-text-block" }>;

interface GridTextBlockProps
  extends Omit<GridTextBlockType, "_type" | "_key"> {
  color?: ColorVariant;
}

function shapeClipClass(shape: GridTextBlockType["shape"]) {
  switch (shape) {
    case "oval":
      return "[clip-path:ellipse(50%_50%_at_50%_50%)]";
    case "circle":
      return "[clip-path:circle(50%)]";
    case "diamond":
      return "[clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]";
    case "star":
      return "[clip-path:polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]";
    case "square":
    case "rectangle":
    default:
      return "";
  }
}

type ColorScheme = GridTextBlockType["colorScheme"];
type HoverColorScheme = GridTextBlockType["hoverColorScheme"];

function getBaseColorClasses(scheme: ColorScheme) {
  if (scheme === "inverted") {
    return { bg: "bg-foreground", text: "text-background" };
  }

  if (scheme === "custom") {
    return {
      bg: "bg-[var(--gtb-bg)]",
      text: "text-[var(--gtb-text)]",
    };
  }

  return { bg: "bg-background", text: "text-foreground" };
}

function getHoverColorClasses(
  hoverChange: boolean | null | undefined,
  scheme: HoverColorScheme,
) {
  if (!hoverChange) return { bg: "", text: "" };

  if (scheme === "inverted") {
    return {
      bg: "group-hover:bg-foreground",
      text: "group-hover:text-background",
    };
  }

  if (scheme === "custom") {
    return {
      bg: "group-hover:bg-[var(--gtb-bg-hover)]",
      text: "group-hover:text-[var(--gtb-text-hover)]",
    };
  }

  return {
    bg: "group-hover:bg-background",
    text: "group-hover:text-foreground",
  };
}

type ContentProps = Pick<
  GridTextBlockProps,
  | "titlePortable"
  | "bodyPortable"
  | "image"
  | "link"
  | "showButton"
  | "useDecorativeTitle"
  | "useDecorativeBody"
>;

function CardContent({
  titlePortable,
  bodyPortable,
  image,
  link,
  showButton,
  useDecorativeTitle,
  useDecorativeBody,
}: ContentProps) {
  const hasLink = !!link;

  // ---- FIX: normalise null -> []
  const safeTitle = (titlePortable ?? []) as PortableTextProps["value"];
  const safeBody = (bodyPortable ?? []) as PortableTextProps["value"];

  const hasTitle = hasPortableTextValue(safeTitle);
  const hasBody = hasPortableTextValue(safeBody);

  return (
    <>
      <div>
        {image && image.asset?._id && (
          <div className="mb-4 relative h-[15rem] sm:h-[20rem] md:h-[25rem] lg:h-[9.5rem] xl:h-[15rem] overflow-hidden">
            <Image
              src={urlFor(image).url()}
              alt={image.alt || ""}
              placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
              blurDataURL={image?.asset?.metadata?.lqip || ""}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              quality={100}
            />
          </div>
        )}

        {hasTitle && (
          <div className="mb-3">
            {useDecorativeTitle ? (
              <PortableTitleText
                value={safeTitle}
                preset="title"
                mode="fit"
                align="center"
                baseSquishX={0.65}
                minSquishX={0.45}
                fitPaddingPx={0}
                uppercase
              />
            ) : (
              <div className="font-bold uppercase text-center text-2xl w-full [&_h1]:m-0 [&_h2]:m-0 [&_h3]:m-0 [&_h4]:m-0 [&_h5]:m-0 [&_p]:m-0">
                <PortableTextRenderer value={safeTitle} />
              </div>
            )}
          </div>
        )}

        {hasBody && (
          <div className="w-full text-center">
            {useDecorativeBody ? (
              <PortableTitleText
                value={safeBody}
                preset="body"
                mode="wrap"
                align="center"
                baseSquishX={0.85}
                minSquishX={0.65}
                fitPaddingPx={0}
                uppercase={false}
              />
            ) : (
              <div className="text-base w-full text-center [&_h1]:uppercase [&_h3]:uppercase [&_h3]:font-semibold [&_h4]:m-0!">
                <PortableTextRenderer value={safeBody} />
              </div>
            )}
          </div>
        )}
      </div>

      {hasLink && showButton !== false && (
        <Button
          className="mt-6"
          size="lg"
          variant={stegaClean(link?.buttonVariant)}
          link={link}
        >
          {link?.title ?? "Learn More"}
        </Button>
      )}
    </>
  );
}

type CSSVarStyle = React.CSSProperties & {
  "--gtb-bg"?: string;
  "--gtb-text"?: string;
  "--gtb-bg-hover"?: string;
  "--gtb-text-hover"?: string;
};

export default function GridTextBlock({
  color,
  titlePortable,
  bodyPortable,
  image,
  link,
  showButton,
  useDecorativeTitle,
  useDecorativeBody,
  shape,
  blurShape,
  shapeHasBorder,
  colorScheme,
  colorBgCustom,
  colorTextCustom,
  hoverColorChange,
  hoverColorScheme,
  hoverColorBgCustom,
  hoverColorTextCustom,
  hoverScaleUp,
  effectStyle,
  enablePerspective,
  retroHoverDepress,
}: GridTextBlockProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const hasHref = !!link?.href;
  const isContactLink = link?.linkType === "contact";
  const hasAnyLink = !!link;
  const isDownloadLink = link?.linkType === "download";

  const effectiveShape = shape || "rectangle";
  const variant: GridTextBlockType["effectStyle"] = effectStyle || "normal";

  const scheme: ColorScheme = colorScheme || "default";
  const hoverScheme: HoverColorScheme = hoverColorScheme || "default";

  const baseColors = getBaseColorClasses(scheme);
  const hoverColors = getHoverColorClasses(hoverColorChange, hoverScheme);

  const scaleHover =
    hoverScaleUp && variant !== "retro" ? "group-hover:scale-[1.05]" : "";

  const shapeBorderClass = shapeHasBorder === false ? "" : "border border-border";

  const isCustomBase = scheme === "custom";
  const isCustomHover = !!hoverColorChange && hoverScheme === "custom";

  const baseBgHex = colorBgCustom?.hex;
  const baseTextHex = colorTextCustom?.hex;
  const hoverBgHex = hoverColorBgCustom?.hex;
  const hoverTextHex = hoverColorTextCustom?.hex;

  const customStyle: CSSVarStyle = {};

  if (isCustomBase && baseBgHex) customStyle["--gtb-bg"] = baseBgHex;
  if (isCustomBase && baseTextHex) customStyle["--gtb-text"] = baseTextHex;
  if (isCustomHover && hoverBgHex) customStyle["--gtb-bg-hover"] = hoverBgHex;
  if (isCustomHover && hoverTextHex) customStyle["--gtb-text-hover"] = hoverTextHex;

  useEffect(() => {
    if (!enablePerspective) return;

    const card = cardRef.current;
    if (!card) return;

    gsap.set(card, { perspective: 650 });

    const outer = card.querySelector<HTMLElement>(".gtb-bg");
    const inner = card.querySelector<HTMLElement>(".gtb-content");
    if (!outer || !inner) return;

    const outerRX = gsap.quickTo(outer, "rotationX", { ease: "power3" });
    const outerRY = gsap.quickTo(outer, "rotationY", { ease: "power3" });
    const innerX = gsap.quickTo(inner, "x", { ease: "power3" });
    const innerY = gsap.quickTo(inner, "y", { ease: "power3" });

    const handleMove = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      outerRX(gsap.utils.interpolate(15, -15, y));
      outerRY(gsap.utils.interpolate(-15, 15, x));
      innerX(gsap.utils.interpolate(-30, 30, x));
      innerY(gsap.utils.interpolate(-30, 30, y));
    };

    const handleLeave = () => {
      outerRX(0);
      outerRY(0);
      innerX(0);
      innerY(0);
    };

    card.addEventListener("pointermove", handleMove);
    card.addEventListener("pointerleave", handleLeave);

    return () => {
      card.removeEventListener("pointermove", handleMove);
      card.removeEventListener("pointerleave", handleLeave);
      gsap.set(outer, { rotationX: 0, rotationY: 0 });
      gsap.set(inner, { x: 0, y: 0 });
    };
  }, [enablePerspective]);

  const hasCustomStyle = Object.keys(customStyle).length > 0;

  const NormalCard = (
    <div
      ref={cardRef}
      className={cn(
        "relative w-full transform transition-transform duration-250 ease-in-out will-change-[transform]",
        scaleHover,
      )}
      style={hasCustomStyle ? customStyle : undefined}
    >
      <div
        className={cn(
          "gtb-bg relative flex w-full flex-col justify-between py-4 lg:py-14 px-6 lg:px-26 transition-colors duration-250 ease-in-out will-change-[background-color,color]",
          baseColors.bg,
          baseColors.text,
          hoverColors.bg,
          hoverColors.text,
          shapeBorderClass,
        )}
      >
        <div className="gtb-content will-change-[transform]">
          <CardContent
            titlePortable={titlePortable}
            bodyPortable={bodyPortable}
            image={image}
            link={link}
            showButton={showButton}
            useDecorativeTitle={useDecorativeTitle}
            useDecorativeBody={useDecorativeBody}
          />
        </div>
      </div>
    </div>
  );

  const ShapeCard = (
    <div
      ref={cardRef}
      className={cn(
        "relative w-full transform transition-transform duration-200 ease-out will-change-[transform]",
        scaleHover,
      )}
      style={hasCustomStyle ? customStyle : undefined}
    >
      <div
        className={cn(
          "absolute inset-0 -z-10 flex items-center justify-center pointer-events-none",
          blurShape && "blur-lg",
        )}
      >
        <div
          className={cn(
            "gtb-bg transition-colors duration-200 ease-in-out will-change-[background-color]",
            effectiveShape === "square" ? "aspect-square h-[90%] w-auto" : "w-full h-full",
            baseColors.bg,
            hoverColors.bg,
            shapeClipClass(effectiveShape),
            shapeBorderClass,
          )}
        />
      </div>

      <div
        className={cn(
          "gtb-content relative flex w-full flex-col justify-between py-4 lg:py-14 px-6 lg:px-26 transition-colors duration-200 ease-in-out will-change-[color,transform]",
          baseColors.text,
          hoverColors.text,
        )}
      >
        <CardContent
          titlePortable={titlePortable}
          bodyPortable={bodyPortable}
          image={image}
          link={link}
          showButton={showButton}
          useDecorativeTitle={useDecorativeTitle}
          useDecorativeBody={useDecorativeBody}
        />
      </div>
    </div>
  );

  const RetroCard = (
    <div
      ref={cardRef}
      className={cn("relative w-full transform will-change-[transform]")}
      style={hasCustomStyle ? customStyle : undefined}
    >
      <div
        className={cn(
          "gtb-bg relative flex w-full flex-col justify-between py-4 lg:py-6 px-4 lg:px-6",
          "transition-[transform,box-shadow,background-color,color] duration-150 ease-out",
          "will-change-[transform,box-shadow,background-color,color]",
          baseColors.bg,
          baseColors.text,
          hoverColors.bg,
          hoverColors.text,
          "border border-[#808080]",
          "[box-shadow:inset_2px_2px_0_rgba(255,255,255,0.90),inset_-2px_-2px_0_rgba(0,0,0,0.65)]",
          retroHoverDepress &&
          [
            "group-hover:translate-x-[3px] group-hover:translate-y-[3px]",
            "active:translate-x-[3px] active:translate-y-[3px]",
            "group-hover:[box-shadow:inset_2px_2px_0_rgba(0,0,0,0.65),inset_-2px_-2px_0_rgba(255,255,255,0.90)]",
            "active:[box-shadow:inset_2px_2px_0_rgba(0,0,0,0.65),inset_-2px_-2px_0_rgba(255,255,255,0.90)]",
          ].join(" "),
        )}
      >
        <div className="gtb-content will-change-[transform]">
          <CardContent
            titlePortable={titlePortable}
            bodyPortable={bodyPortable}
            image={image}
            link={link}
            showButton={showButton}
            useDecorativeTitle={useDecorativeTitle}
            useDecorativeBody={useDecorativeBody}
          />
        </div>
      </div>
    </div>
  );

  let Card: React.ReactNode;
  switch (variant) {
    case "shape":
      Card = ShapeCard;
      break;
    case "retro":
      Card = RetroCard;
      break;
    case "normal":
    default:
      Card = NormalCard;
      break;
  }

  if (isContactLink && showButton === false) {
    return (
      <ContactFormTrigger className="flex w-full ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group">
        {Card}
      </ContactFormTrigger>
    );
  }

  if (hasHref) {
    if (isDownloadLink) {
      return (
        <a
          className="flex w-full ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
          href={link?.href ?? "#"}
          download={link?.downloadFilename || ""}
        >
          {Card}
        </a>
      );
    }

    return (
      <Link
        className="flex w-full ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
        href={link?.href ?? "#"}
        target={link?.target ? "_blank" : undefined}
      >
        {Card}
      </Link>
    );
  }

  if (hasAnyLink) {
    return <div className="flex w-full ring-offset-background group">{Card}</div>;
  }

  return <div className="flex w-full ring-offset-background group">{Card}</div>;
}
