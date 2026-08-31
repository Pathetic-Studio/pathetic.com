"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { stegaClean } from "next-sanity";
import type { ColorVariant, PAGE_QUERYResult } from "@/sanity.types";
import { cn } from "@/lib/utils";
import TitleText from "@/components/ui/title-text";
import { BackgroundPanel } from "@/components/ui/background-panel";
import { getSectionSurfaceClass } from "@/components/blocks/shared/section-surface";
import LifecycleMemeSwarm from "./lifecycle-meme-swarm";
import LifecycleOrbit from "./lifecycle-orbit";
import LifecycleThreeScene from "./lifecycle-three-scene";
import {
  BUNDLED_SLIDE_TWO_CENTER,
  BUNDLED_SLIDE_TWO_ORBIT,
  type LifecycleSlideTwoAsset,
} from "./lifecycle-slide-two-assets";
import { useHeaderVisualTheme } from "@/components/header/visual-theme";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type LifecycleBlock = Extract<PageBlock, { _type: "lifecycle-slideshow" }>;
type LifecycleObjectHeaderEffect = {
  enabled?: boolean | null;
  accentColor?: { hex?: string | null } | null;
  idleIntensity?: number | null;
};

function LifecycleTitleCharacters({ text }: { text: string }) {
  return (
    <>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((token, tokenIndex) => {
          if (/^\s+$/.test(token)) return token;

          return (
            <span key={`${token}-${tokenIndex}`} className="inline-block">
              {Array.from(token).map((character, characterIndex) => (
                <span
                  key={`${character}-${characterIndex}`}
                  data-lifecycle-title-char
                  className="inline-block lg:opacity-0"
                >
                  {character}
                </span>
              ))}
            </span>
          );
        })}
      </span>
      <span className="sr-only">{text}</span>
    </>
  );
}

