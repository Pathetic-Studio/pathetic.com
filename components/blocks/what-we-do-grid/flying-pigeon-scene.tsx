"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import useChromaKeyAsset from "@/components/blocks/what-we-do-grid/use-chroma-key-asset";

const FLIGHT_ATLAS_SRC = "/images/what-we-do/pigeon-flight-atlas.png";
const DEAD_PIGEON_SRC = "/images/what-we-do/pigeon-dead.png";
const MAX_DEAD_PIGEONS = 32;

type DeadPigeon = {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  direction: 1 | -1;
};

const randomBetween = (minimum: number, maximum: number) =>
  minimum + Math.random() * (maximum - minimum);

export default function FlyingPigeonScene() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pigeonRef = useRef<HTMLButtonElement | null>(null);
  const dropPigeonRef = useRef<() => void>(() => undefined);
  const nextDeadIdRef = useRef(0);
  const [nearViewport, setNearViewport] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [dropping, setDropping] = useState(false);
  const [deadPigeons, setDeadPigeons] = useState<DeadPigeon[]>([]);
  const flightAssetUrl = useChromaKeyAsset(FLIGHT_ATLAS_SRC, nearViewport);
  const deadAssetUrl = useChromaKeyAsset(DEAD_PIGEON_SRC, nearViewport);

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
    const pigeon = pigeonRef.current;
    if (!root || !pigeon || !flightAssetUrl || !deadAssetUrl) return;

    let scheduleTimer = 0;
    let flightTween: gsap.core.Tween | null = null;
    let dropTween: gsap.core.Tween | null = null;
    let visible = false;
    let disposed = false;
    let flyingDirection: 1 | -1 = 1;
    let isDropping = false;
    const pointer = { x: -1, y: -1, active: false };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = event.pointerType === "mouse" || event.pointerType === "pen";
    };

    const onPointerLeaveWindow = () => {
      pointer.active = false;
    };

    const clearSchedule = () => window.clearTimeout(scheduleTimer);

    const scheduleFlight = (minimumDelay = 2800, maximumDelay = 6800) => {
      clearSchedule();
      if (!visible || disposed) return;
      scheduleTimer = window.setTimeout(
        launchFlight,
        randomBetween(minimumDelay, maximumDelay),
      );
    };

    const checkPointerCollision = () => {
      if (!pointer.active || isDropping || !flightTween?.isActive()) return;

      const bounds = pigeon.getBoundingClientRect();
      const insetX = bounds.width * 0.1;
      const insetY = bounds.height * 0.13;
      const isOverPigeon =
        pointer.x >= bounds.left + insetX &&
        pointer.x <= bounds.right - insetX &&
        pointer.y >= bounds.top + insetY &&
        pointer.y <= bounds.bottom - insetY;

      if (isOverPigeon) dropPigeonRef.current();
    };

    const launchFlight = () => {
      if (!visible || disposed) return;

      const width = root.clientWidth;
      const height = root.clientHeight;
      const pigeonSize = pigeon.offsetWidth;
      flyingDirection = Math.random() > 0.34 ? 1 : -1;
      isDropping = false;
      setDropping(false);
      setDirection(flyingDirection);

      const startX =
        flyingDirection === 1 ? -pigeonSize * 1.25 : width + pigeonSize * 0.25;
      const endX =
        flyingDirection === 1 ? width + pigeonSize * 0.3 : -pigeonSize * 1.3;
      const startY = height * randomBetween(0.08, 0.29);
      const endY = Math.max(
        height * 0.04,
        Math.min(height * 0.4, startY + height * randomBetween(-0.1, 0.1)),
      );

      gsap.set(pigeon, {
        x: startX,
        y: startY,
        rotation: randomBetween(-4, 4),
        scale: randomBetween(0.82, 1.08),
        autoAlpha: 1,
        pointerEvents: "auto",
      });

      flightTween?.kill();
      flightTween = gsap.to(pigeon, {
        x: endX,
        y: endY,
        rotation: randomBetween(-3, 3),
        duration: randomBetween(7.2, 10.2),
        ease: "none",
        onUpdate: checkPointerCollision,
        onComplete: () => {
          gsap.set(pigeon, { autoAlpha: 0, pointerEvents: "none" });
          scheduleFlight();
        },
      });
    };

    dropPigeonRef.current = () => {
      if (isDropping || !visible) return;
      isDropping = true;
      flightTween?.kill();
      setDropping(true);

      const width = root.clientWidth;
      const height = root.clientHeight;
      const pigeonSize = pigeon.offsetWidth;
      const currentX = Number(gsap.getProperty(pigeon, "x")) || 0;
      const currentScale = Number(gsap.getProperty(pigeon, "scale")) || 1;
      const landingX = Math.max(
        pigeonSize * 0.25,
        Math.min(
          width - pigeonSize * 1.25,
          currentX + flyingDirection * width * randomBetween(0.035, 0.085),
        ),
      );
      const landingY = height * randomBetween(0.78, 0.91);
      const landingRotation = randomBetween(-18, 18);

      gsap.set(pigeon, { pointerEvents: "none" });
      dropTween?.kill();
      dropTween = gsap.to(pigeon, {
        x: landingX,
        y: landingY - pigeonSize * 0.45,
        rotation: landingRotation + flyingDirection * 170,
        scale: currentScale * 0.82,
        duration: randomBetween(0.72, 0.96),
        ease: "power3.in",
        onComplete: () => {
          const deadPigeon: DeadPigeon = {
            id: nextDeadIdRef.current,
            x: ((landingX + pigeonSize * 0.5) / Math.max(1, width)) * 100,
            y: (landingY / Math.max(1, height)) * 100,
            rotation: landingRotation,
            scale: randomBetween(0.76, 1.02),
            direction: flyingDirection,
          };
          nextDeadIdRef.current += 1;
          setDeadPigeons((current) =>
            [...current, deadPigeon].slice(-MAX_DEAD_PIGEONS),
          );
          gsap.set(pigeon, { autoAlpha: 0 });
          setDropping(false);
          scheduleFlight(1100, 2600);
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
          scheduleFlight(350, 1400);
          return;
        }

        clearSchedule();
        flightTween?.kill();
        dropTween?.kill();
        isDropping = false;
        setDropping(false);
        gsap.set(pigeon, { autoAlpha: 0, pointerEvents: "none" });
      },
      { threshold: 0.08 },
    );

    observer.observe(root);

    return () => {
      disposed = true;
      clearSchedule();
      observer.disconnect();
      flightTween?.kill();
      dropTween?.kill();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerLeaveWindow,
      );
      dropPigeonRef.current = () => undefined;
    };
  }, [deadAssetUrl, flightAssetUrl]);

  return (
    <div
      ref={rootRef}
      data-what-layer
      data-depth="0.18"
      data-end-scale="1.055"
      className="pointer-events-none absolute inset-0 z-[32] origin-center will-change-transform"
      aria-hidden={!flightAssetUrl}
    >
      {deadAssetUrl &&
        deadPigeons.map((pigeon) => (
          <span
            key={pigeon.id}
            aria-hidden="true"
            className="absolute aspect-[4/3] w-[clamp(4rem,6vw,6.5rem)] -translate-x-1/2 -translate-y-1/2 bg-contain bg-center bg-no-repeat"
            style={{
              left: `${pigeon.x}%`,
              top: `${pigeon.y}%`,
              backgroundImage: `url(${deadAssetUrl})`,
              transform: `translate(-50%, -50%) rotate(${pigeon.rotation}deg) scale(${pigeon.direction * pigeon.scale}, ${pigeon.scale})`,
            }}
          />
        ))}

      {flightAssetUrl && deadAssetUrl && (
        <button
          ref={pigeonRef}
          type="button"
          aria-label="Drop the flying pigeon onto the road"
          onPointerEnter={() => dropPigeonRef.current()}
          onPointerDown={() => dropPigeonRef.current()}
          onFocus={() => dropPigeonRef.current()}
          className="pointer-events-none absolute left-0 top-0 aspect-square w-[clamp(4.25rem,6.25vw,6.75rem)] cursor-crosshair border-0 bg-transparent p-0 opacity-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <span
            aria-hidden="true"
            className={
              dropping
                ? "block h-full w-full bg-contain bg-center bg-no-repeat"
                : "what-pigeon-flight-frame block h-full w-full bg-no-repeat"
            }
            style={{
              backgroundImage: `url(${dropping ? deadAssetUrl : flightAssetUrl})`,
              backgroundSize: dropping ? "contain" : "300% 300%",
              transform: `scaleX(${direction})`,
            }}
          />
        </button>
      )}
    </div>
  );
}
