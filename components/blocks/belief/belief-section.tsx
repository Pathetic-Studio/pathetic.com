"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERYResult } from "@/sanity.types";
import GridRowAnimated from "@/components/blocks/grid/grid-row-animated";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type BeliefBlock = Extract<PageBlock, { _type: "belief-section" }>;

const CLOUD_LAYERS = [
  { side: "left", left: -34.38, top: 11.96, width: 86.81, height: 51.85, opacity: 0.5 },
  { side: "right", left: 52.43, top: -9.65, width: 86.81, height: 51.85, opacity: 0.5 },
  { side: "left", left: 22.08, top: 20.59, width: 63.47, height: 37.92, opacity: 0.3 },
  { side: "right", left: 57.57, top: 38.55, width: 63.47, height: 37.92, opacity: 0.3 },
  { side: "left", left: -27.71, top: 51.15, width: 59.93, height: 35.81, opacity: 0.7 },
  { side: "right", left: 63.4, top: 14, width: 59.93, height: 35.81, opacity: 1 },
  { side: "right", left: 84.1, top: 56.65, width: 40.42, height: 24.1, opacity: 0.6 },
  { side: "left", left: -22.22, top: -4.8, width: 62.78, height: 37.53, opacity: 1, flip: true },
  { side: "left", left: -18.96, top: 9.53, width: 46.94, height: 28.07, opacity: 1 },
  { side: "left", left: 7.99, top: 24.23, width: 22.36, height: 13.36, opacity: 0.6 },
  { side: "right", left: 65.42, top: 7.54, width: 26.81, height: 16.05, opacity: 1 },
  { side: "right", left: 42.15, top: 6.39, width: 41.94, height: 25.06, opacity: 1 },
  { side: "right", left: 79.17, top: 23.59, width: 22.36, height: 13.36, opacity: 1 },
  { side: "left", left: 25.83, top: 20.84, width: 31.74, height: 18.93, opacity: 0.9 },
] as const;

/**
 * Dedicated What We Believe section entry point. Its first version deliberately
 * shares the proven animated-grid renderer so the extracted section remains
 * visually and behaviourally identical while giving us an independent block
 * to extend from here.
 */
