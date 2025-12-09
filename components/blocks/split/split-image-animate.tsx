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

  const hasGalleryImages = images && images.length > 0;
  const clampedIndex = hasGalleryImages && !useCustomEffect ? 0 : 0;

  if (!useCustomEffect && !hasGalleryImages) return null;

  const baseSrc = "/split-image-animate-1.png";
  const effect1Src = "/effect-1.png";
  const effect2Src = "/effect-2.png";
  const effect3Src = "/effect-3.png";

  const effect1IsActive = useCustomEffect && imageStage >= 2;
  const effect2IsActive = useCustomEffect && imageStage >= 3;
  const effect3IsActive = useCustomEffect && imageStage >= 4;

  return (
    <div className="relative flex items-start justify-center">
      <div
        ref={frameRef}
        className="flex justify-center w-full"
        data-image-track
      >
        {/* keep your vertical-ish width scale */}
        <div className="relative mx-auto w-[55%] sm:w-[60%] md:w-[75%] max-w-md">
          {/* 3:4 vertical ratio – drives the tall oval */}
          <div className="relative w-full pt-[133.333%]">
            {/* SINGLE OVAL CONTAINER: mask + shadow + background */}
            <div
              className="absolute inset-0"
              style={{
                borderRadius: "50%", // perfect oval based on this box
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
                          className="object-cover scale-[1.04]" // overfill to avoid any gaps
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

                  {/* EFFECT 1 – rotating overlay, soft light, always spinning */}
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
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{ transformOrigin: "center center" }}
                    >
                      <Image
                        src={effect1Src}
                        alt="Effect layer 1"
                        fill
                        className="object-cover scale-[1.04]"
                        style={{
                          mixBlendMode: "soft-light",
                          transformOrigin: "center center",
                        }}
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        quality={100}
                      />
                    </motion.div>
                  </motion.div>

                  {/* EFFECT 2 – rotating overlay, soft light, always spinning */}
                  <motion.div
                    className="absolute inset-0 aspect-square"
                    style={{
                      mixBlendMode: "soft-light",
                      transformOrigin: "center center",
                    }}
                    initial={false}
                    animate={
                      effect2IsActive
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.95 }
                    }
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div
                      className="relative w-full h-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 26,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{ transformOrigin: "center center" }}
                    >
                      <Image
                        src={effect2Src}
                        alt="Effect layer 2"
                        fill
                        className="object-cover scale-[1.04]"
                        style={{
                          mixBlendMode: "soft-light",
                          transformOrigin: "center center",
                        }}
                        sizes="(min-width: 1024px) 25vw, 100vw"
                        quality={100}
                      />
                    </motion.div>
                  </motion.div>

                  {/* EFFECT 3 – rotating overlay, pulsing brightness, soft light, always spinning */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      mixBlendMode: "soft-light",
                      transformOrigin: "center center",
                    }}
                    initial={false}
                    animate={
                      effect3IsActive
                        ? {
                          opacity: 1,
                        }
                        : {
                          opacity: 0,
                        }
                    }
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div
                      className="relative w-full h-full"
                      animate={
                        effect3IsActive
                          ? {
                            rotate: 360,
                            filter: [
                              "brightness(0.9)",
                              "brightness(1.3)",
                              "brightness(0.9)",
                            ],
                          }
                          : {
                            rotate: 360,
                            filter: "brightness(1)",
                          }
                      }
                      transition={{
                        rotate: {
                          duration: 22,
                          repeat: Infinity,
                          ease: "linear",
                        },
                        filter: effect3IsActive
                          ? {
                            duration: 2.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                          : {
                            duration: 0,
                          },
                      }}
                      style={{ transformOrigin: "center center" }}
                    >
                      <Image
                        src={effect3Src}
                        alt="Effect layer 3"
                        fill
                        className="object-cover scale-[1.04]"
                        style={{
                          mixBlendMode: "soft-light",
                          transformOrigin: "center center",
                        }}
                        sizes="(min-width: 1024px) 25vw, 100vw"
                        quality={100}
                      />
                    </motion.div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
