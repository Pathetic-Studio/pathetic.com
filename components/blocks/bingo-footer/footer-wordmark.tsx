"use client";

import { useLayoutEffect, useRef, useState } from "react";
import LogoAnimated from "@/components/logo-animated";
import styles from "./bingo-footer.module.css";

type Letter = { path: string; x: number; width: number };
const WIDTH = 1575.44;
const HEIGHT = 664.54;

export default function FooterWordmark() {
  const source = useRef<HTMLDivElement>(null);
  const animations = useRef(new Map<HTMLElement, Animation>());
  const [letters, setLetters] = useState<Letter[]>([]);
  useLayoutEffect(() => {
    const paths = source.current?.querySelectorAll<SVGPathElement>("path");
    if (paths) setLetters(Array.from(paths, (path) => {
      const box = path.getBBox();
      return { path: path.getAttribute("d") || "", x: box.x, width: box.width };
    }));
    const active = animations.current;
    return () => { active.forEach((animation) => animation.cancel()); active.clear(); };
  }, []);
  const flip = (button: HTMLButtonElement) => {
    const face = button.firstElementChild as HTMLElement;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || animations.current.has(face)) return;
    const axis = Math.random() < 0.5 ? "X" : "Y";
    const direction = Math.random() < 0.5 ? -1 : 1;
    const animation = face.animate([
      { transform: `rotate${axis}(0deg)` },
      { transform: `rotate${axis}(${direction * 360}deg)` },
    ], { duration: 720, easing: "cubic-bezier(.32,0,.2,1)" });
    animations.current.set(face, animation);
    animation.onfinish = () => { animations.current.delete(face); animation.cancel(); };
  };
  return (
    <div className={styles.wordmark} data-footer-wordmark>
      <div ref={source} className={styles.wordmarkSource} style={{ visibility: letters.length ? "hidden" : "visible" }}>
        <LogoAnimated className="h-full w-full text-current" />
      </div>
      {letters.map((letter, index) => (
        <button
          type="button"
          key={index}
          data-footer-letter={index}
          aria-label={`Flip letter ${"PATHETIC"[index]}`}
          className={styles.letter}
          style={{ left: `${letter.x / WIDTH * 100}%`, width: `${letter.width / WIDTH * 100}%` }}
          onPointerEnter={(event) => { if (event.pointerType !== "touch") flip(event.currentTarget); }}
          onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) flip(event.currentTarget); }}
          onClick={(event) => flip(event.currentTarget)}
        >
          <span className={styles.letterFace}>
            <svg aria-hidden="true" viewBox={`${letter.x} 0 ${letter.width} ${HEIGHT}`} className="h-full w-full overflow-visible">
              <path d={letter.path} fill="currentColor" />
            </svg>
          </span>
        </button>
      ))}
    </div>
  );
}
