// components/blocks/grid/grid-card.tsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult, ColorVariant } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRow = Extract<Block, { _type: "grid-row" }>;
type GridColumn = NonNullable<NonNullable<GridRow["columns"]>>[number];
type GridCard = Extract<GridColumn, { _type: "grid-card" }>;

interface GridCardProps extends Omit<GridCard, "_type" | "_key"> {
  color?: ColorVariant;
}

export default function GridCard({
  color,
  title,
  excerpt,
  image,
  link,
}: GridCardProps) {
  return (
    <Link
      key={title}
      className="flex w-full  ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
      href={link?.href ?? "#"}
      target={link?.target ? "_blank" : undefined}
    >
      <div
        className={cn(
          "flex w-full flex-col justify-between overflow-hidden transition ease-in-out border  p-4",
          color === "primary"
            ? "group-hover:border-primary-foreground/50"
            : "group-hover:border-primary"
        )}
      >
        <div>
          {image && image.asset?._id && (
            <div className="mb-4 relative h-[15rem] sm:h-[20rem] md:h-[25rem] lg:h-[9.5rem] xl:h-[15rem]  overflow-hidden">
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
          <div
            className={cn(color === "primary" ? "text-background" : undefined)}
          >
            {title && (
              <div className="flex justify-between uppercase items-center mb-4">
                <h3 className="font-bold text-center text-2xl">{title}</h3>
              </div>
            )}
            {excerpt && <p>{excerpt}</p>}
          </div>
        </div>
        <Button
          className="mt-6"
          size="lg"
          variant={stegaClean(link?.buttonVariant)}
        >
          <div>{link?.title ?? "Learn More"}</div>
        </Button>
      </div>
    </Link>
  );
}
