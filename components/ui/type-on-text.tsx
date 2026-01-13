// components/ui/type-on-text.tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

type TypeOnTextProps = {
  text: string;
  speed?: number; // higher = faster
  className?: string;
  start?: string; // trigger start, e.g. "top 80%"
  trigger?: "scroll" | "immediate";
};

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
  speed = 1,
  className,
  start = "top 80%",
  trigger = "scroll",
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

    const startTyping = () => {
      if (startedRef.current) return;
      if (!canStartNow()) return;
      startedRef.current = true;
      tweenRef.current = gsap.to(chars, {
        opacity: 1,
        duration: 0,
        ease: "none",
        stagger: staggerPerChar,
      });
    };

    let raf = 0;

    if (trigger === "immediate") {
      raf = requestAnimationFrame(startTyping);

      const onLoaderChange = () => startTyping();
      window.addEventListener(LOADER_EVENT, onLoaderChange as any);

      return () => {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener(LOADER_EVENT, onLoaderChange as any);
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
  }, [text, speed, start, trigger]);

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
