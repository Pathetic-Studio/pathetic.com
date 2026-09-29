"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import type { CaseStudy } from "@/lib/case-studies";
import CaseStudyObjectArt from "./case-study-object-art";
import styles from "./client-case-study.module.css";

// Sample the artwork once, so transparent padding doesn't become an invisible
// cushion between the object and the floor. No pixel reads happen during motion.
async function silhouette(element: HTMLElement, object: CaseStudy["object"]) {
  const image = element.querySelector("img")!;
  await image.decode().catch(() => {});
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  if (object.presentation === "photostrip") {
    ctx.fillRect(96 * 0.23, 96 * 0.02, 96 * 0.54, 96 * 0.96);
  } else if (image.naturalWidth) {
    ctx.translate(48, 48);
    if (object.presentation === "ramp-card") {
      ctx.rotate((-38 * Math.PI) / 180);
      ctx.scale(0.84, 0.84);
    }
    const scale = 96 / Math.max(image.naturalWidth, image.naturalHeight);
    const w = image.naturalWidth * scale,
      h = image.naturalHeight * scale;
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
  } else ctx.fillRect(8, 8, 80, 80);
  const pixels = ctx.getImageData(0, 0, 96, 96).data;
  const points: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < 96; y++) {
    let left = -1,
      right = -1;
    for (let x = 0; x < 96; x++) {
      if (pixels[(y * 96 + x) * 4 + 3] > 100) {
        if (left === -1) left = x;
        right = x;
      }
    }
    if (left !== -1)
      points.push(
        { x: left / 96, y: y / 96 },
        { x: (right + 1) / 96, y: (y + 1) / 96 },
      );
  }
  return points.length
    ? points
    : [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ];
}

