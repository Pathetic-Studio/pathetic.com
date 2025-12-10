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
import { PAGE_QUERYResult, ColorVariant } from "@/sanity.types";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";

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

// tokens for custom bg/text
type ThemeBgToken =
  | "background"
  | "foreground"
  | "primary"
  | "accent"
  | "muted";

type ThemeTextToken =
  | "foreground"
  | "background"
  | "primary-foreground"
  | "accent-foreground";

function bgFromToken(token?: ThemeBgToken | null) {
  switch (token) {
    case "primary":
      return "bg-primary";
    case "accent":
      return "bg-accent";
    case "muted":
      return "bg-muted";
    case "foreground":
      return "bg-foreground";
    case "background":
    default:
      return "bg-background";
  }
}

function textFromToken(token?: ThemeTextToken | null) {
  switch (token) {
    case "primary-foreground":
      return "text-primary-foreground";
    case "accent-foreground":
      return "text-accent-foreground";
    case "background":
      return "text-background";
    case "foreground":
    default:
      return "text-foreground";
  }
}

type ColorScheme = GridTextBlockType["colorScheme"];
type HoverColorScheme = GridTextBlockType["hoverColorScheme"];

function getBaseColorClasses(
  scheme: ColorScheme,
  customBgToken?: ThemeBgToken | null,
  customTextToken?: ThemeTextToken | null,
) {
  if (scheme === "inverted") {
    return {
      bg: "bg-foreground",
      text: "text-background",
    };
  }

  if (scheme === "custom") {
    return {
      bg: bgFromToken(customBgToken),
      text: textFromToken(customTextToken),
    };
  }

  // default
  return {
    bg: "bg-background",
    text: "text-foreground",
  };
}

function hoverBgFromToken(token?: ThemeBgToken | null) {
  switch (token) {
    case "primary":
      return "group-hover:bg-primary";
    case "accent":
      return "group-hover:bg-accent";
    case "muted":
      return "group-hover:bg-muted";
    case "foreground":
      return "group-hover:bg-foreground";
    case "background":
    default:
      return "group-hover:bg-background";
  }
}

function hoverTextFromToken(token?: ThemeTextToken | null) {
  switch (token) {
    case "primary-foreground":
      return "group-hover:text-primary-foreground";
    case "accent-foreground":
      return "group-hover:text-accent-foreground";
    case "background":
      return "group-hover:text-background";
    case "foreground":
    default:
      return "group-hover:text-foreground";
  }
}

function getHoverColorClasses(
  hoverChange: boolean | null | undefined,
  scheme: HoverColorScheme,
  customBgToken?: ThemeBgToken | null,
  customTextToken?: ThemeTextToken | null,
) {
  if (!hoverChange) {
    return { bg: "", text: "" };
  }

  if (scheme === "inverted") {
    return {
      bg: "group-hover:bg-foreground",
      text: "group-hover:text-background",
    };
  }

  if (scheme === "custom") {
    return {
      bg: hoverBgFromToken(customBgToken),
      text: hoverTextFromToken(customTextToken),
    };
  }

  // default
  return {
    bg: "group-hover:bg-background",
    text: "group-hover:text-foreground",
  };
}

function bevelClass(bevel?: boolean | null) {
  if (!bevel) return "";
  // subtle bevel using inset shadows; keep stable to avoid visual popping
  return "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.2)]";
}

type ContentProps = Pick<
  GridTextBlockProps,
  "titlePortable" | "bodyPortable" | "image" | "link" | "showButton"
>;

