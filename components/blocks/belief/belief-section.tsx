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
  { side: "left", left: -34.38, top: 11.96, width: 86.81, height: 51.85, opacity: 0.5, floatGroup: "cloud-back-left-wide" },
  { side: "right", left: 52.43, top: -9.65, width: 86.81, height: 51.85, opacity: 0.5, floatGroup: "cloud-back-right-wide" },
  { side: "left", left: 22.08, top: 20.59, width: 63.47, height: 37.92, opacity: 0.3, floatGroup: "cloud-back-center" },
  { side: "right", left: 57.57, top: 38.55, width: 63.47, height: 37.92, opacity: 0.3, floatGroup: "cloud-back-right-lower" },
  { side: "left", left: -27.71, top: 51.15, width: 60, height: 35.81, opacity: 0.5, floatGroup: "cloud-lower-left" },
  { side: "right", left: 63.4, top: 14, width: 59.93, height: 35.81, opacity: 1, floatGroup: "cloud-mid-right" },
  { side: "right", left: 84.1, top: 56.65, width: 40.42, height: 24.1, opacity: 0.6, floatGroup: "cloud-lower-right-edge" },
  { side: "left", left: -22.22, top: -4.8, width: 62.78, height: 37.53, opacity: 1, flip: true, floatGroup: "cloud-upper-left" },
  { side: "left", left: -18.96, top: 9.53, width: 46.94, height: 28.07, opacity: 1, floatGroup: "cherub-left" },
  { side: "left", left: 7.99, top: 24.23, width: 18.36, height: 13.36, opacity: 0.3, floatGroup: "cloud-small-left" },
  { side: "right", left: 65.42, top: 7.54, width: 26, height: 16.05, opacity: 1, floatGroup: "cherub-right" },
  { side: "right", left: 42.15, top: 6.39, width: 41, height: 25.06, opacity: 1, floatGroup: "cloud-center-right" },
  { side: "right", left: 79.17, top: 23.59, width: 22.36, height: 13.36, opacity: 1, floatGroup: "hands" },
  { side: "left", left: 28.83, top: 22.84, width: 30, height: 18.93, opacity: 0.7, floatGroup: "cloud-center-left" },
] as const;

type BeliefFloatGroup = (typeof CLOUD_LAYERS)[number]["floatGroup"];
type BeliefFloatEffect = { speed: number; lag: number };

