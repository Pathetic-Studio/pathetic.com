// components/blocks/grid/image-card.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult } from "@/sanity.types";
import { cn } from "@/lib/utils";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRowImage = Extract<Block, { _type: "grid-row-image" }>;
type Item = NonNullable<NonNullable<GridRowImage["items"]>[number]>;
type ImageCardItem = Extract<Item, { _type: "image-card" }>;

interface ImageCardProps extends ImageCardItem {
  showDetailsOnMobile?: boolean;
}

export default function ImageCard({
  title,
  body,
  image,
  link,
  showDetailsOnMobile,
}: ImageCardProps) {
  const imageUrl = image?.asset?._id ? urlFor(image).url() : null;
  const altText = image?.alt ?? "";

  const Header = () => (
    <>
      {imageUrl && (
        <div className="relative aspect-[4/3] w-full overflow-hidden pointer-events-none">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            draggable={false}
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            className="object-cover select-none"
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

  // Static layout: used in grab row (full height, no overlay tricks)
  if (showDetailsOnMobile) {
    return (
      <div className="relative">
        <Header />

        {(body || (link && link.href)) && (
          <div className="mt-3">
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
    );
  }

  // Original overlay behaviour for other grids
  return (
    <div className="group relative">
      {/* Placeholder defines grid footprint (header-only height) */}
      <div className="invisible">
        <Header />
      </div>

      {/* Overlay card */}
      <div className="pointer-events-none absolute inset-0 z-20 group-hover:pointer-events-auto">
        <div className="relative">
          <div className="absolute -inset-6 -z-10 border border-border bg-background opacity-0 transition-opacity duration-150 group-hover:opacity-100" />

          <Header />

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
