"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { Bodies, Body, Engine, Sleeping, World } from "matter-js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";
import { SANDBAR_OBJECT } from "@/lib/work-assets";
import styles from "./basket-section-shortcuts.module.css";

const SHORTCUTS = [
  { title: "Our Story", id: "our-story", selector: "[data-lifecycle-root]", image: "/images/lifecycle/memes/coffee-brick.webp" },
  { title: "Our Clients", id: "our-clients", selector: "[data-space-anchor], [data-credibility-version]", image: "/images/credibility/objects/saturn.webp" },
  { title: "Our Work", id: "work", selector: "#work", image: SANDBAR_OBJECT.src },
  { title: "Our Services", id: "what-we-do", selector: "#what-we-do", image: "/images/what-we-do/cloud.png" },
  { title: "Talent Matrix", id: "talent-matrix", selector: "[data-sequence-talent],#talent-matrix", image: "/images/basket-links/matrix-avatar.webp" },
  { title: "Our Network", id: "our-network", selector: "[data-network-intro]", image: null, kind: "eye" },
  { title: "What We Believe", id: "what-we-believe", selector: "[data-belief-section] section[id]", image: "/images/belief/cherub-left.png" },
  { title: "What We Are", id: "what-we-are", selector: "#what-we-are", image: "/images/what-we-are/wardrobe/hat-camo.webp" },
  { title: "Work With Us", id: "work-with-us", selector: "[data-project-cta-version]", image: "/images/project-cta/cursor-98.png" },
].map((item, index, items) => ({
  ...item,
  side: index % 2,
  y: (Math.floor(index / 2) + .5) / Math.ceil((items.length - index % 2) / 2),
}));
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
type Lane = { left: number; right: number; top: number; bottom: number };

