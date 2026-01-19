// components/blocks/grid/caption-bubble.tsx
"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type CaptionSide = "left" | "right";

export interface CaptionBubbleProps {
  text: string;
  bgColor?: string | null;
  textColor?: string | null;
  side?: CaptionSide | null;
  xPercent?: number | null;
  yPercent?: number | null;
  parallaxSpeed?: number | null;
}

// Default desktop max width
const BUBBLE_MAX_REM = 12;

// Breakpoint for “mobile/tablet” behaviour
const MOBILE_MAX_WIDTH = 1024;

// Keep a little breathing room from the edge
const EDGE_PADDING_REM = 1;

// Don’t let it get ridiculously narrow if we can avoid it
const MIN_READABLE_REM = 7.5;

export default function CaptionBubble({
  text,
  bgColor,
  textColor,
  side = "right",
  xPercent,
  yPercent,
  parallaxSpeed,
}: CaptionBubbleProps) {
  const safeX = xPercent ?? 70;
  const safeY = yPercent ?? 20;

  const clampedX = Math.min(100, Math.max(0, safeX));
  const clampedY = Math.min(100, Math.max(0, safeY));
  const effectiveSide = (side ?? "right") as CaptionSide;

  const bubbleRef = useRef<HTMLDivElement | null>(null);

  const [dynamicMaxWidth, setDynamicMaxWidth] = useState<string | undefined>();
  const [computedX, setComputedX] = useState<number>(clampedX);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const updateLayout = () => {
      const vw = window.innerWidth;

      const rootFontSize = parseFloat(
        getComputedStyle(document.documentElement).fontSize || "16",
      );
      const oneRem = rootFontSize || 16;

      const baseMaxPx = BUBBLE_MAX_REM * oneRem;
      const edgePadPx = EDGE_PADDING_REM * oneRem;
      const minReadablePx = Math.min(baseMaxPx, MIN_READABLE_REM * oneRem);

      // Use the absolute-positioning context width (more accurate than viewport)
      const container =
        (bubbleRef.current?.offsetParent as HTMLElement | null) ??
        bubbleRef.current?.parentElement ??
        null;

      const containerWidth = container?.getBoundingClientRect().width ?? vw;

      // Desktop: use defaults, no nudging
      if (vw >= MOBILE_MAX_WIDTH) {
        setComputedX(clampedX);
        setDynamicMaxWidth(undefined);
        return;
      }

      let nextX = clampedX;

      // If the bubble would become too narrow on its chosen side, nudge X inward (but DO NOT flip sides)
      if (containerWidth > 0) {
        const requiredPercent =
          ((minReadablePx + edgePadPx) / containerWidth) * 100;

        if (effectiveSide === "left") {
          nextX = Math.max(nextX, requiredPercent);
        } else {
          nextX = Math.min(nextX, 100 - requiredPercent);
        }

        nextX = Math.min(100, Math.max(0, nextX));
      }

      const leftSpacePx = (nextX / 100) * containerWidth - edgePadPx;
      const rightSpacePx = ((100 - nextX) / 100) * containerWidth - edgePadPx;

      const availablePx = effectiveSide === "left" ? leftSpacePx : rightSpacePx;
      const maxWidthPx = Math.max(0, Math.min(baseMaxPx, availablePx));

      setComputedX(nextX);
      setDynamicMaxWidth(`${maxWidthPx}px`);
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);

    const container =
      (bubbleRef.current?.offsetParent as HTMLElement | null) ??
      bubbleRef.current?.parentElement ??
      null;

    let ro: ResizeObserver | undefined;
    if (container && "ResizeObserver" in window) {
      ro = new ResizeObserver(updateLayout);
      ro.observe(container);
    }

    return () => {
      window.removeEventListener("resize", updateLayout);
      ro?.disconnect();
    };
  }, [clampedX, effectiveSide]);

  // IMPORTANT:
  // - Use `translate` (not `transform`) so parallax (transform) can't clobber anchoring.
  const horizontalPosition: CSSProperties =
    effectiveSide === "left"
      ? {
        left: `${computedX}%`,
        translate: "-100% 0", // anchor right edge at x%
      }
      : {
        left: `${computedX}%`,
        translate: "0 0", // anchor left edge at x%
      };

  const bubbleStyle: CSSProperties = {
    top: `${clampedY}%`,
    ...horizontalPosition,
    backgroundColor: bgColor || "rgba(0,0,0,0.85)",
    color: textColor || "#ffffff",
    transformOrigin: effectiveSide === "left" ? "top right" : "top left",

    // Hard anti-FOUC (works even before CSS loads)
    opacity: 0,
    visibility: "hidden",

    // Desktop keeps a clean cap; mobile/tablet only shrinks (never grows wider than desktop)
    maxWidth: dynamicMaxWidth ?? `${BUBBLE_MAX_REM}rem`,
    willChange: "transform, opacity",
  };

  return (
    <div
      ref={bubbleRef}
      className={cn(
        "caption-bubble absolute z-20 rounded-2xl px-3 py-2 text-xs tracking-wide",
        "flex items-center justify-center",
      )}
      style={bubbleStyle}
      data-speed={parallaxSpeed ?? undefined}
    >
      <span className="block text-left break-words leading-snug">{text}</span>

      {/* Tail */}
      <span
        className={cn(
          "pointer-events-none absolute top-0",
          effectiveSide === "left"
            ? "right-0 translate-x-1/2"
            : "left-0 -translate-x-1/2",
        )}
        style={{ width: "24px", height: "20px" }}
      >
        <svg
          width="24"
          height="20"
          viewBox="0 0 24 20"
          xmlns="http://www.w3.org/2000/svg"
          className="origin-top"
          style={{
            transform:
              effectiveSide === "left"
                ? "scaleX(1)"
                : "scaleY(-1) rotate(180deg)",
            transformOrigin: "top center",
          }}
        >
          <path
            d="M13.508 19.1958C20.6379 16.7242 23.4344 5.36875 23.9414 0C22.1375 9.9727 7.22912 12.5732 0.000399285 12.6268C1.53219 15.8463 6.37823 21.6674 13.508 19.1958Z"
            fill={bgColor || "rgba(0,0,0,0.85)"}
          />
        </svg>
      </span>
    </div>
  );
}
