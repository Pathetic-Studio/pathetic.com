// components/ui/title-text.tsx
"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import TypeOnText from "@/components/ui/type-on-text";

type TitleTextVariant = "normal" | "stretched";
type TitleTextAnimation = "none" | "typeOn";

interface TitleTextProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "p";
  variant?: TitleTextVariant;
  animation?: TitleTextAnimation;
  animationSpeed?: number;
  className?: string;
  stretchScaleX?: number; // horizontal squish
  overallScale?: number; // overall scale
  align?: "left" | "center";
  maxChars?: number; // max-w-[Nch]
}

export default function TitleText({
  children,
  as = "h2",
  variant = "normal",
  animation = "none",
  animationSpeed = 1.2,
  className,
  stretchScaleX = 0.6,
  overallScale = 1.2,
  align = "center",
  maxChars = 26,
}: TitleTextProps) {
  const Tag = as;
  const ref = useRef<HTMLHeadingElement | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  const isStretched = variant === "stretched";
  const isTypeOn = animation === "typeOn";

  // Measure natural height when stretched so the wrapper can reserve correct space
  useLayoutEffect(() => {
    if (!isStretched) return;
    const el = ref.current;
    if (!el) return;

    const prevTransform = el.style.transform;
    el.style.transform = "none";

    const rect = el.getBoundingClientRect();

    el.style.transform = prevTransform;

    if (rect.height > 0) {
      setMeasuredHeight(rect.height * overallScale);
    }
  }, [children, isStretched, overallScale]);

  const baseTextClasses =
    "font-bold leading-[1.1] uppercase mx-auto";
  const alignClasses = align === "center" ? "text-center" : "text-left";
  const maxWidthClass = `max-w-[${maxChars}ch]`;

  // NORMAL MODE (no stretched wrapper)
  if (!isStretched) {
    return (
      <Tag
        className={cn(
          baseTextClasses,
          alignClasses,
          maxWidthClass,
          "mt-6 md:text-4xl lg:text-8xl",
          className,
        )}
      >
        {isTypeOn ? (
          <TypeOnText
            text={typeof children === "string" ? children : String(children)}
            speed={animationSpeed}
          />
        ) : (
          children
        )}
      </Tag>
    );
  }

  // STRETCHED MODE (scaled container with reserved height)
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
        ref={ref}
        className={cn(
          baseTextClasses,
          alignClasses,
          maxWidthClass,
          "md:text-4xl lg:text-8xl",
          "origin-top",
          "will-change-transform",
        )}
        style={{
          transform: `scale(${overallScale}) scaleX(${stretchScaleX})`,
        }}
      >
        {isTypeOn ? (
          <TypeOnText
            text={typeof children === "string" ? children : String(children)}
            speed={animationSpeed}
          />
        ) : (
          children
        )}
      </Tag>
    </div>
  );
}
