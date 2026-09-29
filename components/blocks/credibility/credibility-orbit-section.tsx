"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERYResult } from "@/sanity.types";
import type { CredibilityEarth } from "./credibility-earth";
import styles from "./credibility-orbit.module.css";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type CredibilityBlock = Extract<PageBlock, { _type: "credibility-section" }>;

// Reference-selected wordmarks are local to this version. The legacy component
// retains the original Sanity arrays and headline without any CMS writes.
const BRANDS = [
  { name: "Adidas", file: "adidas.svg", angle: 3.92, width: 0.052 },
  { name: "DoorDash", file: "doordash.svg", angle: 5.43, width: 0.125 },
  { name: "Square", file: "square.webp", angle: 0, width: 0.122 },
  { name: "Synthesia", file: "synthesia.svg", angle: 0.72, width: 0.145 },
  { name: "Deel", file: "deel.svg", angle: Math.PI / 2, width: 0.085 },
  { name: "MUBI", file: "mubi.webp", angle: 2.3, width: 0.1 },
  { name: "Reformation", file: "reformation.svg", angle: Math.PI, width: 0.17 },
] as const;

const STARS = Array.from({ length: 35 }, (_, i) => ({
  x: ((i * 73 + 13) % 97) + 1,
  y: ((i * 41 + 7) % 91) + 3,
  size: i % 7 === 0 ? 2 : 1,
  opacity: 0.14 + (i % 4) * 0.085,
}));

