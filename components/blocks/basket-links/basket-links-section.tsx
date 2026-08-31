"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Bodies, Body, Engine, Sleeping, World } from "matter-js";
import type { Body as MatterBody, Vector } from "matter-js";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { stegaClean } from "next-sanity";
import BasketLinksPopup, { type BasketPopupType } from "./basket-links-popup";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type BasketLink = {
  linkType?: string | null;
  href?: string | null;
  target?: boolean | null;
};

type BasketItem = {
  _key: string;
  title?: string | null;
  localAsset?: string | null;
  size?: number | null;
  startX?: number | null;
  startY?: number | null;
  image?: {
    alt?: string | null;
    asset?: { url?: string | null } | null;
  } | null;
  link?: BasketLink | null;
};

export type BasketLinksSectionBlock = {
  _type: "basket-links-section";
  _key: string;
  anchor?: { anchorId?: string | null } | null;
  title?: string | null;
  hint?: string | null;
  backgroundColor?: { hex?: string | null } | null;
  basketImage?: {
    alt?: string | null;
    asset?: { url?: string | null } | null;
  } | null;
  items?: BasketItem[] | null;
};

const LOCAL_ASSETS: Record<string, string> = {
  computer: "/images/basket-links/computer.png",
  portal: "/images/basket-links/portal.png",
  hoodie: "/images/basket-links/hoodie.png",
  pigeon: "/images/basket-links/pigeon.png",
};

type BasketPreset = {
  title: string;
  genericTitle: string;
  artworkRotation: number;
  artworkScale: number;
  labelX: number;
  labelY: number;
  startX: number;
  startY: number;
};

const BASKET_PRESETS: Record<string, BasketPreset> = {
  pigeon: {
    title: "Newsletter",
    genericTitle: "Pigeon",
    artworkRotation: 0,
    artworkScale: 0.94,
    labelX: 48,
    labelY: 72,
    startX: 28,
    startY: 34,
  },
  hoodie: {
    title: "Shop",
    genericTitle: "Hoodie",
    artworkRotation: 48,
    artworkScale: 0.92,
    labelX: 49,
    labelY: 79,
    startX: 48,
    startY: 39,
  },
  computer: {
    title: "Jobs",
    genericTitle: "Computer",
    artworkRotation: -22,
    artworkScale: 0.8,
    labelX: 50,
    labelY: 64,
    startX: 72,
    startY: 43,
  },
  portal: {
    title: "The Abyss",
    genericTitle: "Portal",
    artworkRotation: -20,
    artworkScale: 0.86,
    labelX: 50,
    labelY: 73,
    startX: 44,
    startY: 68,
  },
};

const POPUP_BY_PRESET: Record<string, BasketPopupType> = {
  pigeon: "newsletter",
  hoodie: "shop",
  computer: "jobs",
  portal: "abyss",
};

const FALLBACK_ITEMS: BasketItem[] = [
  { _key: "pigeon", title: "Newsletter", localAsset: "pigeon", size: 23, startX: 28, startY: 34 },
  { _key: "hoodie", title: "Shop", localAsset: "hoodie", size: 23, startX: 48, startY: 39 },
  { _key: "computer", title: "Jobs", localAsset: "computer", size: 26, startX: 72, startY: 43 },
  { _key: "portal", title: "The Abyss", localAsset: "portal", size: 27, startX: 44, startY: 68 },
];

