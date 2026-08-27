"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Bodies, Body, Engine, Sleeping, World } from "matter-js";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { stegaClean } from "next-sanity";
import { useContactModal } from "@/components/contact/contact-modal-context";

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
  "object-black": "/images/basket-links/object-black.png",
  magazine: "/images/basket-links/magazine.png",
  portal: "/images/basket-links/portal.png",
  smoothie: "/images/basket-links/smoothie.png",
  hoodie: "/images/basket-links/hoodie.png",
  pigeon: "/images/basket-links/pigeon.png",
};

const FALLBACK_ITEMS: BasketItem[] = [
  { _key: "computer", title: "Computer", localAsset: "computer", size: 24, startX: 69, startY: 57 },
  { _key: "black-object", title: "Basket item", localAsset: "object-black", size: 18, startX: 29, startY: 30 },
  { _key: "magazine", title: "Magazine", localAsset: "magazine", size: 18, startX: 76, startY: 28 },
  { _key: "portal", title: "Portal", localAsset: "portal", size: 25, startX: 43, startY: 64 },
  { _key: "smoothie", title: "Smoothie", localAsset: "smoothie", size: 14, startX: 53, startY: 30 },
  { _key: "hoodie", title: "Hoodie", localAsset: "hoodie", size: 21, startX: 27, startY: 66 },
  { _key: "pigeon", title: "Pigeon", localAsset: "pigeon", size: 21, startX: 37, startY: 38 },
];

type ResolvedBasketItem = BasketItem & { src: string };

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

export default function BasketLinksSection(props: BasketLinksSectionBlock) {
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const { open: openContact } = useContactModal();

  const items = useMemo<ResolvedBasketItem[]>(() => {
    const source = props.items?.length ? props.items : FALLBACK_ITEMS;
    return source
      .map((item) => {
        const localKey = stegaClean(item.localAsset) || "";
        const src = item.image?.asset?.url || LOCAL_ASSETS[localKey];
        return src ? { ...item, src } : null;
      })
      .filter((item): item is ResolvedBasketItem => Boolean(item));
  }, [props.items]);

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
      Body.setAngle(body, ((index * 47) % 70 - 35) * (Math.PI / 180));
      Body.setVelocity(body, { x: (index % 2 ? 1 : -1) * (0.7 + (index % 3) * 0.35), y: (index % 3 - 1) * 0.45 });
      Body.setAngularVelocity(body, (index % 2 ? 1 : -1) * (0.004 + (index % 3) * 0.002));
      return body;
    });

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
          Body.setAngularVelocity(body, clamp(body.angularVelocity + normalized * (index % 2 ? 0.018 : -0.018), -0.09, 0.09));
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
    };
  }, [items]);

  const sectionId = stegaClean(props.anchor?.anchorId) || undefined;
  const basketSrc = props.basketImage?.asset?.url || "/images/basket-links/basket.png";
  const backgroundColor = stegaClean(props.backgroundColor?.hex) || "#FFFFFF";
  const title = stegaClean(props.title) || "THE PATHETIC BASKET";
  const hint = stegaClean(props.hint) || "(PSSSST — YOU HAVE TO CLICK ON IT)";

  const itemContent = (item: ResolvedBasketItem) => (
    <>
      {/* A native image keeps animated/custom Sanity assets untouched and avoids
          Next Image wrappers interfering with Matter's transform target. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.src} alt={stegaClean(item.image?.alt) || stegaClean(item.title) || ""} draggable={false} className="pointer-events-none h-full w-full select-none object-contain" />
      <span
        className="pointer-events-none absolute bottom-[4%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-[clamp(.9rem,1.8vw,1.55rem)] font-black italic uppercase leading-none tracking-[-.05em] text-white"
        style={{ WebkitTextStroke: "clamp(1px,.14vw,2px) #000", paintOrder: "stroke fill" }}
      >
        {stegaClean(item.title)}
      </span>
    </>
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
        className="relative aspect-[1151/768] w-[min(96vw,112svh,78rem)] touch-none select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={basketSrc}
          alt={stegaClean(props.basketImage?.alt) || "Red shopping basket"}
          draggable={false}
          className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none object-contain"
        />

        {items.map((item, index) => {
          const size = clamp(stegaClean(item.size) || 20, 8, 38);
          const commonClass = "group absolute left-0 top-0 z-10 aspect-square cursor-grab touch-none select-none border-0 bg-transparent p-0 will-change-transform active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
          const commonProps = {
            ref: (node: HTMLElement | null) => { itemRefs.current[index] = node; },
            "data-basket-body": "true",
            "data-basket-index": String(index),
            className: commonClass,
            style: { width: `${size}%` },
          };
          const linkType = stegaClean(item.link?.linkType) || "";
          const href = stegaClean(item.link?.href) || "";

          if (linkType === "contact") {
            return (
              <button key={item._key} type="button" {...commonProps} onClick={openContact} aria-label={stegaClean(item.title) || "Open contact form"}>
                {itemContent(item)}
              </button>
            );
          }

          if (href) {
            return (
              <Link key={item._key} href={href} target={item.link?.target ? "_blank" : undefined} rel={item.link?.target ? "noopener noreferrer" : undefined} {...commonProps} aria-label={stegaClean(item.title) || "Basket link"}>
                {itemContent(item)}
              </Link>
            );
          }

          return (
            <div key={item._key} {...commonProps} aria-label={stegaClean(item.title) || undefined}>
              {itemContent(item)}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-[clamp(.72rem,1.05vw,.95rem)] font-bold italic uppercase tracking-[-.03em]">
        {hint}
      </p>
    </section>
  );
}
