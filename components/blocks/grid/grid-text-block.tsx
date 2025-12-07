import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult, ColorVariant } from "@/sanity.types";

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

function hoverBgClass(hoverBgColor: GridTextBlockType["hoverBgColor"]) {
  switch (hoverBgColor) {
    case "accent":
      return "group-hover:bg-accent";
    case "muted":
      return "group-hover:bg-muted";
    case "background":
      return "group-hover:bg-background";
    case "primary":
    default:
      return "group-hover:bg-primary";
  }
}

function hoverTextClass(hoverTextColor: GridTextBlockType["hoverTextColor"]) {
  switch (hoverTextColor) {
    case "onPrimary":
      return "group-hover:text-primary-foreground";
    case "onAccent":
      return "group-hover:text-accent-foreground";
    case "background":
      return "group-hover:text-background";
    case "foreground":
    default:
      return "group-hover:text-foreground";
  }
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
  const hasLink = !!link?.href;

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
        >
          <div>{link?.title ?? "Learn More"}</div>
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
  animateOnHover,
  hoverBgColor,
  hoverTextColor,
  hoverScaleUp,
  effectStyle,
  retroAnimate,
}: GridTextBlockProps) {
  const hasLink = !!link?.href;
  const effectiveShape = shape || "rectangle";
  const variant: GridTextBlockType["effectStyle"] =
    effectStyle || "normal";

  // NORMAL + SHAPE variants share hover config; RETRO has its own.
  const hoverEnabled =
    variant === "retro" ? false : !!animateOnHover;

  const bgHover =
    hoverEnabled && hoverBgColor
      ? hoverBgClass(hoverBgColor)
      : hoverEnabled
        ? hoverBgClass("primary")
        : "";

  const textHover =
    hoverEnabled && hoverTextColor
      ? hoverTextClass(hoverTextColor)
      : hoverEnabled
        ? hoverTextClass("foreground")
        : "";

  const scaleHover =
    hoverEnabled && (hoverScaleUp ?? true)
      ? "group-hover:scale-[1.05]"
      : "";

  const shapeBorderClass =
    shapeHasBorder === false ? "" : "border border-border";

  const NormalCard = (
    <div className={cn("relative w-full", scaleHover)}>
      <div
        className={cn(
          "relative flex w-full flex-col justify-between py-4 lg:py-14  px-6 lg:px-26 transition-colors duration-200 ease-in-out",
          "bg-background text-primary",
          bgHover,
          textHover,
          shapeBorderClass,
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

  const ShapeCard = (
    <div className={cn("relative w-full", scaleHover)}>
      {/* Shape background */}
      <div
        className={cn(
          "absolute inset-0 -z-10 flex items-center justify-center pointer-events-none",
          blurShape && "blur-lg",
        )}
      >
        <div
          className={cn(
            effectiveShape === "square"
              ? "aspect-square h-[90%] w-auto"
              : "w-full h-full",
            "bg-background",
            shapeClipClass(effectiveShape),
            shapeBorderClass,
            bgHover,
          )}
        />
      </div>

      {/* Foreground content */}
      <div
        className={cn(
          "relative flex w-full flex-col justify-between py-14  px-26 transition-colors duration-200 ease-in-out",
          "text-primary",
          textHover,
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

  const shouldRetroAnimate = retroAnimate !== false; // default true

  const RetroCard = (
    <div className="relative w-full">
      <div
        className={cn(
          "relative flex w-full flex-col justify-between py-4 px-4 md:py-5 md:px-5",
          // Classic Win95-style palette
          "bg-[#c0c0c0] text-black",
          // Outer border
          "border border-[#808080]",
          // Default bevel (raised)
          "[box-shadow:inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#404040]",
          shouldRetroAnimate &&
          [
            "transition-[transform,box-shadow] duration-150 ease-out",
            // Pressed / inset on hover and active
            "group-hover:translate-x-[2px] group-hover:translate-y-[2px]",
            "group-hover:[box-shadow:inset_1px_1px_0_#404040,inset_-1px_-1px_0_#ffffff]",
            "active:translate-x-[2px] active:translate-y-[2px]",
            "active:[box-shadow:inset_1px_1px_0_#404040,inset_-1px_-1px_0_#ffffff]",
          ]
            .filter(Boolean)
            .join(" "),
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
    case "retro":
      Card = RetroCard;
      break;
    case "normal":
    default:
      Card = NormalCard;
      break;
  }

  if (hasLink) {
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

  return <div className="flex w-full ring-offset-background group">{Card}</div>;
}
