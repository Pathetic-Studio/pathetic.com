//components/blocks/grid/image-card.tsx
"use client";


import Image from "next/image";
import Link from "next/link";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRowImage = Extract<Block, { _type: "grid-row-image" }>;
type Item = NonNullable<NonNullable<GridRowImage["items"]>[number]>;
type ImageCardItem = Extract<Item, { _type: "image-card" }>;

interface ImageCardProps extends ImageCardItem { }

export default function ImageCard({
  title,
  body,
  image,
  link,
}: ImageCardProps) {
  const imageUrl = image?.asset?._id ? urlFor(image).url() : null;
  const altText = image?.alt ?? "";

  // Header content reused for placeholder + real overlay
  const Header = () => (
    <>
      {imageUrl && (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {title && (
        <div className="mx-auto">
          <h3 className="mt-2 text-center text-sm font-semibold uppercase tracking-tight">
            {title}
          </h3>
        </div>
      )}
    </>
  );

  return (
    <div className="group relative">
      {/* Invisible placeholder: defines grid footprint (image + title only) */}
      <div className="invisible">
        <Header />
      </div>

      {/* Actual card overlay: same position as placeholder, can overflow grid */}
      <div className="pointer-events-none absolute inset-0 z-20 group-hover:pointer-events-auto">
        <div className="relative">
          {/* Card background behind image+title */}
          <div className="absolute -inset-6 -z-10  border border-border bg-background opacity-0  transition-opacity duration-150 group-hover:opacity-100" />

          {/* Image + title: never change size/position on hover */}
          <Header />

          {/* Body + link: visually part of the same card, allowed to overflow */}
          {(body || (link && link.href)) && (
            <div className="mt-3 translate-y-1 opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
              {body && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <PortableTextRenderer value={body as any} />
                </div>
              )}

              {link && link.href && (
                <div className="mt-3">
                  <Link
                    href={link.href}
                    target={link.target ? "_blank" : undefined}
                    rel={link.target ? "noopener" : undefined}
                    className="inline-flex items-center text-xs font-medium uppercase tracking-tight underline-offset-4 hover:underline"
                  >
                    {link.title || "Learn more"}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
