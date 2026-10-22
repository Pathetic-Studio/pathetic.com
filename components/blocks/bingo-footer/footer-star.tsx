"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MEME_STAR_COLOURS } from "@/lib/feature-cannon";
import styles from "./bingo-footer.module.css";

export default function FooterStar() {
  const face = useRef<HTMLSpanElement>(null);
  const queue = useRef(0);
  const busy = useRef(false);
  const colourIndex = useRef(-1);
  const angle = useRef(0);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const [colour, setColour] = useState<string>();
  useEffect(() => () => { queue.current = 0; timeline.current?.kill(); }, []);
  const next = () => {
    if (busy.current || !queue.current || !face.current) return;
    queue.current--;
    const changeColour = () => {
      colourIndex.current = (colourIndex.current + 1) % MEME_STAR_COLOURS.length;
      const nextColour = MEME_STAR_COLOURS[colourIndex.current];
      if (face.current) face.current.style.color = nextColour;
      setColour(nextColour);
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { changeColour(); queue.current = 0; return; }
    busy.current = true;
    const start = angle.current;
    angle.current += 180;
    timeline.current = gsap.timeline({ onComplete: () => { busy.current = false; next(); } })
      .to(face.current, { rotationY: start + 90, duration: 0.22, ease: "power1.in" })
      .call(changeColour)
      .to(face.current, { rotationY: start + 180, duration: 0.3, ease: "power2.out" });
  };
  return (
    <button type="button" data-footer-star aria-label="Flip star and change colour" className={`${styles.control} ${styles.starControl}`}
      onClick={() => { queue.current++; next(); }}>
      <span ref={face} aria-hidden="true" style={{ color: colour }} className="inline-block text-[clamp(2.2rem,5vw,4.7rem)] leading-none">★</span>
    </button>
  );
}
