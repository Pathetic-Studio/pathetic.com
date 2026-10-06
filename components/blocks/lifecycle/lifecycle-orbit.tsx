"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import type { LifecycleSlideTwoAsset } from "./lifecycle-slide-two-assets";

type LifecycleOrbitProps = {
  centerImage: LifecycleSlideTwoAsset;
  images: LifecycleSlideTwoAsset[];
  duration?: number | null;
};

export default function LifecycleOrbit({
  centerImage,
  images,
  duration = 18,
}: LifecycleOrbitProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const orbitImages = images.filter((image) => image.src);

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
    const slide = root.closest<HTMLElement>("[data-lifecycle-slide]");
    let onscreen = false;
    let width = root.clientWidth,
      height = root.clientHeight;
    const setters = items.map((item) => ({
      x: gsap.quickSetter(item, "x", "px"),
      y: gsap.quickSetter(item, "y", "px"),
      z: gsap.quickSetter(item, "z", "px"),
      // quickSetter needs individual transform properties: the `scale` alias
      // expands to an invalid DOM attribute (scaleX,scaleY) in WebKit.
      scaleX: gsap.quickSetter(item, "scaleX"),
      scaleY: gsap.quickSetter(item, "scaleY"),
      opacity: gsap.quickSetter(item, "opacity"),
    }));

    const update = (force = false) => {
      if (
        !force &&
        (!onscreen ||
          document.hidden ||
          reducedMotion ||
          slide?.style.opacity === "0" ||
          slide?.style.visibility === "hidden")
      )
        return;
      const radiusX = Math.min(width * 0.35, 430);
      const radiusY = Math.min(height * 0.3, 235);
      const elapsed = (performance.now() - startedAt) / 1000;
      const cycle = reducedMotion
        ? 0
        : (elapsed / Math.max(6, duration || 18)) * Math.PI * 2;

      items.forEach((item, index) => {
        const angle = cycle + (index / items.length) * Math.PI * 2;
        const depth = Math.sin(angle);
        const depthProgress = (depth + 1) / 2;

        const set = setters[index];
        set.x(Math.cos(angle) * radiusX);
        set.y(depth * radiusY);
        set.z(depth * 180);
        const scale = 0.68 + depthProgress * 0.55;
        set.scaleX(scale);
        set.scaleY(scale);
        set.opacity(0.52 + depthProgress * 0.48);
        item.style.zIndex = String(Math.round(8 + depthProgress * 32));
      });
    };

    const tick = () => update();
    const observer = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
    });
    observer.observe(root);
    const resize = new ResizeObserver(() => {
      width = root.clientWidth;
      height = root.clientHeight;
      update(true);
    });
    resize.observe(root);
    gsap.ticker.add(tick);
    update(true);

    return () => {
      gsap.ticker.remove(tick);
      observer.disconnect();
      resize.disconnect();
      gsap.set(items, { clearProps: "all" });
    };
  }, [duration, orbitImages.length]);

  return (
    <div
      ref={rootRef}
      data-lifecycle-orbit-stage
      className="pointer-events-none absolute inset-0 [perspective:1000px]"
      aria-hidden="true"
    >
      <div
        data-lifecycle-orbit-center
        className="absolute left-1/2 top-1/2 z-20 h-[44%] w-[34%] min-w-32 max-w-[360px] -translate-x-1/2 -translate-y-1/2 lg:h-[56%] lg:w-[28%]"
      >
        {centerImage.src ? (
          <Image
            src={centerImage.src}
            alt={centerImage.alt}
            fill
            sizes="(min-width: 1024px) 360px, 42vw"
            className="object-contain"
          />
        ) : (
          <div className="absolute inset-[12%] rounded-full border border-foreground/25 bg-foreground/5" />
        )}
      </div>

      {orbitImages.map((image, index) => (
        <div
          key={image.key}
          data-lifecycle-orbit-image
          className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 transform-gpu will-change-transform sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]"
        >
          <div
            data-lifecycle-orbit-reveal
            className="absolute inset-0 will-change-transform lg:opacity-0"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 90px, 64px"
              className="object-contain"
              priority={index < 3}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
