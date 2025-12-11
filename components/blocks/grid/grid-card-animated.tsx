// components/blocks/grid/grid-card-animated.tsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult, ColorVariant } from "@/sanity.types";
import CaptionBubble from "./caption-bubble";
import type { GridCardParallaxConfig } from "./grid-row-animated-parallax";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRowAnimated = Extract<Block, { _type: "grid-row-animated" }>;
type GridColumn = NonNullable<NonNullable<GridRowAnimated["columns"]>>[number];
type GridCardAnimatedBlock = Extract<GridColumn, { _type: "grid-card-animated" }>;

interface GridCardAnimatedProps
  extends Omit<GridCardAnimatedBlock, "_type" | "_key"> {
  color?: ColorVariant;
  parallaxConfig?: GridCardParallaxConfig; // NEW
}

export default function GridCardAnimated({
  color,
  title,
  excerpt,
  image,
  link,
  caption,
  parallaxConfig,
}: GridCardAnimatedProps) {
  const hasLink = !!link?.href;
  const hasCaptionText = !!caption?.text;

  const imageSpeed = parallaxConfig?.imageSpeed;
  const bodySpeed = parallaxConfig?.bodySpeed;
  const captionSpeed = parallaxConfig?.captionSpeed;
  const buttonSpeed = parallaxConfig?.buttonSpeed;
  const titleSpeed = parallaxConfig?.titleSpeed;

  const CardInner = (
    <div
      className={cn(
        "flex w-full flex-col justify-between overflow-visible transition ease-in-out p-4 text-center",
        color === "primary" ? "text-background" : undefined,
      )}
    >
      <div>
        {image && image.asset?._id && (
          <div
            className="mb-4 relative w-full aspect-[4/5] h-[300px] lg:h-auto overflow-visible"
            data-speed={imageSpeed ?? undefined} // NEW
          >
            <Image
              src={urlFor(image).url()}
              alt={image.alt || ""}
              placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
              blurDataURL={image?.asset?.metadata?.lqip || ""}
              fill
              sizes="100vw"
              className="object-contain lg:object-cover"
              quality={100}
            />

            {hasCaptionText && (
              <CaptionBubble
                text={caption!.text!}
                bgColor={caption!.bgColor}
                textColor={caption!.textColor}
                side={caption!.side as any}
                xPercent={caption!.xPercent}
                yPercent={caption!.yPercent}
                parallaxSpeed={captionSpeed ?? null} // NEW
              />
            )}
          </div>
        )}

        {title && (
          <div className="mb-4">
            <h3 className="font-bold text-2xl uppercase"
              data-speed={titleSpeed ?? undefined}>{title}</h3>
          </div>
        )}

        {excerpt && (
          <p
            className="mx-auto max-w-prose"
            data-speed={bodySpeed ?? undefined} // NEW
          >
            {excerpt}
          </p>
        )}
      </div>

      {hasLink && (
        <Button
          className="mt-6"
          size="lg"
          variant={stegaClean(link?.buttonVariant)}
          data-speed={buttonSpeed ?? undefined} // optional, NEW
        >
          <div>{link?.title ?? "Learn More"}</div>
        </Button>
      )}
    </div>
  );

  if (hasLink) {
    return (
      <Link
        className="flex w-full ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
        href={link?.href ?? "#"}
        target={link?.target ? "_blank" : undefined}
        rel={link?.target ? "noopener" : undefined}
      >
        {CardInner}
      </Link>
    );
  }

  return <div className="flex w-full ring-offset-background">{CardInner}</div>;
}
