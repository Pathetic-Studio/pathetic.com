// components/ui/title-text.tsx
"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import TypeOnText, { TYPE_ON_SPEEDS } from "@/components/ui/type-on-text";

type TitleTextVariant = "normal" | "stretched";
type TitleTextAnimation = "none" | "typeOn";
type TitleTextWeight = "regular" | "medium" | "semibold" | "bold" | "black";
type TitleTextOutlinePosition = "center" | "outside";
type TitleTextSize =
  | "xxl"
  | "xl"
  | "lg"
  | "md"
  | "display"
  | "display-compact"
  | "what-we-do"
  | "matrix-eyebrow"
  | "matrix-accent"
  | "matrix-talent"
  | "matrix-matrix"
  | "network-eyebrow"
  | "network-lead"
  | "network-main"
  | "network-reach"
  | "network-friends"
  | "belief"
  | "contact-cta";

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

  // Outside strokes are painted behind the fill so they do not eat into it.
  outlinePosition?: TitleTextOutlinePosition;

  fontWeight?: TitleTextWeight;

  // Keep animated and non-animated titles on one line when the design requires it.
  singleLine?: boolean;

  // TypeOnText config (only used when animation="typeOn")
  typeOnStart?: string;
  typeOnTrigger?: "scroll" | "immediate";
  typeOnDelay?: number;
}

const BASE_TEXT_CLASSES = "leading-[1.1] uppercase mx-auto";

const WEIGHT_CLASSES: Record<TitleTextWeight, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  black: "font-black",
};

const SIZE_TEXT_CLASSES: Record<TitleTextSize, string> = {
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-6xl",
  xxl: "text-5xl lg:text-8xl",
  display: "text-[2rem] sm:text-[2.5rem] lg:text-[3.5rem]",
  "display-compact": "text-[1.65rem] sm:text-[2.4rem] lg:text-[2.9rem]",
  "what-we-do": "text-[clamp(3.25rem,6.6vw,7.2rem)] sm:text-[clamp(5.5rem,10vw,10.5rem)] lg:text-[clamp(3.25rem,6.6vw,7.2rem)]",
  "matrix-eyebrow": "text-[clamp(1.3rem,2vw,2.15rem)]",
  "matrix-accent": "text-[clamp(2.6rem,4vw,4.5rem)]",
  "matrix-talent": "text-[clamp(4.4rem,7.2vw,7.25rem)]",
  "matrix-matrix": "text-[clamp(5rem,8vw,8rem)]",
  "network-eyebrow": "text-[clamp(1.15rem,1.55vw,1.7rem)]",
  "network-lead": "text-[clamp(2.5rem,4.6vw,4.8rem)]",
  "network-main": "text-[clamp(5.5rem,10vw,10.5rem)]",
  "network-reach": "text-[2.1rem] sm:text-[3rem] lg:text-[4rem]",
  "network-friends": "text-[3rem] sm:text-[4.5rem] lg:text-[6.4rem]",
  belief: "text-[clamp(4.75rem,13.9vw,12.5rem)]",
  "contact-cta": "text-[clamp(4rem,11.8vw,11rem)]",
};

const SCALE_CONFIG: Record<
  TitleTextSize,
  Record<Breakpoint, { stretchScaleX: number; overallScale: number }>
