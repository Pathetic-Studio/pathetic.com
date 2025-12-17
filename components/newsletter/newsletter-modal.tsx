//components/newsletter/newsletter-modal.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import Draggable from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useNewsletterModal } from "../contact/contact-modal-context";
import NewsletterForm from "./newsletter-form";
import TitleText from "../ui/title-text";

gsap.registerPlugin(Draggable, InertiaPlugin);

/** ✅ Only change these two to control the star size */
const STAR_W = 900; // px + SVG viewBox width
const STAR_H = 650; // px + SVG viewBox height

/** Star look */
const STAR_POINTS = 32;
const INNER_RATIO = 0.8;

/** Stroke + padding (prevents clipping) */
const STROKE_W = 2; // viewBox units
const PAD = 12; // viewBox units

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

  // ✅ Separate radii so BOTH width and height affect the star
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

    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry;

    pts.push(`${x.toFixed(3)},${y.toFixed(3)}`);
  }

  return pts.join(" ");
}

export default function NewsletterModal() {
  const { isOpen, close } = useNewsletterModal();

  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const starPoints = useMemo(() => {
    const safePad = PAD + STROKE_W / 2;
    return starSvgPoints({
      points: STAR_POINTS,
      innerRatio: INNER_RATIO,
      w: STAR_W,
      h: STAR_H,
      pad: safePad,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (!constraintsRef.current || !modalRef.current) return;

    const modal = modalRef.current;

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
      allowContextMenu: true,
      dragClickables: true,
      allowEventDefault: true,
      zIndexBoost: false,
      cursor: "grab",
      activeCursor: "grabbing",
    });

    return () => {
      intro.kill();
      draggable.kill();
    };
  }, [isOpen]);

  if (typeof document === "undefined") return null;
  if (!isOpen) return null;

  return createPortal(
    <div
      ref={constraintsRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={modalRef}
        className="relative select-none"
        style={{
          width: `${STAR_W}px`,
          height: `${STAR_H}px`,
        }}
        aria-label="Newsletter modal"
        role="dialog"
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
            strokeLinejoin="miter"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <button
          type="button"
          onClick={close}
          className="absolute right-10 top-10 z-20 text-4xl font-semibold leading-none text-white hover:text-white/90"
          aria-label="Close"
        >
          ×
        </button>

        <div className="absolute inset-0 z-10 flex items-center justify-center p-10">
          <div className="w-full max-w-[440px] text-center">

            <div className="relative z-10 mt-2 mb-2 text-center flex justify-center">
              <TitleText
                variant="stretched"
                as="h4"
                size="lg"
                align="center"
                maxChars={26}
                textOutline
                outlineWidth={2}
                textColor="#ffffff"
                outlineColor="#000000"
              >
                Be first to know what we drop next
              </TitleText>
            </div>


            <div className="mb-6 text-lg font-semibold uppercase tracking-[0.18em] text-white">
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
