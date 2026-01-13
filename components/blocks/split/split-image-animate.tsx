// components/blocks/split/split-image-animate.tsx
"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";

import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult } from "@/sanity.types";

import { Effect1 } from "./effects/effect-1";
import { Effect2 } from "./effects/effect-2";
import { Effect3 } from "./effects/effect-3";
import type { LensFlareProps } from "./effects/lens-flare";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitImageAnimateBase = Extract<
  NonNullable<SplitRow["splitColumns"]>[number],
  { _type: "split-image-animate" }
>;

type FlareOverrides = Partial<Omit<LensFlareProps, "isActive">>;

interface SplitImageAnimateProps extends SplitImageAnimateBase {
  activeIndex?: number;

  // imageStage:
  // 0 = off / not entered
  // 1 = base image only
  // 2 = Effect 1
  // 3 = Effect 2
  // 4 = Effect 3
  imageStage?: number;

  /**
   * Optional: tweak Effect2 without handling ramp logic here.
   * - effect2FlareProps applies to base layer (stage 3+) and the ramp layer (stage 4) defaults
   * - effect2RampProps applies only to the ramp layer (stage 4)
   */
  effect2FlareProps?: FlareOverrides;
  effect2RampProps?: FlareOverrides;
}

function clampIndex(i: number, len: number) {
  if (len <= 0) return 0;
  return Math.max(0, Math.min(len - 1, i));
}

export default function SplitImageAnimate({
  images,
  useCustomEffect,
  activeIndex = 0,
  imageStage = 0,
  effect2FlareProps,
  effect2RampProps,
}: SplitImageAnimateProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);

  const hasGalleryImages = !!images && images.length > 0;
  const clampedIndex = useMemo(
    () => (hasGalleryImages ? clampIndex(activeIndex, images!.length) : 0),
    [activeIndex, hasGalleryImages, images],
  );

  if (!useCustomEffect && !hasGalleryImages) return null;

  const baseSrc = "/split-image-animate-1.png";
  const effect1Src = "/effect-1.png";

  const effect1IsActive = !!useCustomEffect && imageStage >= 2;
  const effect2IsActive = !!useCustomEffect && imageStage >= 3;
  const effect3IsActive = !!useCustomEffect && imageStage >= 4;

  // Effect2 ramps up when Effect3 becomes active, and ramps down when leaving Effect3.
  const effect2Mode: "base" | "ramped" = effect3IsActive ? "ramped" : "base";

  return (
    <div className="relative flex items-start justify-center">
      <div ref={frameRef} className="flex w-full justify-center" data-image-track>
        <div className="relative mx-auto w-[35%] sm:w-[60%] md:w-[75%] max-w-md">
          <div className="relative w-full pt-[133.333%]">
            <div
              className="absolute inset-0"
              data-oval-container
              style={{
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "black",
                isolation: "isolate",
                boxShadow: `
                  0 0 6px rgba(0,0,0,1),
                  0 0 18px rgba(0,0,0,0.95),
                  0 0 36px rgba(0,0,0,0.85),
                  0 0 72px rgba(0,0,0,0.7)
                `,
              }}
            >
              <div className="pointer-events-none absolute inset-0" />

              {/* MODE 1: CMS images */}
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
                          alt=""
                          placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
                          blurDataURL={image?.asset?.metadata?.lqip || ""}
                          fill
                          className="object-cover scale-[1.04]"
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          quality={100}
                        />
                      </div>
                    );
                  })}
                </>
              )}

              {/* MODE 2: custom effect stack */}
              {useCustomEffect && (
                <>
                  {/* Base image */}
                  <div className="absolute inset-0">
                    <Image
                      src={baseSrc}
                      alt="Animated base"
                      fill
                      className="object-cover scale-[1.04]"
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      quality={100}
                    />
                  </div>

                  {/* EFFECT 1 */}
                  <Effect1
                    src={effect1Src}
                    isActive={effect1IsActive}
                    isBoosted={effect3IsActive}
                  />


                  {/* EFFECT 2 (ramps up smoothly while Effect3 is active, ramps down when leaving) */}
                  <Effect2
                    isActive={effect2IsActive}
                    mode={effect2Mode}
                    flareProps={effect2FlareProps}
                    rampProps={effect2RampProps}
                  />

                  {/* EFFECT 3 (extra flares inside) */}
                  <Effect3 isActive={effect3IsActive} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
