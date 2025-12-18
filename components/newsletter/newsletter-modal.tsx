// components/newsletter/newsletter-modal.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import Draggable from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useNewsletterModal } from "@/components/contact/contact-modal-context";
import NewsletterForm from "./newsletter-form";
import TitleText from "../ui/title-text";
import LogoRound from "@/components/logo-round";

gsap.registerPlugin(Draggable, InertiaPlugin);

const STAR_W = 900;
const STAR_H = 650;

const STAR_POINTS = 32;
const INNER_RATIO = 0.8;

const STROKE_W = 2;
const PAD = 12;

function starSvgPoints(opts: {
  points: number;
  innerRatio: number;
  w: number;
  h: number;
  pad: number;
}) {
  const { points, innerRatio, w, h, pad } = opts;

  const cx = w / 2;
  const cy = h / 2;

  const outerRx = Math.max(0, w / 2 - pad);
  const outerRy = Math.max(0, h / 2 - pad);

  const innerRx = outerRx * innerRatio;
  const innerRy = outerRy * innerRatio;

  const total = points * 2;
  const startAngle = -Math.PI / 2;

  const pts: string[] = [];
  for (let i = 0; i < total; i++) {
    const isOuter = i % 2 === 0;
    const rx = isOuter ? outerRx : innerRx;
    const ry = isOuter ? outerRy : innerRy;

    const a = startAngle + (i * Math.PI) / points;

    pts.push(
      `${(cx + Math.cos(a) * rx).toFixed(3)},${(
        cy + Math.sin(a) * ry
      ).toFixed(3)}`,
    );
  }

  return pts.join(" ");
}

export default function NewsletterModal() {
  const { isOpen, close } = useNewsletterModal();

  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const isClosingRef = useRef(false);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);

  const starPoints = useMemo(() => {
    return starSvgPoints({
      points: STAR_POINTS,
      innerRatio: INNER_RATIO,
      w: STAR_W,
      h: STAR_H,
      pad: PAD + STROKE_W / 2,
    });
  }, []);

  const animateClose = () => {
    if (isClosingRef.current) return;

    const modal = modalRef.current;
    if (!modal) return close();

    isClosingRef.current = true;

    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to(modal, {
      scale: 0.4,
      y: 40,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        isClosingRef.current = false;
        close();
      },
    });
  };

  useEffect(() => {
    if (!isOpen || !constraintsRef.current || !modalRef.current) return;

    const modal = modalRef.current;

    closeTweenRef.current?.kill();
    isClosingRef.current = false;

    gsap.set(modal, {
      scale: 0.4,
      y: -40,
      transformOrigin: "50% 50%",
    });

    const intro = gsap.to(modal, {
      scale: 1,
      y: 0,
      duration: 1,
      ease: "back.out(1.8)",
    });

    const [draggable] = Draggable.create(modal, {
      type: "x,y",
      bounds: constraintsRef.current,
      inertia: true,
      edgeResistance: 0.85,
      dragClickables: true,
      zIndexBoost: false,
      cursor: "grab",
      activeCursor: "grabbing",
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") animateClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      intro.kill();
      draggable.kill();
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={constraintsRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) animateClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative select-none"
        style={{ width: STAR_W, height: STAR_H }}
        role="dialog"
        aria-label="Newsletter modal"
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${STAR_W} ${STAR_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polygon
            points={starPoints}
            fill="#FF3939"
            stroke="#000"
            strokeWidth={STROKE_W}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <button
          type="button"
          onClick={animateClose}
          className="absolute right-10 top-10 z-20 text-4xl font-semibold text-white"
          aria-label="Close"
        >
          ×
        </button>

        <div className="absolute inset-0 z-10 flex items-center justify-center p-10">
          <div className="w-full max-w-[440px] text-center">
            <div className="mb-4 flex justify-center">
              <LogoRound size={64} />
            </div>

            <div className="mb-2 flex justify-center">
              <TitleText
                variant="stretched"
                as="h4"
                size="lg"
                align="center"
                maxChars={14}
                textOutline
                outlineWidth={2}
                textColor="#ffffff"
                outlineColor="#000000"
              >
                See what we drop next
              </TitleText>
            </div>

            <div className="mb-6 text-lg font-normal uppercase text-black">
              Join our Newsletter
            </div>

            <NewsletterForm />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