> = {
  xxl: {
    mobile: { stretchScaleX: 0.55, overallScale: 1.5 },
    tablet: { stretchScaleX: 0.55, overallScale: 1.6 },
    desktop: { stretchScaleX: 0.55, overallScale: 2.1 },
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
  display: {
    mobile: { stretchScaleX: 0.68, overallScale: 1 },
    tablet: { stretchScaleX: 0.65, overallScale: 1.08 },
    desktop: { stretchScaleX: 0.62, overallScale: 1.15 },
  },
  "display-compact": {
    mobile: { stretchScaleX: 0.8, overallScale: 1 },
    tablet: { stretchScaleX: 0.8, overallScale: 1 },
    desktop: { stretchScaleX: 0.8, overallScale: 1 },
  },
  "what-we-do": {
    mobile: { stretchScaleX: 0.8, overallScale: 1 },
    tablet: { stretchScaleX: 0.8, overallScale: 1 },
    desktop: { stretchScaleX: 0.8, overallScale: 1 },
  },
  "matrix-eyebrow": {
    mobile: { stretchScaleX: 0.8, overallScale: 1 },
    tablet: { stretchScaleX: 0.8, overallScale: 1 },
    desktop: { stretchScaleX: 0.8, overallScale: 1 },
  },
  "matrix-accent": {
    mobile: { stretchScaleX: 0.8, overallScale: 1 },
    tablet: { stretchScaleX: 0.8, overallScale: 1 },
    desktop: { stretchScaleX: 0.8, overallScale: 1 },
  },
  "matrix-talent": {
    mobile: { stretchScaleX: 0.8, overallScale: 1 },
    tablet: { stretchScaleX: 0.8, overallScale: 1 },
    desktop: { stretchScaleX: 0.8, overallScale: 1 },
  },
  "matrix-matrix": {
    mobile: { stretchScaleX: 0.8, overallScale: 1 },
    tablet: { stretchScaleX: 0.8, overallScale: 1 },
    desktop: { stretchScaleX: 0.8, overallScale: 1 },
  },
  "network-eyebrow": {
    mobile: { stretchScaleX: 0.8, overallScale: 1 },
    tablet: { stretchScaleX: 0.8, overallScale: 1 },
    desktop: { stretchScaleX: 0.8, overallScale: 1 },
  },
  "network-lead": {
    mobile: { stretchScaleX: 0.8, overallScale: 1 },
    tablet: { stretchScaleX: 0.8, overallScale: 1 },
    desktop: { stretchScaleX: 0.8, overallScale: 1 },
  },
  "network-main": {
    mobile: { stretchScaleX: 0.78, overallScale: 1 },
    tablet: { stretchScaleX: 0.78, overallScale: 1 },
    desktop: { stretchScaleX: 0.78, overallScale: 1 },
  },
  "network-reach": {
    mobile: { stretchScaleX: 0.8, overallScale: 1 },
    tablet: { stretchScaleX: 0.8, overallScale: 1 },
    desktop: { stretchScaleX: 0.8, overallScale: 1 },
  },
  "network-friends": {
    mobile: { stretchScaleX: 0.8, overallScale: 1 },
    tablet: { stretchScaleX: 0.8, overallScale: 1 },
    desktop: { stretchScaleX: 0.8, overallScale: 1 },
  },
  belief: {
    mobile: { stretchScaleX: 0.68, overallScale: 1 },
    tablet: { stretchScaleX: 0.65, overallScale: 1 },
    desktop: { stretchScaleX: 0.62, overallScale: 1 },
  },
  "contact-cta": {
    mobile: { stretchScaleX: 0.76, overallScale: 1 },
    tablet: { stretchScaleX: 0.72, overallScale: 1 },
    desktop: { stretchScaleX: 0.68, overallScale: 1 },
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
  animationSpeed = TYPE_ON_SPEEDS.standard,
  className,
  size = "md",
  stretchScaleX,
  overallScale,
  align = "center",
  maxChars = 26,
  textOutline = false,
  textColor,
  outlineColor = "white",
  outlineWidth = 1.5,
  outlinePosition = "center",
  fontWeight = "bold",
  singleLine = false,
  typeOnStart,
  typeOnTrigger,
  typeOnDelay,
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
  const renderedOutlineWidth =
    outlinePosition === "outside" ? safeOutlineWidth * 2 : safeOutlineWidth;

  // CSS vars (avoid passing style into TypeOnText)
  const varsStyle: React.CSSProperties = {
    ...(textColor ? ({ ["--tt-fill" as any]: textColor } as React.CSSProperties) : {}),
    ...(textOutline ? ({ ["--tt-stroke" as any]: outlineColor } as React.CSSProperties) : {}),
    ...(textOutline
      ? ({
          ["--tt-stroke-w" as any]: `${renderedOutlineWidth}px`,
          paintOrder: outlinePosition === "outside" ? "stroke fill" : "normal",
        } as React.CSSProperties)
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
      delay={typeOnDelay}
      className={cn(
        fillClass,
        typeOnOutlineClasses,
        singleLine && "!whitespace-nowrap",
      )}
      start={typeOnStart}
      trigger={typeOnTrigger}
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
          WEIGHT_CLASSES[fontWeight],
          singleLine && "whitespace-nowrap",
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
          WEIGHT_CLASSES[fontWeight],
          singleLine && "whitespace-nowrap",
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