function CardContent({
  titlePortable,
  bodyPortable,
  image,
  link,
  showButton,
}: ContentProps) {
  const hasLink = !!link;

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

        {titlePortable && (
          <div className="flex justify-between uppercase items-center">
            <div className="font-bold text-center text-2xl w-full  [&_h1]:pb-0 [&_h2]:m-0! [&_h3]:pb-0 [&_h3]:m-0! [&_h2]:scale-x-65">
              <PortableTextRenderer value={titlePortable} />
            </div>
          </div>
        )}

        {bodyPortable && (
          <div className="text-base w-full text-center [&_h1]:uppercase  [&_h3]:uppercase [&_h3]:font-semibold [&_h4]:m-0!">
            <PortableTextRenderer value={bodyPortable} />
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

export default function GridTextBlock({
  color,
  titlePortable,
  bodyPortable,
  image,
  link,
  showButton,
  shape,
  blurShape,
  shapeHasBorder,
  bevel,
  colorScheme,
  colorBgCustomToken,
  colorTextCustomToken,
  hoverColorChange,
  hoverColorScheme,
  hoverColorBgCustomToken,
  hoverColorTextCustomToken,
  hoverScaleUp,
  effectStyle,
  enablePerspective,
}: GridTextBlockProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const hasHref = !!link?.href;
  const isContactLink = link?.linkType === "contact";
  const hasAnyLink = !!link;
  const isDownloadLink = link?.linkType === "download";

  const effectiveShape = shape || "rectangle";
  const variant: GridTextBlockType["effectStyle"] = effectStyle || "normal";

  const baseColors = getBaseColorClasses(
    colorScheme || "default",
    colorBgCustomToken as ThemeBgToken | null,
    colorTextCustomToken as ThemeTextToken | null,
  );

  const hoverColors = getHoverColorClasses(
    hoverColorChange,
    hoverColorScheme || "default",
    hoverColorBgCustomToken as ThemeBgToken | null,
    hoverColorTextCustomToken as ThemeTextToken | null,
  );

  const scaleHover =
    hoverScaleUp ?? false ? "group-hover:scale-[1.05]" : "";

  const shapeBorderClass =
    shapeHasBorder === false ? "" : "border border-border";

  const bevelClasses = bevelClass(bevel);

  useEffect(() => {
    if (!enablePerspective) return;

    const card = cardRef.current;
    if (!card) return;

    // set perspective on the card container
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

  const NormalCard = (
    <div
      ref={cardRef}
      className={cn(
        "relative w-full transform transition-transform duration-250 ease-in-out will-change-[transform]",
        scaleHover,
      )}
    >
      <div
        className={cn(
          "gtb-bg relative flex w-full flex-col justify-between py-4 lg:py-14 px-6 lg:px-26 transition-colors duration-250 ease-in-out will-change-[background-color,color]",
          baseColors.bg,
          baseColors.text,
          hoverColors.bg,
          hoverColors.text,
          shapeBorderClass,
          bevelClasses,
        )}
      >
        <div className="gtb-content will-change-[transform]">
          <CardContent
            titlePortable={titlePortable}
            bodyPortable={bodyPortable}
            image={image}
            link={link}
            showButton={showButton}
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
    >
      {/* Shape background */}
      <div
        className={cn(
          "absolute inset-0 -z-10 flex items-center justify-center pointer-events-none",
          blurShape && "blur-lg",
        )}
      >
        <div
          className={cn(
            "gtb-bg transition-colors duration-200 ease-in-out will-change-[background-color]",
            effectiveShape === "square"
              ? "aspect-square h-[90%] w-auto"
              : "w-full h-full",
            baseColors.bg,
            hoverColors.bg,
            shapeClipClass(effectiveShape),
            shapeBorderClass,
            bevelClasses,
          )}
        />
      </div>

      {/* Foreground content */}
      <div
        className={cn(
          "gtb-content relative flex w-full flex-col justify-between py-14 px-26 transition-colors duration-200 ease-in-out will-change-[color,transform]",
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
        />
      </div>
    </div>
  );

  let Card: React.ReactNode;
  switch (variant) {
    case "shape":
      Card = ShapeCard;
      break;
    case "normal":
    default:
      Card = NormalCard;
      break;
  }

  // 1) CONTACT LINK, NO BUTTON → whole card triggers modal
  if (isContactLink && showButton === false) {
    return (
      <ContactFormTrigger className="flex w-full ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group">
        {Card}
      </ContactFormTrigger>
    );
  }

  // 2) NORMAL LINK WITH HREF → whole card is a link
  if (hasHref) {
    // DOWNLOAD: use plain <a> so the download attribute works correctly
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

    // NON-DOWNLOAD: regular Next.js Link
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

  // 3) CONTACT LINK WITH BUTTON (or any other link without href) → just render card; button inside handles action.
  if (hasAnyLink) {
    return (
      <div className="flex w-full ring-offset-background group">
        {Card}
      </div>
    );
  }

  // 4) No link at all
  return <div className="flex w-full ring-offset-background group">{Card}</div>;
}