export default function CredibilityOrbitSection(props: CredibilityBlock) {
  const panelRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbitDuration = Math.max(
    48,
    Math.min(120, (props.rotationDuration || 32) * 2),
  );

  useEffect(() => {
    const panel = panelRef.current,
      earthMount = earthRef.current,
      canvas = canvasRef.current;
    if (!panel || !earthMount || !canvas) return;
    const controller = new AbortController();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const logos = Array.from(
      panel.querySelectorAll<HTMLElement>("[data-orbit-logo]"),
    );
    let scene: CredibilityEarth | undefined;
    let loading = false,
      visible = false;
    let frame = 0,
      lastTime = 0,
      lastGlobeTime = 0,
      elapsed = 0;
    let width = panel.clientWidth,
      height = panel.clientHeight,
      earthSize = earthMount.clientWidth;
    let pointerX = 0,
      pointerY = 0,
      targetX = 0,
      targetY = 0;

    const positionLogos = () => {
      const compact = width < 700;
      const radiusX = width * (compact ? 0.35 : 0.385);
      const radiusY = height * (compact ? 0.34 : 0.29);
      logos.forEach((logo, index) => {
        const angle =
          BRANDS[index].angle + (elapsed * Math.PI * 2) / orbitDuration;
        const depth = Math.sin(angle);
        const x = Math.cos(angle) * radiusX + pointerX * (3 + depth * 3);
        const y =
          depth * radiusY + Math.cos(angle) * height * 0.025 + pointerY * 4;
        const scale = 0.88 + depth * 0.13;
        logo.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%) scale(${scale.toFixed(3)})`;
        logo.style.opacity = String(0.82 + depth * 0.18);
        logo.style.zIndex = depth < -0.08 ? "1" : "4";
      });
    };
    const tick = (time: number) => {
      frame = 0;
      if (!visible || document.hidden || reducedMotion.matches) {
        lastTime = 0;
        return;
      }
      const delta = Math.min(lastTime ? (time - lastTime) / 1000 : 0, 0.05);
      lastTime = time;
      elapsed += delta;
      pointerX += (targetX - pointerX) * Math.min(1, delta * 4);
      pointerY += (targetY - pointerY) * Math.min(1, delta * 4);
      positionLogos();
      // A slow globe needs only 30 fps; the lightweight DOM orbit stays smooth.
      if (time - lastGlobeTime >= 1000 / 30) {
        scene?.render(elapsed, pointerX, pointerY);
        lastGlobeTime = time;
      }
      frame = requestAnimationFrame(tick);
    };
    const syncPlayback = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      const running = visible && !document.hidden && !reducedMotion.matches;
      panel.dataset.running = String(running);
      if (running) frame = requestAnimationFrame(tick);
      else if (visible && !document.hidden) {
        positionLogos();
        scene?.render(elapsed, pointerX, pointerY);
      }
    };
    const initialize = async () => {
      if (loading || scene || controller.signal.aborted) return;
      loading = true;
      try {
        const { createCredibilityEarth } = await import("./credibility-earth");
        if (controller.signal.aborted) return;
        const nextScene = await createCredibilityEarth(
          canvas,
          controller.signal,
        );
        if (controller.signal.aborted) {
          nextScene.dispose();
          return;
        }
        scene = nextScene;
        scene.resize(earthSize);
        scene.render(elapsed, pointerX, pointerY);
        earthMount.dataset.ready = "true";
        syncPlayback();
      } catch {
        // A CSS globe keeps the section intact if WebGL or a texture fails.
        if (!controller.signal.aborted) earthMount.dataset.ready = "false";
      }
    };
    const resize = new ResizeObserver(() => {
      width = panel.clientWidth;
      height = panel.clientHeight;
      earthSize = earthMount.clientWidth;
      positionLogos();
      scene?.resize(earthSize);
      if (visible) scene?.render(elapsed, pointerX, pointerY);
    });
    resize.observe(panel);
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void initialize();
          near.disconnect();
        }
      },
      { rootMargin: "350px 0px" },
    );
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    });
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reducedMotion.matches) return;
      const bounds = panel.getBoundingClientRect();
      targetX = Math.max(
        -1,
        Math.min(1, ((event.clientX - bounds.left) / width) * 2 - 1),
      );
      targetY = Math.max(
        -1,
        Math.min(1, ((event.clientY - bounds.top) / height) * 2 - 1),
      );
    };
    const leave = () => {
      targetX = 0;
      targetY = 0;
    };
    const contextLost = () => {
      earthMount.dataset.ready = "false";
    };
    const contextRestored = () => {
      if (controller.signal.aborted || !scene) return;
      scene.render(elapsed, pointerX, pointerY);
      earthMount.dataset.ready = "true";
    };
    positionLogos();
    near.observe(panel);
    visibility.observe(panel);
    panel.addEventListener("pointermove", move, { passive: true });
    panel.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener("change", syncPlayback);
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);
    return () => {
      controller.abort();
      cancelAnimationFrame(frame);
      resize.disconnect();
      near.disconnect();
      visibility.disconnect();
      panel.removeEventListener("pointermove", move);
      panel.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", syncPlayback);
      reducedMotion.removeEventListener("change", syncPlayback);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      scene?.dispose();
      panel.dataset.running = "false";
      earthMount.dataset.ready = "false";
    };
  }, [orbitDuration]);

  return (
    <section
      id={stegaClean(props.anchor?.anchorId) || `credibility-${props._key}`}
      className={styles.section}
      aria-labelledby={`credibility-title-${props._key}`}
      data-credibility-version="orbit"
    >
      <div
        ref={panelRef}
        className={styles.panel}
        data-running="false"
        data-lifecycle-environment-preserve
      >
        <div className={styles.starfield} aria-hidden="true">
          {STARS.map((star, i) => (
            <i
              key={i}
              className={styles.star}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
              }}
            />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={styles.shootingStar}
              style={{ "--shoot-index": i } as CSSProperties}
            />
          ))}
        </div>
        <div className={styles.glow} aria-hidden="true" />
        <div
          ref={earthRef}
          className={styles.earth}
          data-ready="false"
          aria-hidden="true"
        >
          <div className={styles.fallback}>
            <Image
              src="/images/credibility/earth-day.webp"
              alt=""
              fill
              unoptimized
              sizes="(max-width: 700px) 82vw, 600px"
              className={styles.fallbackImage}
            />
          </div>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
        <ul className={styles.orbit} aria-label="Selected clients">
          {BRANDS.map((brand) => (
            <li
              key={brand.name}
              data-orbit-logo={brand.name}
              className={styles.logo}
              style={
                {
                  "--logo-width": `${brand.width * 100}cqw`,
                  "--logo-mobile-width": `${Math.max(0.15, brand.width * 1.4) * 100}cqw`,
                  "--initial-x": `${Math.cos(brand.angle) * 38.5}cqw`,
                  "--initial-y": `${Math.sin(brand.angle) * 29}cqh`,
                  zIndex: Math.sin(brand.angle) < -0.08 ? 1 : 4,
                } as CSSProperties
              }
            >
              <Image
                src={`/images/credibility/${brand.file}`}
                alt={brand.name}
                fill
                sizes="(max-width: 700px) 100px, 240px"
                className={styles.logoImage}
              />
            </li>
          ))}
        </ul>
        <h2 id={`credibility-title-${props._key}`} className={styles.headline}>
          <span>We work with the biggest</span>
          <span>brands in the world</span>
        </h2>
      </div>
    </section>
  );
}