export default function CaseStudyObject({
  object,
  additionalObjects,
  placement = "hero",
}: {
  object: CaseStudy["object"];
  additionalObjects?: CaseStudy["object"][];
  placement?: "hero" | "next";
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const bodyRefs = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(() => {
    const area = areaRef.current;
    const objects = [object, ...(additionalObjects || [])];
    const elements = bodyRefs.current.filter(
      (el): el is HTMLButtonElement => !!el,
    );
    if (!area || elements.length !== objects.length) return;
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([
      import("matter-js"),
      Promise.all(
        elements.map((element, i) => silhouette(element, objects[i])),
      ),
    ]).then(
      ([{ Engine, Bodies, Body, Composite, Vertices, Sleeping }, outlines]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        // Both client objects share one world, so they collide with one another
        // as well as with the edges of the coloured container.
        const engine = Engine.create({
          enableSleeping: true,
          gravity: { x: 0, y: 0.12, scale: 0.001 },
        });
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        let width = area.clientWidth,
          height = area.clientHeight;
        let frame = 0,
          previous = 0,
          visible = false,
          lastImpulse = 0;
        let walls: Matter.Body[] = [];
        const clamp = (value: number, min: number, max: number) =>
          Math.max(min, Math.min(max, value));
        const rest = (index: number) => {
          const compact = innerWidth <= 760;
          if (objects.length > 1)
            return {
              x:
                width *
                (compact
                  ? index
                    ? 0.72
                    : 0.28
                  : placement === "next"
                    ? index
                      ? 0.85
                      : 0.64
                    : index
                      ? 0.81
                      : 0.19),
              y:
                placement === "next"
                  ? height * (compact ? 0.67 : 0.4)
                  : compact
                    ? 155
                    : height * 0.4,
            };
          return placement === "next"
            ? {
                x: compact ? width / 2 : width * 0.82,
                y: height * (compact ? 0.62 : 0.4),
              }
            : {
                x: compact ? width / 2 : width * 0.19,
                y: compact ? 155 : height * 0.4,
              };
        };
        const states = elements.map((element, index) => {
          const size = element.clientWidth;
          const vertexBody = Body.create({});
          const hull = Vertices.hull(
            outlines[index].map((p, i) => ({
              x: p.x * size,
              y: p.y * size,
              index: i,
              body: vertexBody,
              isInternal: false,
            })),
          );
          const center = Vertices.centre(hull);
          const offset = { x: center.x - size / 2, y: center.y - size / 2 };
          const start = rest(index);
          const body = Bodies.fromVertices(
            start.x + offset.x,
            start.y + offset.y,
            [hull],
            {
              restitution: 0.58,
              friction: 0.18,
              frictionAir: 0.018,
              density: 0.0014,
            },
          );
          Composite.add(engine.world, body);
          return {
            element,
            index,
            size,
            offset,
            body,
            dragging: false,
            pointerId: null as number | null,
            dragOffset: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            dragTime: 0,
          };
        });
        type ObjectState = (typeof states)[number];
        const contain = ({ body }: ObjectState) => {
          const xs = body.vertices.map((v) => v.x),
            ys = body.vertices.map((v) => v.y);
          const dx =
            Math.max(0, -Math.min(...xs)) +
            Math.min(0, width - Math.max(...xs));
          const dy =
            Math.max(0, -Math.min(...ys)) +
            Math.min(0, height - Math.max(...ys));
          if (dx || dy) Body.translate(body, { x: dx, y: dy });
        };
        const paint = ({ element, body, offset, index }: ObjectState) => {
          const origin = rest(index),
            c = Math.cos(body.angle),
            s = Math.sin(body.angle);
          const ox = offset.x * c - offset.y * s,
            oy = offset.x * s + offset.y * c;
          element.style.transform = `translate3d(${body.position.x - ox - origin.x}px,${body.position.y - oy - origin.y}px,0) rotate(${body.angle}rad)`;
        };
        const reset = () =>
          states.forEach((state) => {
            const origin = rest(state.index);
            Body.setAngle(state.body, 0);
            Body.setPosition(state.body, {
              x: origin.x + state.offset.x,
              y: origin.y + state.offset.y,
            });
            Body.setVelocity(state.body, {
              x: motion.matches ? 0 : state.index ? -0.5 : 0.5,
              y: 0,
            });
            Body.setAngularVelocity(
              state.body,
              motion.matches ? 0 : state.index ? -0.003 : 0.003,
            );
            Sleeping.set(state.body, false);
            contain(state);
            paint(state);
          });
        const resize = () => {
          states.forEach((state) => {
            const nextSize = state.element.clientWidth,
              ratio = nextSize / state.size;
            Body.scale(state.body, ratio, ratio);
            state.offset = {
              x: state.offset.x * ratio,
              y: state.offset.y * ratio,
            };
            state.size = nextSize;
          });
          width = area.clientWidth;
          height = area.clientHeight;
          walls.forEach((w) => Composite.remove(engine.world, w));
          const opts = { isStatic: true, friction: 0.2 };
          walls = [
            Bodies.rectangle(width / 2, -50, width + 200, 100, opts),
            Bodies.rectangle(width / 2, height + 50, width + 200, 100, opts),
            Bodies.rectangle(-50, height / 2, 100, height + 200, opts),
            Bodies.rectangle(width + 50, height / 2, 100, height + 200, opts),
          ];
          Composite.add(engine.world, walls);
          reset();
        };
        const tick = (now: number) => {
          frame = 0;
          if (!visible || document.hidden || motion.matches) {
            previous = 0;
            return;
          }
          const delta = Math.min(previous ? now - previous : 16.67, 32);
          previous = now;
          if (!document.documentElement.hasAttribute("data-case-transition")) {
            Engine.update(engine, delta);
            states.forEach(paint);
          }
          frame = requestAnimationFrame(tick);
        };
        const sync = () => {
          cancelAnimationFrame(frame);
          frame = 0;
          previous = 0;
          if (motion.matches) reset();
          if (visible && !document.hidden && !motion.matches)
            frame = requestAnimationFrame(tick);
        };
        const scroll = ScrollTrigger.create({
          trigger: area,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            if (
              !visible ||
              motion.matches ||
              document.documentElement.hasAttribute("data-case-transition")
            )
              return;
            const now = performance.now();
            if (now - lastImpulse < 70) return;
            const force = clamp(-self.getVelocity() / 2600, -1, 1);
            if (Math.abs(force) < 0.035) return;
            lastImpulse = now;
            states.forEach(({ body, dragging }) => {
              if (dragging) return;
              Sleeping.set(body, false);
              Body.setVelocity(body, {
                x: clamp(
                  body.velocity.x + force * Math.cos(now * 0.003) * 2.2,
                  -10,
                  10,
                ),
                y: clamp(body.velocity.y + force * 5.5, -13, 13),
              });
              Body.setAngularVelocity(
                body,
                clamp(body.angularVelocity + force * 0.016, -0.07, 0.07),
              );
            });
          },
        });
        const unbind = states.map((state) => {
          const { element, body } = state;
          const point = (e: PointerEvent) => {
            const r = area.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
          };
          const down = (e: PointerEvent) => {
            if (motion.matches || e.button !== 0) return;
            const p = point(e);
            state.dragging = true;
            state.pointerId = e.pointerId;
            state.dragTime = performance.now();
            state.velocity = { x: 0, y: 0 };
            state.dragOffset = {
              x: p.x - body.position.x,
              y: p.y - body.position.y,
            };
            Body.setStatic(body, true);
            element.setPointerCapture(e.pointerId);
            element.dataset.dragging = "true";
          };
          const move = (e: PointerEvent) => {
            if (!state.dragging || e.pointerId !== state.pointerId) return;
            const p = point(e),
              now = performance.now(),
              dt = Math.max(8, now - state.dragTime);
            const before = { ...body.position };
            Body.setPosition(body, {
              x: p.x - state.dragOffset.x,
              y: p.y - state.dragOffset.y,
            });
            contain(state);
            state.velocity = {
              x: clamp(((body.position.x - before.x) * 16.67) / dt, -16, 16),
              y: clamp(((body.position.y - before.y) * 16.67) / dt, -16, 16),
            };
            state.dragTime = now;
            paint(state);
          };
          const up = () => {
            if (!state.dragging) return;
            state.dragging = false;
            Body.setStatic(body, false);
            Body.setVelocity(
              body,
              performance.now() - state.dragTime < 100
                ? state.velocity
                : { x: 0, y: 0 },
            );
            Body.setAngularVelocity(body, state.velocity.x * 0.003);
            Sleeping.set(body, false);
            if (
              state.pointerId !== null &&
              element.hasPointerCapture(state.pointerId)
            )
              element.releasePointerCapture(state.pointerId);
            state.pointerId = null;
            element.dataset.dragging = "false";
          };
          const key = (e: KeyboardEvent) => {
            if (motion.matches) return;
            const pushes: Record<string, { x: number; y: number }> = {
              ArrowUp: { x: 0, y: -6 },
              ArrowDown: { x: 0, y: 5 },
              ArrowLeft: { x: -5, y: -2 },
              ArrowRight: { x: 5, y: -2 },
            };
            if (pushes[e.key]) {
              e.preventDefault();
              Sleeping.set(body, false);
              Body.setVelocity(body, pushes[e.key]);
            }
          };
          element.addEventListener("pointerdown", down);
          element.addEventListener("pointermove", move);
          element.addEventListener("pointerup", up);
          element.addEventListener("pointercancel", up);
          element.addEventListener("lostpointercapture", up);
          element.addEventListener("keydown", key);
          return () => {
            element.removeEventListener("pointerdown", down);
            element.removeEventListener("pointermove", move);
            element.removeEventListener("pointerup", up);
            element.removeEventListener("pointercancel", up);
            element.removeEventListener("lostpointercapture", up);
            element.removeEventListener("keydown", key);
          };
        });
        const resized = new ResizeObserver(resize);
        const observer = new IntersectionObserver((entries) => {
          visible = entries[entries.length - 1]?.isIntersecting ?? false;
          if (visible) pop?.play();
          sync();
        });
        resize();
        const artworks = elements
          .map((el) => el.firstElementChild)
          .filter(Boolean);
        const pop =
          !motion.matches &&
          !document.documentElement.hasAttribute("data-case-transition")
            ? gsap.fromTo(
                artworks,
                { scale: 0 },
                {
                  scale: 1,
                  duration: 1.1,
                  paused: placement === "next",
                  ease: "elastic.out(1, 1)",
                  clearProps: "transform",
                },
              )
            : null;
        resized.observe(area);
        observer.observe(area);
        document.addEventListener("visibilitychange", sync);
        motion.addEventListener("change", sync);
        window.addEventListener("app:case-transition-complete", reset);
        cleanup = () => {
          pop?.kill();
          cancelAnimationFrame(frame);
          resized.disconnect();
          observer.disconnect();
          scroll.kill();
          unbind.forEach((fn) => fn());
          document.removeEventListener("visibilitychange", sync);
          motion.removeEventListener("change", sync);
          window.removeEventListener("app:case-transition-complete", reset);
          Composite.clear(engine.world, false);
          Engine.clear(engine);
        };
      },
    );
    return () => {
      disposed = true;
      cleanup();
    };
  }, [object, additionalObjects, placement]);
  return (
    <div
      ref={areaRef}
      className={styles.objectArea}
      data-case-object-area={placement}
      data-case-object-pair={additionalObjects?.length ? "" : undefined}
    >
      {[object, ...(additionalObjects || [])].map((art, index) => (
        <button
          key={art.src}
          ref={(el) => {
            bodyRefs.current[index] = el;
          }}
          type="button"
          className={`${styles.physicsObject} ${placement === "next" ? styles.nextPhysicsObject : ""}`}
          data-case-physics-object
          data-case-object-key={art.src}
          data-case-object-index={index}
          data-case-object={placement === "next" ? "" : undefined}
          data-case-study-hero-object={placement === "hero" ? "" : undefined}
          aria-label={`${art.alt}. Drag to throw, or use the arrow keys.`}
        >
          <CaseStudyObjectArt object={art} priority={placement === "hero"} />
        </button>
      ))}
    </div>
  );
}
