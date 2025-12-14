// components/ui/title-text.tsx
"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import TypeOnText from "@/components/ui/type-on-text";

type TitleTextVariant = "normal" | "stretched";
type TitleTextAnimation = "none" | "typeOn";
type TitleTextSize = "xxl" | "xl" | "md";

type Breakpoint = "mobile" | "tablet" | "desktop";

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

  // New: outline toggle
  textOutline?: boolean;
}

const BASE_TEXT_CLASSES =
  "font-bold leading-[1.1] uppercase mx-auto";

const SIZE_TEXT_CLASSES: Record<TitleTextSize, string> = {
  md: "text-3xl",
  xl: "text-6xl",
  xxl: "text-5xl lg:text-8xl",
};

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

function getBreakpoint(width: number): Breakpoint {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

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
  textOutline = false,
}: TitleTextProps) {
  const Tag = as;

  const scaledInnerRef = useRef<HTMLSpanElement | null>(null);

  // Breakpoint starts as null so we don't assume desktop on SSR.
  const [breakpoint, setBreakpoint] = useState<Breakpoint | null>(null);

  // Natural, unscaled height of the text (layout height)
  const [baseHeight, setBaseHeight] = useState<number | null>(null);

  const isStretched = variant === "stretched";
  const isTypeOn = animation === "typeOn";

  // Detect breakpoint on the client and keep it in sync with resize.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const measureBreakpoint = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    measureBreakpoint();
    window.addEventListener("resize", measureBreakpoint);

    return () => {
      window.removeEventListener("resize", measureBreakpoint);
    };
  }, []);

  // If we don't know the breakpoint yet, fall back to a neutral scale
  const resolvedBreakpoint: Breakpoint = breakpoint ?? "desktop";

  const preset = SCALE_CONFIG[size][resolvedBreakpoint];

  const effectiveStretchScaleX = stretchScaleX ?? preset.stretchScaleX;
  const effectiveOverallScale = overallScale ?? preset.overallScale;

  // Measure the *unscaled* height and then multiply by the vertical scale.
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
        measure();
      });
      resizeObserver.observe(el);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
    // Re-measure when breakpoint or size/scale changes
  }, [isStretched, children, size, resolvedBreakpoint, effectiveOverallScale]);

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

  const outlineClasses = textOutline
    ? " text-black [-webkit-text-stroke-width:1px] [-webkit-text-stroke-color:white]"
    : "";

  // NORMAL MODE (no stretch transforms)
  if (!isStretched) {
    return (
      <Tag
        className={cn(
          BASE_TEXT_CLASSES,
          SIZE_TEXT_CLASSES[size],
          alignClass,
          "mt-6",
          outlineClasses,
          className,
        )}
        style={inlineMaxWidthStyle}
      >
        {content}
      </Tag>
    );
  }

  // STRETCHED MODE
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
          outlineClasses,
        )}
        style={inlineMaxWidthStyle}
      >
        <span
          ref={scaledInnerRef}
          className="inline-block origin-top will-change-transform"
          style={
            breakpoint
              ? {
                transform: `scaleX(${effectiveStretchScaleX}) scale(${effectiveOverallScale})`,
              }
              : undefined
          }
        >
          {content}
        </span>
      </Tag>
    </div>
  );
}
