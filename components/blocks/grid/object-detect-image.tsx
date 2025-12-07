// components/blocks/grid/object-detect-image.tsx
"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult } from "@/sanity.types";
import { cn } from "@/lib/utils";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRowImage = Extract<Block, { _type: "grid-row-image" }>;
type Item = NonNullable<NonNullable<GridRowImage["items"]>[number]>;
type ObjectDetectImageProps = Extract<Item, { _type: "object-detect-image" }>;

export default function ObjectDetectImage({
  title,
  body,
  image,
  link,
  accentColor,
  customWidth,
  customHeight,
}: ObjectDetectImageProps) {
  if (!image?.asset?._id) return null;

  const imageUrl = urlFor(image).url();
  const accent = accentColor || undefined;

  const hasCustomWidth = !!customWidth;
  const hasCustomHeight = !!customHeight;

  // IMAGE WRAPPER

  const wrapperClassName = cn(
    "relative overflow-hidden",
    // Default: no custom dimensions -> flex item with min height
    !hasCustomWidth && !hasCustomHeight && "flex-1 min-h-[450px]",
    // Custom height only -> shrink-to-fit box
    hasCustomHeight && !hasCustomWidth && "inline-block",
  );

  const wrapperStyle: CSSProperties = {
    ...(customWidth ? { width: customWidth } : {}),
    ...(customHeight ? { height: customHeight } : {}),
  };

  const fallbackWidth = 1600;
  const fallbackHeight = 900;

  const metaWidth =
    image.asset?.metadata?.dimensions?.width ?? fallbackWidth;
  const metaHeight =
    image.asset?.metadata?.dimensions?.height ?? fallbackHeight;

  // Only use fill when:
  // - no custom dimensions, OR
  // - both customWidth and customHeight given
  const useFillImage =
    (!hasCustomWidth && !hasCustomHeight) ||
    (hasCustomWidth && hasCustomHeight);

  const imageClassName = cn(
    "object-cover",
    // Custom height only: auto width from aspect ratio, fill height
    hasCustomHeight && !hasCustomWidth && "h-full w-auto",
    // Custom width only: full width, auto height
    hasCustomWidth && !hasCustomHeight && "h-auto w-full",
    // Both: fill wrapper
    hasCustomWidth && hasCustomHeight && "h-full w-full",
    // None: normal responsive full width
    !hasCustomWidth && !hasCustomHeight && "h-auto w-full",
  );

  // PLAIN TEXT FOR BODY

  const bodyPlainText = useMemo(() => {
    if (!body) return "";
    try {
      const blocks = body as any[];
      return blocks
        .map((block) => {
          if (!block?.children) return "";
          return block.children
            .map((child: any) => child?.text || "")
            .join("");
        })
        .filter(Boolean)
        .join("\n\n");
    } catch {
      return "";
    }
  }, [body]);

  // HOVER / TYPE ANIM + MOBILE IN-VIEW ANIM

  const bodyOverlayRef = useRef<HTMLDivElement | null>(null);
  const bodyTextRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const progressRef = useRef<{ p: number }>({ p: 0 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const isMobileRef = useRef(false);
  const hasAnimatedInRef = useRef(false);

  // Detect mobile once on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      isMobileRef.current = window.innerWidth < 768;
    }
  }, []);

  // Initial overlay state
  useEffect(() => {
    const overlay = bodyOverlayRef.current;
    if (!overlay) return;

    gsap.set(overlay, {
      scale: 0.8,
      autoAlpha: 0,
      transformOrigin: "0% 0%",
    });
  }, []);

  const runTypeAnimation = (direction: "in" | "out") => {
    const textEl = bodyTextRef.current;
    if (!textEl || !bodyPlainText) return;

    tweenRef.current?.kill();

    const fullText = bodyPlainText;
    const length = fullText.length;
    const duration = Math.max(0.4, Math.min(2.5, length / 25));

    if (direction === "in") {
      progressRef.current.p = 0;
      textEl.textContent = "";

      tweenRef.current = gsap.to(progressRef.current, {
        p: 1,
        duration,
        ease: "none",
        onUpdate: () => {
          const l = Math.round(progressRef.current.p * length);
          textEl.textContent = fullText.slice(0, l);
        },
      });
    } else {
      progressRef.current.p = 1;

      tweenRef.current = gsap.to(progressRef.current, {
        p: 0,
        duration,
        ease: "none",
        onUpdate: () => {
          const l = Math.round(progressRef.current.p * length);
          textEl.textContent = fullText.slice(0, l);
        },
      });
    }
  };

  const handleMouseEnter = () => {
    // No hover behaviour on mobile; mobile uses in-view animation instead
    if (isMobileRef.current) return;

    const overlay = bodyOverlayRef.current;
    if (overlay && bodyPlainText) {
      gsap.to(overlay, {
        scale: 1,
        autoAlpha: 1,
        duration: 0.25,
        ease: "power2.out",
      });
      runTypeAnimation("in");
    }
  };

  const handleMouseLeave = () => {
    if (isMobileRef.current) return;

    const overlay = bodyOverlayRef.current;
    if (overlay && bodyPlainText) {
      gsap.to(overlay, {
        scale: 0.8,
        autoAlpha: 0,
        duration: 0.2,
        ease: "power2.in",
      });
      runTypeAnimation("out");
    }
  };

  // MOBILE: animate in when in view
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!bodyPlainText) return;

    const el = containerRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            isMobileRef.current &&
            !hasAnimatedInRef.current
          ) {
            hasAnimatedInRef.current = true;
            const overlay = bodyOverlayRef.current;
            if (overlay) {
              gsap.to(overlay, {
                scale: 1,
                autoAlpha: 1,
                duration: 0.25,
                ease: "power2.out",
              });
            }
            runTypeAnimation("in");
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.4,
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [bodyPlainText]);

  return (
    <div className="flex h-full" ref={containerRef}>
      {/* Interactive column: only this area (image + title + body + link) triggers hover on desktop */}
      <div
        className="inline-flex flex-col items-start"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image */}
        <div className={wrapperClassName} style={wrapperStyle}>
          {useFillImage ? (
            <Image
              src={imageUrl}
              alt={image.alt || ""}
              fill
              sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
              className={imageClassName}
              quality={100}
            />
          ) : (
            <Image
              src={imageUrl}
              alt={image.alt || ""}
              width={metaWidth}
              height={metaHeight}
              className={imageClassName}
              quality={100}
            />
          )}

          <div
            className="pointer-events-none absolute inset-0 border-2"
            style={accent ? { borderColor: accent } : undefined}
          />
        </div>

        {/* Title + body */}
        <div className="-mt-[2px] flex flex-col items-start max-w-full">
          {title && (
            <div
              className="inline-flex px-3 py-1 text-base font-semibold uppercase tracking-tight"
              style={
                accent
                  ? {
                    backgroundColor: accent,
                    color: "#000",
                  }
                  : undefined
              }
            >
              <span>{title}</span>
            </div>
          )}

          {body && bodyPlainText && (
            <div
              className={cn(
                "relative inline-block text-sm leading-relaxed",
                // Narrower body box on mobile; fall back to auto on large
                "w-[80vw] max-w-xs sm:max-w-sm md:max-w-md lg:w-auto",
              )}
            >
              {/* Ghost: reserves space, invisible but in flow */}
              <div className="px-3 py-2 invisible whitespace-pre-wrap">
                {bodyPlainText}
              </div>

              {/* Animated overlay: bg = accent, text inside box */}
              <div
                ref={bodyOverlayRef}
                className="pointer-events-none absolute inset-0 px-3 py-2 whitespace-pre-wrap"
                style={
                  accent
                    ? {
                      backgroundColor: accent,
                      color: "#000",
                    }
                    : undefined
                }
              >
                <span ref={bodyTextRef} />
              </div>
            </div>
          )}

          {link && link.href && (
            <div className="mt-2 pt-1">
              <Link
                href={link.href}
                target={link.target ? "_blank" : undefined}
                rel={link.target ? "noopener" : undefined}
                className="inline-flex items-center text-sm font-medium uppercase tracking-tight underline-offset-4 hover:underline"
              >
                {link.title || "Learn more"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