export default function BeliefSection(props: BeliefBlock) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cloudsEnabled = stegaClean(props.cloudsEnabled) !== false;
  const cloudSrc = props.cloudImage?.asset?.url || "/images/what-we-do/cloud.png";
  const partDuration = Math.min(
    3,
    Math.max(0.5, stegaClean(props.cloudPartDuration) || 1.6),
  );

  const renderClouds = (
    clouds: ReadonlyArray<(typeof CLOUD_LAYERS)[number]>,
  ) =>
    clouds.map((cloud, index) => (
      <div
        key={`${cloud.side}-${cloud.left}-${cloud.top}-${index}`}
        data-belief-cloud-side={cloud.side}
        className="absolute origin-center will-change-transform"
        style={{
          left: `${cloud.left}%`,
          top: `${cloud.top}%`,
          width: `${cloud.width}%`,
          height: `${cloud.height}%`,
          opacity: cloud.opacity,
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            transform:
              "flip" in cloud && cloud.flip ? "scaleX(-1)" : undefined,
          }}
        >
          <Image
            src={cloudSrc}
            alt=""
            fill
            sizes={`${Math.ceil(cloud.width)}vw`}
            className="object-contain"
          />
        </div>
      </div>
    ));

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !cloudsEnabled) return;

    const context = gsap.context(() => {
      const leftClouds = gsap.utils.toArray<HTMLElement>(
        '[data-belief-cloud-side="left"]',
        root,
      );
      const rightClouds = gsap.utils.toArray<HTMLElement>(
        '[data-belief-cloud-side="right"]',
        root,
      );
      const glow = root.querySelector<SVGSVGElement>("[data-belief-sky-glow]");
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set([...leftClouds, ...rightClouds], {
          xPercent: 0,
          scale: 1,
        });
        gsap.set(glow, { autoAlpha: 1, scale: 1 });
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 82%",
          once: true,
        },
        defaults: {
          duration: partDuration,
          ease: "power3.out",
        },
      });

      timeline
        .fromTo(
          leftClouds,
          { xPercent: 62, scale: 1.1 },
          {
            xPercent: 0,
            scale: 1,
            stagger: 0.08,
          },
          0,
        )
        .fromTo(
          rightClouds,
          { xPercent: -62, scale: 1.1 },
          {
            xPercent: 0,
            scale: 1,
            stagger: 0.08,
          },
          0,
        )
        .fromTo(
          glow,
          { autoAlpha: 0, scale: 0.72 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: partDuration * 0.9,
          },
          partDuration * 0.08,
        );
    }, root);

    return () => context.revert();
  }, [cloudsEnabled, partDuration]);

  return (
    <div ref={rootRef} className="relative isolate">
      {cloudsEnabled && (
        <>
          <svg
            data-belief-sky-glow
            aria-hidden="true"
            viewBox="0 0 1440 1564"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 z-[5] h-full w-full opacity-0"
          >
            <defs>
              <filter
                id={`belief-glow-${props._key}`}
                x="110.602"
                y="10.0742"
                width="1353.7"
                height="712.57"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="100" />
              </filter>
            </defs>
            <path
              d="M462.685 520.273C377.806 517.919 309.719 490.03 310.607 457.982C311.371 430.432 362.861 408.777 431.222 404.736C430.417 402.208 430.035 399.642 430.107 397.048C430.28 390.803 433.061 384.861 438.053 379.358C433.368 373.584 430.918 367.493 431.091 361.243C431.127 359.945 431.279 358.659 431.537 357.388C374.19 347.412 333.922 325.188 334.607 300.493C335.32 274.794 380.171 254.226 441.68 248.298C469.82 233.886 516.469 225.22 568.998 226.677C607.624 227.748 642.771 234.109 669.525 243.741C714.634 221.396 788.039 208.041 870.532 210.329C1005.98 214.085 1114.63 258.589 1113.21 309.73C1112.85 322.603 1105.56 334.668 1092.67 345.459C1099.08 345.33 1105.6 345.353 1112.22 345.536C1197.1 347.89 1265.18 375.779 1264.29 407.827C1263.41 439.875 1193.88 463.947 1109 461.593C1087.46 460.996 1067.01 458.754 1048.49 455.219C1024.34 496.725 924.65 525.674 806.232 522.389C727.038 520.193 657.005 504.066 612.777 480.827C595.07 505.411 534.348 522.261 462.685 520.273Z"
              fill="#627AFF"
              filter={`url(#belief-glow-${props._key})`}
            />
          </svg>

          {/* The export uses several interleaved cloud/figure layers. Keep that
              stack here so the figures sit inside the cloud bank, not on it. */}
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            {renderClouds(CLOUD_LAYERS.slice(0, 5))}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[12] overflow-hidden">
            <div
              className="absolute"
              style={{ left: "71.18%", top: "2.49%", width: "17.99%", height: "11.13%" }}
            >
              <Image
                src="/images/belief/cherub-top-right.png"
                alt=""
                fill
                sizes="18vw"
                className="object-contain"
              />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[14] overflow-hidden">
            {renderClouds(CLOUD_LAYERS.slice(5, 11))}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[15] overflow-hidden">
            <div
              className="absolute"
              style={{ left: "85.9%", top: "14%", width: "10.49%", height: "14.51%" }}
            >
              <Image
                src="/images/belief/praying-hands.png"
                alt=""
                fill
                sizes="11vw"
                className="object-contain"
              />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[16] overflow-hidden">
            {renderClouds(CLOUD_LAYERS.slice(11, 12))}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[17] overflow-hidden">
            <div
              className="absolute"
              style={{ left: "-0.42%", top: "10.1%", width: "20.14%", height: "17.65%" }}
            >
              <Image
                src="/images/belief/cherub-left.png"
                alt=""
                fill
                sizes="21vw"
                className="object-contain"
              />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
            {renderClouds(CLOUD_LAYERS.slice(12))}
          </div>
        </>
      )}
      <GridRowAnimated {...props} />
    </div>
  );
}
