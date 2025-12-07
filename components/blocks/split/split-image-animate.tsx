// components/blocks/split/split-image-animate.tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitImageAnimateBase = Extract<
  NonNullable<SplitRow["splitColumns"]>[number],
  { _type: "split-image-animate" }
>;

interface SplitImageAnimateProps extends SplitImageAnimateBase {
  activeIndex?: number;
}

export default function SplitImageAnimate({
  images,
  useCustomEffect,
  activeIndex = 0,
}: SplitImageAnimateProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);

  const hasGalleryImages = images && images.length > 0;
  const clampedIndex =
    hasGalleryImages && !useCustomEffect
      ? Math.min(images.length - 1, Math.max(0, activeIndex ?? 0))
      : 0;

  // If we're in CMS-image mode but have no images, render nothing
  if (!useCustomEffect && !hasGalleryImages) return null;

  const baseSrc = "/split-image-animate-1.png";
  const effect1Src = "/effect-1.jpeg";
  const effect2Src = "/effect-2.jpeg";

  return (
    <div className="relative h-full flex items-start justify-center">
      <div
        ref={frameRef}
        className="flex justify-center w-full h-full"
        data-image-track
      >
        {/* OVAL FRAME */}
        <div
          className="relative w-[75%] max-w-md mx-auto"
          style={{ aspectRatio: "3 / 4" }} // vertical oval
        >
          <div
            className="absolute inset-0 overflow-hidden bg-black"
            style={{
              borderRadius: "50%",
              boxShadow: "0 0 29px 45px rgba(0,0,0,1)",
            }}
          >
            {/* heavy black inset fade, no white ring */}
            <div className="pointer-events-none absolute inset-0" />

            {/* MODE 1: fade between CMS images */}
            {!useCustomEffect && hasGalleryImages && (
              <>
                {images!.map((image, index) => {
                  if (!image?.asset?._id) return null;

                  return (
                    <div
                      key={image._key || image.asset._id}
                      className={`absolute inset-0 transition-opacity duration-500 ${index === clampedIndex ? "opacity-100" : "opacity-0"
                        }`}
                    >
                      <Image
                        src={urlFor(image).url()}
                        alt="" // no typed alt field on this image type
                        placeholder={
                          image?.asset?.metadata?.lqip ? "blur" : undefined
                        }
                        blurDataURL={image?.asset?.metadata?.lqip || ""}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        quality={100}
                      />
                    </div>
                  );
                })}
              </>
            )}

            {/* MODE 2: custom effect stack – driven by activeIndex */}
            {useCustomEffect && (
              <>
                <div className="absolute inset-0">
                  <Image
                    src={baseSrc}
                    alt="Animated base"
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    quality={100}
                  />
                </div>

                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${activeIndex >= 1 ? "opacity-100" : "opacity-0"
                    }`}
                >
                  <Image
                    src={effect1Src}
                    alt="Effect layer 1"
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    quality={100}
                  />
                </div>

                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${activeIndex >= 2 ? "opacity-100" : "opacity-0"
                    }`}
                >
                  <Image
                    src={effect2Src}
                    alt="Effect layer 2"
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 25vw, 100vw"
                    quality={100}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
