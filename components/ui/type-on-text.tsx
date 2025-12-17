// components/ui/type-on-text.tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

type TypeOnTextProps = {
  text: string;
  speed?: number; // higher = faster
  className?: string;
  start?: string; // ScrollTrigger start, e.g. "top 80%"
};

export default function TypeOnText({
  text,
  speed = 1,
  className,
  start = "top 80%",
}: TypeOnTextProps) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    el.textContent = text;

    const split = new SplitText(el, { type: "chars,words,lines" });
    const chars = split.chars || [];
    if (!chars.length) return;

    // Initial state: all chars invisible (including their stroke, since stroke is on these spans now)
    gsap.set(chars, { opacity: 0, willChange: "opacity" });

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start,
        once: true,
        onEnter: () => {
          const baseStagger = 0.04; // seconds between chars at speed=1
          const staggerPerChar = baseStagger / Math.max(0.1, speed);

          gsap.to(chars, {
            opacity: 1,
            duration: 0,
            stagger: staggerPerChar,
            ease: "none",
          });
        },
      });
    }, el);

    return () => {
      ctx.revert();
      split.revert();
    };
  }, [text, start, speed]);

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
