// components/ui/type-on-text.tsx
"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
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
  enabled?: boolean;
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
  enabled = true,
  hoverTargetRef,
}: TypeOnTextProps) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const splitRef = useRef<SplitText | null>(null);
  const startedRef = useRef(false);

  const canStartNow = () => {
    if (typeof document === "undefined") return true;
    if (!document.documentElement.hasAttribute(LOADER_FLAG_ATTR)) return true;
    const el = wrapperRef.current;
    if (!el) return false;
    return !!el.closest?.(`#${LOADER_SECTION_ID}`);
  };

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    startedRef.current = false;
    let cancelled = false;
    let raf = 0;
    let startFrame = 0;
    let revealTick: ((time: number, deltaMs: number) => void) | null = null;
    let removeListeners = () => {};

    const cancelStart = () => {
      if (startFrame) cancelAnimationFrame(startFrame);
      startFrame = 0;
      if (revealTick) gsap.ticker.remove(revealTick);
      revealTick = null;
    };

    const cleanupSplit = () => {
      splitRef.current?.revert();
      splitRef.current = null;
    };

    el.style.visibility = "hidden";
    el.textContent = text;

    const prepare = () => {
      if (cancelled) return;
      const split = new SplitText(el, {
        // Words keep their normal wrapping on resize. Frozen line wrappers can
        // retain the wrong breaks after a font or viewport change.
        type: "chars,words",
        reduceWhiteSpace: false,
      });
      splitRef.current = split;

      const chars = (split.chars ?? []) as HTMLElement[];
      if (!chars.length) {
        cleanupSplit();
        return;
      }

      gsap.set(chars, { opacity: 0 });
      el.style.visibility = "inherit";

      const staggerPerChar = Math.max(0.01, 0.04 / Math.max(0.1, speed));

      const startTyping = (restart = false) => {
        if (startedRef.current && !restart) return;
        if (!canStartNow()) return;

        cancelStart();
        if (restart) gsap.set(chars, { opacity: 0 });
        startedRef.current = true;
        // Let the handoff paint before starting a fresh animation clock. Limit
        // catch-up after a slow frame so hydration cannot reveal a whole word
        // at once. At normal frame rates this keeps the existing cadence.
        startFrame = requestAnimationFrame(() => {
          startFrame = 0;
          let elapsed = -Math.max(0, delay);
          let revealed = 0;
          let firstTick = true;
          revealTick = (_time, deltaMs) => {
            if (cancelled) return;
            if (!firstTick) elapsed += Math.min(deltaMs / 1000, 1 / 30);
            firstTick = false;
            const count = Math.min(chars.length, Math.max(0, Math.floor(elapsed / staggerPerChar) + 1));
            while (revealed < count) chars[revealed++].style.opacity = "1";
            if (revealed === chars.length && revealTick) {
              gsap.ticker.remove(revealTick);
              revealTick = null;
            }
          };
          gsap.ticker.add(revealTick);
        });
      };

      if (trigger === "immediate") {
        startTyping();

        const onLoaderChange = () => startTyping();
        window.addEventListener(LOADER_EVENT, onLoaderChange as any);

        removeListeners = () => {
          window.removeEventListener(LOADER_EVENT, onLoaderChange as any);
        };
        return;
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

          cancelStart();
          startedRef.current = false;
          gsap.set(chars, { opacity: 0 });
        };

        hoverTarget.addEventListener("pointerenter", show);
        hoverTarget.addEventListener("pointerleave", hide);
        hoverTarget.addEventListener("focusin", show);
        hoverTarget.addEventListener("focusout", hide);

        if (hoverTarget.matches(":hover") || hoverTarget.contains(document.activeElement)) show();

        removeListeners = () => {
          hoverTarget.removeEventListener("pointerenter", show);
          hoverTarget.removeEventListener("pointerleave", hide);
          hoverTarget.removeEventListener("focusin", show);
          hoverTarget.removeEventListener("focusout", hide);
        };
        return;
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

      removeListeners = () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        window.removeEventListener(LOADER_EVENT, onScroll as any);
      };
    };

    if (enabled) {
      const style = getComputedStyle(el);
      const family = style.fontFamily.split(",")[0];
      const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${family}`;
      // Wait only for this face, not fonts belonging to lower-page scenes.
      // check() can report true once a swap fallback is usable, even while the
      // actual face is downloading; load() waits for the face itself.
      if (document.fonts) {
        document.fonts.load(font, text).then(prepare, prepare);
      } else {
        prepare();
      }
    }

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      cancelStart();
      removeListeners();
      el.style.visibility = "hidden";
      cleanupSplit();
    };
  }, [delay, enabled, hoverTargetRef, text, speed, start, trigger]);

  return (
    <span
      ref={wrapperRef}
      className={cn("inline-block whitespace-pre-wrap", className)}
      aria-label={text}
      style={{ visibility: "hidden" }}
    >
      {text}
    </span>
  );
}

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}
