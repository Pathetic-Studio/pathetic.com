"use client";

import { useEffect, useRef } from "react";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERYResult } from "@/sanity.types";
import TitleText from "@/components/ui/title-text";
import {
  UNIVERSE_BRANDS,
  UNIVERSE_LABEL_STYLE,
  UNIVERSE_OBJECT_STYLE,
  type UniverseLabelStyle,
  type UniverseObjectStyle,
} from "./credibility-universe-data";
import type { UniverseScene } from "./credibility-universe-scene";
import {
  preloadUniverseLogos,
  preloadUniverseObjects,
} from "./credibility-universe-assets";
import styles from "./credibility-universe.module.css";

let sceneModule: Promise<typeof import("./credibility-universe-scene")> | null =
  null;
function preloadScene() {
  return (sceneModule ??= import("./credibility-universe-scene").catch(
    (error) => {
      sceneModule = null;
      throw error;
    },
  ));
}

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type CredibilityBlock = Extract<PageBlock, { _type: "credibility-section" }>;

export default function CredibilityUniverseSection(
  props: CredibilityBlock & {
    labelStyle?: UniverseLabelStyle;
    objectStyle?: UniverseObjectStyle;
  },
) {
  const labelStyle = props.labelStyle ?? UNIVERSE_LABEL_STYLE;
  const objectStyle = props.objectStyle ?? UNIVERSE_OBJECT_STYLE;
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<UniverseScene | null>(null);
  const instructionId = `universe-help-${props._key}`;

  useEffect(() => {
    const panel = panelRef.current,
      canvas = canvasRef.current;
    if (!panel || !canvas) return;
    const controller = new AbortController();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const buttons = [
      ...panel.querySelectorAll<HTMLButtonElement>("[data-universe-brand]"),
    ];
    let visible = false,
      nearViewport = false,
      loading = false,
      lost = false;
    let frame = 0,
      lastTime = 0,
      reportTime = 0;
    let lastInteraction = 0;
    let attempts = 0;
    let retryTimer = 0;
    panel.dataset.ready = "false";
    panel.dataset.running = "false";
    let gesture: {
      id: number;
      target: HTMLElement;
      startX: number;
      startY: number;
      moved: boolean;
      brand: number;
    } | null = null;
    const draw = (dt: number) => sceneRef.current?.render(dt, reduced.matches);
    const tick = (time: number) => {
      frame = 0;
      if (!visible || document.hidden || lost || reduced.matches) {
        lastTime = 0;
        return;
      }
      const interval =
        gesture || sceneRef.current?.isActive() || time - lastInteraction < 1250
          ? 1000 / 60
          : 1000 / 30;
      if (!lastTime || time - lastTime >= interval - 1) {
        draw(lastTime ? (time - lastTime) / 1000 : 0);
        lastTime = time;
        if (
          process.env.NODE_ENV === "development" &&
          time - reportTime > 1000
        ) {
          const stats = sceneRef.current?.stats();
          if (stats) {
            panel.dataset.universeFrames = String(stats.frames);
            panel.dataset.universeCalls = String(stats.calls);
            panel.dataset.universeParticles = String(stats.particles);
            panel.dataset.universeComets = String(stats.comets);
            panel.dataset.universeFragments = String(stats.fragments);
            panel.dataset.universeImpacts = String(stats.impacts);
          }
          reportTime = time;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      sceneRef.current?.setPresented(visible);
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      const running =
        visible &&
        !document.hidden &&
        !lost &&
        Boolean(sceneRef.current) &&
        !reduced.matches;
      panel.dataset.running = String(running);
      if (running) frame = requestAnimationFrame(tick);
      else if (visible && !lost && !document.hidden) draw(0);
    };
    const initialize = async () => {
      if (loading || lost || sceneRef.current || controller.signal.aborted)
        return;
      window.clearTimeout(retryTimer);
      retryTimer = 0;
      loading = true;
      attempts++;
      panel.dataset.universeState = "loading";
      let pendingScene: UniverseScene | null = null;
      try {
        const { createUniverseScene } = await preloadScene();
        if (controller.signal.aborted) return;
        pendingScene = await createUniverseScene(
          canvas,
          buttons,
          controller.signal,
          () => {
            if (visible && reduced.matches) draw(0);
          },
          { labelStyle, objectStyle },
        );
        if (controller.signal.aborted) {
          pendingScene.dispose();
          return;
        }
        if (lost) throw new Error("WebGL context lost during scene startup");
        pendingScene.resize(panel.clientWidth, panel.clientHeight);
        pendingScene.setPresented(visible);
        pendingScene.render(0, reduced.matches);
        sceneRef.current = pendingScene;
        pendingScene = null;
        panel.dataset.ready = "true";
        panel.dataset.universeState = "ready";
        delete panel.dataset.universeError;
        sync();
      } catch (error) {
        pendingScene?.dispose();
        if (controller.signal.aborted) return;
        panel.dataset.ready = "false";
        panel.dataset.universeState = "error";
        panel.dataset.universeError =
          error instanceof Error ? error.message : "Scene startup failed";
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Credibility scene could not start; retrying when available.",
            error,
          );
        }
        // Retry transient failures with backoff. A new visit/tab focus/network
        // reconnection gets a fresh attempt instead of remaining stranded.
        if (!lost && nearViewport && !document.hidden && attempts < 6) {
          panel.dataset.universeState = "retrying";
          retryTimer = window.setTimeout(
            () => void initialize(),
            Math.min(8000, 600 * 2 ** (attempts - 1)),
          );
        }
      } finally {
        loading = false;
      }
    };
    const near = new IntersectionObserver(
      ([entry]) => {
        nearViewport = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (!loading) attempts = 0;
          void initialize();
        }
      },
      { rootMargin: "1800px 0px" },
    );
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !loading && !sceneRef.current && !lost) {
        attempts = 0;
        void initialize();
      }
      if (!visible) {
        sceneRef.current?.release();
        gesture = null;
        lastInteraction = 0;
        sceneRef.current?.setPointer(0, 0, false);
      }
      sync();
    });
    const resize = new ResizeObserver(() => {
      sceneRef.current?.resize(panel.clientWidth, panel.clientHeight);
      if (visible) draw(0);
    });
    const point = (event: PointerEvent) => {
      const rect = panel.getBoundingClientRect();
      sceneRef.current?.setPointer(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2,
        true,
      );
    };
    const down = (event: PointerEvent) => {
      if (gesture || event.button !== 0 || lost) return;
      if (!sceneRef.current) {
        if (!loading) {
          attempts = 0;
          void initialize();
        }
        return;
      }
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLElement>("[data-universe-brand]");
      const brand = button ? Number(button.dataset.universeBrand) : -1;
      gesture = {
        id: event.pointerId,
        target: button || canvas,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        brand,
      };
      lastInteraction = performance.now();
      point(event);
      sceneRef.current.grab(brand);
      if (brand >= 0 || event.pointerType === "mouse")
        gesture.target.setPointerCapture(event.pointerId);
      if (reduced.matches) draw(0);
    };
    const move = (event: PointerEvent) => {
      if (gesture && gesture.id !== event.pointerId) return;
      if (event.pointerType !== "mouse" && !gesture) return;
      lastInteraction = performance.now();
      point(event);
      if (gesture) {
        gesture.moved ||=
          Math.hypot(
            event.clientX - gesture.startX,
            event.clientY - gesture.startY,
          ) > 6;
        if (gesture.brand >= 0) event.preventDefault();
        if (reduced.matches) draw(0);
      }
    };
    const finish = (event: PointerEvent) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const current = gesture;
      gesture = null;
      if (
        event.type === "pointerup" &&
        !current.moved &&
        current.brand < 0 &&
        !reduced.matches
      )
        sceneRef.current?.launchComet();
      sceneRef.current?.release(event.type === "pointerup");
      if (current.target.hasPointerCapture(event.pointerId))
        current.target.releasePointerCapture(event.pointerId);
      if (event.pointerType !== "mouse" || event.type !== "pointerup") {
        lastInteraction = 0;
        sceneRef.current?.setPointer(0, 0, false);
      }
      if (reduced.matches) draw(0);
    };
    const leave = () => {
      if (gesture) return;
      lastInteraction = 0;
      sceneRef.current?.setPointer(0, 0, false);
    };
    const keyboard = (event: KeyboardEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-universe-brand]",
      );
      if (!button) return;
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [-2, 0],
        ArrowRight: [2, 0],
        ArrowUp: [0, 2],
        ArrowDown: [0, -2],
        " ": [1.5, 2],
        Enter: [1.5, 2],
      };
      if (event.key === "Escape") {
        sceneRef.current?.reset();
        return;
      }
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      lastInteraction = performance.now();
      sceneRef.current?.nudge(
        Number(button.dataset.universeBrand),
        ...direction,
      );
      if (reduced.matches) draw(0);
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      sceneRef.current?.release();
      gesture = null;
      panel.dataset.ready = "false";
      panel.dataset.universeState = "context-lost";
      sync();
    };
    const contextRestored = () => {
      // Three's own context-restoration listener is installed after this one.
      // Let it rebuild its GL state before recreating particle compute buffers.
      queueMicrotask(() => {
        if (controller.signal.aborted) return;
        lost = false;
        try {
          if (sceneRef.current) {
            sceneRef.current.reset();
            draw(0);
            panel.dataset.ready = "true";
            panel.dataset.universeState = "ready";
            sync();
          } else {
            attempts = 0;
            void initialize();
          }
        } catch {
          sceneRef.current?.dispose();
          sceneRef.current = null;
          attempts = 0;
          void initialize();
        }
      });
    };
    const resume = () => {
      if (
        !document.hidden &&
        nearViewport &&
        !lost &&
        !loading &&
        !sceneRef.current
      ) {
        attempts = 0;
        void initialize();
      }
      sync();
    };
    preloadUniverseLogos();
    if (objectStyle === "images") preloadUniverseObjects();
    // Warm the code chunk during the intro, before proximity starts WebGL.
    const warmModule = () => {
      void preloadScene().catch(() => {});
    };
    const useIdle = typeof window.requestIdleCallback === "function";
    const idle = useIdle
      ? window.requestIdleCallback(warmModule, { timeout: 1500 })
      : window.setTimeout(warmModule, 300);
    near.observe(panel);
    visibility.observe(panel);
    resize.observe(panel);
    panel.addEventListener("pointerdown", down);
    panel.addEventListener("pointermove", move, { passive: false });
    panel.addEventListener("pointerup", finish);
    panel.addEventListener("pointercancel", finish);
    panel.addEventListener("lostpointercapture", finish);
    panel.addEventListener("pointerleave", leave);
    panel.addEventListener("keydown", keyboard);
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    return () => {
      controller.abort();
      if (useIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      window.clearTimeout(retryTimer);
      cancelAnimationFrame(frame);
      near.disconnect();
      visibility.disconnect();
      resize.disconnect();
      panel.removeEventListener("pointerdown", down);
      panel.removeEventListener("pointermove", move);
      panel.removeEventListener("pointerup", finish);
      panel.removeEventListener("pointercancel", finish);
      panel.removeEventListener("lostpointercapture", finish);
      panel.removeEventListener("pointerleave", leave);
      panel.removeEventListener("keydown", keyboard);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [labelStyle, objectStyle]);

  return (
    <section
      id={stegaClean(props.anchor?.anchorId) || `credibility-${props._key}`}
      className={styles.section}
      data-credibility-version="universe"
      data-universe-label-style={labelStyle}
      data-universe-object-style={objectStyle}
      aria-labelledby={`universe-title-${props._key}`}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        data-universe-panel
        data-ready="false"
        data-running="false"
        data-lifecycle-environment-preserve
      >
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <ul className={styles.brands} aria-label="Selected clients">
          {UNIVERSE_BRANDS.map((brand, i) => (
            <li key={brand.name}>
              <button
                type="button"
                className={styles.brand}
                data-universe-brand={i}
                aria-label={`${brand.name}: drag or use the arrow keys to move`}
                aria-describedby={instructionId}
              />
            </li>
          ))}
        </ul>
        <div id={`universe-title-${props._key}`} className={styles.headline}>
          <TitleText
            as="h2"
            variant="stretched"
            size="what-we-do"
            animation="none"
            stretchScaleX={0.62}
            overallScale={1}
            maxChars={0}
            textColor="#ffffff"
            textOutline
            outlineColor="#000000"
            outlineWidth={1.5}
            outlinePosition="outside"
            fontWeight="bold"
          >
            We work with the biggest
            <br />
            brands in the universe
          </TitleText>
        </div>
        <p id={instructionId} className="sr-only">
          Drag a brand or use arrow keys to move a focused brand. Click the
          background to send a comet through the galaxy. Press Escape to reset.
        </p>
      </div>
    </section>
  );
}
