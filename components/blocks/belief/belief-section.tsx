"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
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

// Desktop positions are traced from cloud-guidance.svg. The cloud asset stays
// separate so every bank can keep its own opacity, drift and responsive offset.
const CLOUD_LAYERS = [
  { layer: "pre-glow", side: "right", left: 50, top: -10.74, width: 86.81, height: 51.85, opacity: 0.5, floatGroup: "cloud-back-right-wide" },
  { layer: "pre-glow", side: "left", left: -24.65, top: -5.88, width: 62.78, height: 37.53, opacity: 1, flip: true, floatGroup: "cloud-upper-left" },
  { layer: "pre-glow", side: "right", left: 39.72, top: 5.31, width: 41.94, height: 25.06, opacity: 1, floatGroup: "cloud-center-right" },
  { layer: "pre-glow", side: "right", left: 62.99, top: 6.46, width: 26.81, height: 16.05, opacity: 1, floatGroup: "cloud-top-right-small" },
  { layer: "pre-glow", side: "left", left: -21.39, top: 8.44, width: 46.94, height: 28.07, opacity: 1, floatGroup: "cloud-top-left-small" },
  { layer: "pre-glow", side: "left", left: -36.81, top: 10.87, width: 86.81, height: 51.85, opacity: 0.5, floatGroup: "cloud-back-left-wide" },
  { layer: "post-glow", side: "right", left: 60.97, top: 12.92, width: 59.93, height: 35.81, opacity: 1, floatGroup: "cloud-mid-right" },
  { layer: "foreground", side: "left", left: 19.65, top: 19.5, width: 63.47, height: 37.92, opacity: 0.3, floatGroup: "cloud-back-center" },
  { layer: "foreground", side: "right", left: 51.94, top: 25.7, width: 31.74, height: 18.93, opacity: 0.5, floatGroup: "cloud-center-left" },
  { layer: "foreground", side: "right", left: 74.65, top: 21.29, width: 26.53, height: 15.79, opacity: 1, floatGroup: "cloud-upper-right-small" },
  { layer: "foreground", side: "right", left: 57.99, top: 24.94, width: 63.47, height: 37.92, opacity: 0.3, floatGroup: "cloud-mid-right-soft" },
  { layer: "foreground", side: "left", left: 0.76, top: 21.61, width: 30.76, height: 18.35, opacity: 0.6, floatGroup: "cloud-mid-left-soft" },
  { layer: "pre-glow", side: "left", left: -16.11, top: 33.95, width: 82.71, height: 49.36, opacity: 0.5, floatGroup: "cloud-lower-left" },
  { layer: "foreground", side: "left", left: -31.53, top: 52.94, width: 59.93, height: 35.81, opacity: 0.65, floatGroup: "cloud-lower-left-dense" },
  { layer: "pre-glow", side: "right", left: 42.57, top: 58.63, width: 72.92, height: 43.54, opacity: 0.7, floatGroup: "cloud-lower-right-edge" },
  { layer: "pre-glow", side: "right", left: 40.07, top: 54.67, width: 41.74, height: 24.94, opacity: 0.4, floatGroup: "cloud-back-right-lower" },
  { layer: "foreground", side: "left", left: -22.08, top: 57.74, width: 63.47, height: 37.92, opacity: 0.3, floatGroup: "cloud-lower-left-soft" },
  { layer: "foreground", side: "right", left: 81.67, top: 55.56, width: 40.42, height: 24.1, opacity: 0.6, floatGroup: "cloud-lower-right-soft" },
  { layer: "foreground", side: "left", left: 26.46, top: 61.32, width: 48.54, height: 29.03, opacity: 0.4, floatGroup: "cloud-small-left" },
] as const;

type BeliefFloatGroup =
  | (typeof CLOUD_LAYERS)[number]["floatGroup"]
  | "cherub-left"
  | "cherub-right"
  | "hands";
type BeliefFloatEffect = { speed: number; lag: number };