type ResolvedBasketItem = Omit<BasketItem, "title" | "startX" | "startY"> & {
  title: string;
  startX: number;
  startY: number;
  src: string;
  preset: BasketPreset;
  presetKey: string;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

export default function BasketLinksSection(props: BasketLinksSectionBlock) {
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const matterBodiesRef = useRef<MatterBody[]>([]);
  const frozenPopupBodyRef = useRef<{
    body: MatterBody;
    velocity: Vector;
    angularVelocity: number;
    collisionMask: number;
  } | null>(null);
  const popupSourceRef = useRef<HTMLElement | null>(null);
  const [activePopup, setActivePopup] = useState<BasketPopupType | null>(null);
  const [popupOrigin, setPopupOrigin] = useState<{ x: number; y: number } | null>(null);

  const items = useMemo<ResolvedBasketItem[]>(() => {
    const source = props.items?.length ? props.items : FALLBACK_ITEMS;
    return source
      .map((item) => {
        const localKey = stegaClean(item.localAsset) || "";
        const preset = BASKET_PRESETS[localKey];
        if (!preset) return null;
        const customImageUrl = item.image?.asset?.url || "";
        const src = customImageUrl || LOCAL_ASSETS[localKey];
        if (!src) return null;

        const cleanTitle = (stegaClean(item.title) || "").trim();
        const title =
          !cleanTitle || cleanTitle.toLowerCase() === preset.genericTitle.toLowerCase()
            ? preset.title
            : cleanTitle;

        return {
          ...item,
          title,
          src,
          preset: customImageUrl
            ? { ...preset, artworkRotation: 0, artworkScale: 0.94 }
            : preset,
          presetKey: localKey,
          startX: preset.startX,
          startY: preset.startY,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [props.items]);

  const closePopup = useCallback(() => {
    setActivePopup(null);
    const frozen = frozenPopupBodyRef.current;
    frozenPopupBodyRef.current = null;
    if (!frozen) return;

    // The popup's reverse FLIP finishes before this callback. Keeping the
    // Matter body static until now means its live DOM destination cannot drift
    // away from the rectangle the artwork is animating toward.
    Body.setStatic(frozen.body, false);
    frozen.body.collisionFilter.mask = frozen.collisionMask;
    Body.setVelocity(frozen.body, {
      x: frozen.velocity.x * 0.32,
      y: frozen.velocity.y * 0.32,
    });
    Body.setAngularVelocity(frozen.body, frozen.angularVelocity * 0.24);
    Sleeping.set(frozen.body, false);
  }, []);

  const openPopup = useCallback((type: BasketPopupType, event: React.MouseEvent<HTMLElement>) => {
    popupSourceRef.current = event.currentTarget;
    const index = Number(event.currentTarget.dataset.basketIndex);
    const body = matterBodiesRef.current[index];
    if (body) {
      frozenPopupBodyRef.current = {
        body,
        velocity: { x: body.velocity.x, y: body.velocity.y },
        angularVelocity: body.angularVelocity,
        collisionMask: body.collisionFilter.mask ?? 0xffffffff,
      };
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
      Body.setStatic(body, true);
      body.collisionFilter.mask = 0;
    }
    setPopupOrigin({ x: event.clientX, y: event.clientY });
    setActivePopup(type);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const elements = itemRefs.current.slice(0, items.length);
    if (!root || !stage || !elements.length || elements.some((element) => !element)) return;

    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;

    const engine = Engine.create({ enableSleeping: true });
    engine.world.gravity.x = 0;
    engine.world.gravity.y = 0.12;
    engine.world.gravity.scale = 0.001;

    const bounds = {
      left: width * 0.075,
      right: width * 0.925,
      top: height * 0.08,
      bottom: height * 0.92,
    };
    const wallThickness = Math.max(width, height) * 0.35;
    const wallOptions = { isStatic: true, render: { visible: false } } as const;
    const walls = [
      Bodies.rectangle((bounds.left + bounds.right) / 2, bounds.top - wallThickness / 2, bounds.right - bounds.left, wallThickness, wallOptions),
      Bodies.rectangle((bounds.left + bounds.right) / 2, bounds.bottom + wallThickness / 2, bounds.right - bounds.left, wallThickness, wallOptions),
      Bodies.rectangle(bounds.left - wallThickness / 2, (bounds.top + bounds.bottom) / 2, wallThickness, bounds.bottom - bounds.top, wallOptions),
      Bodies.rectangle(bounds.right + wallThickness / 2, (bounds.top + bounds.bottom) / 2, wallThickness, bounds.bottom - bounds.top, wallOptions),
    ];

    const bodies = elements.map((element, index) => {
      const item = items[index];
      const itemWidth = element!.offsetWidth;
      const itemHeight = element!.offsetHeight;
      const halfWidth = itemWidth / 2;
      const halfHeight = itemHeight / 2;
      const x = clamp(
        width * ((stegaClean(item.startX) || 24 + index * 9) / 100),
        bounds.left + halfWidth,
        bounds.right - halfWidth,
      );
      const y = clamp(
        height * ((stegaClean(item.startY) || 25 + (index % 3) * 22) / 100),
        bounds.top + halfHeight,
        bounds.bottom - halfHeight,
      );
      const body = Bodies.rectangle(x, y, itemWidth * 0.72, itemHeight * 0.72, {
        restitution: 0.58,
        friction: 0.18,
        frictionAir: 0.025,
        density: 0.0014,
        chamfer: { radius: Math.min(itemWidth, itemHeight) * 0.12 },
      });
      // Start from the artwork's authored orientation. The old random angle
      // made labels look detached even though they lived inside the item.
      Body.setAngle(body, 0);
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
      return body;
    });
    matterBodiesRef.current = bodies;

    World.add(engine.world, [...walls, ...bodies]);

    let active = true;
    let disposed = false;
    let animationFrame = 0;
    let lastFrameTime = performance.now();
    let lastImpulseTime = 0;
    let drag: {
      pointerId: number;
      index: number;
      element: HTMLElement;
      offsetX: number;
      offsetY: number;
      startX: number;
      startY: number;
      lastX: number;
      lastY: number;
      lastTime: number;
      velocityX: number;
      velocityY: number;
      moved: boolean;
    } | null = null;

    const renderBodies = () => {
      bodies.forEach((body, index) => {
        const element = elements[index];
        if (!element) return;
        element.style.transform = `translate3d(${body.position.x - element.offsetWidth / 2}px, ${body.position.y - element.offsetHeight / 2}px, 0) rotate(${body.angle}rad)`;
      });
    };

    const loop = (time: number) => {
      if (disposed || !active) return;
      const delta = clamp(time - lastFrameTime, 8, 32);
      lastFrameTime = time;
      Engine.update(engine, delta);
      renderBodies();
      animationFrame = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (disposed || animationFrame) return;
      lastFrameTime = performance.now();
      animationFrame = requestAnimationFrame(loop);
    };

    renderBodies();
    startLoop();

    const observer = new IntersectionObserver(
      ([entry]) => {
        active = Boolean(entry?.isIntersecting);
        if (active) {
          startLoop();
        } else if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
      },
      { rootMargin: "20% 0px", threshold: 0.01 },
    );
    observer.observe(root);

    const scrollTrigger = ScrollTrigger.create({
      trigger: root,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        if (!active || drag) return;
        const now = performance.now();
        if (now - lastImpulseTime < 70) return;
        lastImpulseTime = now;
        const normalized = clamp(-self.getVelocity() / 2600, -1, 1);
        if (Math.abs(normalized) < 0.035) return;

        bodies.forEach((body, index) => {
          if (body.isStatic) return;
          Body.setVelocity(body, {
            x: clamp(body.velocity.x + normalized * ((index % 3) - 1) * 1.6, -13, 13),
            y: clamp(body.velocity.y + normalized * (4.5 + (index % 3)), -15, 15),
          });
          Sleeping.set(body, false);
        });
      },
    });

    const getStagePoint = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const element = (event.target as Element | null)?.closest<HTMLElement>("[data-basket-body]");
      if (!element || !stage.contains(element)) return;
      const index = Number(element.dataset.basketIndex);
      const body = bodies[index];
      if (!body) return;
      const point = getStagePoint(event);
      drag = {
        pointerId: event.pointerId,
        index,
        element,
        offsetX: point.x - body.position.x,
        offsetY: point.y - body.position.y,
        startX: point.x,
        startY: point.y,
        lastX: point.x,
        lastY: point.y,
        lastTime: performance.now(),
        velocityX: 0,
        velocityY: 0,
        moved: false,
      };
      Body.setStatic(body, true);
      Sleeping.set(body, false);
      element.dataset.dragging = "true";
      element.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const body = bodies[drag.index];
      if (!body) return;
      const point = getStagePoint(event);
      const now = performance.now();
      const elapsed = Math.max(8, now - drag.lastTime);
      drag.velocityX = ((point.x - drag.lastX) / elapsed) * 16.67;
      drag.velocityY = ((point.y - drag.lastY) / elapsed) * 16.67;
      drag.lastX = point.x;
      drag.lastY = point.y;
      drag.lastTime = now;
      drag.moved ||= Math.hypot(point.x - drag.startX, point.y - drag.startY) > 6;

      const halfWidth = drag.element.offsetWidth / 2;
      const halfHeight = drag.element.offsetHeight / 2;
      Body.setPosition(body, {
        x: clamp(point.x - drag.offsetX, bounds.left + halfWidth, bounds.right - halfWidth),
        y: clamp(point.y - drag.offsetY, bounds.top + halfHeight, bounds.bottom - halfHeight),
      });
      renderBodies();
      if (drag.moved) event.preventDefault();
    };

    const finishDrag = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const body = bodies[drag.index];
      const element = drag.element;
      const moved = drag.moved;
      if (body) {
        Body.setStatic(body, false);
        Body.setVelocity(body, {
          x: clamp(drag.velocityX, -16, 16),
          y: clamp(drag.velocityY, -16, 16),
        });
        Body.setAngularVelocity(body, clamp(drag.velocityX * 0.004, -0.08, 0.08));
      }
      element.dataset.dragging = "false";
      if (moved) element.dataset.draggedUntil = String(performance.now() + 300);
      if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);
      drag = null;
    };

    const onClickCapture = (event: MouseEvent) => {
      const element = (event.target as Element | null)?.closest<HTMLElement>("[data-basket-body]");
      if (!element) return;
      const draggedUntil = Number(element.dataset.draggedUntil || 0);
      if (performance.now() < draggedUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove, { passive: false });
    stage.addEventListener("pointerup", finishDrag);
    stage.addEventListener("pointercancel", finishDrag);
    stage.addEventListener("click", onClickCapture, true);

    return () => {
      disposed = true;
      observer.disconnect();
      scrollTrigger.kill();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", finishDrag);
      stage.removeEventListener("pointercancel", finishDrag);
      stage.removeEventListener("click", onClickCapture, true);
      World.clear(engine.world, false);
      Engine.clear(engine);
      matterBodiesRef.current = [];
      frozenPopupBodyRef.current = null;
    };
  }, [items]);

  const sectionId = stegaClean(props.anchor?.anchorId) || "shop";
  const basketSrc = props.basketImage?.asset?.url || "/images/basket-links/basket.png";
  const backgroundColor = stegaClean(props.backgroundColor?.hex) || "#FFFFFF";
  const title = stegaClean(props.title) || "THE PATHETIC BASKET";
  const hint = stegaClean(props.hint) || "(PSSSST — YOU HAVE TO CLICK ON IT)";

  const itemContent = (item: ResolvedBasketItem) => (
    <span
      data-basket-artwork-plane
      className="pointer-events-none absolute inset-0 block"
    >
      {/* A native image keeps animated/custom Sanity assets untouched and avoids
          Next Image wrappers interfering with Matter's transform target. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={stegaClean(item.image?.alt) || stegaClean(item.title) || ""}
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-contain"
        style={{
          transform: `rotate(${item.preset.artworkRotation}deg) scale(${item.preset.artworkScale})`,
          transformOrigin: "50% 50%",
        }}
      />
      <span
        data-basket-label
        className="pointer-events-none absolute z-20 whitespace-nowrap text-center text-[clamp(1.05rem,2.3vw,2.05rem)] font-black italic uppercase leading-none tracking-[-.055em] text-black"
        style={{
          left: `${item.preset.labelX}%`,
          top: `${item.preset.labelY}%`,
          transform: "translate(-50%, -50%) rotate(0deg)",
          WebkitTextStroke: "clamp(2px,.22vw,3px) #fff",
          paintOrder: "stroke fill",
          transformOrigin: "50% 50%",
          filter: "drop-shadow(1px 1px 0 #000)",
        }}
      >
        {stegaClean(item.title)}
      </span>
    </span>
  );

  return (
    <section
      ref={rootRef}
      id={sectionId}
      className="relative isolate flex h-[96svh] max-h-[96svh] flex-col items-center justify-center overflow-hidden px-3 py-[clamp(2rem,4vh,3.5rem)] sm:px-4 lg:px-6"
      style={{ backgroundColor }}
    >
      <h2 className="sr-only">{title}</h2>
      <div
        ref={stageRef}
        className={`relative aspect-[1151/768] w-[min(96vw,112svh,78rem)] touch-none select-none transition-[filter] ${activePopup === "abyss" ? "duration-[3000ms] ease-in brightness-0" : "duration-700 ease-out"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={basketSrc}
          alt={stegaClean(props.basketImage?.alt) || "Red shopping basket"}
          draggable={false}
          className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none object-contain"
        />

        {items.map((item, index) => {
          const size = clamp((stegaClean(item.size) || 20) * 1.16, 10, 44);
          const commonClass = "group absolute left-0 top-0 z-10 aspect-square cursor-grab touch-none select-none border-0 bg-transparent p-0 will-change-transform active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
          const commonProps = {
            ref: (node: HTMLElement | null) => { itemRefs.current[index] = node; },
            "data-basket-body": "true",
            "data-basket-index": String(index),
            className: commonClass,
            style: { width: `${size}%` },
          };
          return (
            <button
              key={item._key}
              type="button"
              {...commonProps}
              onClick={(event) => openPopup(POPUP_BY_PRESET[item.presetKey], event)}
              aria-label={`Open ${stegaClean(item.title) || "basket"} popup`}
            >
              {itemContent(item)}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-[clamp(.72rem,1.05vw,.95rem)] font-bold italic uppercase tracking-[-.03em]">
        {hint}
      </p>
      <BasketLinksPopup
        active={activePopup}
        onClose={closePopup}
        origin={popupOrigin}
        sourceElement={popupSourceRef.current}
        shopHref={stegaClean(items.find((item) => item.presetKey === "hoodie")?.link?.href) || undefined}
      />
    </section>
  );
}
