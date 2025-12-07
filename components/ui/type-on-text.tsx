// components/ui/type-on-text.tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type TypeOnTextProps = {
  text: string;
  className?: string;
  speed?: number; // seconds for full string
  start?: string; // ScrollTrigger start, e.g. "top 80%"
};

export default function TypeOnText({
  text,
  className,
  speed = 1.2,
  start = "top 80%",
}: TypeOnTextProps) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const animatedRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const wrapperEl = wrapperRef.current;
    const animatedEl = animatedRef.current;
    if (!wrapperEl || !animatedEl) return;

    const fullText = text;
    animatedEl.textContent = ""; // start empty

    const progressObj = { p: 0 };

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrapperEl,
        start,
        once: true,
        onEnter: () => {
          gsap.to(progressObj, {
            p: 1,
            duration: speed,
            ease: "none",
            onUpdate: () => {
              const length = Math.round(progressObj.p * fullText.length);
              animatedEl.textContent = fullText.slice(0, length);
            },
          });
        },
      });
    }, wrapperEl);

    return () => {
      ctx.revert();
    };
  }, [text, speed, start]);

  const combinedClassName = ["relative inline-block", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      ref={wrapperRef}
      className={combinedClassName}
      aria-label={text}
    >
      {/* Ghost text: locks layout, never visible */}
      <span
        aria-hidden="true"
        className="whitespace-pre-wrap text-transparent"
      >
        {text}
      </span>

      {/* Animated text: visible, absolutely positioned on top */}
      <span
        ref={animatedRef}
        className="absolute inset-0 whitespace-pre-wrap"
      />
    </span>
  );
}