function SlideCopy({
  topText,
  centerText,
  textStyle,
}: {
  topText?: string | null;
  centerText?: string | null;
  textStyle?: LifecycleBlock["displayTextStyle"] | null;
}) {
  const cleanTopText = topText ? stegaClean(topText) : "";
  const cleanCenterText = centerText ? stegaClean(centerText) : "";

  return (
    <div className="pointer-events-none absolute inset-0 z-[90] flex flex-col items-center px-5 text-center">
      {cleanTopText && (
        <p
          data-lifecycle-top-text
          className="max-w-[90vw] pt-[13svh] text-xs font-bold uppercase italic tracking-[-0.02em] sm:text-sm lg:pt-[14svh] lg:text-base lg:opacity-0"
        >
          {cleanTopText}
        </p>
      )}

      {cleanCenterText && (
        <div
          data-lifecycle-center-text
          className="absolute left-1/2 top-1/2 w-[min(96vw,1200px)] -translate-x-1/2 -translate-y-1/2"
        >
          <TitleText
            variant="stretched"
            as="h2"
            size="display"
            align="center"
            maxChars={38}
            animation="none"
            className="whitespace-pre-line [text-wrap:balance]"
            textColor={textStyle?.fillColor?.hex || undefined}
            textOutline
            outlineColor="#ffffff"
            outlineWidth={2}
            outlinePosition="outside"
            fontWeight={textStyle?.fontWeight ?? undefined}
          >
            <LifecycleTitleCharacters text={cleanCenterText} />
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
  const [objectEntryKey, setObjectEntryKey] = useState(0);
  const [memeResetKey, setMemeResetKey] = useState(0);
  const boostedRef = useRef(false);
  const objectSlideActiveRef = useRef(false);
  const {
    setHeaderVisualTheme,
    clearHeaderVisualTheme,
  } = useHeaderVisualTheme();

  const cleanColor = (stegaClean(colorVariant) || "background") as ColorVariant;
  const cleanAnchor = stegaClean(anchor?.anchorId) || undefined;
  const duration = Math.min(10, Math.max(7, pinDuration || 7));
  const objectHeaderEffect = (
    objectSlide as
      | (typeof objectSlide & { headerEffect?: LifecycleObjectHeaderEffect | null })
      | undefined
  )?.headerEffect;
  const electricHeaderEnabled = stegaClean(objectHeaderEffect?.enabled) !== false;
  const electricAccent =
    stegaClean(objectHeaderEffect?.accentColor?.hex) || "#7ed7ff";
  const electricIntensity = Math.max(
    0.15,
    Math.min(1, stegaClean(objectHeaderEffect?.idleIntensity) ?? 1),
  );
  const headerThemeSource = `lifecycle:${stegaClean(_key) || _key}`;

  useEffect(() => {
    boostedRef.current = boosted;
    document.documentElement.toggleAttribute(
      "data-lifecycle-fun-active",
      boosted,
    );
    if (boosted && objectSlideActiveRef.current && electricHeaderEnabled) {
      setHeaderVisualTheme(headerThemeSource, {
        mode: "electric",
        accent: electricAccent,
        intensity: electricIntensity,
        progress: 1,
        priority: 10,
      });
    } else {
      clearHeaderVisualTheme(headerThemeSource);
    }

    return () => {
      document.documentElement.removeAttribute("data-lifecycle-fun-active");
    };
  }, [
    boosted,
    clearHeaderVisualTheme,
    electricAccent,
    electricHeaderEnabled,
    electricIntensity,
    headerThemeSource,
    setHeaderVisualTheme,
  ]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const next = root.nextElementSibling as HTMLElement | null;
    next?.setAttribute("data-lifecycle-fun-neighbor", "below");

    return () => {
      next?.removeAttribute("data-lifecycle-fun-neighbor");
    };
  }, []);

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
          const orbitReveals = gsap.utils.toArray<HTMLElement>(
            "[data-lifecycle-orbit-reveal]",
            root,
          );
          const orbitStage = root.querySelector<HTMLElement>(
            "[data-lifecycle-orbit-stage]",
          );
          const orbitCenter = root.querySelector<HTMLElement>(
            "[data-lifecycle-orbit-center]",
          );
          const bridgeSource = root.querySelector<HTMLElement>(
            '[data-lifecycle-bridge-source="true"]',
          );
          const bridgeFloat = bridgeSource?.querySelector<HTMLElement>(
            "[data-lifecycle-meme-float]",
          );
          const pinTarget = root.querySelector<HTMLElement>(
            '[data-pin-target="true"]',
          );
          const bridgeClone =
            bridgeSource && pinTarget
              ? (bridgeSource.cloneNode(true) as HTMLElement)
              : null;
          const departingMemeImages = bridgeSource
            ? memeImages.filter((image) => image !== bridgeSource)
            : memeImages;

          if (bridgeClone && pinTarget) {
            bridgeClone.removeAttribute("data-lifecycle-meme-image");
            bridgeClone.removeAttribute("data-lifecycle-bridge-source");
            bridgeClone.removeAttribute("style");
            bridgeClone.setAttribute("aria-hidden", "true");
            bridgeClone.tabIndex = -1;
            bridgeClone
              .querySelectorAll<HTMLElement>(
                "[data-lifecycle-meme-float], [data-lifecycle-meme-hover]",
              )
              .forEach((element) => element.removeAttribute("style"));
            Object.assign(bridgeClone.style, {
              position: "absolute",
              left: "0px",
              top: "0px",
              margin: "0px",
              transform: "none",
              translate: "none",
              rotate: "none",
              scale: "none",
              pointerEvents: "none",
              zIndex: "140",
            });
            bridgeClone.setAttribute("data-lifecycle-bridge-flight", "true");
            pinTarget.appendChild(bridgeClone);
            gsap.set(bridgeClone, { autoAlpha: 0 });
          }

          const relativeRect = (element: HTMLElement) => {
            const bounds = element.getBoundingClientRect();
            const parentBounds = pinTarget?.getBoundingClientRect();

            return {
              left: bounds.left - (parentBounds?.left ?? 0),
              top: bounds.top - (parentBounds?.top ?? 0),
              width: Math.max(1, bounds.width),
              height: Math.max(1, bounds.height),
            };
          };
          const threeStage = root.querySelector<HTMLElement>(
            "[data-lifecycle-three-stage]",
          );
          const progress = root.querySelector<HTMLElement>(
            "[data-lifecycle-progress]",
          );
          const topTextElements = slides.map((slide) =>
            slide.querySelector<HTMLElement>("[data-lifecycle-top-text]"),
          );
          const centerTextElements = slides.map((slide) =>
            slide.querySelector<HTMLElement>(
              "[data-lifecycle-center-text]",
            ),
          );
          const topTextSplits = topTextElements.map((element) =>
            element
              ? new SplitText(element, {
                  type: "chars",
                  reduceWhiteSpace: false,
                })
              : null,
          );
          const topTextChars = topTextSplits.map(
            (split) => (split?.chars ?? []) as HTMLElement[],
          );
          const centerTitleChars = slides.map((slide) =>
            gsap.utils.toArray<HTMLElement>(
              "[data-lifecycle-title-char]",
              slide,
            ),
          );
          const characterStagger = (
            chars: HTMLElement[],
            preferred: number,
            maxDuration: number,
          ) =>
            chars.length > 1
              ? Math.min(preferred, maxDuration / (chars.length - 1))
              : 0;

          gsap.set(slides, { autoAlpha: 0 });
          gsap.set(slides[0], { autoAlpha: 1 });
          gsap.set(topTextElements.filter(Boolean), { autoAlpha: 1 });
          gsap.set(topTextChars.flat(), { autoAlpha: 0 });
          gsap.set(centerTitleChars.flat(), { autoAlpha: 0 });
          gsap.set(centerTitleChars[0], { autoAlpha: 1 });
          gsap.set(centerTextElements.filter(Boolean), {
            scale: 1,
            transformOrigin: "50% 50%",
          });
          if (progress) {
            gsap.set(progress, {
              scaleX: 0,
              transformOrigin: "left center",
            });
          }
          if (orbitStage) {
            gsap.set(orbitStage, {
              autoAlpha: 1,
              scale: 1,
            });
          }
          if (orbitReveals.length) {
            gsap.set(orbitReveals, { autoAlpha: 0, scale: 0.45 });
          }
          if (threeStage) {
            gsap.set(threeStage, {
              yPercent: 68,
              rotation: 0,
              scale: 0.58,
              transformOrigin: "50% 50%",
            });
          }

          const subtitleEntrance = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          });

          if (topTextChars[0].length) {
            subtitleEntrance.to(topTextChars[0], {
              autoAlpha: 1,
              duration: 0.01,
              stagger: characterStagger(topTextChars[0], 0.018, 0.42),
              ease: "none",
            });
          }

          const waveMemeImages = [...memeImages].sort((a, b) => {
            const yDifference =
              Number(a.dataset.restY ?? 0) - Number(b.dataset.restY ?? 0);
            if (Math.abs(yDifference) > 3) return yDifference;
            return Number(a.dataset.restX ?? 0) - Number(b.dataset.restX ?? 0);
          });
          const firstSlideEntrance = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: "top 76%",
              toggleActions: "play none none reverse",
            },
          });

          if (waveMemeImages.length) {
            firstSlideEntrance.fromTo(
              waveMemeImages,
              { autoAlpha: 0, scale: 0.72, rotation: 0 },
              {
                autoAlpha: (_index, target) =>
                  Number((target as HTMLElement).dataset.restOpacity ?? 1),
                scale: (_index, target) =>
                  Number((target as HTMLElement).dataset.restScale ?? 1),
                rotation: 0,
                duration: 0.32,
                stagger: {
                  amount: 0.62,
                  from: "start",
                },
                ease: "back.out(1.7)",
              },
            );
          }

          const timeline = gsap.timeline({
            paused: true,
            defaults: { ease: "power3.inOut" },
          });

          const firstOutAt = 0;
          const bridgeStartAt = 0.2;
          const secondInAt = 0.72;
          const orbitImagesInAt = 0.75;
          const secondTextInAt = 0.78;
          const secondRestAt = 1.3;
          const secondOutAt = 1.72;
          const thirdInAt = 1.96;
          const thirdRestAt = 2.66;
          const timelineEnd = 3.1;

          timeline.call(
            () => setMemeResetKey((current) => current + 1),
            [],
            firstOutAt,
          );

          if (topTextElements[0]) {
            timeline.to(
              topTextElements[0],
              {
                autoAlpha: 0,
                duration: 0.1,
                ease: "power1.out",
              },
              firstOutAt,
            );
          }

          if (centerTextElements[0]) {
            timeline.to(
              centerTextElements[0],
              {
                autoAlpha: 0,
                duration: 0.1,
                ease: "power1.out",
              },
              firstOutAt,
            );
          }

          if (departingMemeImages.length) {
            timeline.to(
              departingMemeImages,
              {
                autoAlpha: 0,
                scale: 0.38,
                duration: 0.38,
                stagger: {
                  each:
                    departingMemeImages.length > 1
                      ? Math.min(
                          0.008,
                          0.24 / (departingMemeImages.length - 1),
                        )
                      : 0,
                  from: "random",
                },
                ease: "power3.inOut",
                overwrite: "auto",
              },
              firstOutAt,
            );
          }

          if (bridgeSource && bridgeClone && orbitCenter) {
            timeline
              .call(
                () => {
                  if (bridgeFloat) {
                    gsap.getTweensOf(bridgeFloat).forEach((tween) =>
                      tween.resume(),
                    );
                  }
                },
                [],
                bridgeStartAt - 0.1,
              )
              .call(
                () => {
                  if (bridgeFloat) {
                    gsap.getTweensOf(bridgeFloat).forEach((tween) =>
                      tween.pause(),
                    );
                  }
                },
                [],
                bridgeStartAt,
              )
              .set(
                bridgeClone,
                {
                  autoAlpha: 0,
                  left: () => relativeRect(bridgeSource).left,
                  top: () => relativeRect(bridgeSource).top,
                  width: () => relativeRect(bridgeSource).width,
                  height: () => relativeRect(bridgeSource).height,
                },
                bridgeStartAt,
              )
              .to(
                bridgeSource,
                {
                  autoAlpha: 0,
                  duration: 0.08,
                  ease: "none",
                },
                bridgeStartAt,
              )
              .to(
                bridgeClone,
                {
                  autoAlpha: 1,
                  duration: 0.08,
                  ease: "none",
                },
                bridgeStartAt,
              )
              .to(
                bridgeClone,
                {
                  left: () => relativeRect(orbitCenter).left,
                  top: () => relativeRect(orbitCenter).top,
                  width: () => relativeRect(orbitCenter).width,
                  height: () => relativeRect(orbitCenter).height,
                  duration: secondInAt - bridgeStartAt,
                  ease: "expo.inOut",
                },
                bridgeStartAt,
              );
          }

          if (bridgeClone && orbitCenter) {
            timeline.set(bridgeClone, { autoAlpha: 0 }, secondInAt);
          }

          timeline
            .set(slides[0], { autoAlpha: 0 }, secondInAt)
            .set(slides[1], { autoAlpha: 1 }, secondInAt);

          if (orbitReveals.length) {
            timeline.to(
              orbitReveals,
              {
                autoAlpha: 1,
                scale: 1,
                duration: 0.16,
                stagger: {
                  each:
                    orbitReveals.length > 1
                      ? Math.min(0.035, 0.26 / (orbitReveals.length - 1))
                      : 0,
                  from: "start",
                },
                ease: "back.out(1.6)",
              },
              orbitImagesInAt,
            );
          }

          if (centerTitleChars[1].length) {
            timeline.to(
              centerTitleChars[1],
              {
                autoAlpha: 1,
                duration: 0.01,
                stagger: characterStagger(
                  centerTitleChars[1],
                  0.009,
                  0.22,
                ),
                ease: "none",
              },
              secondTextInAt + 0.04,
            );
          }

          if (topTextChars[1].length) {
            timeline.to(
              topTextChars[1],
              {
                autoAlpha: 1,
                duration: 0.01,
                stagger: characterStagger(topTextChars[1], 0.009, 0.22),
                ease: "none",
              },
              secondTextInAt,
            );
            timeline.to(
              topTextElements[1],
              {
                autoAlpha: 0,
                duration: 0.1,
                ease: "power1.out",
              },
              secondOutAt,
            );
          }

          if (centerTextElements[1]) {
            timeline.to(
              centerTextElements[1],
              {
                autoAlpha: 0,
                duration: 0.1,
                ease: "power1.out",
              },
              secondOutAt,
            );
          }

          if (orbitStage) {
            timeline.to(
              orbitStage,
              {
                autoAlpha: 0,
                scale: 1.08,
                duration: 0.25,
                ease: "power3.in",
              },
              secondOutAt,
            );
          }

          timeline
            .to(
              slides[1],
              { autoAlpha: 0, duration: 0.16 },
              secondOutAt + 0.06,
            )
            .set(
              slides[2],
              { autoAlpha: 1 },
              thirdInAt,
            );

          if (threeStage) {
            timeline.to(
              threeStage,
              {
                yPercent: 0,
                rotation: 0,
                scale: 1,
                duration: 0.55,
                ease: "power4.out",
                force3D: true,
                onStart: () =>
                  setObjectEntryKey((current) => current + 1),
              },
              thirdInAt,
            );
          }

          if (centerTitleChars[2].length) {
            timeline.to(
              centerTitleChars[2],
              {
                autoAlpha: 1,
                duration: 0.01,
                stagger: characterStagger(
                  centerTitleChars[2],
                  0.009,
                  0.22,
                ),
                ease: "none",
              },
              thirdInAt + 0.04,
            );
          }

          if (topTextChars[2].length) {
            timeline.to(
              topTextChars[2],
              {
                autoAlpha: 1,
                duration: 0.01,
                stagger: characterStagger(topTextChars[2], 0.009, 0.22),
                ease: "none",
              },
              thirdInAt + 0.04,
            );
          }

          timeline.to({}, { duration: timelineEnd - thirdInAt }, thirdInAt);

          const stageThresholds = [0, 0.34, 0.68] as const;
          const stageTimes = [0, secondRestAt, thirdRestAt] as const;
          let currentStage = 0;
          let stageTween: gsap.core.Tween | null = null;

          const stageForProgress = (progressValue: number) => {
            if (progressValue >= stageThresholds[2]) return 2;
            if (progressValue >= stageThresholds[1]) return 1;
            return 0;
          };

          const animateToStage = (nextStage: number) => {
            if (nextStage === currentStage) return;
            currentStage = nextStage;
            stageTween?.kill();
            stageTween = timeline.tweenTo(stageTimes[nextStage], {
              ease: "none",
              overwrite: true,
            });
          };

          const updateTitleScale = (progressValue: number) => {
            const ranges = [
              [stageThresholds[0], stageThresholds[1]],
              [stageThresholds[1], stageThresholds[2]],
              [stageThresholds[2], 1],
            ] as const;

            centerTextElements.forEach((element, index) => {
              if (!element) return;
              const [start, end] = ranges[index];
              const localProgress = gsap.utils.clamp(
                0,
                1,
                (progressValue - start) / Math.max(0.001, end - start),
              );
              gsap.set(element, { scale: 1 + localProgress * 0.14 });
            });
          };

          const syncObjectSlideState = (
            progressValue: number,
            triggerActive: boolean,
          ) => {
            const nextObjectSlideActive =
              triggerActive && progressValue >= stageThresholds[2];
            objectSlideActiveRef.current = nextObjectSlideActive;
            if (
              nextObjectSlideActive &&
              electricHeaderEnabled &&
              boostedRef.current
            ) {
              setHeaderVisualTheme(headerThemeSource, {
                mode: "electric",
                accent: electricAccent,
                intensity: electricIntensity,
                progress: 1,
                priority: 10,
              });
            } else {
              clearHeaderVisualTheme(headerThemeSource);
            }
          };

          const resetScrubState = () => {
            stageTween?.kill();
            stageTween = null;
            currentStage = 0;
            timeline.pause(0);
            if (progress) gsap.set(progress, { scaleX: 0 });
            updateTitleScale(0);
            objectSlideActiveRef.current = false;
            boostedRef.current = false;
            setBoosted(false);
            clearHeaderVisualTheme(headerThemeSource);
          };

          const scrubTrigger = ScrollTrigger.create({
            trigger: root,
            start: "top top",
            end: () => `+=${window.innerHeight * duration}`,
            invalidateOnRefresh: true,
            onEnter: (self) => {
              animateToStage(stageForProgress(self.progress));
              syncObjectSlideState(self.progress, self.isActive);
            },
            onEnterBack: (self) => {
              animateToStage(stageForProgress(self.progress));
              syncObjectSlideState(self.progress, self.isActive);
            },
            onUpdate: (self) => {
              if (progress) gsap.set(progress, { scaleX: self.progress });
              updateTitleScale(self.progress);
              animateToStage(stageForProgress(self.progress));
              syncObjectSlideState(self.progress, self.isActive);
            },
            onLeave: () => {
              objectSlideActiveRef.current = false;
              boostedRef.current = false;
              setBoosted(false);
              clearHeaderVisualTheme(headerThemeSource);
            },
            onLeaveBack: resetScrubState,
          });

          requestAnimationFrame(() => ScrollTrigger.refresh());

          return () => {
            scrubTrigger.kill();
            stageTween?.kill();
            timeline.kill();
            topTextSplits.forEach((split) => split?.revert());
            bridgeClone?.remove();
            objectSlideActiveRef.current = false;
            clearHeaderVisualTheme(headerThemeSource);
            if (progress) gsap.set(progress, { clearProps: "transform" });
          };
        },
      );

      media.add(
        "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
        () => {
          const slides = gsap.utils.toArray<HTMLElement>(
            "[data-lifecycle-slide]",
            root,
          );
          const memeImages = gsap.utils.toArray<HTMLElement>(
            "[data-lifecycle-meme-image]",
            root,
          );
          const orbitReveals = gsap.utils.toArray<HTMLElement>(
            "[data-lifecycle-orbit-reveal]",
            root,
          );
          const orbitStage = root.querySelector<HTMLElement>(
            "[data-lifecycle-orbit-stage]",
          );
          const orbitCenter = root.querySelector<HTMLElement>(
            "[data-lifecycle-orbit-center]",
          );
          const threeStage = root.querySelector<HTMLElement>(
            "[data-lifecycle-three-stage]",
          );
          const readableItems = gsap.utils.toArray<HTMLElement>(
            "[data-lifecycle-top-text], [data-lifecycle-title-char]",
            root,
          );

          if (slides.length) gsap.set(slides, { clearProps: "all" });
          if (readableItems.length) {
            gsap.set(readableItems, { autoAlpha: 1, scale: 1 });
          }

          const waveMemeImages = [...memeImages].sort((a, b) => {
            const yDifference =
              Number(a.dataset.restY ?? 0) - Number(b.dataset.restY ?? 0);
            if (Math.abs(yDifference) > 3) return yDifference;
            return Number(a.dataset.restX ?? 0) - Number(b.dataset.restX ?? 0);
          });

          if (waveMemeImages.length && slides[0]) {
            gsap.set(waveMemeImages, { autoAlpha: 0, scale: 0.18 });
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: slides[0],
                  start: "top 86%",
                  toggleActions: "play none none reverse",
                },
              })
              .to(waveMemeImages, {
                autoAlpha: (_index, target) =>
                  Number((target as HTMLElement).dataset.restOpacity ?? 1),
                scale: (_index, target) =>
                  Number((target as HTMLElement).dataset.restScale ?? 1),
                duration: 0.34,
                stagger: { amount: 0.72, from: "start" },
                ease: "back.out(1.75)",
                overwrite: "auto",
              });
          }

          if (slides[1]) {
            if (orbitStage) gsap.set(orbitStage, { scale: 0.82 });
            if (orbitCenter) gsap.set(orbitCenter, { scale: 0.55 });
            if (orbitReveals.length) {
              gsap.set(orbitReveals, { autoAlpha: 0, scale: 0.35 });
            }

            const orbitEntrance = gsap.timeline({
              scrollTrigger: {
                trigger: slides[1],
                start: "top 84%",
                toggleActions: "play none none reverse",
              },
            });
            if (orbitStage) {
              orbitEntrance.to(
                orbitStage,
                { scale: 1, duration: 0.48, ease: "power3.out" },
                0,
              );
            }
            if (orbitCenter) {
              orbitEntrance.to(
                orbitCenter,
                { scale: 1, duration: 0.42, ease: "back.out(1.7)" },
                0.04,
              );
            }
            if (orbitReveals.length) {
              orbitEntrance.to(
                orbitReveals,
                {
                  autoAlpha: 1,
                  scale: 1,
                  duration: 0.2,
                  stagger: 0.055,
                  ease: "back.out(1.8)",
                },
                0.14,
              );
            }
          }

          if (slides[2] && threeStage) {
            gsap.set(threeStage, {
              yPercent: 38,
              scale: 0.68,
              transformOrigin: "50% 50%",
            });
            const objectEntrance = gsap
              .timeline({
                scrollTrigger: {
                  trigger: slides[2],
                  start: "top 84%",
                  toggleActions: "play none none reverse",
                  onEnter: () => {
                    objectSlideActiveRef.current = true;
                  },
                  onEnterBack: () => {
                    objectSlideActiveRef.current = true;
                  },
                  onLeave: () => {
                    objectSlideActiveRef.current = false;
                    setBoosted(false);
                    clearHeaderVisualTheme(headerThemeSource);
                  },
                  onLeaveBack: () => {
                    objectSlideActiveRef.current = false;
                    setBoosted(false);
                    clearHeaderVisualTheme(headerThemeSource);
                  },
                },
              })
              .call(
                () => setObjectEntryKey((current) => current + 1),
                [],
                0,
              )
              .to(
                threeStage,
                {
                  yPercent: 0,
                  scale: 1,
                  duration: 0.72,
                  ease: "power4.out",
                  force3D: true,
                },
                0,
              );

            if (objectEntrance.scrollTrigger?.isActive) {
              objectSlideActiveRef.current = true;
            }
          }

          const progress = root.querySelector<HTMLElement>(
            "[data-lifecycle-progress]",
          );
          if (progress) gsap.set(progress, { scaleX: 1 });
        },
      );

      media.add("(prefers-reduced-motion: reduce)", () => {
        const slides = gsap.utils.toArray<HTMLElement>(
          "[data-lifecycle-slide]",
          root,
        );
        const readableItems = gsap.utils.toArray<HTMLElement>(
          "[data-lifecycle-top-text], [data-lifecycle-title-char], [data-lifecycle-meme-image], [data-lifecycle-orbit-reveal]",
          root,
        );
        if (slides.length) gsap.set(slides, { clearProps: "all" });
        if (readableItems.length) {
          gsap.set(readableItems, { autoAlpha: 1, scale: 1 });
        }
      });
    }, root);

    return () => {
      objectSlideActiveRef.current = false;
      clearHeaderVisualTheme(headerThemeSource);
      media.revert();
      context.revert();
    };
  }, [
    clearHeaderVisualTheme,
    duration,
    electricAccent,
    electricHeaderEnabled,
    electricIntensity,
    headerThemeSource,
    setHeaderVisualTheme,
  ]);

  const modelUrl =
    objectSlide?.model?.asset?.url || "/models/pathetic-goggles.glb";
  const fallbackImageUrl = objectSlide?.fallbackImage?.asset?.url;
  const orbitArtworkSettings = orbitSlide as unknown as
    | { useSanityArtwork?: boolean }
    | undefined;
  const useSanityArtwork = orbitArtworkSettings?.useSanityArtwork === true;
  const sanityCenterArtwork = orbitSlide?.centerImage?.asset?.url
    ? {
        key: "sanity-center",
        src: orbitSlide.centerImage.asset.url,
        alt: orbitSlide.centerImage.alt || "",
      }
    : null;
  const sanityOrbitArtwork: LifecycleSlideTwoAsset[] =
    orbitSlide?.orbitImages?.flatMap((image) =>
      image.asset?.url
        ? [
            {
              key: image._key,
              src: image.asset.url,
              alt: image.alt || "",
            },
          ]
        : [],
    ) ?? [];
  const resolvedOrbitCenter =
    useSanityArtwork && sanityCenterArtwork
      ? sanityCenterArtwork
      : BUNDLED_SLIDE_TWO_CENTER;
  const resolvedOrbitImages =
    useSanityArtwork && sanityOrbitArtwork.length
      ? sanityOrbitArtwork
      : BUNDLED_SLIDE_TWO_ORBIT;
  const cleanMemeSubtitle = stegaClean(memeSlide?.topText || "").trim();
  const resolvedMemeSubtitle =
    !cleanMemeSubtitle ||
    cleanMemeSubtitle.toLowerCase() === "the lifecycle of pathetic"
      ? "Becoming Pathetic"
      : cleanMemeSubtitle;

  return (
    <section
      ref={rootRef}
      id={cleanAnchor || `_lifecycle-${_key}`}
      data-lifecycle-root="true"
      data-lifecycle-fun-active={boosted ? "true" : undefined}
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

        <div
          data-lifecycle-fun-site-wash
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 z-[5] transition-opacity duration-300 ease-out",
            boosted ? "opacity-100" : "opacity-0",
          )}
          style={{
            background: "#000000",
          }}
        />

        <article
          data-lifecycle-slide="meme"
          className="relative z-10 min-h-[92svh] overflow-hidden lg:absolute lg:inset-0 lg:min-h-0"
        >
          <LifecycleMemeSwarm
            memes={memeSlide?.memes}
            bridgeImage={resolvedOrbitCenter}
            resetKey={memeResetKey}
          />
          <SlideCopy
            topText={resolvedMemeSubtitle}
            centerText={memeSlide?.centerText}
            textStyle={displayTextStyle}
          />
        </article>

        <article
          data-lifecycle-slide="orbit"
          data-lifecycle-fun-previous="true"
          className="relative z-10 -mt-px min-h-[calc(92svh+1px)] overflow-hidden lg:invisible lg:absolute lg:inset-0 lg:mt-0 lg:min-h-0 lg:opacity-0"
        >
          <LifecycleOrbit
            centerImage={resolvedOrbitCenter}
            images={resolvedOrbitImages}
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
          className="relative z-10 -mt-px min-h-[calc(92svh+1px)] overflow-hidden lg:invisible lg:absolute lg:inset-0 lg:mt-0 lg:min-h-0 lg:opacity-0"
        >
          <div
            data-lifecycle-fun-background
            className="pointer-events-none absolute inset-0 z-[15] opacity-0 will-change-[opacity]"
            style={{
              background:
                "radial-gradient(ellipse 62% 58% at 50% 50%, #2789ff 0%, #2030a8 28%, #10165e 48%, #030515 72%, #000 100%)",
            }}
            aria-hidden="true"
          />
          <div
            data-lifecycle-three-stage
            className="absolute inset-0 z-20 will-change-transform"
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
              entryKey={objectEntryKey}
            />
          </div>

          <div
            data-lifecycle-fun-edge-gradient
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 ease-out",
              boosted ? "opacity-100" : "opacity-0",
            )}
            style={{
              background:
                "linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.92) 1.5%, rgba(0,0,0,0.48) 4%, transparent 9%, transparent 91%, rgba(0,0,0,0.48) 96%, rgba(0,0,0,0.92) 98.5%, #000 100%)",
            }}
          />

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
            className="absolute bottom-6 right-5 z-50 flex h-20 w-20 touch-none select-none items-center justify-center rounded-full bg-[#ff241a] px-3 text-center text-[10px] font-bold uppercase leading-[0.95] text-white transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 lg:bottom-8 lg:right-8 lg:h-28 lg:w-28 lg:text-xs"
          >
            {stegaClean(objectSlide?.buttonLabel) || "Hold to spin"}
          </button>
        </article>

        <div
          className="pointer-events-none absolute bottom-[7svh] left-1/2 z-[70] hidden h-[3px] w-1/2 -translate-x-1/2 lg:block"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-current opacity-20" />
          <div
            data-lifecycle-progress
            className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-current will-change-transform"
          />
        </div>
      </div>
    </section>
  );
}
