"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import type { PAGE_QUERYResult } from "@/sanity.types";
import LifecycleMemeComposition, {
  MEME_TEMPLATES,
  type MemeCompositionBox,
  type MemeCompositionTarget,
  type MemeLayerSpec,
} from "./lifecycle-meme-composition";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type LifecycleBlock = Extract<PageBlock, { _type: "lifecycle-slideshow" }>;
type MemeSlide = NonNullable<LifecycleBlock["memeSlide"]>;

type LifecycleMemeSwarmProps = {
  memes?: MemeSlide["memes"];
  bridgeImage?: { src: string; alt?: string };
  resetKey?: number;
};

type RenderLayer = {
  groupIndex: number;
  layerIndex: number;
  globalIndex: number;
  layer: MemeLayerSpec;
  restX: number;
  restY: number;
  restWidth: number;
  restHeight: number;
  restOpacity: number;
  restScale: number;
  restZIndex: number;
};

const DEPTH_SEQUENCE = [1, 0, 2, 1, 2, 0, 1, 2, 0, 2, 1, 0] as const;
const DEPTH_PRESETS = [
  { opacity: 0.42, scale: 0.78, zIndex: 8 },
  { opacity: 0.72, scale: 0.92, zIndex: 16 },
  { opacity: 1, scale: 1.08, zIndex: 28 },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundLayoutValue(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

function getFloatMotion(index: number) {
  return {
    distance: 4 + (index % 4) * 1.15,
    direction: index % 2 === 0 ? -1 : 1,
    duration: 2.7 + (index % 6) * 0.31,
    delay: -(index % 7) * 0.28,
  };
}

function getScatterPosition(index: number, total: number) {
  const columns = Math.max(7, Math.ceil(Math.sqrt(total * 1.5)));
  const rows = Math.ceil(total / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  const xStep = columns > 1 ? 86 / (columns - 1) : 0;
  const yStep = rows > 1 ? 60 / (rows - 1) : 0;

  return {
    x: clamp(7 + column * xStep + Math.sin(index * 2.17) * 2.8, 5, 95),
    y: clamp(20 + row * yStep + Math.cos(index * 1.73) * 3, 18, 83),
  };
}

function getRestSize(layer: MemeLayerSpec, index: number) {
  if (!layer.src) {
    const side = 38 + ((index * 11) % 18);
    return { width: side, height: side };
  }

  const maxSide = 56 + ((index * 13) % 38);
  const aspect = Math.max(0.35, Math.min(2.8, layer.width / layer.height));

  return aspect >= 1
    ? { width: maxSide, height: maxSide / aspect }
    : { width: maxSide * aspect, height: maxSide };
}

function getCompositionBox(
  root: HTMLElement,
  groupIndex: number,
): MemeCompositionBox {
  const bounds = root.getBoundingClientRect();
  const template = MEME_TEMPLATES[groupIndex] ?? MEME_TEMPLATES[0];
  let width = Math.min(360, Math.max(270, bounds.width * 0.23));
  let height = width / template.aspectRatio;
  const maxHeight = Math.max(240, bounds.height - 28);

  if (height > maxHeight) {
    height = maxHeight;
    width = height * 0.89;
  }

  width = Math.min(width, bounds.width - 28);
  // Every meme resolves into the same central viewing area. The scattered
  // source image still determines which template is built, but the finished
  // composition no longer jumps between desktop-specific corner positions.
  const left = clamp(
    (bounds.width - width) * 0.5,
    14,
    Math.max(14, bounds.width - width - 14),
  );
  const top = clamp(
    (bounds.height - height) * 0.5,
    14,
    Math.max(14, bounds.height - height - 14),
  );

  return {
    left: (left / bounds.width) * 100,
    top: (top / bounds.height) * 100,
    width: (width / bounds.width) * 100,
    height: (height / bounds.height) * 100,
  };
}

export default function LifecycleMemeSwarm({
  memes,
  bridgeImage,
  resetKey = 0,
}: LifecycleMemeSwarmProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const floatTweensRef = useRef(new Map<HTMLElement, gsap.core.Tween>());
  const hasInteractedRef = useRef(false);
  const activeMemeRef = useRef<MemeCompositionTarget | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const [activeMeme, setActiveMeme] = useState<MemeCompositionTarget | null>(
    null,
  );
  const [displayedMeme, setDisplayedMeme] =
    useState<MemeCompositionTarget | null>(null);
  const [compositionBox, setCompositionBox] =
    useState<MemeCompositionBox | null>(null);

  const layers = useMemo(() => {
    let globalIndex = 0;
    const total = MEME_TEMPLATES.reduce(
      (count, template) => count + template.layers.length,
      0,
    );

    return MEME_TEMPLATES.flatMap((template, groupIndex) =>
      template.layers.map((layer, layerIndex): RenderLayer => {
        const currentIndex = globalIndex++;
        const rest = getScatterPosition(currentIndex, total);
        const size = getRestSize(layer, currentIndex);
        const depth =
          DEPTH_PRESETS[DEPTH_SEQUENCE[currentIndex % DEPTH_SEQUENCE.length]];

        return {
          groupIndex,
          layerIndex,
          globalIndex: currentIndex,
          layer,
          restX: roundLayoutValue(rest.x),
          restY: roundLayoutValue(rest.y),
          restWidth: roundLayoutValue(size.width),
          restHeight: roundLayoutValue(size.height),
          restOpacity: depth.opacity,
          restScale: depth.scale,
          restZIndex: depth.zIndex,
        };
      }),
    );
  }, []);

  const [layoutVersion, setLayoutVersion] = useState(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const slide = root?.closest<HTMLElement>("[data-lifecycle-slide]");
    if (!root || !slide) return;
    let cancelled = false;
    let frame = 0;
    const measure = () => {
      if (cancelled) return;
      const bounds = root.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      // The actual characters define each line's protected area. The headline
      // wrapper is almost viewport-wide and must not become a giant safe zone.
      const characters = slide.querySelectorAll<HTMLElement>(
        "[data-lifecycle-title-char]",
      );
      const zones: Array<{
        left: number;
        right: number;
        top: number;
        bottom: number;
      }> = [];
      characters.forEach((character) => {
        const box = character.getBoundingClientRect();
        const top = box.top - bounds.top;
        const line = zones.find((zone) => Math.abs(zone.top - top) < 5);
        if (line) {
          line.left = Math.min(line.left, box.left - bounds.left);
          line.right = Math.max(line.right, box.right - bounds.left);
          line.bottom = Math.max(line.bottom, box.bottom - bounds.top);
        } else {
          zones.push({
            left: box.left - bounds.left,
            right: box.right - bounds.left,
            top,
            bottom: box.bottom - bounds.top,
          });
        }
      });
      const title = slide.querySelector<HTMLElement>(
        "[data-lifecycle-center-text]",
      );
      const titleScale = title
        ? Number(gsap.getProperty(title, "scaleX")) || 1
        : 1;
      const growth = bounds.width >= 1024 ? 1.14 / titleScale : 1;
      zones.forEach((zone) => {
        zone.left = bounds.width / 2 + (zone.left - bounds.width / 2) * growth;
        zone.right =
          bounds.width / 2 + (zone.right - bounds.width / 2) * growth;
        zone.top = bounds.height / 2 + (zone.top - bounds.height / 2) * growth;
        zone.bottom =
          bounds.height / 2 + (zone.bottom - bounds.height / 2) * growth;
      });
      const subtitle = slide.querySelector<HTMLElement>(
        "[data-lifecycle-top-text]",
      );
      if (subtitle) {
        const range = document.createRange();
        range.selectNodeContents(subtitle);
        const box = range.getBoundingClientRect();
        zones.push({
          left: box.left - bounds.left,
          right: box.right - bounds.left,
          top: box.top - bounds.top,
          bottom: box.bottom - bounds.top,
        });
      }
      const placed: Array<{ x: number; y: number; radius: number }> = [];
      const compact = bounds.width < 1024;
      const sidePadding = compact ? 18 : 0;
      root
        .querySelectorAll<HTMLElement>("[data-lifecycle-meme-image]")
        .forEach((item, index) => {
          const layer = layers[index] ?? { restX: 68, restY: 21 };
          const scale =
            Number(item.dataset.restScale) * (bounds.width < 640 ? 0.7 : 1);
          // Include the hover growth and floating travel in the clearance.
          const halfWidth = Number(item.dataset.restWidth) * scale * 0.61 + 7;
          const halfHeight =
            Number(item.dataset.restHeight) * scale * 0.61 + 14;
          const clear = (x: number, y: number) =>
            (!compact || (x - halfWidth >= sidePadding && x + halfWidth <= bounds.width - sidePadding
              && y - halfHeight >= 20 && y + halfHeight <= bounds.height - 24)) &&
            zones.every(
              (zone) =>
                x + halfWidth < zone.left ||
                x - halfWidth > zone.right ||
                y + halfHeight < zone.top ||
                y - halfHeight > zone.bottom,
            );
          const origin = {
            x: (bounds.width * layer.restX) / 100,
            y: (bounds.height * (compact ? 50 + (layer.restY - 50) * 1.28 : layer.restY)) / 100,
          };
          let best = origin;
          let bestScore = Infinity;
          for (let candidate = 0; candidate < 240; candidate++) {
            const x =
              candidate === 0
                ? origin.x
                : bounds.width *
                  (0.035 +
                    ((candidate * 0.61803398875 + index * 0.13) % 1) * 0.93);
            const y =
              candidate === 0
                ? origin.y
                : bounds.height *
                  ((compact ? 0.07 : 0.18) +
                    ((candidate * 0.41421356237 + index * 0.17) % 1) * (compact ? 0.86 : 0.64));
            if (!clear(x, y)) continue;
            const crowding = placed.reduce(
              (total, point) =>
                total +
                Math.max(
                  0,
                  halfWidth +
                    point.radius +
                    12 -
                    Math.hypot(x - point.x, y - point.y),
                ) *
                  12,
              0,
            );
            const score = Math.hypot(x - origin.x, y - origin.y) + crowding;
            if (score < bestScore) {
              best = { x, y };
              bestScore = score;
            }
          }
          placed.push({ ...best, radius: halfWidth });
          item.dataset.restX = String(
            roundLayoutValue((best.x / bounds.width) * 100),
          );
          item.dataset.restY = String(
            roundLayoutValue((best.y / bounds.height) * 100),
          );
        });
      setLayoutVersion((value) => value + 1);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    const title = slide.querySelector<HTMLElement>(
      "[data-lifecycle-center-text]",
    );
    if (title) observer.observe(title);
    void document.fonts.ready.then(schedule);
    schedule();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [layers, bridgeImage?.src]);

  const bridgeLayer = useMemo(() => {
    const depth = DEPTH_PRESETS[2];
    return {
      globalIndex: layers.length,
      restX: 68,
      restY: 21,
      restWidth: 68,
      restHeight: 68,
      restOpacity: depth.opacity,
      restScale: depth.scale,
      restZIndex: depth.zIndex,
    };
  }, [layers.length]);

  useEffect(
    () => () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    },
    [],
  );

  const showMeme = useCallback((target: MemeCompositionTarget) => {
    const root = rootRef.current;
    if (!root || activeMemeRef.current) return;

    hasInteractedRef.current = true;
    activeMemeRef.current = target;
    setCompositionBox(getCompositionBox(root, target.groupIndex));
    setDisplayedMeme(target);
    setActiveMeme(target);
  }, []);

  const resetHoverScales = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const hoverLayers = gsap.utils.toArray<HTMLElement>(
      "[data-lifecycle-meme-hover]",
      root,
    );
    gsap.to(hoverLayers, {
      scale: 1,
      duration: 0.26,
      ease: "power3.out",
      overwrite: true,
    });
  }, []);

  const setGroupHover = useCallback(
    (_groupIndex: number, globalIndex: number | null) => {
      if (activeMemeRef.current || resetTimerRef.current !== null) return;
      const root = rootRef.current;
      if (!root) return;

      const hoverLayers = gsap.utils.toArray<HTMLElement>(
        "[data-lifecycle-meme-hover]",
        root,
      );
      hoverLayers.forEach((layer) => {
        const isHovered = Number(layer.dataset.globalIndex) === globalIndex;
        gsap.to(layer, {
          scale: isHovered ? 1.22 : 1,
          duration: globalIndex === null ? 0.28 : 0.34,
          ease: globalIndex === null ? "power3.out" : "back.out(1.7)",
          overwrite: true,
        });
      });
    },
    [],
  );

  const deactivateMeme = useCallback(() => {
    if (!activeMemeRef.current) return;

    activeMemeRef.current = null;
    setActiveMeme(null);
    resetHoverScales();

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      resetTimerRef.current = null;
    }, 760);
  }, [resetHoverScales]);

  const handleMemeClick = useCallback(
    (target: MemeCompositionTarget) => {
      const current = activeMemeRef.current;

      // Any click while a meme is assembled only closes it. A separate,
      // deliberate click is required before another meme can open.
      if (current) return deactivateMeme();
      if (resetTimerRef.current !== null) return;

      resetHoverScales();
      showMeme(target);
    },
    [deactivateMeme, resetHoverScales, showMeme],
  );

  useEffect(() => {
    if (resetKey > 0) {
      deactivateMeme();
    }
  }, [deactivateMeme, resetKey]);

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      if (!activeMemeRef.current) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("[data-lifecycle-meme-hit]")
      ) {
        return;
      }
      deactivateMeme();
    };

    window.addEventListener("pointerdown", handleOutsideClick);
    return () => window.removeEventListener("pointerdown", handleOutsideClick);
  }, [deactivateMeme]);

  const handleCompositionExit = useCallback(() => {
    if (!activeMemeRef.current) {
      setDisplayedMeme(null);
    }
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const context = gsap.context(() => {
      const floatLayers = gsap.utils.toArray<HTMLElement>(
        "[data-lifecycle-meme-float]",
        root,
      );

      floatLayers.forEach((layer, index) => {
        const { distance, direction, duration, delay } = getFloatMotion(index);
        const tween = gsap.fromTo(
          layer,
          { y: -distance * direction },
          {
            y: distance * direction,
            duration,
            delay,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          },
        );
        floatTweensRef.current.set(layer, tween);
      });
    }, root);

    return () => {
      floatTweensRef.current.forEach((tween) => tween.kill());
      floatTweensRef.current.clear();
      context.revert();
    };
  }, [bridgeImage?.src]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const rootBounds = root.getBoundingClientRect();
    const mobileRestScale = rootBounds.width < 640 ? 0.7 : 1;
    const items = gsap.utils.toArray<HTMLElement>(
      "[data-lifecycle-meme-image]",
      root,
    );
    const title = root
      .closest<HTMLElement>("[data-lifecycle-slide]")
      ?.querySelector<HTMLElement>("[data-lifecycle-center-text]");
    const backdrop = root.querySelector<HTMLElement>(
      "[data-lifecycle-meme-backdrop]",
    );

    items.forEach((item) => {
      const groupIndex = Number(item.dataset.groupIndex ?? 0);
      const layerIndex = Number(item.dataset.layerIndex ?? 0);
      const globalIndex = Number(item.dataset.globalIndex ?? 0);
      const restX = Number(item.dataset.restX ?? 50);
      const restY = Number(item.dataset.restY ?? 50);
      const restWidth = Number(item.dataset.restWidth ?? 50);
      const restHeight = Number(item.dataset.restHeight ?? 50);
      const restOpacity = Number(item.dataset.restOpacity ?? 1);
      const restScale = Number(item.dataset.restScale ?? 1);
      const restZIndex = Number(item.dataset.restZIndex ?? 10);
      const isStandalone = item.dataset.memeStandalone === "true";
      const belongsToActiveGroup = groupIndex === activeMeme?.groupIndex;
      const isActiveItem = globalIndex === activeMeme?.globalIndex;
      const layer = isStandalone
        ? null
        : MEME_TEMPLATES[groupIndex]?.layers[layerIndex];
      const floatLayer = item.querySelector<HTMLElement>(
        "[data-lifecycle-meme-float]",
      );

      let left: string | number = `${restX}%`;
      let top: string | number = `${restY}%`;
      let width = restWidth * (belongsToActiveGroup ? 1 : mobileRestScale);
      let height = restHeight * (belongsToActiveGroup ? 1 : mobileRestScale);

      if (belongsToActiveGroup && compositionBox && layer) {
        const layerCenterX = layer.left + layer.width / 2;
        const layerCenterY = layer.top + layer.height / 2;
        const placeholderSide = Math.min(layer.width, layer.height);
        const finalWidth = layer.src ? layer.width : placeholderSide;
        const finalHeight = layer.src ? layer.height : placeholderSide;

        left = `${compositionBox.left + (layerCenterX / 100) * compositionBox.width}%`;
        top = `${compositionBox.top + (layerCenterY / 100) * compositionBox.height}%`;
        width =
          rootBounds.width * (compositionBox.width / 100) * (finalWidth / 100);
        height =
          rootBounds.height *
          (compositionBox.height / 100) *
          (finalHeight / 100);
      }

      const properties = {
        left,
        top,
        width,
        height,
        rotation: belongsToActiveGroup && layer ? (layer.rotation ?? 0) : 0,
        rotationX: 0,
        rotationY: 0,
        z: 0,
        // Restore authored depth as soon as the return begins. Keeping the
        // assembled z-index until the end made deeper items arrive above the
        // title and then visibly snap behind it one frame later.
        zIndex: belongsToActiveGroup ? 110 + layerIndex : restZIndex,
        force3D: true,
      };

      if (!hasInteractedRef.current) {
        gsap.set(item, properties);
        return;
      }

      if (activeMeme === null) {
        gsap.set(item, { zIndex: restZIndex });
      }

      gsap.to(item, {
        ...properties,
        autoAlpha:
          activeMeme === null
            ? restOpacity
            : belongsToActiveGroup
              ? 1
              : Math.max(0.08, restOpacity * 0.15),
        scale:
          activeMeme === null
            ? restScale
            : belongsToActiveGroup
              ? 1
              : restScale * 0.72,
        duration: activeMeme === null ? 0.72 : 0.68,
        ease: "power3.inOut",
        overwrite: true,
      });

      if (isActiveItem) item.dataset.activeItem = "true";
      else delete item.dataset.activeItem;

      if (floatLayer && belongsToActiveGroup) {
        floatTweensRef.current.get(floatLayer)?.kill();
        floatTweensRef.current.delete(floatLayer);
        gsap.to(floatLayer, {
          y: 0,
          duration: 0.28,
          ease: "power2.out",
          overwrite: true,
        });
      } else if (
        floatLayer &&
        activeMeme === null &&
        !floatTweensRef.current.has(floatLayer)
      ) {
        const { distance, direction, duration } = getFloatMotion(globalIndex);
        const tween = gsap.to(floatLayer, {
          y: distance * direction,
          duration,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          overwrite: true,
        });
        floatTweensRef.current.set(floatLayer, tween);
      }
    });

    if (backdrop) {
      gsap.to(backdrop, {
        autoAlpha: activeMeme ? 1 : 0,
        duration: activeMeme ? 0.18 : 0.5,
        ease: "power2.inOut",
        overwrite: true,
      });
    }

    if (title) {
      gsap.to(title, {
        opacity: activeMeme ? 0.3 : 1,
        duration: activeMeme ? 0.35 : 0.6,
        ease: "power2.inOut",
        overwrite: true,
      });
    }
  }, [activeMeme, compositionBox, displayedMeme, layoutVersion]);

  return (
    <div ref={rootRef} className="absolute inset-0">
      {layers.map((item) => (
        <button
          key={`${item.groupIndex}-${item.layerIndex}`}
          type="button"
          data-lifecycle-meme-image
          data-lifecycle-meme-hit
          data-group-index={item.groupIndex}
          data-layer-index={item.layerIndex}
          data-global-index={item.globalIndex}
          data-rest-x={item.restX}
          data-rest-y={item.restY}
          data-rest-width={item.restWidth}
          data-rest-height={item.restHeight}
          data-rest-opacity={item.restOpacity}
          data-rest-scale={item.restScale}
          data-rest-z-index={item.restZIndex}
          aria-pressed={activeMeme?.globalIndex === item.globalIndex}
          aria-label={`Build ${MEME_TEMPLATES[item.groupIndex].label}`}
          onPointerEnter={() =>
            setGroupHover(item.groupIndex, item.globalIndex)
          }
          onPointerLeave={() => setGroupHover(item.groupIndex, null)}
          onClick={() => {
            handleMemeClick({
              groupIndex: item.groupIndex,
              layerIndex: item.layerIndex,
              globalIndex: item.globalIndex,
              x: item.restX,
              y: item.restY,
            });
          }}
          className="absolute cursor-pointer border-0 bg-transparent p-0 outline-none ring-offset-2 transform-gpu will-change-transform focus-visible:ring-2 focus-visible:ring-foreground lg:opacity-0"
          style={{
            left: `${item.restX}%`,
            top: `${item.restY}%`,
            width: `${item.restWidth}px`,
            height: `${item.restHeight}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span
            data-lifecycle-meme-float
            className="pointer-events-none absolute inset-0 will-change-transform"
          >
            <span
              data-lifecycle-meme-hover
              data-group-index={item.groupIndex}
              data-global-index={item.globalIndex}
              className="absolute inset-0 will-change-transform"
            >
              {item.layer.src && item.layer.sourceCrop ? (
                <svg
                  viewBox={item.layer.sourceCrop.viewBox}
                  role="img"
                  aria-label={item.layer.alt}
                  className="h-full w-full"
                >
                  <defs>
                    <clipPath id={`meme-character-${item.globalIndex}`}>
                      <path d={item.layer.sourceCrop.outline} />
                    </clipPath>
                  </defs>
                  <image
                    href={item.layer.src}
                    width="1018"
                    height="1146"
                    clipPath={`url(#meme-character-${item.globalIndex})`}
                  />
                </svg>
              ) : item.layer.src ? (
                <Image
                  src={item.layer.src}
                  alt={item.layer.alt}
                  fill
                  sizes="(min-width: 1024px) 180px, 90px"
                  className="object-contain"
                />
              ) : (
                <span className="block h-full w-full bg-[#b7b7b7]" />
              )}
            </span>
          </span>
        </button>
      ))}

      {bridgeImage?.src && (
        <div
          data-lifecycle-meme-image
          data-lifecycle-bridge-source="true"
          data-meme-standalone="true"
          data-group-index={-1}
          data-layer-index={-1}
          data-global-index={bridgeLayer.globalIndex}
          data-rest-x={bridgeLayer.restX}
          data-rest-y={bridgeLayer.restY}
          data-rest-width={bridgeLayer.restWidth}
          data-rest-height={bridgeLayer.restHeight}
          data-rest-opacity={bridgeLayer.restOpacity}
          data-rest-scale={bridgeLayer.restScale}
          data-rest-z-index={bridgeLayer.restZIndex}
          className="pointer-events-none absolute transform-gpu will-change-transform lg:opacity-0"
          style={{
            left: `${bridgeLayer.restX}%`,
            top: `${bridgeLayer.restY}%`,
            width: `${bridgeLayer.restWidth}px`,
            height: `${bridgeLayer.restHeight}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span
            data-lifecycle-meme-float
            className="absolute inset-0 will-change-transform"
          >
            <span className="absolute inset-0">
              <Image
                src={bridgeImage.src}
                alt={bridgeImage.alt || ""}
                fill
                sizes="(min-width: 1024px) 150px, 90px"
                className="object-contain"
              />
            </span>
          </span>
        </div>
      )}

      {displayedMeme && compositionBox && (
        <div
          data-lifecycle-meme-backdrop
          className="pointer-events-none absolute z-[100] bg-background opacity-0"
          style={{
            left: `${compositionBox.left}%`,
            top: `${compositionBox.top}%`,
            width: `${compositionBox.width}%`,
            height: `${compositionBox.height}%`,
          }}
          aria-hidden="true"
        />
      )}

      {displayedMeme && compositionBox && (
        <LifecycleMemeComposition
          template={MEME_TEMPLATES[displayedMeme.groupIndex]}
          box={compositionBox}
          active={activeMeme?.globalIndex === displayedMeme.globalIndex}
          onExitComplete={handleCompositionExit}
        />
      )}

    </div>
  );
}
