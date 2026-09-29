"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import { useNewsletterModal } from "@/components/contact/contact-modal-context";
import PigeonNewsletter from "./pigeon-newsletter";

const FOCUSABLE =
  'button:not([disabled]), input:not([type="hidden"]):not([aria-hidden="true"]), a[href], [tabindex="0"]';
const onFlapSettled = () => undefined;

export default function NewsletterModal() {
  const { isOpen, close } = useNewsletterModal();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<gsap.core.Timeline | null>(null);
  const departingRef = useRef(false);

  const flyAway = useCallback(() => {
    if (departingRef.current) return;
    const panel = panelRef.current;
    if (!panel) return close();
    departingRef.current = true;
    rootRef.current?.setAttribute("data-flight-state", "departing");
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    flightRef.current?.kill();
    flightRef.current = gsap
      .timeline({ onComplete: close })
      .to(panel, {
        x: reduceMotion ? 0 : -(window.innerWidth + panel.offsetWidth) / 2 - 80,
        y: reduceMotion ? 0 : -window.innerHeight * 0.22,
        rotation: reduceMotion ? 0 : -12,
        opacity: reduceMotion ? 0 : 1,
        duration: reduceMotion ? 0.15 : 0.62,
        ease: "power2.in",
      })
      .to(backdropRef.current, { opacity: 0, duration: 0.2 }, "-=0.2");
  }, [close]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const opener = document.activeElement as HTMLElement | null;
    const smoother = ScrollSmoother.get();
    const wasPaused = smoother?.paused();
    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    smoother?.paused(true);
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    departingRef.current = false;
    rootRef.current?.setAttribute("data-flight-state", "arriving");
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    flightRef.current = gsap
      .timeline({
        onComplete: () => {
          rootRef.current?.setAttribute("data-flight-state", "hovering");
        },
      })
      .fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2 },
        0,
      )
      .fromTo(
        panel,
        {
          x: 0,
          y: reduceMotion
            ? 0
            : (window.innerHeight + panel.offsetHeight) / 2 + 80,
          rotation: reduceMotion ? 0 : 6,
          opacity: reduceMotion ? 0 : 1,
        },
        {
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          duration: reduceMotion ? 0.18 : 0.86,
          ease: "power3.out",
        },
        0,
      );
    panel.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        flyAway();
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      const current = document.activeElement;
      if (event.shiftKey && (current === first || current === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || current === panel)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      flightRef.current?.kill();
      flightRef.current = null;
      smoother?.paused(wasPaused ?? false);
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen, flyAway]);

  if (!isOpen || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={rootRef}
      data-footer-newsletter
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden px-3 py-14"
    >
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/70"
        onClick={flyAway}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Join our mailing list"
        tabIndex={-1}
        className="relative max-h-[calc(100dvh-2rem)] origin-center outline-none will-change-transform [@media(max-height:600px)]:scale-[.72]"
      >
        <PigeonNewsletter
          onClose={flyAway}
          flapping
          heroVisible
          onFlapSettled={onFlapSettled}
        />
      </div>
    </div>,
    document.body,
  );
}
