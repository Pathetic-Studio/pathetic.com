// components/ui/portable-title-text.tsx
"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { PortableText, type PortableTextProps } from "@portabletext/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Align = "left" | "center";
type Mode = "fit" | "wrap";
type Preset = "title" | "body";

export function hasPortableTextValue(
  value: PortableTextProps["value"] | null | undefined,
) {
  if (!Array.isArray(value)) return false;

  return value.some((block: any) => {
    if (!block) return false;

    if (block._type === "block") {
      const kids = Array.isArray(block.children) ? block.children : [];
      return kids.some((ch: any) => (ch?.text ?? "").trim().length > 0);
    }

    return true;
  });
}

interface PortableTitleTextProps {
  value: PortableTextProps["value"];
  className?: string;

  align?: Align;

  /**
   * "fit": single-line per block, squish more if needed to stay inside container.
   * "wrap": allow wrapping. Still squishes, but keeps layout width correct.
   */
  mode?: Mode;

  preset?: Preset;

  baseSquishX?: number;
  minSquishX?: number;
  fitPaddingPx?: number;

  uppercase?: boolean;
}

const PRESETS: Record<
  Preset,
  {
    base: string;
    sizes: Record<"h1" | "h2" | "h3" | "h4" | "h5" | "p", string>;
  }
> = {
  title: {
    base: "font-bold leading-[1.05] m-0",
    sizes: {
      h1: "text-6xl md:text-7xl",
      h2: "text-5xl md:text-5xl",
      h3: "text-3xl md:text-3xl",
      h4: "text-lg md:text-xl",
      h5: "text-base md:text-lg",
      p: "text-2xl md:text-3xl",
    },
  },
  body: {
    base: "font-semibold leading-[1.2] m-0",
    sizes: {
      h1: "text-2xl md:text-3xl",
      h2: "text-xl md:text-2xl",
      h3: "text-lg md:text-xl",
      h4: "text-base md:text-lg",
      h5: "text-sm md:text-base",
      p: "text-sm md:text-base",
    },
  },
};

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

function nearlyEqual(a: number | null, b: number | null, eps = 0.5) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= eps;
}

