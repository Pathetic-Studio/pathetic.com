// components/blocks/split/split-image-animate.tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitImageAnimateBase = Extract<
  NonNullable<SplitRow["splitColumns"]>[number],
  { _type: "split-image-animate" }
>;

interface SplitImageAnimateProps extends SplitImageAnimateBase {
  // activeIndex kept for compatibility but unused
  activeIndex?: number;
  // 0 = base only, 1 = image scaled, 2 = effect1, 3 = effect2
  imageStage?: number;
}

export default function SplitImageAnimate({
  images,
  useCustomEffect,
  imageStage = 0,
}: SplitImageAnimateProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);

  const hasGalleryImages = images && images.length > 0;
  const clampedIndex =
    hasGalleryImages && !useCustomEffect ? 0 : 0; // gallery mode no longer driven by index

  // If we're in CMS-image mode but have no images, render nothing
  if (!useCustomEffect && !hasGalleryImages) return null;

  const baseSrc = "/split-image-animate-1.png";
  const effect1Src = "/effect-1.png";
  const effect2Src = "/effect-2.jpeg";

  const effect1IsActive = useCustomEffect && imageStage >= 2;
  const effect2IsActive = useCustomEffect && imageStage >= 3;

  return (
    <div className="relative flex items-start justify-center">
      <div
        ref={frameRef}
        className="flex justify-center w-full"
        data-image-track
      >
        {/* OVAL FRAME (size controlled via responsive width, no transform gap) */}
        <div className="relative mx-auto w-[55%] sm:w-[60%] md:w-[75%] max-w-md">
          {/* 3:4 ratio box via padding (works reliably on mobile) */}
          <div className="relative w-full pt-[133.333%]">
            <div
              className="absolute inset-0 overflow-hidden bg-black"
              style={{
                borderRadius: "50%",
                boxShadow: "0 0 29px 45px rgba(0,0,0,1)",
              }}
            >
              <div className="pointer-events-none absolute inset-0" />

              {/* MODE 1: fade between CMS images */}
              {!useCustomEffect && hasGalleryImages && (
                <>
                  {images!.map((image, index) => {
                    if (!image?.asset?._id) return null;

                    return (
                      <div
                        key={image._key || image.asset._id}
                        className={`absolute inset-0 transition-opacity duration-500 ${index === clampedIndex
                            ? "opacity-100"
                            : "opacity-0"
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
                          className="object-cover"
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          quality={100}
                        />
                      </div>
                    );
                  })}
                </>
              )}

              {/* MODE 2: custom effect stack – driven by imageStage */}
              {useCustomEffect && (
                <>
                  {/* Base image with scale tied to stage */}
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
                      className="object-cover"
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      quality={100}
                    />
                  </motion.div>

                  {/* EFFECT 1: soft light at all times when active, fade/scale in, infinite rotate */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      mixBlendMode: "soft-light",
                      transformOrigin: "center center",
                    }}
                    initial={false}
                    animate={
                      effect1IsActive
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.85 }
                    }
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div
                      className="relative w-full h-full"
                      animate={
                        effect1IsActive ? { rotate: 360 } : { rotate: 0 }
                      }
                      transition={
                        effect1IsActive
                          ? {
                            duration: 18,
                            repeat: Infinity,
                            ease: "linear",
                          }
                          : { duration: 0.3 }
                      }
                      style={{ transformOrigin: "center center" }}
                    >
                      <Image
                        src={effect1Src}
                        alt="Effect layer 1"
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        quality={100}
                      />
                    </motion.div>
                  </motion.div>

                  {/* EFFECT 2: standard fade-in on its trigger */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-500 ${effect2IsActive ? "opacity-100" : "opacity-0"
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
    </div>
  );
}
