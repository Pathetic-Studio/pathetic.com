"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERYResult } from "@/sanity.types";
import {
  GPS_BRANDS,
  createGpsOrbit,
  gpsOrbitMatrix,
  projectGpsOrbit,
  gpsLogoScale,
} from "./credibility-gps-data";
import type { GpsScene } from "./credibility-gps-scene";
import TitleText from "@/components/ui/title-text";
import styles from "./credibility-gps.module.css";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type CredibilityBlock = Extract<PageBlock, { _type: "credibility-section" }>;

export default function CredibilityGpsSection(props: CredibilityBlock) {
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const panel = panelRef.current,
      canvas = canvasRef.current;
    if (!panel || !canvas) return;
    const logos = Array.from(
      panel.querySelectorAll<HTMLElement>("[data-gps-logo]"),
    );
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let scene: GpsScene | undefined,
      disposed = false,
      loading = false,
      visible = false,
      contextAvailable = true;
    let frame = 0,
      last = 0,
      lastRender = 0,
      elapsed = 0;
    let width = panel.clientWidth,
      height = panel.clientHeight;
    let orbit = createGpsOrbit(width, height);
    const orbitPointer = { x: 0, y: 0 };
    let orbitMatrix = gpsOrbitMatrix(orbitPointer);
    const positionLogos = () => {
      logos.forEach((logo, i) => {
        const p = projectGpsOrbit(
          orbit(i, elapsed),
          width / height,
          orbitMatrix,
        );
        logo.style.transform = `translate3d(${p.x * width}px,${p.y * height}px,0)`;
        // Scale the wordmark independently so its waypoint stays on the path.
        logo.style.setProperty("--logo-scale", String(gpsLogoScale(p.depth)));
        logo.style.opacity = String(0.65 + (p.depth + 1) * 0.16);
      });
    };
    const render = () => {
      scene?.render(elapsed, targetRef.current, orbitMatrix);
    };
    const tick = (time: number) => {
      frame = 0;
      if (!visible || document.hidden || motion.matches || !contextAvailable) {
        last = 0;
        return;
      }
      const dt = Math.min(last ? (time - last) / 1000 : 0, 0.06);
      elapsed += dt;
      last = time;
      // Commit the shared tilt with the WebGL frame so dots stay on the lines.
      // Logos continue travelling at display rate between globe renders.
      const interval = 1000 / 30;
      if (time - lastRender >= interval - 0.5) {
        const follow =
          1 - Math.exp(-Math.min((time - lastRender) / 1000, 0.06) * 4);
        orbitPointer.x += (targetRef.current.x - orbitPointer.x) * follow;
        orbitPointer.y += (targetRef.current.y - orbitPointer.y) * follow;
        orbitMatrix = gpsOrbitMatrix(orbitPointer);
        lastRender += interval;
        if (time - lastRender >= interval) lastRender = time;
        render();
      }
      positionLogos();
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      lastRender = 0;
      const running =
        visible &&
        !!scene &&
        !document.hidden &&
        !motion.matches &&
        contextAvailable;
      panel.dataset.running = String(running);
      if (running) frame = requestAnimationFrame(tick);
      else if (visible && !document.hidden && contextAvailable) render();
      positionLogos();
    };
    const initialize = async () => {
      if (loading || scene || disposed) return;
      loading = true;
      try {
        const { createGpsScene } = await import("./credibility-gps-scene");
        if (disposed) return;
        scene = createGpsScene(canvas);
        scene.resize(width, height);
        render();
        panel.dataset.ready = "true";
        sync();
      } catch {
        if (!disposed) {
          panel.dataset.ready = "false";
        }
      }
    };
    const near = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1]?.isIntersecting) {
          void initialize();
          near.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    const observer = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1]?.isIntersecting ?? false;
      sync();
    });
    const resize = new ResizeObserver(() => {
      width = panel.clientWidth;
      height = panel.clientHeight;
      orbit = createGpsOrbit(width, height);
      scene?.resize(width, height);
      positionLogos();
      render();
    });
    const move = (event: PointerEvent) => {
      if (motion.matches) return;
      const rect = panel.getBoundingClientRect();
      targetRef.current = {
        x: Math.max(
          -0.95,
          Math.min(0.95, ((event.clientX - rect.left) / width) * 2 - 1),
        ),
        y: Math.max(
          -0.9,
          Math.min(0.9, ((event.clientY - rect.top) / height) * 2 - 1),
        ),
      };
    };
    const key = (event: KeyboardEvent) => {
      if (motion.matches) return;
      if (event.key === "Escape") {
        targetRef.current = { x: 0, y: 0 };
        return;
      }
      const offsets: Record<string, [number, number]> = {
        ArrowUp: [0, -0.12],
        ArrowDown: [0, 0.12],
        ArrowLeft: [-0.12, 0],
        ArrowRight: [0.12, 0],
      };
      const offset = offsets[event.key];
      if (offset) {
        event.preventDefault();
        targetRef.current = {
          x: Math.max(-0.95, Math.min(0.95, targetRef.current.x + offset[0])),
          y: Math.max(-0.9, Math.min(0.9, targetRef.current.y + offset[1])),
        };
      }
    };
    const leave = () => {
      targetRef.current = { x: 0, y: 0 };
    };
    const lost = (event: Event) => {
      event.preventDefault();
      contextAvailable = false;
      panel.dataset.ready = "false";
      sync();
    };
    const restored = () => {
      contextAvailable = true;
      panel.dataset.ready = "true";
      sync();
    };
    positionLogos();
    near.observe(panel);
    observer.observe(panel);
    resize.observe(panel);
    panel.addEventListener("pointermove", move, { passive: true });
    panel.addEventListener("pointerdown", move, { passive: true });
    panel.addEventListener("keydown", key);
    panel.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      scene?.dispose();
      near.disconnect();
      observer.disconnect();
      resize.disconnect();
      panel.removeEventListener("pointermove", move);
      panel.removeEventListener("pointerdown", move);
      panel.removeEventListener("keydown", key);
      panel.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, []);

  return (
    <section
      id={stegaClean(props.anchor?.anchorId) || `credibility-${props._key}`}
      className={styles.section}
      data-credibility-version="gps"
      aria-labelledby={`gps-title-${props._key}`}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        data-ready="false"
        tabIndex={0}
        aria-label="Interactive globe. Move the pointer or use arrow keys to tilt the logo orbit and position the satellite’s ground target."
        data-running="false"
        data-lifecycle-environment-preserve
      >
        <div className={styles.fallback} aria-hidden="true">
          <Image
            src="/images/credibility/earth-day.webp"
            alt=""
            fill
            sizes="300px"
          />
        </div>
        <div className={styles.shootingStars} aria-hidden="true">
          <span className={styles.shootingStar} />
          <span className={styles.shootingStar} />
        </div>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <div className={styles.scanlines} aria-hidden="true" />
        <ul className={styles.logos} aria-label="Selected clients">
          {GPS_BRANDS.map((brand, i) => {
            const p = createGpsOrbit(1440, 600)(i, 0);
            return (
              <li
                key={brand.name}
                data-gps-logo={brand.name}
                className={styles.logo}
                style={
                  {
                    "--logo-width": `${brand.width * 0.8}cqw`,
                    "--logo-mobile-width": `${Math.max(18, brand.width * 2) * 0.8}cqw`,
                    "--logo-x": `${(p.x * 100).toFixed(4)}cqw`,
                    "--logo-y": `${(p.y * 100).toFixed(4)}cqh`,
                    "--logo-scale": gpsLogoScale(p.depth),
                  } as CSSProperties
                }
              >
                <span className={styles.waypoint} aria-hidden="true" />
                <span className={styles.wordmark}>
                  <Image
                    src={`/images/credibility/${brand.file}`}
                    alt={brand.name}
                    fill
                    sizes="(max-width: 700px) 110px, 180px"
                  />
                </span>
              </li>
            );
          })}
        </ul>
        <div id={`gps-title-${props._key}`} className={styles.headline}>
          <TitleText
            as="h2"
            variant="stretched"
            size="what-we-do"
            animation="none"
            stretchScaleX={0.62}
            overallScale={1}
            singleLine
            maxChars={0}
            textColor="#dbffe6"
            fontWeight="bold"
          >
            We work with the biggest
            <br />
            brands in the world
          </TitleText>
        </div>
      </div>
    </section>
  );
}
