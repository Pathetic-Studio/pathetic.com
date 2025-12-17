// components/ui/title-text.tsx
"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import TypeOnText from "@/components/ui/type-on-text";

type TitleTextVariant = "normal" | "stretched";
type TitleTextAnimation = "none" | "typeOn";
type TitleTextSize = "xxl" | "xl" | "lg" | "md";

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

  // Outline toggle
  textOutline?: boolean;

  // Custom colors
  textColor?: string;
  outlineColor?: string;

  // Outline thickness (px)
  outlineWidth?: number;
}

const BASE_TEXT_CLASSES = "font-bold leading-[1.1] uppercase mx-auto";

const SIZE_TEXT_CLASSES: Record<TitleTextSize, string> = {
  md: "text-3xl",
  lg: "text-5xl",
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
  lg: {
    mobile: { stretchScaleX: 0.55, overallScale: 1.5 },
    tablet: { stretchScaleX: 0.55, overallScale: 1.5 },
    desktop: { stretchScaleX: 0.55, overallScale: 1.5 },
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
  textColor,
  outlineColor = "white",
  outlineWidth = 1,
}: TitleTextProps) {
  const Tag = as;

  const scaledInnerRef = useRef<HTMLSpanElement | null>(null);

  const [breakpoint, setBreakpoint] = useState<Breakpoint | null>(null);
  const [baseHeight, setBaseHeight] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(variant !== "stretched");

  const isStretched = variant === "stretched";
  const isTypeOn = animation === "typeOn";

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const measureBreakpoint = () => setBreakpoint(getBreakpoint(window.innerWidth));
    measureBreakpoint();

    window.addEventListener("resize", measureBreakpoint);
    return () => window.removeEventListener("resize", measureBreakpoint);
  }, []);

  const resolvedBreakpoint: Breakpoint = breakpoint ?? "desktop";
  const preset = SCALE_CONFIG[size][resolvedBreakpoint];

  const effectiveStretchScaleX = stretchScaleX ?? preset.stretchScaleX;
  const effectiveOverallScale = overallScale ?? preset.overallScale;

  useLayoutEffect(() => {
    if (!isStretched) {
      setBaseHeight(null);
      setIsReady(true);
      return;
    }

    if (typeof window === "undefined") return;
    const el = scaledInnerRef.current;
    if (!el) return;

    const measure = () => {
      const prevTransform = el.style.transform;
      el.style.transform = "none";

      const h = el.offsetHeight;

      el.style.transform = prevTransform;

      if (h > 0) setBaseHeight(h);
    };

    measure();
    requestAnimationFrame(measure);

    (document as any).fonts?.ready?.then?.(measure);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(el);
    }

    setIsReady(true);

    return () => resizeObserver?.disconnect();
  }, [isStretched, children, size, resolvedBreakpoint, effectiveOverallScale]);

  const measuredHeight =
    isStretched && baseHeight != null ? baseHeight * effectiveOverallScale : null;

  const alignClass = align === "center" ? "text-center" : "text-left";

  const inlineMaxWidthStyle: React.CSSProperties = maxChars
    ? { maxWidth: `${maxChars}ch` }
    : {};

  const safeOutlineWidth = Math.max(0, outlineWidth);

  // CSS vars (avoid passing style into TypeOnText)
  const varsStyle: React.CSSProperties = {
    ...(textColor ? ({ ["--tt-fill" as any]: textColor } as React.CSSProperties) : {}),
    ...(textOutline ? ({ ["--tt-stroke" as any]: outlineColor } as React.CSSProperties) : {}),
    ...(textOutline
      ? ({ ["--tt-stroke-w" as any]: `${safeOutlineWidth}px` } as React.CSSProperties)
      : {}),
  };

  const fillClass = textColor ? "text-[var(--tt-fill)]" : "";

  const outlineClasses = textOutline
    ? "[-webkit-text-stroke-width:var(--tt-stroke-w)] [-webkit-text-stroke-color:var(--tt-stroke)]"
    : "";

  const tagOutlineClasses = !isTypeOn ? outlineClasses : "";
  const typeOnOutlineClasses = isTypeOn ? outlineClasses : "";

  const content = isTypeOn ? (
    <TypeOnText
      text={String(children)}
      speed={animationSpeed}
      className={cn(fillClass, typeOnOutlineClasses)}
    />
  ) : (
    children
  );

  if (!isStretched) {
    return (
      <Tag
        className={cn(
          BASE_TEXT_CLASSES,
          SIZE_TEXT_CLASSES[size],
          alignClass,
          fillClass,
          tagOutlineClasses,
          className,
        )}
        style={{ ...inlineMaxWidthStyle, ...varsStyle }}
      >
        {content}
      </Tag>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full flex",
        align === "center" ? "justify-center" : "justify-start",
        className,
      )}
      style={{
        ...(measuredHeight != null ? { height: `${measuredHeight}px` } : {}),
        opacity: isReady ? 1 : 0,
        transition: "opacity 150ms ease-out",
      }}
    >
      <Tag
        className={cn(
          BASE_TEXT_CLASSES,
          SIZE_TEXT_CLASSES[size],
          alignClass,
          fillClass,
          tagOutlineClasses,
        )}
        style={{ ...inlineMaxWidthStyle, ...varsStyle }}
      >
        <span
          ref={scaledInnerRef}
          className="inline-block origin-top will-change-transform"
          style={
            breakpoint
              ? {
                ...varsStyle,
                transform: `scaleX(${effectiveStretchScaleX}) scale(${effectiveOverallScale})`,
              }
              : varsStyle
          }
        >
          {content}
        </span>
      </Tag>
    </div>
  );
}