// A speed of 1 with zero lag leaves that named group neutral. Change either
// value here to opt the cloud into the same ScrollSmoother effect as the figures.
const BELIEF_FLOAT_EFFECTS: Record<BeliefFloatGroup, BeliefFloatEffect> = {
  "cloud-back-left-wide": { speed: 0.92, lag: 0.12 },
  "cloud-back-right-wide": { speed: 0.8, lag: 0.2 },
  "cloud-back-center": { speed: 1.06, lag: 0.09 },
  "cloud-back-right-lower": { speed: 0.88, lag: 0.24 },
  "cloud-lower-left": { speed: 0.9, lag: 0.5 },
  "cloud-mid-right": { speed: 1.09, lag: 0.14 },
  "cloud-lower-right-edge": { speed: 0.86, lag: 0.3 },
  "cloud-upper-left": { speed: 1.04, lag: 0.08 },
  "cherub-right": { speed: 0.9, lag: 0.42 },
  hands: { speed: 1.14, lag: 0.22 },
  "cherub-left": { speed: 0.9, lag: 0.2 },
  "cloud-small-left": { speed: 1.12, lag: 0.16 },
  "cloud-center-right": { speed: 0.94, lag: 0.18 },
  "cloud-center-left": { speed: 0.9, lag: 0.2 },
  "cloud-mid-left-soft": { speed: 1.03, lag: 0.11 },
  "cloud-top-right-small": { speed: 1.05, lag: 0.1 },
  "cloud-top-left-small": { speed: 0.97, lag: 0.13 },
  "cloud-upper-right-small": { speed: 1.02, lag: 0.12 },
  "cloud-mid-right-soft": { speed: 0.96, lag: 0.16 },
  "cloud-lower-left-dense": { speed: 1.04, lag: 0.14 },
  "cloud-lower-left-soft": { speed: 0.95, lag: 0.18 },
  "cloud-lower-right-soft": { speed: 1.03, lag: 0.15 },
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
      const idleX = 1.5 + (index % 3) * 0.8;
      const idleY = 4 + (index % 4) * 1.7;

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
              className="belief-cloud-idle relative h-full w-full will-change-transform"
              style={
                {
                  "--belief-idle-x-from": `${index % 2 ? -idleX : idleX}px`,
                  "--belief-idle-x-to": `${index % 2 ? idleX : -idleX}px`,
                  "--belief-idle-y-from": `${-idleY}px`,
                  "--belief-idle-y-to": `${idleY}px`,
                  "--belief-idle-duration": `${4.6 + (index % 5) * 0.65}s`,
                  "--belief-idle-delay": `${-0.7 - index * 0.37}s`,
                } as CSSProperties
              }
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

    let revealIfVisible = () => {};
    const delayedVisibilityChecks: gsap.core.Tween[] = [];

    const context = gsap.context(() => {
      const leftLayers = gsap.utils.toArray<HTMLElement>(
        '[data-belief-layer-side="left"]',
        root,
      );
      const rightLayers = gsap.utils.toArray<HTMLElement>(
        '[data-belief-layer-side="right"]',
        root,
      );
      const glow = root.querySelector<HTMLElement>("[data-belief-sky-glow]");
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
      // The pulse is a persistent atmospheric layer, so it must not depend on
      // an entrance ScrollTrigger firing (hash/restored-position navigation can
      // legitimately arrive after that trigger point).
      gsap.set(glow, { autoAlpha: 1, scale: 0.82 });

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

      // A hash jump or restored browser position can place this section in the
      // viewport before ScrollTrigger receives its first scroll update. In that
      // case the entrance state used to strand several banks off-screen and
      // leave the blue glow invisible. Resolve the composition to its finished
      // state as soon as the section is already visible; ordinary page scrolling
      // still uses the full side-entry timeline above.
      revealIfVisible = () => {
        const bounds = root.getBoundingClientRect();
        const isVisible =
          bounds.top < window.innerHeight * 0.96 && bounds.bottom > 0;
        if (!isVisible) return;

        timeline.scrollTrigger?.kill(false);
        timeline.progress(1).pause();
        gsap.set([...leftLayers, ...rightLayers], {
          xPercent: 0,
          scale: 1,
        });
        gsap.set(glow, { autoAlpha: 1, scale: 1 });
      };

      delayedVisibilityChecks.push(
        gsap.delayedCall(1.2, revealIfVisible),
        gsap.delayedCall(3, revealIfVisible),
      );
    }, root);

    const revealOnPositionedScroll = () => {
      if (window.location.hash) revealIfVisible();
    };
    window.addEventListener("initial-hash-ready", revealIfVisible);
    window.addEventListener("scroll", revealOnPositionedScroll, { passive: true });

    return () => {
      window.removeEventListener("initial-hash-ready", revealIfVisible);
      window.removeEventListener("scroll", revealOnPositionedScroll);
      delayedVisibilityChecks.forEach((check) => check.kill());
      context.revert();
    };
  }, [cloudsEnabled, partDuration]);

  return (
    <div ref={rootRef} className="relative isolate overflow-visible">
      {cloudsEnabled && (
        <>
          <div
            data-belief-sky-glow
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
          >
            <div data-belief-glow-pulse="wide" className="belief-sky-glow-pulse absolute left-[18%] top-[2%] h-[35%] w-[70%] rounded-[50%] bg-[#627AFF] opacity-85 blur-[clamp(4rem,8vw,8rem)]" />
            <div data-belief-glow-pulse="core" className="belief-sky-glow-pulse absolute left-[33%] top-[8%] h-[22%] w-[42%] rounded-[50%] bg-[#7388ff] opacity-75 blur-[clamp(2.5rem,6vw,6rem)] [animation-delay:-1.7s]" />
          </div>

          {/* The export uses several interleaved cloud/figure layers. Keep that
              stack here so the figures sit inside the cloud bank, not on it. */}
          <div className="pointer-events-none absolute inset-0 z-[3] overflow-visible">
            {renderClouds(CLOUD_LAYERS.filter((cloud) => cloud.layer === "pre-glow"))}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[4] overflow-visible">
            <div
              data-belief-layer-side="right"
              data-belief-figure="cherub-right"
              className="absolute"
              style={{ left: "68.75%", top: "1.41%", width: "17.99%", height: "11.13%" }}
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
                    style={{ left: "-32%", top: "45%", width: "149%", height: "144%" }}
                  >
                    <Image src={cloudSrc} alt="" fill sizes="28vw" className="object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[10] overflow-visible">
            {renderClouds(CLOUD_LAYERS.filter((cloud) => cloud.layer === "post-glow"))}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[22] overflow-visible">
            <div
              data-belief-layer-side="right"
              data-belief-figure="hands"
              className="absolute"
              style={{ left: "83.47%", top: "12.92%", width: "10.49%", height: "14.51%" }}
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
                    style={{ left: "-84%", top: "58%", width: "253%", height: "109%" }}
                  >
                    <Image src={cloudSrc} alt="" fill sizes="24vw" className="object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[4] overflow-visible">
            <div
              data-belief-layer-side="left"
              data-belief-figure="cherub-left"
              className="absolute"
              style={{ left: "-2.85%", top: "9.02%", width: "20.14%", height: "17.65%" }}
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
                    className="z-30 object-contain"
                  />
                  <div
                    data-belief-cloud-group="cherub-left"
                    data-belief-attached-cloud="cherub-left"
                    className="absolute z-20"
                    style={{ left: "-92%", top: "-3%", width: "233%", height: "159%" }}
                  >
                    <Image src={cloudSrc} alt="" fill sizes="48vw" className="object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[21] overflow-visible">
            {renderClouds(CLOUD_LAYERS.filter((cloud) => cloud.layer === "foreground"))}
          </div>
        </>
      )}
      <GridRowAnimated {...props} />
      <style jsx>{`
        .belief-cloud-idle {
          animation: belief-idle-cloud var(--belief-idle-duration) ease-in-out
            var(--belief-idle-delay) infinite alternate;
        }

        .belief-sky-glow-pulse {
          transform-origin: 50% 50%;
          animation: belief-sky-pulse 4.8s ease-in-out infinite alternate;
          will-change: transform, opacity;
        }

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
          from { transform: translate3d(-3px, -9px, 0) rotate(-0.55deg); }
          to { transform: translate3d(4px, 10px, 0) rotate(0.7deg); }
        }

        @keyframes belief-idle-hands {
          from { transform: translate3d(-2px, 8px, 0) rotate(-0.45deg); }
          to { transform: translate3d(3px, -9px, 0) rotate(0.55deg); }
        }

        @keyframes belief-idle-left {
          from { transform: translate3d(-4px, -10px, 0) rotate(-0.65deg); }
          to { transform: translate3d(5px, 8px, 0) rotate(0.55deg); }
        }

        @keyframes belief-idle-cloud {
          from {
            transform: translate3d(
              var(--belief-idle-x-from),
              var(--belief-idle-y-from),
              0
            ) rotate(-0.22deg);
          }
          to {
            transform: translate3d(
              var(--belief-idle-x-to),
              var(--belief-idle-y-to),
              0
            ) rotate(0.22deg);
          }
        }

        @keyframes belief-sky-pulse {
          from {
            opacity: 0.68;
            transform: scale3d(0.96, 0.94, 1);
          }
          to {
            opacity: 1;
            transform: scale3d(1.055, 1.08, 1);
          }
        }

        @media (max-width: 1023px) {
          [data-belief-sky-glow] {
            height: 34rem !important;
          }

          [data-belief-glow-pulse="wide"] {
            left: -5% !important;
            top: 5.5rem !important;
            width: 110% !important;
            height: 18rem !important;
          }

          [data-belief-glow-pulse="core"] {
            left: 10% !important;
            top: 8rem !important;
            width: 80% !important;
            height: 13rem !important;
          }

          [data-belief-cloud-group] {
            height: auto !important;
            aspect-ratio: 428 / 278;
          }

          [data-belief-cloud-group="cloud-back-left-wide"] { left: -34% !important; top: -3rem !important; width: 94% !important; }
          [data-belief-cloud-group="cloud-back-right-wide"] { left: 38% !important; top: -4rem !important; width: 108% !important; }
          [data-belief-cloud-group="cloud-back-center"] { left: 8% !important; top: 5rem !important; width: 84% !important; }
          [data-belief-cloud-group="cloud-back-right-lower"] { left: 47% !important; width: 78% !important; }
          [data-belief-cloud-group="cloud-lower-left"] { left: -30% !important; width: 86% !important; }
          [data-belief-cloud-group="cloud-mid-right"] { left: 52% !important; top: 2.5rem !important; width: 76% !important; }
          [data-belief-cloud-group="cloud-lower-right-edge"] { left: 70% !important; width: 64% !important; }
          [data-belief-cloud-group="cloud-upper-left"] { left: -30% !important; top: -1rem !important; width: 84% !important; }
          [data-belief-cloud-group="cloud-small-left"] { left: 2% !important; width: 48% !important; }
          [data-belief-cloud-group="cloud-center-right"] { left: 35% !important; top: 8rem !important; width: 68% !important; }
          [data-belief-cloud-group="cloud-center-left"] { left: 14% !important; top: 13rem !important; width: 57% !important; }
          [data-belief-cloud-group="cloud-mid-left-soft"] { left: -8% !important; top: 9rem !important; width: 60% !important; }
          [data-belief-cloud-group="cloud-top-right-small"] { left: 66% !important; top: 4rem !important; width: 32% !important; }
          [data-belief-cloud-group="cloud-top-left-small"] { left: -22% !important; top: 4rem !important; width: 55% !important; }
          [data-belief-cloud-group="cloud-upper-right-small"] { left: 72% !important; top: 11rem !important; width: 42% !important; }
          [data-belief-cloud-group="cloud-mid-right-soft"] { left: 52% !important; width: 70% !important; }
          [data-belief-cloud-group="cloud-lower-left-dense"] { left: -30% !important; width: 72% !important; }
          [data-belief-cloud-group="cloud-lower-left-soft"] { left: -20% !important; width: 70% !important; }
          [data-belief-cloud-group="cloud-lower-right-soft"] { left: 70% !important; width: 55% !important; }

          [data-belief-attached-cloud="cherub-right"] { left: -34% !important; top: 36% !important; width: 174% !important; }
          [data-belief-attached-cloud="cherub-left"] { left: -66% !important; top: -7% !important; width: 214% !important; }
          [data-belief-attached-cloud="hands"] { left: -94% !important; top: 48% !important; width: 275% !important; }

          [data-belief-figure="cherub-right"] {
            left: 67% !important;
            top: 2.5rem !important;
            width: 28% !important;
            height: auto !important;
            aspect-ratio: 518 / 348;
          }

          [data-belief-figure="hands"] {
            left: 82% !important;
            top: 14rem !important;
            width: 15% !important;
            height: auto !important;
            aspect-ratio: 302 / 454;
          }

          [data-belief-figure="cherub-left"] {
            left: -1% !important;
            top: 7rem !important;
            width: 29% !important;
            height: auto !important;
            aspect-ratio: 568 / 552;
          }
        }

        @media (max-width: 639px) {

          [data-belief-glow-pulse="wide"] {
            left: -20% !important;
            top: 7rem !important;
            width: 140% !important;
            height: 18rem !important;
          }

          [data-belief-glow-pulse="core"] {
            left: 2% !important;
            top: 9rem !important;
            width: 96% !important;
            height: 14rem !important;
          }

          [data-belief-cloud-group="cloud-back-left-wide"] { left: -55% !important; top: -2rem !important; width: 130% !important; }
          [data-belief-cloud-group="cloud-back-right-wide"] { left: 35% !important; top: -4rem !important; width: 135% !important; }
          [data-belief-cloud-group="cloud-back-center"] { left: -1% !important; top: 5rem !important; width: 105% !important; }
          [data-belief-cloud-group="cloud-back-right-lower"] { left: 42% !important; width: 100% !important; }
          [data-belief-cloud-group="cloud-lower-left"] { left: -45% !important; width: 105% !important; }
          [data-belief-cloud-group="cloud-mid-right"] { left: 48% !important; top: 2.5rem !important; width: 95% !important; }
          [data-belief-cloud-group="cloud-lower-right-edge"] { left: 76% !important; width: 68% !important; }
          [data-belief-cloud-group="cloud-upper-left"] { left: -45% !important; top: 0 !important; width: 105% !important; }
          [data-belief-cloud-group="cloud-small-left"] { left: -4% !important; width: 55% !important; }
          [data-belief-cloud-group="cloud-center-right"] { left: 27% !important; top: 8.5rem !important; width: 92% !important; }
          [data-belief-cloud-group="cloud-center-left"] { left: 5% !important; top: 13.5rem !important; width: 78% !important; }
          [data-belief-cloud-group="cloud-mid-left-soft"] { left: -12% !important; top: 9rem !important; width: 74% !important; }
          [data-belief-cloud-group="cloud-top-right-small"] { left: 64% !important; top: 5rem !important; width: 46% !important; }
          [data-belief-cloud-group="cloud-top-left-small"] { left: -38% !important; top: 5rem !important; width: 75% !important; }
          [data-belief-cloud-group="cloud-upper-right-small"] { left: 72% !important; top: 11rem !important; width: 58% !important; }
          [data-belief-cloud-group="cloud-mid-right-soft"] { left: 46% !important; width: 90% !important; }
          [data-belief-cloud-group="cloud-lower-left-dense"] { left: -36% !important; width: 90% !important; }
          [data-belief-cloud-group="cloud-lower-left-soft"] { left: -28% !important; width: 85% !important; }
          [data-belief-cloud-group="cloud-lower-right-soft"] { left: 68% !important; width: 70% !important; }

          [data-belief-attached-cloud="cherub-right"] { left: -30% !important; top: 30% !important; width: 190% !important; }
          [data-belief-attached-cloud="cherub-left"] { left: -50% !important; top: -10% !important; width: 200% !important; }
          [data-belief-attached-cloud="hands"] { left: -100% !important; top: 42% !important; width: 300% !important; }

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
          [data-belief-idle],
          .belief-sky-glow-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
