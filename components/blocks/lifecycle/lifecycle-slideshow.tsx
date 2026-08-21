"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stegaClean } from "next-sanity";
import type { ColorVariant, PAGE_QUERYResult } from "@/sanity.types";
import { cn } from "@/lib/utils";
import TitleText from "@/components/ui/title-text";
import { BackgroundPanel } from "@/components/ui/background-panel";
import { getSectionSurfaceClass } from "@/components/blocks/shared/section-surface";
import LifecycleMemeSwarm from "./lifecycle-meme-swarm";
import LifecycleOrbit from "./lifecycle-orbit";
import LifecycleThreeScene from "./lifecycle-three-scene";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type LifecycleBlock = Extract<PageBlock, { _type: "lifecycle-slideshow" }>;

function SlideCopy({
  topText,
  centerText,
  textStyle,
}: {
  topText?: string | null;
  centerText?: string | null;
  textStyle?: LifecycleBlock["displayTextStyle"] | null;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center px-5 text-center">
      {topText && (
        <p
          data-lifecycle-top-text
          className="mt-20 max-w-[78vw] text-xs font-bold uppercase italic tracking-[-0.02em] sm:text-sm lg:mt-8 lg:text-base"
        >
          {stegaClean(topText)}
        </p>
      )}

      {centerText && (
        <div
          data-lifecycle-center-text
          className="absolute left-1/2 top-1/2 w-[min(92vw,960px)] -translate-x-1/2 -translate-y-1/2"
        >
          <TitleText
            variant="stretched"
            as="h2"
            size="display"
            align="center"
            maxChars={31}
            animation="none"
            className="whitespace-pre-line [text-wrap:balance]"
            textColor={textStyle?.fillColor?.hex || undefined}
            textOutline={Boolean(textStyle?.outline)}
            outlineColor={textStyle?.outlineColor?.hex || undefined}
            outlineWidth={textStyle?.outlineWidth ?? undefined}
            outlinePosition={textStyle?.outlinePosition ?? undefined}
            fontWeight={textStyle?.fontWeight ?? undefined}
          >
            {stegaClean(centerText)}
          </TitleText>
        </div>
      )}
    </div>
  );
}