export default function BasketSectionShortcuts({ basketRef }: { basketRef: RefObject<HTMLDivElement | null> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  useLayoutEffect(() => {
    const root = rootRef.current, basket = basketRef.current;
    if (!root || !basket) return;
    gsap.registerPlugin(ScrollTrigger);
    const horizontal = matchMedia("(min-width: 640px)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    SHORTCUTS.forEach((item, index) => {
      const node = document.querySelector<HTMLElement>(item.selector);
      const target = node?.id ? node : node?.closest<HTMLElement>("section[id]");
      if (target?.id && itemRefs.current[index]) itemRefs.current[index]!.href = `#${target.id}`;
    });
    let disposeScene: (() => void) | undefined;

    const setup = () => {
      disposeScene?.(); disposeScene = undefined;
      // No extra bodies or event handlers while the basket is vertical.
      if (!horizontal.matches) return;
      const elements = itemRefs.current as HTMLAnchorElement[];
      const engine = Engine.create({ enableSleeping: true });
      // Match the basket's gravity as well as its bounce, drag and friction.
      engine.gravity.x = 0;
      engine.gravity.y = .12;
      engine.gravity.scale = .001;
      let lanes: Lane[] = [], size = 100, disposed = false, active = false;
      let raf = 0, lastTime = 0, lastImpulse = 0, abyssPaused = false, resumeAfter = 0;
      let walls: Body[] = [];
      const bodies = SHORTCUTS.map((_, i) => Bodies.circle(0, 0, 46, {
        frictionAir: .025, friction: .18, restitution: .58, density: .0014,
        label: `section-shortcut-${i}`,
      }));
      World.add(engine.world, bodies);
      let drag: { index: number; id: number; x: number; y: number; startX: number; startY: number;
        offsetX: number; offsetY: number; time: number; vx: number; vy: number; moved: boolean; threshold: number } | null = null;

      const contain = (index: number, bounce = true) => {
        const body = bodies[index], lane = lanes[SHORTCUTS[index].side];
        // Use the rotated artwork's extent too, so even a fast throw stays
        // visibly outside the basket instead of just constraining its centre.
        const radius = size * (Math.abs(Math.cos(body.angle)) + Math.abs(Math.sin(body.angle))) / 2;
        const x = clamp(body.position.x, lane.left + radius, lane.right - radius);
        const y = clamp(body.position.y, lane.top + radius, lane.bottom - radius);
        if (x !== body.position.x || y !== body.position.y) {
          const vx = x !== body.position.x && bounce ? -body.velocity.x * .58 : body.velocity.x;
          const vy = y !== body.position.y && bounce ? -body.velocity.y * .58 : body.velocity.y;
          Body.setPosition(body, { x, y });
          Body.setVelocity(body, { x: vx, y: vy });
        }
      };
      const render = () => bodies.forEach((body, index) => {
        elements[index].style.transform = `translate3d(${body.position.x - size / 2}px,${body.position.y - size / 2}px,0) rotate(${body.angle}rad)`;
        elements[index].dataset.basketRotation = String(body.angle);
      });
      let initialized = false;
      const resize = () => {
        const rect = root.getBoundingClientRect(), box = basket.getBoundingClientRect();
        const previous = lanes;
        const top = Math.max(16, box.top - rect.top - 32), bottom = Math.min(rect.height - 16, box.bottom - rect.top + 32);
        lanes = [
          { left: 12, right: box.left - rect.left - 18, top, bottom },
          { left: box.right - rect.left + 18, right: rect.width - 12, top, bottom },
        ];
        const nextSize = Math.min(122, (bottom - top) / 5 * .72, ...lanes.map(lane => (lane.right - lane.left) * .66));
        root.style.setProperty("--shortcut-size", `${nextSize}px`);
        for (const wall of walls) World.remove(engine.world, wall);
        walls = lanes.flatMap(lane => [
          Bodies.rectangle((lane.left + lane.right) / 2, lane.top - 20, lane.right - lane.left, 40, { isStatic: true }),
          Bodies.rectangle((lane.left + lane.right) / 2, lane.bottom + 20, lane.right - lane.left, 40, { isStatic: true }),
          Bodies.rectangle(lane.left - 20, (lane.top + lane.bottom) / 2, 40, lane.bottom - lane.top, { isStatic: true }),
          Bodies.rectangle(lane.right + 20, (lane.top + lane.bottom) / 2, 40, lane.bottom - lane.top, { isStatic: true }),
        ]);
        World.add(engine.world, walls);
        bodies.forEach((body, i) => {
          const lane = lanes[SHORTCUTS[i].side], old = previous[SHORTCUTS[i].side];
          const y = initialized && old ? (body.position.y - old.top) / (old.bottom - old.top) : SHORTCUTS[i].y;
          Body.scale(body, nextSize / size, nextSize / size);
          Body.setPosition(body, { x: (lane.left + lane.right) / 2, y: lane.top + y * (lane.bottom - lane.top) });
          if (!initialized) {
            Body.setAngle(body, [ -.16, .1, -.07, .2 ][i % 4]);
            if (!reduced.matches) Body.setVelocity(body, { x: i % 2 ? -.25 : .25, y: i % 2 ? .4 : -.4 });
          }
        });
        size = nextSize; initialized = true;
        bodies.forEach((_, i) => contain(i, false)); render();
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(root); resizeObserver.observe(basket);
      const settle = () => bodies.forEach(body => {
        Body.setVelocity(body, { x: 0, y: 0 }); Body.setAngularVelocity(body, 0);
        body.force.x = body.force.y = body.torque = 0;
        if (!body.isStatic) Sleeping.set(body, true);
      });
      const tick = (time: number) => {
        raf = 0;
        if (!active || disposed || document.hidden) return;
        const abyss = document.documentElement.hasAttribute("data-abyss-active");
        if (abyss !== abyssPaused) { settle(); resumeAfter = time + 250; }
        abyssPaused = abyss;
        if (!abyss) {
          Engine.update(engine, Math.min(32, lastTime ? time - lastTime : 16.67));
          bodies.forEach((_, i) => contain(i)); render();
        }
        lastTime = time; raf = requestAnimationFrame(tick);
      };
      const wake = () => { if (!raf && active && !disposed) { lastTime = 0; raf = requestAnimationFrame(tick); } };
      const visibility = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else wake(); };
      document.addEventListener("visibilitychange", visibility);
      const observer = new IntersectionObserver(([entry]) => {
        active = entry.isIntersecting;
        if (active) wake(); else { cancelAnimationFrame(raf); raf = 0; }
      }, { rootMargin: "20% 0px" });
      observer.observe(root);
      const impulse = (velocity: number) => {
        const time = performance.now();
        if (!active || drag || reduced.matches || time < resumeAfter || time - lastImpulse < 70 || document.documentElement.hasAttribute("data-abyss-active")) return;
        const amount = clamp(-velocity / 2600, -1, 1);
        if (Math.abs(amount) < .035) return;
        lastImpulse = time;
        bodies.forEach((body, i) => {
          Sleeping.set(body, false);
          Body.setVelocity(body, { x: clamp(body.velocity.x + amount * (i % 2 ? -1.6 : 1.6), -13, 13), y: clamp(body.velocity.y + amount * (4.5 + i % 3), -15, 15) });
          Body.setAngularVelocity(body, body.angularVelocity + amount * (i % 2 ? -.025 : .025));
        });
      };
      const trigger = ScrollTrigger.create({ trigger: root, start: "top bottom", end: "bottom top", onUpdate: self => impulse(self.getVelocity()) });
      const point = (event: PointerEvent) => { const rect = root.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
      const down = (event: PointerEvent) => {
        if (drag || (event.pointerType === "mouse" && event.button !== 0)) return;
        const element = (event.target as Element)?.closest<HTMLElement>("[data-basket-shortcut]");
        if (!element || !root.contains(element)) return;
        const index = Number(element.dataset.shortcutIndex), body = bodies[index], p = point(event);
        delete element.dataset.shortcutDragged;
        drag = { index, id: event.pointerId, x: p.x, y: p.y, startX: p.x, startY: p.y, offsetX: p.x - body.position.x, offsetY: p.y - body.position.y, time: performance.now(), vx: 0, vy: 0, moved: false, threshold: event.pointerType === "touch" ? 12 : 6 };
        Body.setStatic(body, true); Sleeping.set(body, false);
        element.setPointerCapture(event.pointerId); element.dataset.dragging = "true";
      };
      const move = (event: PointerEvent) => {
        if (!drag || drag.id !== event.pointerId) return;
        const p = point(event), time = performance.now(), elapsed = Math.max(8, time - drag.time);
        drag.vx = (p.x - drag.x) / elapsed * 16.67; drag.vy = (p.y - drag.y) / elapsed * 16.67;
        drag.x = p.x; drag.y = p.y; drag.time = time;
        drag.moved ||= Math.hypot(p.x - drag.startX, p.y - drag.startY) > drag.threshold;
        if (!drag.moved) return;
        elements[drag.index].dataset.shortcutDragged = "true";
        Body.setPosition(bodies[drag.index], { x: p.x - drag.offsetX, y: p.y - drag.offsetY });
        contain(drag.index, false); render(); event.preventDefault();
      };
      const up = (event: PointerEvent) => {
        if (!drag || drag.id !== event.pointerId) return;
        const released = drag; drag = null;
        const element = elements[released.index], body = bodies[released.index];
        const cancelled = event.type !== "pointerup";
        const throwing = released.moved && !cancelled && performance.now() - released.time < 100;
        Body.setStatic(body, false);
        Body.setVelocity(body, { x: throwing ? clamp(released.vx, -16, 16) : 0, y: throwing ? clamp(released.vy, -16, 16) : 0 });
        Body.setAngularVelocity(body, throwing ? clamp(released.vx * .004, -.08, .08) : 0);
        if (released.moved || cancelled) element.dataset.shortcutDragged = "true";
        element.dataset.dragging = "false";
        if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      };
      root.addEventListener("pointerdown", down); root.addEventListener("pointermove", move, { passive: false });
      root.addEventListener("pointerup", up); root.addEventListener("pointercancel", up); root.addEventListener("lostpointercapture", up);
      disposeScene = () => {
        disposed = true; cancelAnimationFrame(raf); observer.disconnect(); resizeObserver.disconnect(); trigger.kill();
        document.removeEventListener("visibilitychange", visibility);
        root.removeEventListener("pointerdown", down); root.removeEventListener("pointermove", move);
        root.removeEventListener("pointerup", up); root.removeEventListener("pointercancel", up); root.removeEventListener("lostpointercapture", up);
        if (drag) { const el = elements[drag.index]; if (el.hasPointerCapture(drag.id)) el.releasePointerCapture(drag.id); }
        World.clear(engine.world, false); Engine.clear(engine);
      };
    };
    setup(); horizontal.addEventListener("change", setup);
    return () => { horizontal.removeEventListener("change", setup); disposeScene?.(); };
  }, [basketRef]);

  return <div ref={rootRef} className={styles.field} data-basket-shortcuts>
    {SHORTCUTS.map((item, index) => <a key={item.id} href={`#${item.id}`} ref={node => { itemRefs.current[index] = node; }}
      className={styles.object} data-basket-shortcut={item.id} data-shortcut-index={index} data-shortcut-side={item.side} data-basket-body="shortcut"
      aria-label={`Go to ${item.title}`} draggable={false}
      onClick={event => {
        if (event.currentTarget.dataset.shortcutDragged === "true" && event.detail > 0) {
          delete event.currentTarget.dataset.shortcutDragged; event.preventDefault(); event.stopPropagation(); return;
        }
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const anchorId = event.currentTarget.hash.slice(1);
        const target = document.getElementById(anchorId);
        if (!target) return;
        event.preventDefault(); event.stopPropagation();
        // On desktop the city lives inside a shared pin. Navigate to the
        // revealed city in that timeline, rather than the pin's first scene.
        const matrix = item.id === "talent-matrix" ? ScrollTrigger.getById("what-we-do-matrix-reveal") : undefined;
        const offsetPercent = matrix ? ((ScrollSmoother.get()?.scrollTop() ?? scrollY) + target.getBoundingClientRect().top - (matrix.start + (matrix.end - matrix.start) * .88)) / innerHeight * 100 : undefined;
        window.dispatchEvent(new CustomEvent("app:anchor-navigate", { detail: { anchorId, offsetPercent, href: `/#${anchorId}` } }));
      }}>
      <span className={styles.artwork} data-basket-artwork-plane>
        {item.image ? <img src={item.image} alt="" draggable={false} decoding="async" /> : <span className={styles.eye}>
          <img src="/eye/base.png" alt="" draggable={false} /><span className={styles.pupil} /><img src="/eye/highlight.png" alt="" draggable={false} />
        </span>}
        <span className={styles.label}>{item.title}</span>
      </span>
    </a>)}
  </div>;
}
