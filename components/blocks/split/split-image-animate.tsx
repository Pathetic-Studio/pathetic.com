// components/blocks/split/split-image-animate.tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult } from "@/sanity.types";

import { Effect1 } from "./effects/effect-1";
import { Effect2 } from "./effects/effect-2";
import { Effect3 } from "./effects/effect-3";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitImageAnimateBase = Extract<
  NonNullable<SplitRow["splitColumns"]>[number],
  { _type: "split-image-animate" }
>;

interface SplitImageAnimateProps extends SplitImageAnimateBase {
  activeIndex?: number;
  // imageStage:
  // 0 = off / not entered
  // 1 = base image only
  // 2 = Effect 1
  // 3 = Effect 2
  // 4 = Effect 3
  imageStage?: number;
}

export default function SplitImageAnimate({
  images,
  useCustomEffect,
  imageStage = 0,
}: SplitImageAnimateProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);

  const hasGalleryImages = !!images && images.length > 0;
  const clampedIndex = hasGalleryImages ? 0 : 0;

  if (!useCustomEffect && !hasGalleryImages) return null;

  const baseSrc = "/split-image-animate-1.png";
  const effect1Src = "/effect-1.png";
  const effect2Src = "/effect-2.png";
  const effect3Src = "/effect-3.png";

  const effect1IsActive = !!useCustomEffect && imageStage >= 2;
  const effect2IsActive = !!useCustomEffect && imageStage >= 3;
  const effect3IsActive = !!useCustomEffect && imageStage >= 4;

  return (
    <div className="relative flex items-start justify-center ">
      <div
        ref={frameRef}
        className="flex justify-center w-full"
        data-image-track
      >
        {/* keep your vertical-ish width scale */}
        <div className="relative h-[200px] md:h-auto mx-auto w-[35%] sm:w-[60%] md:w-[75%] max-w-md">
          {/* 3:4 vertical ratio – drives the tall oval */}
          <div className="relative h-[200px] md:h-auto w-full pt-[133.333%]">
            {/* SINGLE OVAL CONTAINER: mask + shadow + background */}
            <div
              className="absolute h-[200px] md:h-auto inset-0"
              style={{
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "black",
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
                          placeholder={
                            image?.asset?.metadata?.lqip ? "blur" : undefined
                          }
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
                  <motion.div
                    className="absolute inset-0"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: imageStage >= 1 ? 1 : 0.9 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <Image
                      src={baseSrc}
                      alt="Animated base"
                      fill
                      className="object-cover scale-[1.04]"
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      quality={100}
                    />
                  </motion.div>

                  {/* EFFECT 1 */}
                  <Effect1 src={effect1Src} isActive={effect1IsActive} />

                  {/* EFFECT 2 */}
                  <Effect2 src={effect2Src} isActive={effect2IsActive} />

                  {/* EFFECT 3 */}
                  <Effect3 src={effect3Src} isActive={effect3IsActive} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