// A speed of 1 with zero lag leaves that named group neutral. Change either
// value here to opt the cloud into the same ScrollSmoother effect as the figures.
const BELIEF_FLOAT_EFFECTS: Record<BeliefFloatGroup, BeliefFloatEffect> = {
  "cloud-back-left-wide": { speed: 1, lag: 0 },
  "cloud-back-right-wide": { speed: 0.8, lag: 0.2 },
  "cloud-back-center": { speed: 1, lag: 0 },
  "cloud-back-right-lower": { speed: 1, lag: 0 },
  "cloud-lower-left": { speed: 0.9, lag: 0.5 },
  "cloud-mid-right": { speed: 1, lag: 0 },
  "cloud-lower-right-edge": { speed: 1, lag: 0 },
  "cloud-upper-left": { speed: 1, lag: 0 },
  "cherub-right": { speed: 0.9, lag: 0.42 },
  hands: { speed: 1.14, lag: 0.22 },
  "cherub-left": { speed: 0.6, lag: 0.2 },
  "cloud-small-left": { speed: 1, lag: 0 },
  "cloud-center-right": { speed: 1, lag: 0 },
  "cloud-center-left": { speed: 0.9, lag: 0.2 },
};

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
    clouds.map((cloud, index) => {
      const floatGroup = cloud.floatGroup;
      const floatEffect = BELIEF_FLOAT_EFFECTS[floatGroup];
      const floatEnabled = floatEffect.speed !== 1 || floatEffect.lag !== 0;

      return (
        <div
          key={`${cloud.side}-${cloud.left}-${cloud.top}-${index}`}
          data-belief-cloud-side={cloud.side}
          data-belief-cloud-group={floatGroup}
          data-belief-layer-side={cloud.side}
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
            data-belief-float={floatGroup}
            data-speed={floatEnabled ? floatEffect.speed : undefined}
            data-lag={floatEnabled ? floatEffect.lag : undefined}
            className="relative h-full w-full will-change-transform"
            style={{
              transform:
                "flip" in cloud && cloud.flip ? "scaleX(-1)" : undefined,
            }}
          >
            <div
              data-belief-idle={floatGroup}
              className="relative h-full w-full will-change-transform"
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
        </div>
      );
    });

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !cloudsEnabled) return;

    const context = gsap.context(() => {
      const leftLayers = gsap.utils.toArray<HTMLElement>(
        '[data-belief-layer-side="left"]',
        root,
      );
      const rightLayers = gsap.utils.toArray<HTMLElement>(
        '[data-belief-layer-side="right"]',
        root,
      );
      const glow = root.querySelector<SVGSVGElement>("[data-belief-sky-glow]");
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set([...leftLayers, ...rightLayers], {
          xPercent: 0,
          scale: 1,
        });
        gsap.set(glow, { autoAlpha: 1, scale: 1 });
        return;
      }

      gsap.set(leftLayers, { xPercent: -72, scale: 1.04 });
      gsap.set(rightLayers, { xPercent: 72, scale: 1.04 });
      gsap.set(glow, { autoAlpha: 0, scale: 0.82 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 90%",
          once: true,
        },
        defaults: {
          duration: partDuration,
          ease: "power2.out",
        },
      });

      timeline
        .to(
          leftLayers,
          {
            xPercent: 0,
            scale: 1,
            stagger: 0.025,
          },
          0,
        )
        .to(
          rightLayers,
          {
            xPercent: 0,
            scale: 1,
            stagger: 0.025,
          },
          0,
        )
        .to(
          glow,
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
    <div ref={rootRef} className="relative isolate overflow-visible">
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
          <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
            {renderClouds(CLOUD_LAYERS.slice(0, 5))}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[12] overflow-visible">
            <div
              data-belief-layer-side="right"
              data-belief-figure="cherub-right"
              className="absolute"
              style={{ left: "71.18%", top: "2.49%", width: "17.99%", height: "11.13%" }}
            >
              <div
                data-belief-float="cherub-right"
                data-speed={BELIEF_FLOAT_EFFECTS["cherub-right"].speed}
                data-lag={BELIEF_FLOAT_EFFECTS["cherub-right"].lag}
                className="relative h-full w-full will-change-transform"
              >
                <div data-belief-idle="cherub-right" className="relative h-full w-full will-change-transform">
                  <Image
                    src="/images/belief/cherub-top-right.png"
                    alt=""
                    fill
                    sizes="18vw"
                    className="z-10 object-contain"
                  />
                  <div
                    data-belief-cloud-group="cherub-right"
                    data-belief-attached-cloud="cherub-right"
                    className="absolute z-20"
                    style={{ left: "-32%", top: "20%", width: "145%", height: "144%" }}
                  >
                    <Image src={cloudSrc} alt="" fill sizes="28vw" className="object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[14] overflow-visible">
            {renderClouds(CLOUD_LAYERS.slice(5, 8))}
            {renderClouds(CLOUD_LAYERS.slice(9, 10))}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[15] overflow-visible">
            <div
              data-belief-layer-side="right"
              data-belief-figure="hands"
              className="absolute"
              style={{ left: "85.9%", top: "14%", width: "10.49%", height: "14.51%" }}
            >
              <div
                data-belief-float="hands"
                data-speed={BELIEF_FLOAT_EFFECTS.hands.speed}
                data-lag={BELIEF_FLOAT_EFFECTS.hands.lag}
                className="relative h-full w-full will-change-transform"
              >
                <div data-belief-idle="hands" className="relative h-full w-full will-change-transform">
                  <Image
                    src="/images/belief/praying-hands.png"
                    alt=""
                    fill
                    sizes="11vw"
                    className="z-10 object-contain"
                  />
                  <div
                    data-belief-cloud-group="hands"
                    data-belief-attached-cloud="hands"
                    className="absolute z-20"
                    style={{ left: "-64%", top: "35%", width: "213%", height: "92%" }}
                  >
                    <Image src={cloudSrc} alt="" fill sizes="24vw" className="object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[16] overflow-visible">
            {renderClouds(CLOUD_LAYERS.slice(11, 12))}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[17] overflow-visible">
            <div
              data-belief-layer-side="left"
              data-belief-figure="cherub-left"
              className="absolute"
              style={{ left: "-0.42%", top: "10.1%", width: "20.14%", height: "17.65%" }}
            >
              <div
                data-belief-float="cherub-left"
                data-speed={BELIEF_FLOAT_EFFECTS["cherub-left"].speed}
                data-lag={BELIEF_FLOAT_EFFECTS["cherub-left"].lag}
                className="relative h-full w-full will-change-transform"
              >
                <div data-belief-idle="cherub-left" className="relative h-full w-full will-change-transform">
                  <Image
                    src="/images/belief/cherub-left.png"
                    alt=""
                    fill
                    sizes="21vw"
                    className="z-10 object-contain"
                  />
                  <div
                    data-belief-cloud-group="cherub-left"
                    data-belief-attached-cloud="cherub-left"
                    className="absolute z-20"
                    style={{ left: "-92%", top: "-10%", width: "233%", height: "159%" }}
                  >
                    <Image src={cloudSrc} alt="" fill sizes="48vw" className="object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
            {renderClouds(CLOUD_LAYERS.slice(13))}
          </div>
        </>
      )}
      <GridRowAnimated {...props} />
      <style jsx>{`
        [data-belief-idle="cherub-right"] {
          animation: belief-idle-right 5.2s ease-in-out -1.1s infinite alternate;
        }

        [data-belief-idle="hands"] {
          animation: belief-idle-hands 4.35s ease-in-out -2.4s infinite alternate;
        }

        [data-belief-idle="cherub-left"] {
          animation: belief-idle-left 6.1s ease-in-out -3.2s infinite alternate;
        }

        @keyframes belief-idle-right {
          from { transform: translate3d(0, -5px, 0); }
          to { transform: translate3d(0, 7px, 0); }
        }

        @keyframes belief-idle-hands {
          from { transform: translate3d(0, 5px, 0); }
          to { transform: translate3d(0, -6px, 0); }
        }

        @keyframes belief-idle-left {
          from { transform: translate3d(0, -7px, 0); }
          to { transform: translate3d(0, 5px, 0); }
        }

        @media (max-width: 639px) {
          [data-belief-cloud-group] {
            height: auto !important;
            aspect-ratio: 428 / 278;
          }

          [data-belief-cloud-group="cloud-back-left-wide"] { left: -55% !important; top: -2rem !important; width: 130% !important; }
          [data-belief-cloud-group="cloud-back-right-wide"] { left: 35% !important; top: -4rem !important; width: 135% !important; }
          [data-belief-cloud-group="cloud-back-center"] { left: -1% !important; top: 5rem !important; width: 105% !important; }
          [data-belief-cloud-group="cloud-back-right-lower"] { left: 42% !important; top: 14rem !important; width: 100% !important; }
          [data-belief-cloud-group="cloud-lower-left"] { left: -45% !important; top: 15.5rem !important; width: 105% !important; }
          [data-belief-cloud-group="cloud-mid-right"] { left: 48% !important; top: 2.5rem !important; width: 95% !important; }
          [data-belief-cloud-group="cloud-lower-right-edge"] { left: 76% !important; top: 17rem !important; width: 68% !important; }
          [data-belief-cloud-group="cloud-upper-left"] { left: -45% !important; top: 0 !important; width: 105% !important; }
          [data-belief-cloud-group="cloud-small-left"] { left: -4% !important; top: 12.5rem !important; width: 55% !important; }
          [data-belief-cloud-group="cloud-center-right"] { left: 27% !important; top: 8.5rem !important; width: 92% !important; }
          [data-belief-cloud-group="cloud-center-left"] { left: 5% !important; top: 13.5rem !important; width: 78% !important; }

          [data-belief-attached-cloud="cherub-right"] { left: -30% !important; top: 30% !important; width: 190% !important; }
          [data-belief-attached-cloud="cherub-left"] { left: -50% !important; top: -10% !important; width: 200% !important; }
          [data-belief-attached-cloud="hands"] { left: -100% !important; top: 25% !important; width: 300% !important; }

          [data-belief-figure="cherub-right"] {
            left: 63% !important;
            top: 3rem !important;
            width: 38% !important;
            height: auto !important;
            aspect-ratio: 518 / 348;
          }

          [data-belief-figure="hands"] {
            left: 78% !important;
            top: 14.25rem !important;
            width: 21% !important;
            height: auto !important;
            aspect-ratio: 302 / 454;
          }

          [data-belief-figure="cherub-left"] {
            left: -2% !important;
            top: 7rem !important;
            width: 37% !important;
            height: auto !important;
            aspect-ratio: 568 / 552;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [data-belief-idle] {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
