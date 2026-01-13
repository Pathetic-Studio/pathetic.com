// components/ui/type-on-text.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const startedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  const segments = useMemo(() => text.split(/(\s+)/), [text]);
  const totalChars = useMemo(() => Array.from(text).length, [text]);

  const canStartNow = () => {
    if (typeof document === "undefined") return true;
    if (!document.documentElement.hasAttribute(LOADER_FLAG_ATTR)) return true;
    const el = wrapperRef.current;
    if (!el) return false;
    return !!el.closest?.(`#${LOADER_SECTION_ID}`);
  };

  useEffect(() => {
    startedRef.current = false;
    setStarted(false);
    setVisibleCount(0);
  }, [text, trigger, start]);

  useEffect(() => {
    if (trigger !== "immediate") return;
    let raf = 0;
    const tryStart = () => {
      if (startedRef.current) return;
      if (!canStartNow()) return;
      startedRef.current = true;
      setStarted(true);
    };

    raf = requestAnimationFrame(tryStart);

    const onLoaderChange = () => tryStart();
    window.addEventListener(LOADER_EVENT, onLoaderChange as any);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener(LOADER_EVENT, onLoaderChange as any);
    };
  }, [trigger, text]);

  useEffect(() => {
    if (trigger !== "scroll") return;
    const el = wrapperRef.current;
    if (!el) return;

    const triggerEl =
      (el.closest?.('[data-typeon-trigger="true"]') as HTMLElement | null) ?? el;

    let raf = 0;

    const startTyping = () => {
      if (startedRef.current) return;
      if (!canStartNow()) return;
      startedRef.current = true;
      setStarted(true);
    };

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
    };
  }, [trigger, start]);

  useEffect(() => {
    if (!started) return;
    if (visibleCount >= totalChars) return;

    const baseStepMs = 40;
    const stepMs = Math.max(12, baseStepMs / Math.max(0.1, speed));

    const id = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(totalChars, count + 1));
    }, stepMs);

    return () => window.clearTimeout(id);
  }, [started, visibleCount, totalChars, speed]);

  return (
    <span
      ref={wrapperRef}
      className={cn("inline-block whitespace-pre-wrap", className)}
      aria-label={text}
    >
      {(() => {
        let charIndex = 0;

        return segments.map((segment, segIndex) => {
          if (!segment) return null;

          const isWhitespace = /^\s+$/.test(segment);
          if (isWhitespace) {
            return (
              <span key={`ws-${segIndex}`}>
                {Array.from(segment).map((char, index) => {
                  const currentIndex = charIndex;
                  charIndex += 1;

                  return (
                    <span
                      key={`ws-${segIndex}-${index}`}
                      style={{ opacity: started && currentIndex < visibleCount ? 1 : 0 }}
                      aria-hidden="true"
                    >
                      {char}
                    </span>
                  );
                })}
              </span>
            );
          }

          return (
            <span key={`w-${segIndex}`} className="inline-block whitespace-nowrap">
              {Array.from(segment).map((char, index) => {
                const currentIndex = charIndex;
                charIndex += 1;

                return (
                  <span
                    key={`w-${segIndex}-${index}`}
                    className="inline-block"
                    style={{ opacity: started && currentIndex < visibleCount ? 1 : 0 }}
                    aria-hidden="true"
                  >
                    {char}
                  </span>
                );
              })}
            </span>
          );
        });
      })()}
    </span>
  );
}

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}
