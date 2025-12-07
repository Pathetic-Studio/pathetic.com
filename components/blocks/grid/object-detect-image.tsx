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
    !hasCustomWidth && !hasCustomHeight && "flex-1 min-h-[450px]",
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

  const useFillImage =
    (!hasCustomWidth && !hasCustomHeight) ||
    (hasCustomWidth && hasCustomHeight);

  const imageClassName = cn(
    "object-cover",
    hasCustomHeight && !hasCustomWidth && "h-full w-auto",
    hasCustomWidth && !hasCustomHeight && "h-auto w-full",
    hasCustomWidth && hasCustomHeight && "h-full w-full",
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
  const isVisibleRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      isMobileRef.current = window.innerWidth < 768;
    }
  }, []);

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
      isVisibleRef.current = true;
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
      isVisibleRef.current = false;
    }
  };

  // MOBILE: animate in when in view, animate out when out of view
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!bodyPlainText) return;

    const el = containerRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!isMobileRef.current) return;

          const overlay = bodyOverlayRef.current;
          if (!overlay || !bodyPlainText) return;

          if (entry.isIntersecting) {
            if (isVisibleRef.current) return;

            isVisibleRef.current = true;
            gsap.to(overlay, {
              scale: 1,
              autoAlpha: 1,
              duration: 0.25,
              ease: "power2.out",
            });
            runTypeAnimation("in");
          } else {
            if (!isVisibleRef.current) return;

            isVisibleRef.current = false;
            gsap.to(overlay, {
              scale: 0.8,
              autoAlpha: 0,
              duration: 0.2,
              ease: "power2.in",
            });
            runTypeAnimation("out");
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
                // narrower on mobile, capped
                "w-full max-w-xs sm:w-[60vw] sm:max-w-sm md:w-[50vw] md:max-w-md lg:w-auto",
              )}
            >
              <div className="px-3 py-2 invisible whitespace-pre-wrap">
                {bodyPlainText}
              </div>

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
