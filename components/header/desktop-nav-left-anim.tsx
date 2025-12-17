// components/header/desktop-nav-left-anim.tsx
"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export type DesktopNavLeftAnimHandle = {
  open: () => Promise<void>;
  close: () => Promise<void>;
  setOpenImmediate: (open: boolean) => void;
};

type Props = {
  className?: string;
  itemsDuration?: number;
  stagger?: number;
  children: React.ReactNode;
};

function waitTimeline(tl: gsap.core.Timeline) {
  return new Promise<void>((resolve) => {
    tl.eventCallback("onComplete", () => resolve());
  });
}

const DesktopNavLeftAnim = forwardRef<DesktopNavLeftAnimHandle, Props>(
  function DesktopNavLeftAnim(
    { className, itemsDuration = 0.7, stagger = 0.06, children },
    ref
  ) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    const getItems = () => {
      const root = rootRef.current;
      if (!root) return { root: null, items: [] as HTMLElement[] };
      const items = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll("[data-left-nav-item]")
      );
      return { root, items };
    };

    const setOpenImmediate = (open: boolean) => {
      const { root, items } = getItems();
      if (!root) return;

      tlRef.current?.kill();

      gsap.set(items, { scale: open ? 1 : 0, transformOrigin: "center center" });
      gsap.set(root, {
        visibility: open ? "visible" : "hidden",
        pointerEvents: open ? "auto" : "none",
      });
    };

    const close = async () => {
      const { root, items } = getItems();
      if (!root) return;

      tlRef.current?.kill();

      if (!items.length) {
        gsap.set(root, { visibility: "hidden", pointerEvents: "none" });
        return;
      }

      gsap.set(root, { visibility: "visible", pointerEvents: "auto" });
      gsap.set(items, { transformOrigin: "center center" });

      const tl = gsap.timeline();
      tl.to(items, {
        scale: 0,
        duration: itemsDuration * 0.85,
        ease: "elastic.in(1, 1)",
        stagger: { each: stagger, from: "start" },
      });
      tl.set(root, { visibility: "hidden", pointerEvents: "none" });

      tlRef.current = tl;
      await waitTimeline(tl);
    };

    const open = async () => {
      const { root, items } = getItems();
      if (!root) return;

      tlRef.current?.kill();

      if (!items.length) {
        gsap.set(root, { visibility: "hidden", pointerEvents: "none" });
        return;
      }

      gsap.set(root, { visibility: "visible", pointerEvents: "auto" });
      gsap.set(items, { scale: 0, transformOrigin: "center center" });

      const tl = gsap.timeline();
      tl.to(items, {
        scale: 1,
        duration: itemsDuration,
        ease: "elastic.out(1, 1)",
        stagger: { each: stagger, from: "start" },
      });

      tlRef.current = tl;
      await waitTimeline(tl);
    };

    useImperativeHandle(ref, () => ({ open, close, setOpenImmediate }));

    return (
      <div
        ref={rootRef}
        className={cn(className)}
        // ✅ server-side FOUC prevention
        style={{ visibility: "hidden", pointerEvents: "none" }}
      >
        {children}
      </div>
    );
  }
);

export default DesktopNavLeftAnim;
