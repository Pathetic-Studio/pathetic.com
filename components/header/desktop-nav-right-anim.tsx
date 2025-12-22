"use client";

import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export type DesktopNavRightAnimHandle = {
  open: () => Promise<void>;
  close: () => Promise<void>;
  setOpenImmediate: (open: boolean) => void;
};

type Props = {
  isOpen: boolean;

  className?: string;
  boxClassName?: string;

  boxDuration?: number;
  itemsDuration?: number;
  stagger?: number;

  children: React.ReactNode;
};

function waitTimeline(tl: gsap.core.Timeline) {
  return new Promise<void>((resolve) => {
    tl.eventCallback("onComplete", () => resolve());
  });
}

const DesktopNavRightAnim = forwardRef<DesktopNavRightAnimHandle, Props>(
  function DesktopNavRightAnim(
    {
      isOpen,
      className,
      boxClassName,
      boxDuration = 0.45,
      itemsDuration = 0.7,
      stagger = 0.06,
      children,
    },
    ref
  ) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const boxRef = useRef<HTMLDivElement | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    // prev state for THIS mounted instance
    const prevOpenRef = useRef<boolean | null>(null);
    const didInitRef = useRef(false);

    const getParts = () => {
      const root = rootRef.current;
      const box = boxRef.current;
      if (!root || !box) return { root: null, box: null, items: [] as HTMLElement[] };
      const items = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-right-nav-item]"));
      return { root, box, items };
    };

    const setOpenImmediate = (open: boolean) => {
      const { root, box, items } = getParts();
      if (!root || !box) return;

      tlRef.current?.kill();

      gsap.set(box, { transformOrigin: "right center", willChange: "transform" });
      gsap.set(items, { transformOrigin: "center center", willChange: "transform" });

      gsap.set(box, { scaleX: open ? 1 : 0 });
      gsap.set(items, { scale: open ? 1 : 0 });

      gsap.set(root, {
        autoAlpha: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        visibility: open ? "visible" : "hidden",
      });


      prevOpenRef.current = open;
    };

    const close = async () => {
      const { root, box, items } = getParts();
      if (!root || !box) return;

      tlRef.current?.kill();

      gsap.set(root, { autoAlpha: 1, pointerEvents: "auto" });
      gsap.set(box, { transformOrigin: "right center", willChange: "transform" });
      gsap.set(items, { transformOrigin: "center center", willChange: "transform" });

      const staggerCfg: gsap.StaggerVars = { each: stagger, from: "end" };

      const tl = gsap.timeline();
      if (items.length) {
        tl.to(items, {
          scale: 0,
          duration: itemsDuration * 0.85,
          ease: "elastic.in(1, 1)",
          stagger: staggerCfg,
        });
        tl.to(box, { scaleX: 0, duration: boxDuration, ease: "power2.inOut" }, "-=0.2");
      } else {
        tl.to(box, { scaleX: 0, duration: boxDuration, ease: "power2.inOut" }, 0);
      }

      tl.set(root, { autoAlpha: 0, pointerEvents: "none" });

      tlRef.current = tl;
      await waitTimeline(tl);

      prevOpenRef.current = false;
    };

    const open = async () => {
      const { root, box, items } = getParts();
      if (!root || !box) return;

      tlRef.current?.kill();

      // if nothing to show, keep closed
      if (!items.length) {
        setOpenImmediate(false);
        return;
      }

      gsap.set(root, { autoAlpha: 1, pointerEvents: "auto" });
      gsap.set(box, { transformOrigin: "right center", willChange: "transform" });
      gsap.set(items, { transformOrigin: "center center", willChange: "transform" });

      gsap.set(box, { scaleX: 0 });
      gsap.set(items, { scale: 0 });

      const staggerCfg: gsap.StaggerVars = { each: stagger, from: "end" };

      const tl = gsap.timeline();
      tl.to(box, { scaleX: 1, duration: boxDuration, ease: "power2.out" }, 0);
      tl.to(
        items,
        {
          scale: 1,
          duration: itemsDuration,
          ease: "elastic.out(1, 1)",
          stagger: staggerCfg,
        },
        0.05
      );

      tlRef.current = tl;
      await waitTimeline(tl);

      prevOpenRef.current = true;
    };

    useImperativeHandle(ref, () => ({ open, close, setOpenImmediate }));

    // One-time init: enforce baseline via GSAP (not React style props)
    useLayoutEffect(() => {
      if (didInitRef.current) return;
      didInitRef.current = true;

      const { root, box, items } = getParts();
      if (!root || !box) return;

      // baseline closed (prevents SSR flashes)
      gsap.set(root, { autoAlpha: 0, pointerEvents: "none" });
      gsap.set(box, { transformOrigin: "right center", scaleX: 0 });
      gsap.set(items, { transformOrigin: "center center", scale: 0 });

      // now sync to current isOpen immediately (no animation on very first mount)
      setOpenImmediate(isOpen);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Animate on state changes
    useLayoutEffect(() => {
      if (!rootRef.current || !boxRef.current) return;

      const prev = prevOpenRef.current;
      if (prev === null) return; // init effect sets this

      if (prev === isOpen) return;

      void (isOpen ? open() : close());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, boxDuration, itemsDuration, stagger]);

    return (
      <div ref={rootRef} className={cn("flex items-stretch gsap-hidden", className)}>
        <div
          ref={boxRef}
          className={cn(
            "flex items-center gap-2 border border-border bg-background/100 px-3 py-0",
            boxClassName
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);

export default DesktopNavRightAnim;
