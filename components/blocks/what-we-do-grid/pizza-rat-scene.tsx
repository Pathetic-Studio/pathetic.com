"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import useChromaKeyAsset from "@/components/blocks/what-we-do-grid/use-chroma-key-asset";

const RAT_ATLAS_SRC = "/images/what-we-do/pizza-rat-atlas.png";
const DROPPED_PIZZA_SRC = "/images/what-we-do/pizza-dropped.png";
const MAX_DROPPED_PIZZAS = 24;

type RatMode = "pulling" | "nibbling" | "fleeing";

type DroppedPizza = {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

const randomBetween = (minimum: number, maximum: number) =>
  minimum + Math.random() * (maximum - minimum);

export default function PizzaRatScene() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ratRef = useRef<HTMLButtonElement | null>(null);
  const spriteRef = useRef<HTMLSpanElement | null>(null);
  const scareRatRef = useRef<() => void>(() => undefined);
  const nextPizzaIdRef = useRef(0);
  const [nearViewport, setNearViewport] = useState(false);
  const [droppedPizzas, setDroppedPizzas] = useState<DroppedPizza[]>([]);
  const ratAssetUrl = useChromaKeyAsset(RAT_ATLAS_SRC, nearViewport);
  const pizzaAssetUrl = useChromaKeyAsset(DROPPED_PIZZA_SRC, nearViewport);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || nearViewport) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: "70% 0px" },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [nearViewport]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const rat = ratRef.current;
    const sprite = spriteRef.current;
    if (!root || !rat || !sprite || !ratAssetUrl || !pizzaAssetUrl) return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    let scheduleTimer = 0;
    let nibbleTimer = 0;
    let movementTween: gsap.core.Tween | null = null;
    let escapeTween: gsap.core.Tween | null = null;
    let visible = false;
    let disposed = false;
    let ratActive = false;
    let scared = false;
    let currentMode: RatMode = "pulling";
    let lastFrame = -1;
    const setRatX = gsap.quickSetter(rat, "x", "px");
    let travelDirection: -1 | 1 = -1;
    const pointer = { x: -1, y: -1, active: false };
    const mobileLayout = window.matchMedia("(max-width: 1023px)");
    const road = root
      .closest("[data-what-grid]")
      ?.querySelector<HTMLElement>("[data-what-road]");
    let roadTrack: { top: number; bottom: number } | null = null;
    let checkPointerCollision = () => undefined;

    const readRoadTrack = () => {
      if (!mobileLayout.matches || !road) {
        roadTrack = null;
        return;
      }
      const sceneBounds = root.getBoundingClientRect();
      const roadBounds = road.getBoundingClientRect();
      const scale = root.clientHeight / Math.max(1, sceneBounds.height);
      roadTrack = {
        top: (roadBounds.top - sceneBounds.top) * scale,
        bottom: (roadBounds.bottom - sceneBounds.top) * scale,
      };
    };

    // The pulling sprite extends beyond its button by 14% at each end.
    // Keep that entire sprite, including its pizza, on the shortened road.
    const fitScaleToRoad = (scale: number) =>
      roadTrack
        ? Math.min(
            scale,
            Math.max(
              0.1,
              (roadTrack.bottom - roadTrack.top - 16) /
                (rat.offsetWidth * 1.28),
            ),
          )
        : scale;

    const roadYRange = (scale: number) => {
      const size = rat.offsetWidth;
      return {
        min: roadTrack!.top + 8 - size * (0.5 - 0.64 * scale),
        max: roadTrack!.bottom - 8 - size * (0.5 + 0.64 * scale),
      };
    };

    const clampYToRoad = (y: number, scale: number) => {
      if (!roadTrack) return y;
      const range = roadYRange(scale);
      return Math.max(range.min, Math.min(range.max, y));
    };

    readRoadTrack();

    const updateMode = (nextMode: RatMode) => {
      currentMode = nextMode;
      lastFrame = -1;
      rat.dataset.ratMode = nextMode;
      sprite.className = `${nextMode === "nibbling" ? "what-rat-nibble-frame " : ""}block h-full w-full bg-no-repeat`;
      sprite.style.backgroundSize = nextMode === "fleeing" ? "420% 420%" : "300% 300%";
      // The running row is cropped tighter in the atlas. Register its feet to
      // the pulling row's ground line instead of letting the crop lift the rat.
      sprite.style.transform = nextMode === "fleeing" ? "translate(-27%, 39%)" : nextMode === "pulling" ? "scale(1.28)" : "translateY(5%)";
      sprite.style.transformOrigin = nextMode === "pulling" ? "0% 50%" : "50% 50%";
      sprite.style.backgroundPosition = nextMode === "fleeing" ? "6.25% 93.75%" : nextMode === "nibbling" ? "0 50%" : "0 0";
    };
    const setStrideFrame = (cycle: number) => {
      const index = reducedMotion.matches ? 0 : Math.floor(cycle * 3) % 3;
      if (index === lastFrame) return;
      lastFrame = index;
      sprite.style.backgroundPosition = currentMode === "fleeing"
        ? `${[6.25, 50, 93.75][index]}% 93.75%`
        : `${index * 50}% 0`;
      rat.dataset.ratFrame = String(index);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active =
        event.pointerType === "mouse" || event.pointerType === "pen";
      checkPointerCollision();
    };

    const onPointerLeaveWindow = () => {
      pointer.active = false;
    };

    const clearSchedule = () => window.clearTimeout(scheduleTimer);
    const clearNibble = () => window.clearTimeout(nibbleTimer);

    const scheduleRat = (minimumDelay = 2400, maximumDelay = 5600) => {
      clearSchedule();
      if (!visible || disposed) return;
      scheduleTimer = window.setTimeout(
        launchRat,
        randomBetween(minimumDelay, maximumDelay),
      );
    };

    checkPointerCollision = () => {
      if (!pointer.active || !ratActive || scared) return;

      const bounds = rat.getBoundingClientRect();
      const verticalInsets =
        currentMode === "pulling"
          ? { top: 0.47, bottom: 0.1 }
          : currentMode === "nibbling"
            ? { top: 0.34, bottom: 0.23 }
            : { top: 0.22, bottom: 0.26 };
      const baseHorizontalBounds =
        currentMode === "fleeing"
          ? { left: 0.16, right: 0.78 }
          : currentMode === "pulling"
            ? { left: 0.01, right: 0.68 }
            : { left: 0.06, right: 0.54 };
      const horizontalBounds =
        travelDirection === 1
          ? {
              left: 1 - baseHorizontalBounds.right,
              right: 1 - baseHorizontalBounds.left,
            }
          : baseHorizontalBounds;
      const isOverRat =
        pointer.x >= bounds.left + bounds.width * horizontalBounds.left &&
        pointer.x <= bounds.left + bounds.width * horizontalBounds.right &&
        pointer.y >= bounds.top + bounds.height * verticalInsets.top &&
        pointer.y <= bounds.bottom - bounds.height * verticalInsets.bottom;

      if (isOverRat) scareRatRef.current();
    };

    const finishCrossing = () => {
      ratActive = false;
      gsap.set(rat, { autoAlpha: 0, pointerEvents: "none" });
      scheduleRat();
    };

    const startNibbling = () => {
      if (!ratActive || scared || disposed) return;
      updateMode("nibbling");
      checkPointerCollision();
      clearNibble();
      nibbleTimer = window.setTimeout(
        () => {
          if (!ratActive || scared || disposed) return;
          updateMode("pulling");
          moveNextSegment();
        },
        randomBetween(450, 900),
      );
    };

    const moveNextSegment = () => {
      if (!ratActive || scared || disposed) return;

      const width = root.clientWidth;
      const ratSize = rat.offsetWidth;
      const currentX = Number(gsap.getProperty(rat, "x")) || 0;
      const endX =
        travelDirection === -1 ? -ratSize * 1.2 : width + ratSize * 1.2;
      const distance = width * randomBetween(0.24, 0.36);
      const targetX =
        travelDirection === -1
          ? Math.max(endX, currentX - distance)
          : Math.min(endX, currentX + distance);
      const reachedEnd =
        travelDirection === -1 ? targetX <= endX + 1 : targetX >= endX - 1;
      const scale = Math.abs(Number(gsap.getProperty(rat, "scaleY"))) || 1;
      const travel = Math.abs(targetX - currentX);
      const cycles = Math.max(1, Math.ceil(travel / (ratSize * scale * 0.3)));
      const stride = travel / cycles;
      const pull = { cycle: 0 };

      movementTween?.kill();
      movementTween = gsap.to(pull, {
        cycle: cycles,
        duration: cycles * 0.56,
        ease: "none",
        onUpdate: () => {
          const whole = Math.floor(pull.cycle);
          const phase = pull.cycle - whole;
          // Brace, tug, recover: each visible pose drives the same small pull.
          const tug = reducedMotion.matches ? phase : phase < 0.25
            ? phase * 0.32
            : phase < 0.8
              ? 0.08 + 0.86 * (1 - Math.pow(1 - (phase - 0.25) / 0.55, 2))
              : 0.94 + (phase - 0.8) * 0.3;
          setRatX(currentX + travelDirection * (whole + tug) * stride);
          setStrideFrame(pull.cycle);
          checkPointerCollision();
        },
        onComplete: () => {
          if (reachedEnd) {
            finishCrossing();
            return;
          }
          if (Math.random() < 0.34) {
            startNibbling();
          } else {
            moveNextSegment();
          }
        },
      });
    };

    const launchRat = () => {
      if (!visible || disposed) return;

      const width = root.clientWidth;
      const height = root.clientHeight;
      const ratSize = rat.offsetWidth;
      readRoadTrack();
      const launchScale = fitScaleToRoad(randomBetween(0.84, 1.02));
      const lane = roadTrack ? roadYRange(launchScale) : null;
      const launchY = lane
        ? lane.min + (lane.max - lane.min) * randomBetween(0.55, 0.95)
        : height * randomBetween(0.69, 0.79);
      ratActive = true;
      scared = false;
      travelDirection = Math.random() < 0.5 ? -1 : 1;
      updateMode("pulling");

      gsap.set(rat, {
        x: travelDirection === -1 ? width + ratSize * 0.2 : -ratSize * 1.2,
        y: launchY,
        rotation: 0,
        scaleX: travelDirection === 1 ? -launchScale : launchScale,
        scaleY: launchScale,
        autoAlpha: 1,
        pointerEvents: "auto",
      });

      moveNextSegment();
    };

    scareRatRef.current = () => {
      if (!ratActive || scared || !visible) return;
      scared = true;
      ratActive = false;
      clearNibble();
      movementTween?.kill();

      const width = root.clientWidth;
      const height = root.clientHeight;
      const ratSize = rat.offsetWidth;
      const currentX = Number(gsap.getProperty(rat, "x")) || 0;
      const currentY = Number(gsap.getProperty(rat, "y")) || 0;
      const currentScale =
        Math.abs(Number(gsap.getProperty(rat, "scaleY"))) || 1;
      const pizzaOffset =
        currentMode === "pulling" ? { x: 0.96, y: 0.74 } : { x: 0.66, y: 0.65 };
      const pizzaXOffset =
        travelDirection === 1 ? 1 - pizzaOffset.x : pizzaOffset.x;
      const pizzaDrop: DroppedPizza = {
        id: nextPizzaIdRef.current,
        x: ((currentX + ratSize * pizzaXOffset) / Math.max(1, width)) * 100,
        y: ((currentY + ratSize * pizzaOffset.y) / Math.max(1, height)) * 100,
        rotation: randomBetween(-7, 7),
        scale: randomBetween(0.78, 1),
      };
      nextPizzaIdRef.current += 1;
      setDroppedPizzas((current) =>
        [...current, pizzaDrop].slice(-MAX_DROPPED_PIZZAS),
      );

      const groundY = currentY + ratSize * (0.5 + (0.88 - 0.5) * currentScale);
      updateMode("fleeing");
      const fleeScale = currentScale * 0.94;
      const fleeScaleX = travelDirection === 1 ? fleeScale : -fleeScale;
      const fleeY = groundY - ratSize * (0.5 + (0.88 - 0.5) * fleeScale);
      const endX = travelDirection === -1 ? -ratSize * 1.5 : width + ratSize * 0.5;
      const runDistance = Math.abs(endX - currentX);
      const runStride = ratSize * fleeScale * 0.85;
      const runDuration = Math.max(0.18, runDistance / (ratSize * fleeScale * 3.8));
      const ramp = Math.min(0.18, 0.12 / runDuration);
      gsap.set(rat, {
        y: fleeY,
        pointerEvents: "none",
        rotation: 0,
        scaleX: fleeScaleX,
        scaleY: fleeScale,
      });
      escapeTween?.kill();
      escapeTween = gsap.to(rat, {
        x: endX,
        duration: runDuration,
        ease: (progress) => (progress < ramp ? progress * progress / (2 * ramp) : progress - ramp / 2) / (1 - ramp / 2),
        onUpdate: () => {
          // Advance feet by distance travelled, including the short launch
          // acceleration, so they cannot sprint on the spot or slide at speed.
          const x = Number(gsap.getProperty(rat, "x")) || 0;
          setStrideFrame(Math.abs(x - currentX) / runStride);
        },
        onComplete: () => {
          gsap.set(rat, { autoAlpha: 0 });
          updateMode("pulling");
          scheduleRat(1400, 3200);
        },
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener(
      "pointerleave",
      onPointerLeaveWindow,
    );

    const sequenceStage = root.closest<HTMLElement>("[data-sequence-what]");
    let intersects = false;
    const syncVisibility = () => {
      const next = intersects && !sequenceStage?.inert;
      if (visible === next) return;
      visible = next;
      if (visible) {
        scheduleRat(500, 1600);
        return;
      }

      clearSchedule();
      clearNibble();
      movementTween?.kill();
      escapeTween?.kill();
      ratActive = false;
      scared = false;
      updateMode("pulling");
      gsap.set(rat, { autoAlpha: 0, pointerEvents: "none" });
    };
    const observer = new IntersectionObserver(([entry]) => {
      intersects = Boolean(entry?.isIntersecting);
      syncVisibility();
    }, { threshold: 0.08 });
    const stageObserver = new MutationObserver(syncVisibility);
    if (sequenceStage) stageObserver.observe(sequenceStage, { attributes: true, attributeFilter: ["inert"] });

    observer.observe(root);

    const resizeObserver = new ResizeObserver(() => {
      readRoadTrack();
      if (!roadTrack || (!ratActive && !scared)) return;
      const currentScaleX = Number(gsap.getProperty(rat, "scaleX")) || 1;
      const scale = fitScaleToRoad(Math.abs(currentScaleX));
      const y = clampYToRoad(Number(gsap.getProperty(rat, "y")) || 0, scale);
      gsap.set(rat, {
        y,
        scaleX: Math.sign(currentScaleX) * scale,
        scaleY: scale,
      });
    });
    resizeObserver.observe(root);
    resizeObserver.observe(rat);
    if (road) resizeObserver.observe(road);

    return () => {
      disposed = true;
      clearSchedule();
      clearNibble();
      observer.disconnect();
      stageObserver.disconnect();
      resizeObserver.disconnect();
      movementTween?.kill();
      escapeTween?.kill();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerLeaveWindow,
      );
      scareRatRef.current = () => undefined;
    };
  }, [pizzaAssetUrl, ratAssetUrl]);

  return (
    <div
      ref={rootRef}
      data-what-rat-scene
      data-what-layer
      data-depth="0.86"
      data-end-scale="1.18"
      className="pointer-events-none absolute inset-0 z-50 origin-center will-change-transform"
      aria-hidden={!ratAssetUrl}
    >
      {pizzaAssetUrl &&
        droppedPizzas.map((pizza) => (
          <button
            key={pizza.id}
            type="button"
            data-road-debris="pizza"
            aria-label="Throw the dropped pizza"
            className="pointer-events-auto absolute aspect-square w-[clamp(3.75rem,5.5vw,6rem)] touch-none select-none cursor-grab border-0 bg-transparent bg-contain bg-center bg-no-repeat p-0 focus-visible:outline focus-visible:outline-2"
            style={{
              left: `${pizza.x}%`,
              top: `${pizza.y}%`,
              backgroundImage: `url(${pizzaAssetUrl})`,
              transform: `translate(-50%, -50%) rotate(${pizza.rotation}deg) scale(${pizza.scale})`,
            }}
          />
        ))}

      {ratAssetUrl && pizzaAssetUrl && (
        <button
          ref={ratRef}
          type="button"
          aria-label="Scare the pizza rat"
          onPointerDown={() => scareRatRef.current()}
          onFocus={() => scareRatRef.current()}
          className="pointer-events-none absolute left-0 top-0 aspect-square w-[clamp(7.5rem,10.5vw,11rem)] cursor-crosshair border-0 bg-transparent p-0 opacity-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <span
            ref={spriteRef}
            aria-hidden="true"
            className="block h-full w-full bg-no-repeat"
            style={{
              backgroundImage: `url(${ratAssetUrl})`,
              backgroundSize: "300% 300%",
              transform: "scale(1.28)",
              transformOrigin: "0% 50%",
            }}
          />
        </button>
      )}
    </div>
  );
}
