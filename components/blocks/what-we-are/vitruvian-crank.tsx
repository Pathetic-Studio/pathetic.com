"use client";

import { useEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import gsap from "gsap";
import styles from "./what-we-are.module.css";

export type FigureMotion = { stop: () => void; settle: () => void };

export default function VitruvianCrank({
  sectionRef,
  figureRef,
  motionRef,
  onEject,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  figureRef: RefObject<HTMLDivElement | null>;
  motionRef: RefObject<FigureMotion | null>;
  onEject: () => void;
}) {
  const control = useRef({ start: () => {}, end: () => {} });
  const wheelRef = useRef<HTMLImageElement>(null);
  const ejectRef = useRef(onEject);
  ejectRef.current = onEject;
  useEffect(() => {
    const root = sectionRef.current,
      figure = figureRef.current,
      wheel = wheelRef.current;
    if (!root || !figure || !wheel) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const stars = [
      ...root.querySelectorAll<SVGGraphicsElement>("[data-dizzy-star]"),
    ];
    let frame = 0,
      last = 0,
      held = false,
      speed = 0,
      angle = 0,
      winding = 0,
      fastFor = 0,
      elapsed = 0,
      ejected = false;
    let settle: gsap.core.Tween | null = null;
    const reset = () => {
      held = false;
      speed = 0;
      fastFor = 0;
      ejected = false;
      last = 0;
      cancelAnimationFrame(frame);
      frame = 0;
      settle?.kill();
      delete root.dataset.figureSpinning;
      delete root.dataset.figureDizzy;
      root.dataset.figureSpeed = "0";
    };
    const faceFront = () => {
      const target = Math.round(angle / 360) * 360;
      const pose = { angle };
      settle = gsap.to(pose, {
        angle: target,
        duration: reduced.matches ? 0 : 0.5,
        ease: "power2.out",
        onUpdate: () => {
          angle = pose.angle;
          figure.style.transform = `rotateY(${angle}deg)`;
        },
        onComplete: () => {
          angle = 0;
          figure.style.transform = "";
        },
      });
    };
    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(last ? (now - last) / 1000 : 1 / 60, 0.035);
      last = now;
      elapsed += dt;
      if (document.hidden || root.dataset.inView === "false") {
        reset();
        faceFront();
        return;
      }
      speed = held
        ? Math.min(1380, speed + dt * 460)
        : speed * Math.exp(-dt * 1.8);
      angle += speed * dt;
      winding += speed * dt * 0.38;
      figure.style.transform = `rotateY(${angle}deg)`;
      wheel.style.transform = `rotate(${winding}deg)`;
      root.dataset.figureSpinning = "true";
      root.dataset.figureSpeed = String(Math.round(speed));
      if (speed > 350) fastFor += dt;
      const dizzy = fastFor > 1.35 && speed > 90;
      root.dataset.figureDizzy = String(dizzy);
      if (dizzy)
        stars.forEach((star, index) => {
          const phase = elapsed * 3 + index * Math.PI * 0.5,
            depth = Math.sin(phase);
          star.setAttribute(
            "transform",
            `translate(${100 + Math.cos(phase) * 83} ${34 + depth * 21}) rotate(${elapsed * 100}) scale(${0.8 + depth * 0.2})`,
          );
        });
      // Toss from the front-facing part of a turn so its screen position is
      // continuous with the hat on his head, rather than an edge-on rectangle.
      const front = ((angle % 360) + 360) % 360;
      if (
        !ejected &&
        fastFor > 2 &&
        speed > 1120 &&
        (front < 22 || front > 338)
      ) {
        ejected = true;
        ejectRef.current();
      }
      if (!held && speed < 12) {
        reset();
        faceFront();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    motionRef.current = {
      stop: () => {
        reset();
        angle = 0;
        figure.style.transform = "";
      },
      settle: faceFront,
    };
    control.current = {
      start: () => {
        if (reduced.matches) return;
        held = true;
        settle?.kill();
        speed = Math.max(speed, 160);
        if (!frame) {
          last = 0;
          frame = requestAnimationFrame(tick);
        }
      },
      end: () => {
        held = false;
      },
    };
    const visibility = () => {
      if (document.hidden) {
        reset();
        faceFront();
      }
    };
    const change = () => {
      reset();
      faceFront();
    };
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", change);
    return () => {
      reset();
      figure.style.transform = "";
      motionRef.current = null;
      control.current = { start: () => {}, end: () => {} };
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", change);
    };
  }, [sectionRef, figureRef, motionRef]);
  return (
    <button
      type="button"
      className={styles.crank}
      data-vitruvian-crank
      aria-label="Hold the hand crank to spin the Vitruvian man"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        control.current.start();
      }}
      onPointerUp={() => control.current.end()}
      onPointerCancel={() => control.current.end()}
      onLostPointerCapture={() => control.current.end()}
      onBlur={() => control.current.end()}
      onKeyDown={(event) => {
        if ((event.key === " " || event.key === "Enter") && !event.repeat) {
          event.preventDefault();
          control.current.start();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          control.current.end();
        }
      }}
    >
      <Image
        ref={wheelRef}
        src="/images/what-we-are/brass-hand-crank.webp"
        alt=""
        width={560}
        height={560}
        sizes="156px"
        loading="eager"
        draggable={false}
      />
    </button>
  );
}

export function DizzyStars() {
  return (
    <svg
      className={styles.dizzy}
      data-figure-dizzy-orbit
      viewBox="0 0 200 70"
      aria-hidden="true"
    >
      <ellipse
        cx="100"
        cy="34"
        rx="83"
        ry="21"
        stroke="#8c693d"
        strokeWidth="1.4"
        fill="none"
        opacity=".7"
      />
      {[0, 1, 2, 3].map((i) => (
        <g
          key={i}
          data-dizzy-star
          transform={`translate(${i % 2 ? 183 : 17} 34)`}
        >
          <path
            d="m0-11 3.5 7 8 1-6 5.5 1.5 8L0 7-7 10-5.5 2.5-12-3l8.5-1Z"
            fill="#ffe353"
            stroke="#684a21"
            strokeWidth="1.2"
          />
        </g>
      ))}
    </svg>
  );
}
