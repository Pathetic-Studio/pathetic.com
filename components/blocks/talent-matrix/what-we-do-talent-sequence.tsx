"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { stegaClean } from "next-sanity";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  WhatWeDoGridView,
  type WhatWeDoGridBlock,
} from "@/components/blocks/what-we-do-grid/what-we-do-grid-section";
import {
  TalentMatrixView,
  type TalentMatrixBlock,
} from "./talent-matrix-section";
import MatrixRevealCanvas from "./matrix-reveal-canvas";
import { matrixRevealSoftMask } from "./matrix-reveal-edge";
import { useHeaderVisualTheme } from "@/components/header/visual-theme";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function safeNumber(value: number | null | undefined, fallback: number) {
  const clean = stegaClean(value);
  return typeof clean === "number" && Number.isFinite(clean) ? clean : fallback;
}

function smoothstep(start: number, end: number, value: number) {
  const progress = Math.max(
    0,
    Math.min(1, (value - start) / Math.max(0.0001, end - start)),
  );
  return progress * progress * (3 - 2 * progress);
}

const REVEAL_START_TIME = 0.82;
const SEQUENCE_TIMELINE_DURATION = 3.1;
type SequenceViewportMode = "desktop" | "tablet" | "mobile" | "reduced";

export default function WhatWeDoTalentSequence({
  whatWeDo,
  talent,
}: {
  whatWeDo: WhatWeDoGridBlock;
  talent: TalentMatrixBlock;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const transitionProgress = useRef({ value: 0 });
  const cameraScrollProgress = useRef({ value: 0 });
  const [viewportMode, setViewportMode] = useState<SequenceViewportMode | null>(null);
  const { setHeaderVisualTheme, clearHeaderVisualTheme } =
    useHeaderVisualTheme();
  const duration = Math.max(
    3.3,
    Math.min(9, safeNumber(whatWeDo.pinDuration, 4.2) + 1.8),
  );
  const accent = stegaClean(whatWeDo.transition?.matrixColor?.hex) || "#00ff46";
  const density = safeNumber(whatWeDo.transition?.density, 96);
  const changeSpeed = safeNumber(whatWeDo.transition?.speed, 1);
  const softness = safeNumber(whatWeDo.transition?.softness, 0.13);
  const transitionWithHeader = whatWeDo.transition as
    | (typeof whatWeDo.transition & { headerEffectEnabled?: boolean | null })
    | null
    | undefined;
  const matrixHeaderEnabled =
    stegaClean(transitionWithHeader?.headerEffectEnabled) !== false;
  const matrixSurface =
    stegaClean(talent.backgroundColor?.hex) || "#000600";
  const headerThemeSource = `matrix:${stegaClean(whatWeDo._key) || whatWeDo._key}:${stegaClean(talent._key) || talent._key}`;
  const sequenceBackground =
    stegaClean(whatWeDo.backgroundColor?.hex) || "#e7e7e2";
  const whatWeDoId = stegaClean(whatWeDo.anchor?.anchorId) || `_what-we-do-grid-${whatWeDo._key}`;
  const talentId = stegaClean(talent.anchor?.anchorId) || "talent-matrix";

  useLayoutEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (reducedMotion.matches) {
        setViewportMode("reduced");
        return;
      }

      const touch = coarsePointer.matches || navigator.maxTouchPoints > 0;
      if (window.innerWidth >= 1024 && !touch) {
        setViewportMode("desktop");
      } else if (window.innerWidth >= 700) {
        setViewportMode("tablet");
      } else {
        setViewportMode("mobile");
      }
    };
    update();
    coarsePointer.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      coarsePointer.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !viewportMode || viewportMode === "reduced") return;

    // A breakpoint change destroys and rebuilds this section's triggers.
    // Clear the old claim before measuring the new layout so a matrix nav
    // cannot survive for a frame at an unrelated restored scroll position.
    clearHeaderVisualTheme(headerThemeSource);

    const isDesktop = viewportMode === "desktop";
    const sequenceDuration = isDesktop
      ? duration
      : viewportMode === "tablet"
        ? Math.max(3, Math.min(3.5, duration * 0.58))
        : Math.max(2.3, Math.min(2.75, duration * 0.44));
    const animationScrub = isDesktop
      ? 0.72
      : viewportMode === "tablet"
        ? 0.3
        : 0.18;
    const parallaxScrub = isDesktop
      ? 0.35
      : viewportMode === "tablet"
        ? 0.24
        : 0.16;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          const whatScene = root.querySelector<HTMLElement>("[data-sequence-what]");
          const talentScene = root.querySelector<HTMLElement>("[data-sequence-talent]");
          const pinTarget = root.querySelector<HTMLElement>("[data-pin-target='true']");
          if (!whatScene || !talentScene || !pinTarget) return;

          const layers = gsap.utils.toArray<HTMLElement>(
            "[data-what-layer]",
            whatScene,
          );
          const services = gsap.utils.toArray<HTMLElement>(
            "[data-what-service]",
            whatScene,
          );
          const heading = whatScene.querySelector<HTMLElement>("[data-what-heading]");
          const applyRevealMask = (reveal: number) => {
            if (reveal <= 0.001) {
              whatScene.style.maskImage = "none";
              whatScene.style.webkitMaskImage = "none";
              return;
            }
            const mask = matrixRevealSoftMask(reveal, softness);
            whatScene.style.maskImage = mask;
            whatScene.style.webkitMaskImage = mask;
          };
          const applyHeaderProgress = (
            progressValue: number,
            boundary = 0,
          ) => {
            const progress = Math.max(0, Math.min(1, progressValue));
            if (!matrixHeaderEnabled || progress <= 0.001) {
              clearHeaderVisualTheme(headerThemeSource);
              return;
            }

            setHeaderVisualTheme(headerThemeSource, {
              mode: "matrix",
              accent,
              surface: matrixSurface,
              intensity: 0.72,
              progress,
              boundary,
              priority: 20,
            });
          };
          const applyHeaderReveal = (reveal: number) => {
            // The Matrix edge begins at the top of the scene. Hold the default
            // header a little longer, then let the code progressively take it.
            applyHeaderProgress(smoothstep(0.28, 0.52, reveal));
          };
          transitionProgress.current.value = 0;
          cameraScrollProgress.current.value = 0;
          gsap.set(whatScene, {
            opacity: 1,
            visibility: "visible",
            clipPath: "none",
            pointerEvents: "auto",
          });
          applyRevealMask(0);
          gsap.set(talentScene, {
            opacity: 0,
            visibility: "visible",
            clipPath: "none",
            pointerEvents: "none",
          });

          const parallaxTimeline = gsap.timeline({
            defaults: { ease: "power1.out" },
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: () => `+=${window.innerHeight * (sequenceDuration + 1)}`,
              scrub: parallaxScrub,
              invalidateOnRefresh: true,
            },
          });

          layers.forEach((layer) => {
            const depth = safeNumber(Number(layer.dataset.depth), 0.35);
            const endScale = safeNumber(
              Number(layer.dataset.endScale),
              1 + depth * 0.18,
            );
            parallaxTimeline.to(
              layer,
              {
                scale: endScale,
                yPercent: -depth * 3.5,
                duration: 1,
              },
              0,
            );
          });

          const timeline = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: () => `+=${window.innerHeight * sequenceDuration}`,
              scrub: animationScrub,
              pin: isDesktop ? false : pinTarget,
              pinSpacing: isDesktop ? false : true,
              anticipatePin: isDesktop ? 0 : 1,
              invalidateOnRefresh: true,
              onEnter: () => clearHeaderVisualTheme(headerThemeSource),
              onEnterBack: () =>
                applyHeaderReveal(transitionProgress.current.value),
              onLeave: () => applyHeaderProgress(1),
              onLeaveBack: () => clearHeaderVisualTheme(headerThemeSource),
            },
          });

          if (heading) {
            timeline.to(
              heading,
              { scale: 1.035, yPercent: -4, duration: 0.85, ease: "power1.inOut" },
              0.46,
            );
          }
          if (services.length) {
            timeline.to(
              services,
              {
                yPercent: -2.2,
                scale: 1.015,
                duration: 0.85,
                stagger: 0.025,
                ease: "power1.inOut",
              },
              0.48,
            );
          }

          timeline
            .set(talentScene, { opacity: 1, pointerEvents: "auto" }, 0.78)
            .to(
              transitionProgress.current,
              {
                value: 1,
                duration: 1.52,
                ease: "none",
                onUpdate: () => {
                  const reveal = Math.max(
                    0,
                    Math.min(1, transitionProgress.current.value),
                  );
                  applyRevealMask(reveal);
                  applyHeaderReveal(reveal);
                },
              },
              0.82,
            )
            .set(whatScene, { opacity: 0, pointerEvents: "none" }, 2.34)
            .to({}, { duration: 0.76 });

          const fullCameraDistance = sequenceDuration + 1;
          const exitStartProgress = sequenceDuration / fullCameraDistance;
          const boundaryForExit = (exitProgress: number) =>
            Math.max(0, Math.min(1, exitProgress));
          const cameraStartProgress =
            (sequenceDuration * (REVEAL_START_TIME / SEQUENCE_TIMELINE_DURATION)) /
            fullCameraDistance;
          gsap
            .timeline({
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: () => `+=${window.innerHeight * fullCameraDistance}`,
                scrub: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  if (self.progress < exitStartProgress) return;
                  const exitProgress = Math.max(
                    0,
                    Math.min(
                      1,
                      (self.progress - exitStartProgress) /
                        Math.max(0.0001, 1 - exitStartProgress),
                    ),
                  );
                  const boundaryProgress = boundaryForExit(exitProgress);
                  applyHeaderProgress(1, boundaryProgress);
                },
                onEnterBack: (self) => {
                  const exitProgress = Math.max(
                    0,
                    Math.min(
                      1,
                      (self.progress - exitStartProgress) /
                        Math.max(0.0001, 1 - exitStartProgress),
                    ),
                  );
                  const boundaryProgress = boundaryForExit(exitProgress);
                  applyHeaderProgress(1, boundaryProgress);
                },
                onLeave: () => {
                  // Paint the completed boundary state before dropping the
                  // Matrix claim. Without this final frame, fast scrolling can
                  // clear the theme one tick before the text/icon masks finish.
                  applyHeaderProgress(1, 1);
                  requestAnimationFrame(() => {
                    clearHeaderVisualTheme(headerThemeSource);
                  });
                },
              },
            })
            .to(cameraScrollProgress.current, {
              value: 0,
              duration: cameraStartProgress,
              ease: "none",
            })
            .to(cameraScrollProgress.current, {
              value: 1,
              duration: 1 - cameraStartProgress,
              ease: "none",
            });

          requestAnimationFrame(() => ScrollTrigger.refresh());
        },
      );

      media.add(
        "(prefers-reduced-motion: reduce)",
        () => {
          transitionProgress.current.value = 0;
          cameraScrollProgress.current.value = 0;
          clearHeaderVisualTheme(headerThemeSource);
        },
      );
    }, root);

    return () => {
      clearHeaderVisualTheme(headerThemeSource);
      media.revert();
      context.revert();
      transitionProgress.current.value = 0;
      cameraScrollProgress.current.value = 0;
      const whatScene = root.querySelector<HTMLElement>("[data-sequence-what]");
      if (whatScene) {
        whatScene.style.maskImage = "";
        whatScene.style.webkitMaskImage = "";
      }
    };
  }, [
    accent,
    clearHeaderVisualTheme,
    duration,
    headerThemeSource,
    matrixHeaderEnabled,
    matrixSurface,
    setHeaderVisualTheme,
    softness,
    viewportMode,
  ]);

  return (
    <section
      ref={rootRef}
      id={whatWeDoId}
      data-pin-to-viewport="true"
      data-pin-duration={duration}
      data-pin-spacing="true"
      data-pin-resize-refresh="false"
      className="relative z-[2] -mt-[8px]"
      style={{ backgroundColor: sequenceBackground }}
    >
      {viewportMode === "reduced" && (
        <div>
          <WhatWeDoGridView block={whatWeDo} />
          <div id={talentId}>
            <TalentMatrixView block={talent} quality="mobile" />
          </div>
        </div>
      )}

      {viewportMode !== "reduced" && (
        <div
          data-pin-target="true"
          data-sequence-mode={viewportMode || "mobile"}
          className="relative overflow-hidden"
          style={{
            backgroundColor: sequenceBackground,
            boxShadow: `0 -12px 0 ${sequenceBackground}, 0 12px 0 ${sequenceBackground}`,
            height:
              viewportMode === "desktop"
                ? "100svh"
                : "var(--app-height, 100dvh)",
            minHeight:
              viewportMode === "desktop"
                ? "680px"
                : "var(--app-height, 100dvh)",
          }}
        >
          <div
            data-sequence-what
            className="absolute inset-0 z-30"
            style={{
              visibility: "visible",
              maskRepeat: "no-repeat",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskSize: "100% 100%",
              willChange: "mask-image, opacity",
            }}
          >
            <WhatWeDoGridView block={whatWeDo} />
          </div>
          <div
            id={talentId}
            data-sequence-talent
            className="absolute inset-0 z-20 opacity-0 will-change-opacity"
            style={{ visibility: "visible" }}
          >
            <TalentMatrixView
              block={talent}
              cameraScrollProgress={cameraScrollProgress}
              quality={viewportMode === "desktop" ? "desktop" : viewportMode === "tablet" ? "tablet" : "mobile"}
            />
          </div>
          <MatrixRevealCanvas
            progress={transitionProgress}
            color={accent}
            density={density}
            changeSpeed={changeSpeed}
            softness={softness}
            quality={viewportMode === "desktop" ? "desktop" : viewportMode === "tablet" ? "tablet" : "mobile"}
          />
        </div>
      )}
    </section>
  );
}