function SquishText({
  as: Tag,
  align = "center",
  mode = "fit",
  baseSquishX = 0.65,
  minSquishX = 0.45,
  fitPaddingPx = 0,
  className,
  children,
}: {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "p";
  align?: Align;
  mode?: Mode;
  baseSquishX?: number;
  minSquishX?: number;
  fitPaddingPx?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scaledRef = useRef<HTMLSpanElement | null>(null);

  const [layoutWidth, setLayoutWidth] = useState<number | null>(null);
  const [scaleX, setScaleX] = useState<number>(baseSquishX);

  const lastRef = useRef<{ w: number | null; sx: number }>({
    w: null,
    sx: baseSquishX,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const scaled = scaledRef.current;
    if (!container || !scaled) return;

    const safeBase = clamp(baseSquishX, 0.1, 1);
    const safeMin = clamp(minSquishX, 0.1, safeBase);

    let raf = 0;

    const apply = (nextW: number | null, nextSX: number) => {
      const prev = lastRef.current;
      if (!nearlyEqual(prev.w, nextW) || !nearlyEqual(prev.sx, nextSX, 0.01)) {
        lastRef.current = { w: nextW, sx: nextSX };
        setLayoutWidth(nextW);
        setScaleX(nextSX);
      }
    };

    // Prevent last glyph clipping (subpixel/AA)
    const BUFFER_PX = 6;

    const measure = () => {
      const containerW = container.getBoundingClientRect().width;
      if (!containerW || containerW < 8) {
        apply(null, safeBase);
        return;
      }

      const maxW = Math.max(0, containerW - fitPaddingPx * 2);
      if (maxW < 8) {
        apply(null, safeBase);
        return;
      }

      if (mode === "wrap") {
        apply(Math.ceil(maxW), safeBase);
        return;
      }

      // FIT mode: stable width (ignores transforms)
      const naturalW = scaled.scrollWidth;
      if (!naturalW || naturalW < 8) {
        apply(null, safeBase);
        return;
      }

      const fitMaxW = Math.max(0, maxW - BUFFER_PX);

      const neededScale = fitMaxW / naturalW;
      const effectiveScale = clamp(
        Math.min(safeBase, neededScale),
        safeMin,
        safeBase,
      );

      const effectiveW = Math.ceil(naturalW * effectiveScale);
      const finalW = Math.min(maxW, effectiveW + BUFFER_PX + 1);

      apply(finalW >= 8 ? finalW : null, effectiveScale);
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measure();
    schedule();
    (document as any).fonts?.ready?.then?.(schedule);

    // Observe container ONLY (prevents feedback loops)
    const ro = new ResizeObserver(schedule);
    ro.observe(container);

    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [children, mode, baseSquishX, minSquishX, fitPaddingPx]);

  const isWrap = mode === "wrap";

  const outerJustify = align === "center" ? "justify-center" : "justify-start";
  const innerJustify = align === "center" ? "justify-center" : "justify-start";
  const textAlignClass = align === "center" ? "text-center" : "text-left";
  const originClass = align === "center" ? "origin-center" : "origin-left";

  // Wrap mode: widen the pre-squish layout so wrapping happens BEFORE squish
  const wrapInnerWidth =
    isWrap && layoutWidth != null && scaleX > 0.0001 ? layoutWidth / scaleX : null;

  return (
    <div ref={containerRef} className={cn("w-full flex", outerJustify)}>
      <span
        // Wrap needs clipping because inner is intentionally wider pre-squish.
        // Fit should NOT clip (avoids last-glyph cut-off).
        className={cn("block", isWrap ? "overflow-hidden" : "overflow-visible")}
        style={{ width: layoutWidth != null ? `${layoutWidth}px` : undefined }}
      >
        <Tag
          className={cn(
            "w-full",
            isWrap ? "block" : cn("flex", innerJustify),
            isWrap ? textAlignClass : "",
            className,
          )}
        >
          <span
            ref={scaledRef}
            className={cn(
              // Wrap: make it block so width applies cleanly for wrapping.
              // Fit: inline-block so it sizes to content.
              isWrap ? "block" : "inline-block",
              originClass,
              !isWrap && "whitespace-nowrap",
              // Make sure text stays visually centered when squished
              isWrap ? textAlignClass : "",
            )}
            style={{
              width: wrapInnerWidth != null ? `${wrapInnerWidth}px` : undefined,
              transform: `scaleX(${scaleX})`,
            }}
          >
            {children}
          </span>
        </Tag>
      </span>
    </div>
  );
}

export default function PortableTitleText({
  value,
  className,
  align = "center",
  mode = "fit",
  preset = "title",
  baseSquishX = preset === "title" ? 0.65 : 0.85,
  minSquishX = preset === "title" ? 0.45 : 0.65,
  fitPaddingPx = 0,
  uppercase,
}: PortableTitleTextProps) {
  const presetCfg = PRESETS[preset];
  const shouldUppercase = uppercase ?? preset === "title";
  const uppercaseClass = shouldUppercase ? "uppercase" : "";

  const components: PortableTextProps["components"] = useMemo(
    () => ({
      block: {
        normal: ({ children }) => (
          <div className="mb-2 last:mb-0">
            <SquishText
              as="p"
              align={align}
              mode={mode}
              baseSquishX={baseSquishX}
              minSquishX={minSquishX}
              fitPaddingPx={fitPaddingPx}
              className={cn(presetCfg.base, presetCfg.sizes.p, uppercaseClass)}
            >
              {children}
            </SquishText>
          </div>
        ),
        h1: ({ children }) => (
          <div className="mb-2 last:mb-0">
            <SquishText
              as="h1"
              align={align}
              mode={mode}
              baseSquishX={baseSquishX}
              minSquishX={minSquishX}
              fitPaddingPx={fitPaddingPx}
              className={cn(presetCfg.base, presetCfg.sizes.h1, uppercaseClass)}
            >
              {children}
            </SquishText>
          </div>
        ),
        h2: ({ children }) => (
          <div className="mb-2 last:mb-0">
            <SquishText
              as="h2"
              align={align}
              mode={mode}
              baseSquishX={baseSquishX}
              minSquishX={minSquishX}
              fitPaddingPx={fitPaddingPx}
              className={cn(presetCfg.base, presetCfg.sizes.h2, uppercaseClass)}
            >
              {children}
            </SquishText>
          </div>
        ),
        h3: ({ children }) => (
          <div className="mb-2 last:mb-0">
            <SquishText
              as="h3"
              align={align}
              mode={mode}
              baseSquishX={baseSquishX}
              minSquishX={minSquishX}
              fitPaddingPx={fitPaddingPx}
              className={cn(presetCfg.base, presetCfg.sizes.h3, uppercaseClass)}
            >
              {children}
            </SquishText>
          </div>
        ),
        h4: ({ children }) => (
          <div className="mb-2 last:mb-0">
            <SquishText
              as="h4"
              align={align}
              mode={mode}
              baseSquishX={baseSquishX}
              minSquishX={minSquishX}
              fitPaddingPx={fitPaddingPx}
              className={cn(presetCfg.base, presetCfg.sizes.h4, uppercaseClass)}
            >
              {children}
            </SquishText>
          </div>
        ),
        h5: ({ children }) => (
          <div className="mb-2 last:mb-0">
            <SquishText
              as="h5"
              align={align}
              mode={mode}
              baseSquishX={baseSquishX}
              minSquishX={minSquishX}
              fitPaddingPx={fitPaddingPx}
              className={cn(presetCfg.base, presetCfg.sizes.h5, uppercaseClass)}
            >
              {children}
            </SquishText>
          </div>
        ),
      },
      marks: {
        link: ({ value, children }) => {
          const href = value?.href || "#";
          const isExternal =
            href.startsWith("http") ||
            href.startsWith("https") ||
            href.startsWith("mailto");

          if (isExternal) {
            return (
              <a href={href} target="_blank" rel="noopener" className="underline">
                {children}
              </a>
            );
          }

          return (
            <Link href={href} className="underline">
              {children}
            </Link>
          );
        },
      },
    }),
    [
      align,
      mode,
      baseSquishX,
      minSquishX,
      fitPaddingPx,
      presetCfg.base,
      presetCfg.sizes,
      uppercaseClass,
    ],
  );

  return (
    <div className={cn("w-full", className)}>
      <PortableText value={value} components={components} />
    </div>
  );
}
