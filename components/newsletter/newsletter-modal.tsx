// components/newsletter/newsletter-modal.tsx
"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import Draggable from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useNewsletterModal } from "../contact/contact-modal-context";
import NewsletterForm from "./newsletter-form";

gsap.registerPlugin(Draggable, InertiaPlugin);

export default function NewsletterModal() {
  const { isOpen, close } = useNewsletterModal();
  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!constraintsRef.current || !modalRef.current) return;

    const modal = modalRef.current;

    // Spin-in intro animation (3 spins, no fade)
    gsap.set(modal, {
      scale: 0.4,
      rotation: -1080,
      y: -40,
      transformOrigin: "50% 50%",
    });

    const intro = gsap.to(modal, {
      scale: 1,
      rotation: 0,
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
      // Important: let inputs/buttons work normally
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
        className="
          relative max-h-[80vh] w-[min(90vw,420px)] overflow-visible rounded-md border border-black
          bg-gradient-to-t from-[#0AB2FA]  to-[#f5f5f5]
          shadow-[10px_10px_0_rgba(0,0,0,1)]
        "
      >
        {/* SVG title for real stroked text, spilling out of the modal */}
        <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 w-[200%] overflow-visible">
          <svg
            viewBox="0 0 1200 200"
            className="h-[140px] w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize="140"
              fontWeight="900"
              fontFamily="inherit"
              fill="#F9F700"
              stroke="#000000"
              strokeWidth="10"
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{
                filter: `
                  drop-shadow(0px 4px 0px rgba(0,0,0,1))
                  drop-shadow(0px_4px_0px_rgba(0,0,0,1))
                `,
              }}
            >
              NEWSLETTER
            </text>
          </svg>
        </div>

        {/* Title bar */}
        <div className="flex cursor-move items-center justify-between px-4 pt-16 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
          <span className="text-foreground">Join the newsletter</span>
          <button
            type="button"
            onClick={close}
            className="cursor-pointer scale-x-[0.6] text-4xl font-semibold leading-[14px] text-neutral-100 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="border-t border-dashed border-neutral-600 bg-transparent px-4 py-3 text-xs text-neutral-50">
          <NewsletterForm />
        </div>
      </div>
    </div>,
    document.body,
  );
}
