// components/header/desktop-nav-right-anim.tsx
"use client";

import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

/**
 * Persist last state across remounts. On true cold-load this is null.
 */
let LAST_RIGHT_OPEN: boolean | null = null;

type Props = {
  isOpen: boolean;

  /**
   * When false, force-hide everything (prevents wrong-state flash on cold load).
   * When it flips true, animate to isOpen from a closed baseline.
   */
  ready?: boolean;

  className?: string;
  boxClassName?: string;

  boxDuration?: number;
  itemsDuration?: number;
  stagger?: number;

  children: React.ReactNode;
};

export default function DesktopNavRightAnim({
  isOpen,
  ready = true,
  className,
  boxClassName,
  boxDuration = 0.45,
  itemsDuration = 0.7,
  stagger = 0.06,
  children,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    if (!rootRef.current || !boxRef.current) return;

    const ctx = gsap.context(() => {
      const root = rootRef.current!;
      const box = boxRef.current!;
      const items = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll("[data-right-nav-item]")
      );

      tlRef.current?.kill();

      gsap.set(box, { transformOrigin: "right center", willChange: "transform" });
      gsap.set(items, { transformOrigin: "center center", willChange: "transform" });

      const staggerCfg: gsap.StaggerVars = { each: stagger, from: "end" };

      // Not ready: hard-hide
      if (!ready) {
        gsap.set(root, { visibility: "hidden", pointerEvents: "none" });
        gsap.set(box, { scaleX: 0 });
        gsap.set(items, { scale: 0 });
        return;
      }

      // Cold-load baseline: start closed if we've never seen this in-session
      const startOpen = LAST_RIGHT_OPEN === null ? false : LAST_RIGHT_OPEN;

      gsap.set(box, { scaleX: startOpen ? 1 : 0 });
      gsap.set(items, { scale: startOpen ? 1 : 0 });
      gsap.set(root, {
        visibility: startOpen ? "visible" : "hidden",
        pointerEvents: startOpen ? "auto" : "none",
      });

      if (startOpen !== isOpen) {
        const tl = gsap.timeline();

        if (isOpen) {
          tl.set(root, { visibility: "visible", pointerEvents: "auto" }, 0);
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
        } else {
          tl.to(items, {
            scale: 0,
            duration: itemsDuration * 0.85,
            ease: "elastic.in(1, 1)",
            stagger: staggerCfg,
          });
          tl.to(box, { scaleX: 0, duration: boxDuration, ease: "power2.inOut" }, "-=0.2");
          tl.set(root, { visibility: "hidden", pointerEvents: "none" });
        }

        tlRef.current = tl;
      }

      LAST_RIGHT_OPEN = isOpen;
    }, rootRef);

    return () => ctx.revert();
  }, [isOpen, ready, boxDuration, itemsDuration, stagger]);

  return (
    <div
      ref={rootRef}
      className={cn("flex items-stretch", className)}
      // ✅ critical: prevents server-render flash before GSAP runs
      style={{ visibility: "hidden", pointerEvents: "none" }}
    >
      <div
        ref={boxRef}
        className={cn(
          "flex items-center gap-2 border border-border bg-background/100 px-3 py-0",
          boxClassName
        )}
        // ✅ critical: closed baseline before hydration
        style={{ transform: "scaleX(0)" }}
      >
        {children}
      </div>
    </div>
  );
}
