"use client";

import { useEffect, type RefObject } from "react";

type Debris = {
  node: HTMLElement;
  parent: HTMLElement;
  transform: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  minX: number;
  maxX: number;
  minY: number;
  floor: number;
};

/** Only thrown items tick; resting decorations and dragging need no RAF loop. */
export default function useRoadDebris(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const bodies = new WeakMap<HTMLElement, Debris>();
    const moving = new Set<Debris>();
    let drag: { body: Debris; id: number; offsetX: number; offsetY: number; time: number } | null = null;
    let frame = 0;
    let lastTime = 0;
    let intersects = false;
    let visible = false;
    const stage = root.closest<HTMLElement>("[data-sequence-what]");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const draw = (body: Debris) => {
      body.node.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) ${body.transform} rotate(${body.angle}deg)`;
    };
    const measure = (body: Debris) => {
      const parent = body.parent.getBoundingClientRect();
      const bounds = body.node.getBoundingClientRect();
      const sx = body.parent.clientWidth / Math.max(1, parent.width);
      const sy = body.parent.clientHeight / Math.max(1, parent.height);
      const halfWidth = bounds.width * sx / 2;
      const halfHeight = bounds.height * sy / 2;
      const road = root.querySelector<HTMLElement>("[data-what-road]")?.getBoundingClientRect();
      const floor = road ? Math.min(body.parent.clientHeight, (road.bottom - parent.top) * sy) : body.parent.clientHeight;
      const anchorX = body.node.offsetLeft;
      const anchorY = body.node.offsetTop;
      body.minX = halfWidth - anchorX;
      body.maxX = Math.max(body.minX, body.parent.clientWidth - halfWidth - anchorX);
      body.minY = halfHeight - anchorY;
      body.floor = Math.max(body.minY, floor - halfHeight - anchorY - 3);
    };
    const settle = (body: Debris) => {
      body.vx = body.vy = body.spin = 0;
      moving.delete(body);
      body.node.style.willChange = "";
      delete body.node.dataset.throwing;
    };
    const tick = (time: number) => {
      frame = 0;
      const dt = Math.min(1 / 30, Math.max(0, (time - lastTime) / 1000));
      lastTime = time;
      moving.forEach((body) => {
        if (!body.node.isConnected) { settle(body); return; }
        body.vy += 1700 * dt;
        body.vx *= Math.exp(-0.6 * dt);
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        body.angle += body.spin * dt;
        if (body.x < body.minX || body.x > body.maxX) {
          body.x = clamp(body.x, body.minX, body.maxX);
          body.vx *= -0.38;
          body.spin *= -0.5;
        }
        if (body.y < body.minY) { body.y = body.minY; body.vy = Math.abs(body.vy) * 0.3; }
        if (body.y >= body.floor) {
          body.y = body.floor;
          body.vy *= -0.28;
          body.vx *= 0.64;
          body.spin *= 0.55;
          if (Math.abs(body.vy) < 35 && Math.abs(body.vx) < 12) settle(body);
        }
        draw(body);
      });
      if (moving.size && visible) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (frame || !visible || !moving.size) return;
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const release = (cancelled = false) => {
      if (!drag) return;
      const { body, id, time } = drag;
      drag = null;
      if (body.node.hasPointerCapture(id)) body.node.releasePointerCapture(id);
      body.node.style.cursor = "";
      delete body.node.dataset.dragging;
      // Holding still before release should drop, not replay an old flick.
      if (cancelled || performance.now() - time > 100 || reducedMotion.matches) body.vx = body.vy = 0;
      body.spin = reducedMotion.matches ? 0 : clamp(body.vx * 0.35, -360, 360);
      body.node.dataset.throwing = "true";
      moving.add(body);
      wake();
    };
    const getBody = (node: HTMLElement) => {
      const parent = node.parentElement;
      if (!parent) return null;
      let body = bodies.get(node);
      if (!body) {
        body = { node, parent, transform: node.style.transform, x: 0, y: 0, vx: 0, vy: 0, angle: 0, spin: 0, minX: 0, maxX: 0, minY: 0, floor: 0 };
        bodies.set(node, body);
      }
      measure(body);
      return body;
    };
    const down = (event: PointerEvent) => {
      const node = (event.target as Element).closest<HTMLElement>("[data-road-debris]");
      if (!node || !root.contains(node) || !visible || event.button !== 0 || drag) return;
      const body = getBody(node);
      if (!body) return;
      const { parent } = body;
      moving.delete(body);
      delete node.dataset.throwing;
      const bounds = parent.getBoundingClientRect();
      drag = {
        body, id: event.pointerId, time: performance.now(),
        offsetX: (event.clientX - bounds.left) * parent.clientWidth / bounds.width - body.x,
        offsetY: (event.clientY - bounds.top) * parent.clientHeight / bounds.height - body.y,
      };
      body.vx = body.vy = 0;
      node.dataset.dragging = "true";
      node.style.cursor = "grabbing";
      node.style.willChange = "transform";
      node.setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopPropagation();
    };
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      const { body } = drag;
      const bounds = body.parent.getBoundingClientRect();
      const now = performance.now();
      const dt = Math.max(1 / 120, (now - drag.time) / 1000);
      const x = clamp((event.clientX - bounds.left) * body.parent.clientWidth / bounds.width - drag.offsetX, body.minX, body.maxX);
      const y = clamp((event.clientY - bounds.top) * body.parent.clientHeight / bounds.height - drag.offsetY, body.minY, body.floor);
      body.vx = clamp((x - body.x) / dt, -1800, 1800);
      body.vy = clamp((y - body.y) / dt, -1800, 1800);
      body.x = x;
      body.y = y;
      drag.time = now;
      draw(body);
      event.preventDefault();
    };
    const up = (event: PointerEvent) => {
      if (drag?.id === event.pointerId) release(event.type !== "pointerup");
    };
    const key = (event: KeyboardEvent) => {
      const node = (event.target as Element).closest<HTMLElement>("[data-road-debris]");
      if (!node || !visible || (event.key !== "Enter" && event.key !== " ")) return;
      // Keyboard activation provides the same small toss without a drag gesture.
      const body = getBody(node);
      if (!body || drag) return;
      event.preventDefault();
      body.vx = reducedMotion.matches ? 0 : (node.offsetLeft < body.parent.clientWidth / 2 ? 170 : -170);
      body.vy = reducedMotion.matches ? -180 : -480;
      body.spin = reducedMotion.matches ? 0 : body.vx * 0.6;
      node.dataset.throwing = "true";
      node.style.willChange = "transform";
      moving.add(body);
      wake();
    };
    const sync = () => {
      visible = intersects && !stage?.inert && !document.hidden;
      if (visible) { wake(); return; }
      release(true);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const observer = new IntersectionObserver((entries) => {
      intersects = entries[entries.length - 1]?.isIntersecting ?? false;
      sync();
    });
    observer.observe(root);
    const stageObserver = new MutationObserver(sync);
    if (stage) stageObserver.observe(stage, { attributes: true, attributeFilter: ["inert"] });
    const resize = new ResizeObserver(() => {
      root.querySelectorAll<HTMLElement>("[data-road-debris]").forEach((node) => {
        const body = bodies.get(node);
        if (!body) return;
        measure(body);
        body.x = clamp(body.x, body.minX, body.maxX);
        body.y = clamp(body.y, body.minY, body.floor);
        draw(body);
      });
    });
    resize.observe(root);
    root.addEventListener("pointerdown", down);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerup", up);
    root.addEventListener("pointercancel", up);
    root.addEventListener("lostpointercapture", up);
    root.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", sync);
    return () => {
      visible = false;
      release(true);
      if (frame) cancelAnimationFrame(frame);
      moving.clear();
      observer.disconnect();
      stageObserver.disconnect();
      resize.disconnect();
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointercancel", up);
      root.removeEventListener("lostpointercapture", up);
      root.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [rootRef]);
}
