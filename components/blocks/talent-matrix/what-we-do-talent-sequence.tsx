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

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function safeNumber(value: number | null | undefined, fallback: number) {
  const clean = stegaClean(value);
  return typeof clean === "number" && Number.isFinite(clean) ? clean : fallback;
}

const REVEAL_START_TIME = 0.82;
const SEQUENCE_TIMELINE_DURATION = 3.1;

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
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile" | null>(null);
  const duration = Math.max(
    3.3,
    Math.min(9, safeNumber(whatWeDo.pinDuration, 4.2) + 1.8),
  );
  const accent = stegaClean(whatWeDo.transition?.matrixColor?.hex) || "#00ff46";
  const density = safeNumber(whatWeDo.transition?.density, 96);
  const changeSpeed = safeNumber(whatWeDo.transition?.speed, 1);
  const softness = safeNumber(whatWeDo.transition?.softness, 0.13);
  const sequenceBackground =
    stegaClean(whatWeDo.backgroundColor?.hex) || "#e7e7e2";
  const whatWeDoId = stegaClean(whatWeDo.anchor?.anchorId) || `_what-we-do-grid-${whatWeDo._key}`;
  const talentId = stegaClean(talent.anchor?.anchorId) || `_talent-matrix-${talent._key}`;

  useLayoutEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setViewportMode(query.matches ? "desktop" : "mobile");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || viewportMode !== "desktop") return;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const whatScene = root.querySelector<HTMLElement>("[data-sequence-what]");
          const talentScene = root.querySelector<HTMLElement>("[data-sequence-talent]");
          if (!whatScene || !talentScene) return;

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
          transitionProgress.current.value = 0;
          cameraScrollProgress.current.value = 0;
          gsap.set(whatScene, {
            autoAlpha: 1,
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
              end: () => `+=${window.innerHeight * (duration + 1)}`,
              scrub: 0.35,
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
              end: () => `+=${window.innerHeight * duration}`,
              scrub: 0.72,
              invalidateOnRefresh: true,
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
                },
              },
              0.82,
            )
            .set(whatScene, { opacity: 0, pointerEvents: "none" }, 2.34)
            .to({}, { duration: 0.76 });

          const fullCameraDistance = duration + 1;
          const cameraStartProgress =
            (duration * (REVEAL_START_TIME / SEQUENCE_TIMELINE_DURATION)) /
            fullCameraDistance;
          gsap
            .timeline({
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: () => `+=${window.innerHeight * fullCameraDistance}`,
                scrub: true,
                invalidateOnRefresh: true,
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
        },
      );
    }, root);

    return () => {
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
  }, [duration, softness, viewportMode]);

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
      {viewportMode !== "desktop" && (
        <div className="lg:hidden">
          <WhatWeDoGridView block={whatWeDo} />
          <div id={talentId}>
            <TalentMatrixView block={talent} />
          </div>
        </div>
      )}

      {viewportMode !== "mobile" && (
        <div
          data-pin-target="true"
          className="relative hidden h-[100svh] min-h-[680px] overflow-hidden lg:block"
          style={{
            backgroundColor: sequenceBackground,
            boxShadow: `0 -12px 0 ${sequenceBackground}, 0 12px 0 ${sequenceBackground}`,
          }}
        >
          <div
            data-sequence-what
            className="absolute inset-0 z-30"
            style={{
              maskRepeat: "no-repeat",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskSize: "100% 100%",
              willChange: "mask-image, opacity",
            }}
          >
            <WhatWeDoGridView block={whatWeDo} />
          </div>
          <div id={talentId} data-sequence-talent className="absolute inset-0 z-20 opacity-0 will-change-opacity">
            <TalentMatrixView
              block={talent}
              cameraScrollProgress={cameraScrollProgress}
            />
          </div>
          <MatrixRevealCanvas
            progress={transitionProgress}
            color={accent}
            density={density}
            changeSpeed={changeSpeed}
            softness={softness}
          />
        </div>
      )}
    </section>
  );
}
