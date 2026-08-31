// components/ui/type-on-text.tsx
"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

type TypeOnTextProps = {
  text: string;
  speed?: number; // higher = faster
  delay?: number; // seconds before the first character appears
  className?: string;
  start?: string; // trigger start, e.g. "top 80%"
  trigger?: "scroll" | "immediate" | "hover";
  hoverTargetRef?: RefObject<HTMLElement | null>;
};

// Shared cadence bands. Section layouts should generally move their trigger
// earlier before increasing these values; speed is reserved for tone.
export const TYPE_ON_SPEEDS = {
  standard: 1.2,
  deliberate: 2.7,
  quick: 3.4,
  rapid: 4,
} as const;

const LOADER_FLAG_ATTR = "data-loader-playing";
const LOADER_EVENT = "loader-playing-change";
const LOADER_SECTION_ID = "page-loader-section";

function parseStartThresholdPx(start: string): number {
  const match = start.match(/top\s+(\d{1,3})%/i);
  const pct = match ? Number(match[1]) : NaN;
  const clamped = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 80;
  return (clamped / 100) * window.innerHeight;
}

export default function TypeOnText({
  text,
  speed = TYPE_ON_SPEEDS.standard,
  delay = 0,
  className,
  start = "top 80%",
  trigger = "scroll",
  hoverTargetRef,
}: TypeOnTextProps) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const splitRef = useRef<SplitText | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const startedRef = useRef(false);

  const canStartNow = () => {
    if (typeof document === "undefined") return true;
    if (!document.documentElement.hasAttribute(LOADER_FLAG_ATTR)) return true;
    const el = wrapperRef.current;
    if (!el) return false;
    return !!el.closest?.(`#${LOADER_SECTION_ID}`);
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    startedRef.current = false;

    const cleanupSplit = () => {
      tweenRef.current?.kill();
      tweenRef.current = null;
      splitRef.current?.revert();
      splitRef.current = null;
    };

    cleanupSplit();

    el.textContent = text;

    const split = new SplitText(el, {
      type: "chars,words,lines",
      reduceWhiteSpace: false,
    });
    splitRef.current = split;

    const chars = (split.chars ?? []) as HTMLElement[];
    if (!chars.length) {
      cleanupSplit();
      return;
    }

    gsap.set(chars, { opacity: 0 });

    const staggerPerChar = Math.max(0.01, 0.04 / Math.max(0.1, speed));

    const startTyping = (restart = false) => {
      if (startedRef.current && !restart) return;
      if (!canStartNow()) return;

      tweenRef.current?.kill();
      if (restart) gsap.set(chars, { opacity: 0 });
      startedRef.current = true;
      tweenRef.current = gsap.to(chars, {
        opacity: 1,
        duration: 0,
        delay: Math.max(0, delay),
        ease: "none",
        stagger: staggerPerChar,
      });
    };

    let raf = 0;

    if (trigger === "immediate") {
      startTyping();

      const onLoaderChange = () => startTyping();
      window.addEventListener(LOADER_EVENT, onLoaderChange as any);

      return () => {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener(LOADER_EVENT, onLoaderChange as any);
        cleanupSplit();
      };
    }

    if (trigger === "hover") {
      const hoverTarget =
        hoverTargetRef?.current ??
        (el.closest?.('[data-typeon-hover="true"]') as HTMLElement | null) ??
        el;

      const show = () => startTyping(true);
      const hide = (event?: FocusEvent) => {
        if (
          event?.relatedTarget instanceof Node &&
          hoverTarget.contains(event.relatedTarget)
        ) {
          return;
        }

        tweenRef.current?.kill();
        tweenRef.current = null;
        startedRef.current = false;
        gsap.set(chars, { opacity: 0 });
      };

      hoverTarget.addEventListener("pointerenter", show);
      hoverTarget.addEventListener("pointerleave", hide);
      hoverTarget.addEventListener("focusin", show);
      hoverTarget.addEventListener("focusout", hide);

      return () => {
        hoverTarget.removeEventListener("pointerenter", show);
        hoverTarget.removeEventListener("pointerleave", hide);
        hoverTarget.removeEventListener("focusin", show);
        hoverTarget.removeEventListener("focusout", hide);
        cleanupSplit();
      };
    }

    const triggerEl =
      (el.closest?.('[data-typeon-trigger="true"]') as HTMLElement | null) ?? el;

    const check = () => {
      if (startedRef.current) return;
      const thresholdPx = parseStartThresholdPx(start);
      const rect = triggerEl.getBoundingClientRect();
      if (rect.top <= thresholdPx && rect.bottom >= 0) startTyping();
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        check();
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener(LOADER_EVENT, onScroll as any);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener(LOADER_EVENT, onScroll as any);
      cleanupSplit();
    };
  }, [delay, hoverTargetRef, text, speed, start, trigger]);

  return (
    <span
      ref={wrapperRef}
      className={cn("inline-block whitespace-pre-wrap", className)}
      aria-label={text}
    />
  );
}

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}
