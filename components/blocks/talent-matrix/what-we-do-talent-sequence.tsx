"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
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
import styles from "./what-we-do-talent-sequence.module.css";

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
  const whatSceneRef = useRef<HTMLDivElement>(null);
  const talentSceneRef = useRef<HTMLDivElement>(null);
  const pinTargetRef = useRef<HTMLDivElement>(null);
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
  const whatWeDoId = "what-we-do";
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
    if (!root || viewportMode !== "desktop") return;

    // A breakpoint change destroys and rebuilds this section's triggers.
    // Clear the old claim before measuring the new layout so a matrix nav
    // cannot survive for a frame at an unrelated restored scroll position.
    clearHeaderVisualTheme(headerThemeSource);

    const sequenceDuration = duration;
    const animationScrub = 0.72;
    const parallaxScrub = 0.35;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          const whatScene = whatSceneRef.current;
          const talentScene = talentSceneRef.current;
          const pinTarget = pinTargetRef.current;
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
          let headerBoundary = 0;
          let headerExited = false;
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
            boundary = headerBoundary,
          ) => {
            const progress = Math.max(0, Math.min(1, progressValue));
            if (
              !matrixHeaderEnabled || progress <= 0.001 ||
              headerExited || boundary >= 1
            ) {
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
              pin: false,
              pinSpacing: false,
              anticipatePin: 0,
              invalidateOnRefresh: true,
              onEnter: () => {
                headerExited = false;
                headerBoundary = 0;
                clearHeaderVisualTheme(headerThemeSource);
              },
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
                  if (self.progress < exitStartProgress) {
                    headerExited = false;
                    headerBoundary = 0;
                    return;
                  }
                  const exitProgress = Math.max(
                    0,
                    Math.min(
                      1,
                      (self.progress - exitStartProgress) /
                        Math.max(0.0001, 1 - exitStartProgress),
                    ),
                  );
                  headerBoundary = boundaryForExit(exitProgress);
                  headerExited = headerBoundary >= 1;
                  applyHeaderProgress(1);
                },
                onEnterBack: (self) => {
                  headerExited = false;
                  const exitProgress = Math.max(
                    0,
                    Math.min(
                      1,
                      (self.progress - exitStartProgress) /
                        Math.max(0.0001, 1 - exitStartProgress),
                    ),
                  );
                  headerBoundary = boundaryForExit(exitProgress);
                  applyHeaderProgress(1);
                },
                onLeave: () => {
                  // A lagging scrub tween can still finish after this trigger.
                  // Its reveal callback must not restore a full Matrix claim.
                  headerExited = true;
                  headerBoundary = 1;
                  clearHeaderVisualTheme(headerThemeSource);
                },
                onLeaveBack: () => {
                  headerExited = false;
                  headerBoundary = 0;
                  clearHeaderVisualTheme(headerThemeSource);
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
      const whatScene = whatSceneRef.current;
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

  useLayoutEffect(() => {
    if (!viewportMode || viewportMode === "desktop") return;
    const talentScene = talentSceneRef.current;
    if (!talentScene) return;
    const syncHeader = (trigger: ScrollTrigger) => {
      if (!matrixHeaderEnabled || !trigger.isActive) {
        clearHeaderVisualTheme(headerThemeSource);
        return;
      }
      setHeaderVisualTheme(headerThemeSource, {
        mode: "matrix", accent, surface: matrixSurface,
        intensity: 0.72, progress: 1, boundary: 0, priority: 20,
      });
    };
    // The mobile city is a normal section. Only the navigation colour follows
    // its boundaries; neither scene is pinned or masked while scrolling.
    const trigger = ScrollTrigger.create({
      trigger: talentScene,
      start: "top top",
      end: "bottom top",
      onToggle: syncHeader,
      onRefresh: syncHeader,
    });
    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(refresh);
      trigger.kill();
      clearHeaderVisualTheme(headerThemeSource);
    };
  }, [viewportMode, matrixHeaderEnabled, headerThemeSource, accent, matrixSurface, setHeaderVisualTheme, clearHeaderVisualTheme]);

  return (
    <section
      ref={rootRef}
      id={whatWeDoId}
      data-pin-to-viewport="true"
      data-pin-duration={duration}
      data-pin-spacing="true"
      data-pin-resize-refresh="false"
      className="relative z-[2] lg:-mt-[8px]"
      style={{ backgroundColor: sequenceBackground }}
    >
      <div
        ref={pinTargetRef}
        data-pin-target="true"
        data-sequence-mode={viewportMode || undefined}
        className={styles.stages}
        style={{ backgroundColor: sequenceBackground, "--sequence-background": sequenceBackground } as CSSProperties}
      >
        <div ref={whatSceneRef} data-sequence-what className={styles.what}>
          <WhatWeDoGridView block={whatWeDo} />
        </div>
        <div className="mobile-section-gap" aria-hidden="true" />
        <div ref={talentSceneRef} id={talentId} data-sequence-talent className={styles.talent}>
          <TalentMatrixView
            block={talent}
            cameraScrollProgress={viewportMode === "desktop" ? cameraScrollProgress : undefined}
            quality={viewportMode === "desktop" ? "desktop" : viewportMode === "tablet" ? "tablet" : "mobile"}
          />
        </div>
        {viewportMode === "desktop" && (
          <MatrixRevealCanvas
            progress={transitionProgress}
            color={accent}
            density={density}
            changeSpeed={changeSpeed}
            softness={softness}
            quality="desktop"
          />
        )}
      </div>
    </section>
  );
}
