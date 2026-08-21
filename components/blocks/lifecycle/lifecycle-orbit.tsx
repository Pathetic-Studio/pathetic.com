"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import type { PAGE_QUERYResult } from "@/sanity.types";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type LifecycleBlock = Extract<PageBlock, { _type: "lifecycle-slideshow" }>;
type OrbitSlide = NonNullable<LifecycleBlock["orbitSlide"]>;

type LifecycleOrbitProps = {
  centerImage?: OrbitSlide["centerImage"];
  images?: OrbitSlide["orbitImages"];
  duration?: number | null;
};

export default function LifecycleOrbit({
  centerImage,
  images,
  duration = 18,
}: LifecycleOrbitProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const orbitImages = (images ?? []).filter((image) => image.asset?.url);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = gsap.utils.toArray<HTMLElement>(
      "[data-lifecycle-orbit-image]",
      root,
    );
    if (!items.length) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const startedAt = performance.now();

    const update = () => {
      const bounds = root.getBoundingClientRect();
      const radiusX = Math.min(bounds.width * 0.35, 430);
      const radiusY = Math.min(bounds.height * 0.3, 235);
      const elapsed = (performance.now() - startedAt) / 1000;
      const cycle = reducedMotion
        ? 0
        : (elapsed / Math.max(6, duration || 18)) * Math.PI * 2;

      items.forEach((item, index) => {
        const angle = cycle + (index / items.length) * Math.PI * 2;
        const depth = Math.sin(angle);
        const depthProgress = (depth + 1) / 2;

        gsap.set(item, {
          x: Math.cos(angle) * radiusX,
          y: depth * radiusY,
          z: depth * 180,
          scale: 0.68 + depthProgress * 0.55,
          opacity: 0.52 + depthProgress * 0.48,
          rotation: 0,
          rotationX: 0,
          rotationY: 0,
          zIndex: Math.round(8 + depthProgress * 32),
        });
      });
    };

    gsap.ticker.add(update);
    update();

    return () => {
      gsap.ticker.remove(update);
      gsap.set(items, { clearProps: "all" });
    };
  }, [duration, orbitImages.length]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 [perspective:1000px]"
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-1/2 z-20 h-[44%] w-[34%] min-w-32 max-w-[360px] -translate-x-1/2 -translate-y-1/2 lg:h-[56%] lg:w-[28%]">
        {centerImage?.asset?.url ? (
          <Image
            src={centerImage.asset.url}
            alt={centerImage.alt || ""}
            fill
            sizes="(min-width: 1024px) 360px, 42vw"
            className="object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.16)]"
          />
        ) : (
          <div className="absolute inset-[12%] rounded-full border border-foreground/25 bg-foreground/5 shadow-[0_30px_80px_rgba(0,0,0,0.16)]" />
        )}
      </div>

      {orbitImages.map((image, index) => (
        <div
          key={image._key}
          data-lifecycle-orbit-image
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 transform-gpu will-change-transform sm:h-20 sm:w-20 lg:h-24 lg:w-24"
        >
          <Image
            src={image.asset!.url!}
            alt={image.alt || ""}
            fill
            sizes="(min-width: 1024px) 110px, 80px"
            className="object-contain drop-shadow-[0_16px_18px_rgba(0,0,0,0.16)]"
            priority={index < 3}
          />
        </div>
      ))}
    </div>
  );
}
