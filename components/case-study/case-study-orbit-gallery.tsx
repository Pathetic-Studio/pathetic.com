"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { CaseStudyImage } from "@/lib/case-studies";
import CaseStudyLightbox from "./case-study-lightbox";
import styles from "./case-study-galleries.module.css";

export type OrbitGalleryImage = CaseStudyImage & { caption?: string };
// Rest just off the centreline so front/back images do not form vertical stacks.
const REST_PHASE = 0.22;
const wrap = (value: number, count: number) =>
  ((value % count) + count) % count;

export default function CaseStudyOrbitGallery({
  images,
  label,
}: {
  images: OrbitGalleryImage[];
  label: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const controls = useRef({
    move: (_direction: number) => {},
    show: (_index: number) => {},
  });
  const dragged = useRef(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<CaseStudyImage | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const count = images.length;
    if (!stage || !count) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let position = REST_PHASE;
    let target = REST_PHASE;
    let active = 0;
    let frame = 0;
    let lastFrame = 0;
    let visible = false;
    let radiusX = 0;
    let radiusY = 0;
    let pixelsPerStep = 1;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    let pointer: {
      id: number;
      x: number;
      y: number;
      lastX: number;
      time: number;
      velocity: number;
    } | null = null;

    const paint = () => {
      cards.current.forEach((card, index) => {
        if (!card) return;
        const angle = ((index - position) / count) * Math.PI * 2;
        const depth = (Math.cos(angle) + 1) / 2;
        // A complete, flat ellipse: the far half is smaller and passes behind
        // the near half. Every image stays upright throughout the orbit.
        card.style.transform = `translate(-50%, -50%) translate3d(${Math.sin(angle) * radiusX}px, ${Math.cos(angle) * radiusY}px, 0) scale(${0.4 + depth * 0.6})`;
        card.style.zIndex = String(Math.round(depth * 100));
      });
      const next = wrap(Math.round(position - REST_PHASE), count);
      if (next !== active) {
        active = next;
        setCurrent(next);
      }
    };
    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(now - lastFrame || 16.67, 40);
      lastFrame = now;
      position += (target - position) * (1 - Math.exp(-dt / 95));
      if (Math.abs(target - position) < 0.0005) position = target;
      paint();
      if (position !== target && visible && !document.hidden)
        frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (motion.matches) {
        position = target;
        paint();
      } else if (!frame && visible && !document.hidden) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const move = (direction: number) => {
      clearTimeout(wheelTimer);
      target = Math.round(target - REST_PHASE) + direction + REST_PHASE;
      wake();
    };
    controls.current = {
      move,
      show: (index) => {
        let distance = wrap(index + REST_PHASE - target, count);
        if (distance > count / 2) distance -= count;
        target += distance;
        wake();
      },
    };
    const measure = () => {
      const width = stage.clientWidth;
      const cardWidth = Math.max(
        ...cards.current.map((card) => card?.offsetWidth || 0),
      );
      radiusX = Math.max(0, width / 2 - cardWidth / 2 - 20);
      radiusY = width < 600 ? 54 : 78;
      pixelsPerStep = Math.max(80, (width * 0.9) / count);
      paint();
    };
    const onDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      clearTimeout(wheelTimer);
      cancelAnimationFrame(frame);
      frame = 0;
      target = position;
      dragged.current = false;
      pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        time: event.timeStamp,
        velocity: 0,
      };
    };
    const onMove = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (!dragged.current) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
          pointer = null;
          return;
        }
        if (Math.abs(dx) < 5) return;
        dragged.current = true;
        stage.setPointerCapture(event.pointerId);
        stage.dataset.dragging = "true";
      }
      const delta = event.clientX - pointer.lastX;
      const elapsed = Math.max(8, event.timeStamp - pointer.time);
      pointer.velocity = delta / elapsed;
      pointer.lastX = event.clientX;
      pointer.time = event.timeStamp;
      position -= delta / pixelsPerStep;
      target = position;
      paint();
    };
    const release = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      if (dragged.current) {
        const velocity =
          event.timeStamp - pointer.time < 100 ? pointer.velocity : 0;
        const coast =
          motion.matches || event.type === "pointercancel"
            ? 0
            : Math.max(-1.4, Math.min(1.4, (-velocity * 180) / pixelsPerStep));
        target = Math.round(position + coast - REST_PHASE) + REST_PHASE;
        wake();
      }
      if (stage.hasPointerCapture(event.pointerId))
        stage.releasePointerCapture(event.pointerId);
      delete stage.dataset.dragging;
      pointer = null;
    };
    const onWheel = (event: WheelEvent) => {
      // Vertical scrolling still moves the page. Trackpad horizontal gestures,
      // horizontal mouse wheels and Shift + wheel turn the gallery.
      if (
        event.ctrlKey ||
        (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY))
      )
        return;
      const delta =
        event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? stage.clientWidth
            : 1;
      target += (delta * unit) / pixelsPerStep;
      wake();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        target = Math.round(target - REST_PHASE) + REST_PHASE;
        wake();
      }, 140);
    };
    const sync = () => {
      if (visible && !document.hidden) wake();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      sync();
    });
    const resize = new ResizeObserver(measure);
    measure();
    observer.observe(stage);
    resize.observe(stage);
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);
    stage.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", wake);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(wheelTimer);
      observer.disconnect();
      resize.disconnect();
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", release);
      stage.removeEventListener("pointercancel", release);
      stage.removeEventListener("wheel", onWheel);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", wake);
      controls.current = { move: () => {}, show: () => {} };
    };
  }, [images.length]);

  if (!images.length) return null;
  return (
    <div
      className={styles.reel}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      data-case-reel
      onKeyDown={(event) => {
        if (selected) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          controls.current.move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <div className={styles.reelStage} ref={stageRef}>
        {images.map((photo, i) => (
          <button
            type="button"
            key={photo.src}
            ref={(element) => {
              cards.current[i] = element;
            }}
            className={styles.reelCard}
            data-active={i === current}
            style={
              { "--photo-ratio": photo.width / photo.height } as CSSProperties
            }
            tabIndex={i === current ? 0 : -1}
            aria-label={
              i === current
                ? `Enlarge: ${photo.alt}`
                : `Show ${photo.caption || photo.alt}`
            }
            onClick={() => {
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              if (i === current) setSelected(photo);
              else controls.current.show(i);
            }}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              draggable={false}
              sizes="(max-width: 600px) 50vw, 340px"
            />
          </button>
        ))}
      </div>
      <div className={styles.reelControls}>
        <button
          type="button"
          onClick={() => controls.current.move(-1)}
          aria-label="Previous image"
        >
          ←
        </button>
        <p aria-live="polite" aria-atomic="true">
          <strong>{images[current].caption || images[current].alt}</strong>
          <span>
            {String(current + 1).padStart(2, "0")} /{" "}
            {String(images.length).padStart(2, "0")}
          </span>
        </p>
        <button
          type="button"
          onClick={() => controls.current.move(1)}
          aria-label="Next image"
        >
          →
        </button>
      </div>
      <CaseStudyLightbox image={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
