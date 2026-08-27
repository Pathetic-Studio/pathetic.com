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
  const scareRatRef = useRef<() => void>(() => undefined);
  const nextPizzaIdRef = useRef(0);
  const [nearViewport, setNearViewport] = useState(false);
  const [mode, setMode] = useState<RatMode>("pulling");
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
    if (!root || !rat || !ratAssetUrl || !pizzaAssetUrl) return;

    let scheduleTimer = 0;
    let nibbleTimer = 0;
    let movementTween: gsap.core.Tween | null = null;
    let escapeTween: gsap.core.Tween | null = null;
    let visible = false;
    let disposed = false;
    let ratActive = false;
    let scared = false;
    let currentMode: RatMode = "pulling";
    let travelDirection: -1 | 1 = -1;
    const pointer = { x: -1, y: -1, active: false };
    let checkPointerCollision = () => undefined;

    const updateMode = (nextMode: RatMode) => {
      currentMode = nextMode;
      setMode(nextMode);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = event.pointerType === "mouse" || event.pointerType === "pen";
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
      nibbleTimer = window.setTimeout(() => {
        if (!ratActive || scared || disposed) return;
        updateMode("pulling");
        moveNextSegment();
      }, randomBetween(450, 900));
    };

    const moveNextSegment = () => {
      if (!ratActive || scared || disposed) return;

      const width = root.clientWidth;
      const ratSize = rat.offsetWidth;
      const currentX = Number(gsap.getProperty(rat, "x")) || 0;
      const endX =
        travelDirection === -1
          ? -ratSize * 1.2
          : width + ratSize * 1.2;
      const distance = width * randomBetween(0.24, 0.36);
      const targetX =
        travelDirection === -1
          ? Math.max(endX, currentX - distance)
          : Math.min(endX, currentX + distance);
      const reachedEnd =
        travelDirection === -1
          ? targetX <= endX + 1
          : targetX >= endX - 1;

      movementTween?.kill();
      movementTween = gsap.to(rat, {
        x: targetX,
        duration: randomBetween(2.5, 3.7),
        ease: "power1.inOut",
        onUpdate: checkPointerCollision,
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
      const launchScale = randomBetween(0.84, 1.02);
      ratActive = true;
      scared = false;
      travelDirection = Math.random() < 0.5 ? -1 : 1;
      updateMode("pulling");

      gsap.set(rat, {
        x:
          travelDirection === -1
            ? width + ratSize * 0.2
            : -ratSize * 1.2,
        y: height * randomBetween(0.69, 0.79),
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
        currentMode === "pulling"
          ? { x: 0.96, y: 0.74 }
          : { x: 0.66, y: 0.65 };
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

      updateMode("fleeing");
      const fleeScale = currentScale * 0.94;
      const fleeScaleX = travelDirection === 1 ? fleeScale : -fleeScale;
      gsap.set(rat, {
        pointerEvents: "none",
        rotation: 0,
        scaleX: fleeScaleX,
        scaleY: fleeScale,
      });
      escapeTween?.kill();
      escapeTween = gsap.to(rat, {
        x:
          travelDirection === -1
            ? -ratSize * 1.5
            : width + ratSize * 0.5,
        y: Math.max(height * 0.64, currentY - height * randomBetween(0.01, 0.045)),
        duration: randomBetween(1.05, 1.45),
        ease: "power2.in",
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
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
      },
      { threshold: 0.08 },
    );

    observer.observe(root);

    return () => {
      disposed = true;
      clearSchedule();
      clearNibble();
      observer.disconnect();
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

  const animationClass =
    mode === "pulling"
      ? "what-rat-pull-frame"
      : mode === "nibbling"
        ? "what-rat-nibble-frame"
        : "what-rat-flee-frame";

  return (
    <div
      ref={rootRef}
      data-what-layer
      data-depth="0.86"
      data-end-scale="1.18"
      className="pointer-events-none absolute inset-0 z-50 origin-center will-change-transform"
      aria-hidden={!ratAssetUrl}
    >
      {pizzaAssetUrl &&
        droppedPizzas.map((pizza) => (
          <span
            key={pizza.id}
            aria-hidden="true"
            className="absolute aspect-square w-[clamp(3.75rem,5.5vw,6rem)] bg-contain bg-center bg-no-repeat"
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
            aria-hidden="true"
            className={`${animationClass} block h-full w-full bg-no-repeat`}
            style={{
              backgroundImage: `url(${ratAssetUrl})`,
              backgroundSize: mode === "fleeing" ? "420% 420%" : "300% 300%",
              transform:
                mode === "fleeing"
                  ? "translateX(-27%)"
                  : mode === "pulling"
                    ? "scale(1.28)"
                    : undefined,
              transformOrigin: mode === "pulling" ? "0% 50%" : "50% 50%",
            }}
          />
        </button>
      )}
    </div>
  );
}