export default function LifecycleSlideshow(props: LifecycleBlock) {
  const {
    _key,
    anchor,
    colorVariant,
    background,
    displayTextStyle,
    pinDuration,
    memeSlide,
    orbitSlide,
    objectSlide,
  } = props;
  const rootRef = useRef<HTMLElement | null>(null);
  const [boosted, setBoosted] = useState(false);

  const cleanColor = (stegaClean(colorVariant) || "background") as ColorVariant;
  const cleanAnchor = stegaClean(anchor?.anchorId) || undefined;
  const duration = Math.min(6, Math.max(2, pinDuration || 3.2));

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const slides = gsap.utils.toArray<HTMLElement>(
            "[data-lifecycle-slide]",
            root,
          );
          if (slides.length < 3) return;

          const memeImages = gsap.utils.toArray<HTMLElement>(
            "[data-lifecycle-meme-image]",
            root,
          );
          const orbitImages = gsap.utils.toArray<HTMLElement>(
            "[data-lifecycle-orbit-image]",
            root,
          );
          const threeStage = root.querySelector<HTMLElement>(
            "[data-lifecycle-three-stage]",
          );

          gsap.set(slides, { autoAlpha: 0, yPercent: 5 });
          gsap.set(slides[0], { autoAlpha: 1, yPercent: 0 });

          const timeline = gsap.timeline({
            defaults: { ease: "power3.inOut" },
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: () => `+=${window.innerHeight * duration}`,
              scrub: 0.75,
              invalidateOnRefresh: true,
            },
          });

          if (memeImages.length) {
            timeline.fromTo(
              memeImages,
              { autoAlpha: 0, scale: 0, rotation: 0 },
              {
                autoAlpha: 1,
                scale: 1,
                rotation: 0,
                duration: 0.42,
                stagger: { each: 0.025, from: "random" },
                ease: "back.out(1.7)",
              },
              0,
            );
          }

          timeline
            .to(slides[0], { autoAlpha: 0, yPercent: -5, duration: 0.35 }, 0.8)
            .fromTo(
              slides[1],
              { autoAlpha: 0, yPercent: 7 },
              { autoAlpha: 1, yPercent: 0, duration: 0.42 },
              0.86,
            );

          if (orbitImages.length) {
            timeline.fromTo(
              orbitImages,
              { autoAlpha: 0, scale: 0.45 },
              {
                autoAlpha: 1,
                scale: 1,
                duration: 0.42,
                stagger: 0.025,
                ease: "back.out(1.5)",
              },
              0.94,
            );
          }

          timeline
            .to(slides[1], { autoAlpha: 0, yPercent: -5, duration: 0.35 }, 1.82)
            .fromTo(
              slides[2],
              { autoAlpha: 0, yPercent: 8 },
              { autoAlpha: 1, yPercent: 0, duration: 0.42 },
              1.88,
            );

          if (threeStage) {
            timeline.fromTo(
              threeStage,
              { yPercent: 72, rotation: -5, scale: 0.78 },
              {
                yPercent: 0,
                rotation: 0,
                scale: 1,
                duration: 0.68,
                ease: "power4.out",
              },
              1.92,
            );
          }

          timeline.to({}, { duration: 0.7 });

          requestAnimationFrame(() => ScrollTrigger.refresh());
        },
      );

      media.add(
        "(max-width: 1023px), (prefers-reduced-motion: reduce)",
        () => {
          const slides = gsap.utils.toArray<HTMLElement>(
            "[data-lifecycle-slide]",
            root,
          );
          const animatedItems = gsap.utils.toArray<HTMLElement>(
            "[data-lifecycle-meme-image], [data-lifecycle-orbit-image], [data-lifecycle-three-stage]",
            root,
          );

          if (slides.length) gsap.set(slides, { clearProps: "all" });
          if (animatedItems.length) {
            gsap.set(animatedItems, { clearProps: "opacity,visibility" });
          }
        },
      );
    }, root);

    return () => {
      media.revert();
      context.revert();
    };
  }, [duration]);

  const modelUrl =
    objectSlide?.model?.asset?.url || "/models/oakley-juliet-x-metal.glb";
  const fallbackImageUrl = objectSlide?.fallbackImage?.asset?.url;

  return (
    <section
      ref={rootRef}
      id={cleanAnchor || `_lifecycle-${_key}`}
      data-pin-to-viewport="true"
      data-pin-duration={duration}
      data-pin-spacing="true"
      className={cn("relative", getSectionSurfaceClass(cleanColor))}
    >
      <div
        data-pin-target="true"
        className="relative overflow-hidden lg:h-[100svh] lg:min-h-[680px]"
      >
        <BackgroundPanel background={background} />

        <article
          data-lifecycle-slide="meme"
          className="relative z-10 min-h-[92svh] overflow-hidden border-b border-current/15 lg:absolute lg:inset-0 lg:min-h-0 lg:border-0"
        >
          <LifecycleMemeSwarm memes={memeSlide?.memes} />
          <SlideCopy
            topText={memeSlide?.topText}
            centerText={memeSlide?.centerText}
            textStyle={displayTextStyle}
          />
        </article>

        <article
          data-lifecycle-slide="orbit"
          className="relative z-10 min-h-[92svh] overflow-hidden border-b border-current/15 lg:invisible lg:absolute lg:inset-0 lg:min-h-0 lg:opacity-0 lg:border-0"
        >
          <LifecycleOrbit
            centerImage={orbitSlide?.centerImage}
            images={orbitSlide?.orbitImages}
            duration={orbitSlide?.orbitDuration}
          />
          <SlideCopy
            topText={orbitSlide?.topText}
            centerText={orbitSlide?.centerText}
            textStyle={displayTextStyle}
          />
        </article>

        <article
          data-lifecycle-slide="object"
          className="relative z-10 min-h-[92svh] overflow-hidden lg:invisible lg:absolute lg:inset-0 lg:min-h-0 lg:opacity-0"
        >
          <div
            data-lifecycle-three-stage
            className="absolute inset-x-[4%] bottom-[8%] top-[16%] z-20 will-change-transform lg:inset-x-[12%] lg:bottom-[5%] lg:top-[10%]"
          >
            {fallbackImageUrl && !modelUrl && (
              <Image
                src={fallbackImageUrl}
                alt={objectSlide?.fallbackImage?.alt || ""}
                fill
                sizes="80vw"
                className="object-contain opacity-20 blur-[1px]"
              />
            )}
            <LifecycleThreeScene
              modelUrl={modelUrl}
              modelScale={objectSlide?.modelScale ?? 0.72}
              rotationSpeed={objectSlide?.rotationSpeed}
              boosted={boosted}
            />
          </div>

          <SlideCopy
            topText={objectSlide?.topText}
            centerText={objectSlide?.centerText}
            textStyle={displayTextStyle}
          />

          <button
            type="button"
            aria-pressed={boosted}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setBoosted(true);
            }}
            onPointerUp={() => setBoosted(false)}
            onPointerCancel={() => setBoosted(false)}
            onLostPointerCapture={() => setBoosted(false)}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                setBoosted(true);
              }
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") {
                setBoosted(false);
              }
            }}
            className="absolute bottom-6 right-5 z-50 flex h-20 w-20 touch-none select-none items-center justify-center rounded-full bg-[#ff241a] px-3 text-center text-[10px] font-bold uppercase leading-[0.95] text-white shadow-[0_16px_40px_rgba(255,36,26,0.35)] transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 lg:bottom-8 lg:right-8 lg:h-28 lg:w-28 lg:text-xs"
          >
            {stegaClean(objectSlide?.buttonLabel) || "Hold to spin"}
          </button>
        </article>
      </div>
    </section>
  );
}
