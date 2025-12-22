// components/header/desktop-nav-right-anim.tsx
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
  ready?: boolean;

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
      ready = true,
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

    // track previous isOpen per mounted instance
    const prevOpenRef = useRef<boolean | null>(null);

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
        visibility: open ? "visible" : "hidden",
        pointerEvents: open ? "auto" : "none",
      });
    };

    const close = async () => {
      const { root, box, items } = getParts();
      if (!root || !box) return;

      tlRef.current?.kill();

      if (!items.length) {
        gsap.set(root, { visibility: "hidden", pointerEvents: "none" });
        gsap.set(box, { scaleX: 0 });
        prevOpenRef.current = false;
        return;
      }

      gsap.set(root, { visibility: "visible", pointerEvents: "auto" });
      gsap.set(box, { transformOrigin: "right center", willChange: "transform" });
      gsap.set(items, { transformOrigin: "center center", willChange: "transform" });

      const staggerCfg: gsap.StaggerVars = { each: stagger, from: "end" };

      const tl = gsap.timeline();
      tl.to(items, {
        scale: 0,
        duration: itemsDuration * 0.85,
        ease: "elastic.in(1, 1)",
        stagger: staggerCfg,
      });
      tl.to(box, { scaleX: 0, duration: boxDuration, ease: "power2.inOut" }, "-=0.2");
      tl.set(root, { visibility: "hidden", pointerEvents: "none" });

      tlRef.current = tl;
      await waitTimeline(tl);

      prevOpenRef.current = false;
    };

    const open = async () => {
      const { root, box, items } = getParts();
      if (!root || !box) return;

      tlRef.current?.kill();

      if (!items.length) {
        gsap.set(root, { visibility: "hidden", pointerEvents: "none" });
        gsap.set(box, { scaleX: 0 });
        prevOpenRef.current = false;
        return;
      }

      // start from closed baseline every time we animate open
      gsap.set(root, { visibility: "visible", pointerEvents: "auto" });
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

    useLayoutEffect(() => {
      if (!rootRef.current || !boxRef.current) return;

      const ctx = gsap.context(() => {
        if (!ready) {
          // hard baseline while not ready
          setOpenImmediate(false);
          prevOpenRef.current = false;
          return;
        }

        const prev = prevOpenRef.current;

        // first ready mount: always start CLOSED, then animate to open if needed
        if (prev === null) {
          setOpenImmediate(false);
          prevOpenRef.current = false;

          if (isOpen) void open();
          return;
        }

        // subsequent updates: animate on change
        if (prev !== isOpen) {
          void (isOpen ? open() : close());
          return;
        }

        // no change: do nothing (preserve current visual state)
      }, rootRef);

      return () => ctx.revert();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, ready, boxDuration, itemsDuration, stagger]);

    return (
      <div
        ref={rootRef}
        className={cn("flex items-stretch", className)}
        // SSR baseline
        style={{ visibility: "hidden", pointerEvents: "none" }}
      >
        <div
          ref={boxRef}
          className={cn(
            "flex items-center gap-2 border border-border bg-background/100 px-3 py-0",
            boxClassName
          )}
          // SSR baseline
          style={{ transform: "scaleX(0)" }}
        >
          {children}
        </div>
      </div>
    );
  }
);

export default DesktopNavRightAnim;
