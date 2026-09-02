// components/blocks/grid/image-card.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult } from "@/sanity.types";
import { cn } from "@/lib/utils";
import { TEXT_STYLES } from "@/components/ui/text-styles";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRowImage = Extract<Block, { _type: "grid-row-image" }>;
type Item = NonNullable<NonNullable<GridRowImage["items"]>[number]>;
type ImageCardItem = Extract<Item, { _type: "image-card" }>;

interface ImageCardProps extends ImageCardItem {
  // When true (used by grid-row-grab):
  // - mobile/tablet: static full card (body always visible)
  // - desktop: original overlay/hover behaviour
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
        <div className="relative aspect-[5/6] w-full overflow-hidden pointer-events-none">
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
          <h3 className={`mt-2 text-center ${TEXT_STYLES.label}`}>
            {title}
          </h3>
        </div>
      )}
    </>
  );

  // GRAB-ROW BEHAVIOUR
  if (showDetailsOnMobile) {
    return (
      <>
        {/* Mobile / Tablet: static full-height card (body always visible) */}
        <div className="block lg:hidden">
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
                      className={`inline-flex items-center underline-offset-4 hover:underline ${TEXT_STYLES.link}`}
                    >
                      {link.title || "Learn more"}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop: original overlay/hover behaviour */}
        <div className="hidden lg:block">
          <DesktopOverlayCard Header={Header} body={body} link={link} />
        </div>
      </>
    );
  }

  // DEFAULT (non-grab-row) usage: always overlay behaviour
  return <DesktopOverlayCard Header={Header} body={body} link={link} />;
}

type DesktopOverlayCardProps = {
  Header: React.FC;
  body: ImageCardProps["body"];
  link: ImageCardProps["link"];
};

function DesktopOverlayCard({ Header, body, link }: DesktopOverlayCardProps) {
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
          <div className="absolute -inset-3 lg:-inset-4 -z-10 border border-border bg-background opacity-0 transition-opacity duration-150 group-hover:opacity-100" />

          {/* Image + title: never change size/position on hover */}
          <Header />

          {/* Body + link: visually part of the same card, allowed to overflow */}
          {(body || (link && link?.href)) && (
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
                    className={`inline-flex items-center underline-offset-4 hover:underline ${TEXT_STYLES.link}`}
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
