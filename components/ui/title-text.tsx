// components/ui/title-text.tsx
"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import TypeOnText from "@/components/ui/type-on-text";

type TitleTextVariant = "normal" | "stretched";
type TitleTextAnimation = "none" | "typeOn";
type TitleTextSize = "xxl" | "xl" | "md";

interface TitleTextProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "p";
  variant?: TitleTextVariant;
  animation?: TitleTextAnimation;
  animationSpeed?: number;
  className?: string;

  size?: TitleTextSize;

  // Optional overrides for current viewport
  stretchScaleX?: number;
  overallScale?: number;

  align?: "left" | "center";
  maxChars?: number;
}

const BASE_TEXT_CLASSES =
  "font-bold leading-[1.1] uppercase mx-auto";

// size-specific base text classes
const SIZE_TEXT_CLASSES: Record<TitleTextSize, string> = {
  md: "text-3xl",
  xl: "text-6xl",
  xxl: "text-5xl lg:text-8xl",
};

function getBreakpoint(width: number) {
  if (width < 768) return "mobile" as const;
  if (width < 1024) return "tablet" as const;
  return "desktop" as const;
}

type Breakpoint = ReturnType<typeof getBreakpoint>;

const SCALE_CONFIG: Record<
  TitleTextSize,
  Record<Breakpoint, { stretchScaleX: number; overallScale: number }>
> = {
  xxl: {
    mobile: { stretchScaleX: 0.55, overallScale: 1.5 },
    tablet: { stretchScaleX: 0.55, overallScale: 1.6 },
    desktop: { stretchScaleX: 0.55, overallScale: 2.0 },
  },
  xl: {
    mobile: { stretchScaleX: 0.55, overallScale: 1.2 },
    tablet: { stretchScaleX: 0.55, overallScale: 1.7 },
    desktop: { stretchScaleX: 0.55, overallScale: 2.2 },
  },
  md: {
    mobile: { stretchScaleX: 0.55, overallScale: 1.5 },
    tablet: { stretchScaleX: 0.55, overallScale: 1.5 },
    desktop: { stretchScaleX: 0.55, overallScale: 1.5 },
  },
};

export default function TitleText({
  children,
  as = "h2",
  variant = "normal",
  animation = "none",
  animationSpeed = 1.2,
  className,
  size = "md",
  stretchScaleX,
  overallScale,
  align = "center",
  maxChars = 26,
}: TitleTextProps) {
  const Tag = as;

  // This ref points to the INNER element that actually gets scaled
  const scaledInnerRef = useRef<HTMLSpanElement | null>(null);

  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") return 1440;
    return window.innerWidth;
  });

  // Natural, unscaled height of the text (layout height)
  const [baseHeight, setBaseHeight] = useState<number | null>(null);

  const isStretched = variant === "stretched";
  const isTypeOn = animation === "typeOn";

  // Track viewport width for breakpoint-based presets
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const breakpoint = getBreakpoint(viewportWidth);
  const preset = SCALE_CONFIG[size][breakpoint];

  const effectiveStretchScaleX = stretchScaleX ?? preset.stretchScaleX;
  const effectiveOverallScale = overallScale ?? preset.overallScale;

  // Measure the *unscaled* height of the inner span and then multiply by overallScale.
  useLayoutEffect(() => {
    if (!isStretched) {
      setBaseHeight(null);
      return;
    }

    if (typeof window === "undefined") return;
    const el = scaledInnerRef.current;
    if (!el) return;

    const measure = () => {
      // Temporarily remove transform to get natural layout height
      const prevTransform = el.style.transform;
      el.style.transform = "none";
      const rect = el.getBoundingClientRect();
      el.style.transform = prevTransform;

      if (rect.height > 0) {
        setBaseHeight(rect.height);
      }
    };

    // Initial measure
    measure();

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        // Type-on adds chars / wrapping changes -> remeasure natural height
        measure();
      });
      resizeObserver.observe(el);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isStretched, children]);

  // Final container height = natural height * vertical scale
  const measuredHeight =
    isStretched && baseHeight != null
      ? baseHeight * effectiveOverallScale
      : null;

  const alignClass = align === "center" ? "text-center" : "text-left";

  const inlineMaxWidthStyle: React.CSSProperties = maxChars
    ? { maxWidth: `${maxChars}ch` }
    : {};

  const content = isTypeOn ? (
    <TypeOnText text={String(children)} speed={animationSpeed} />
  ) : (
    children
  );

  // NORMAL MODE: no scaling logic, just base font size.
  if (!isStretched) {
    return (
      <Tag
        className={cn(
          BASE_TEXT_CLASSES,
          SIZE_TEXT_CLASSES[size],
          alignClass,
          "mt-6",
          className,
        )}
        style={inlineMaxWidthStyle}
      >
        {content}
      </Tag>
    );
  }

  // STRETCHED MODE:
  // - outer div reserves scaled height
  // - inner span carries the transform (so we can strip it for measurement)
  return (
    <div
      className={cn(
        "relative w-full flex mt-6",
        align === "center" ? "justify-center" : "justify-start",
        className,
      )}
      style={measuredHeight != null ? { height: `${measuredHeight}px` } : undefined}
    >
      <Tag
        className={cn(
          BASE_TEXT_CLASSES,
          SIZE_TEXT_CLASSES[size],
          alignClass,
        )}
        style={inlineMaxWidthStyle}
      >
        <span
          ref={scaledInnerRef}
          className="inline-block origin-top will-change-transform"
          style={{
            transform: `scaleX(${effectiveStretchScaleX}) scale(${effectiveOverallScale})`,
          }}
        >
          {content}
        </span>
      </Tag>
    </div>
  );
}
