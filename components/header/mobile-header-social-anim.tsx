"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { registerMobileSocialNavController } from "@/components/header/nav-anim-registry";

type Props = {
  children: ReactNode;
  className?: string;
};

function waitTimeline(tl: gsap.core.Timeline) {
  return new Promise<void>((resolve) => {
    tl.eventCallback("onComplete", () => resolve());
  });
}

export default function MobileHeaderSocialAnim({ children, className }: Props) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(false);

  const setOpenImmediate = useCallback((open: boolean) => {
    const el = rootRef.current;
    if (!el) return;

    tlRef.current?.kill();
    tlRef.current = null;

    gsap.set(el, {
      autoAlpha: open ? 1 : 0,
      scale: open ? 1 : 0,
      y: open ? 0 : -6,
      transformOrigin: "50% 50%",
      pointerEvents: open ? "auto" : "none",
    });

    openRef.current = open;
  }, []);

  const open = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    if (openRef.current) return;

    tlRef.current?.kill();
    tlRef.current = null;

    openRef.current = true;

    gsap.set(el, {
      autoAlpha: 0,
      scale: 0,
      y: -6,
      transformOrigin: "50% 50%",
      pointerEvents: "auto",
    });

    const tl = gsap.timeline();
    tl.to(el, {
      autoAlpha: 1,
      scale: 1,
      y: 0,
      duration: 0.6,
      ease: "elastic.out(1, 1)",
    });

    tlRef.current = tl;
    await waitTimeline(tl);
  }, []);

  const close = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;

    tlRef.current?.kill();
    tlRef.current = null;

    openRef.current = false;

    gsap.set(el, { transformOrigin: "50% 50%", pointerEvents: "auto" });

    const tl = gsap.timeline();
    tl.to(el, {
      autoAlpha: 0,
      scale: 0,
      y: -6,
      duration: 0.25,
      ease: "power2.inOut",
    });
    tl.set(el, { pointerEvents: "none" });

    tlRef.current = tl;
    await waitTimeline(tl);
  }, []);

  useLayoutEffect(() => {
    setOpenImmediate(false);
  }, [setOpenImmediate]);

  useEffect(() => {
    const sync = (playing: boolean) => {
      if (playing) {
        setOpenImmediate(false);
        return;
      }

      if (openRef.current) return;
      void open();
    };

    const playingNow =
      typeof document !== "undefined" &&
      document.documentElement.hasAttribute("data-loader-playing");
    sync(!!playingNow);

    const handleLoaderChange = (event: Event) => {
      const on = (event as CustomEvent<{ on?: boolean }>).detail?.on;
      const playing =
        typeof on === "boolean"
          ? on
          : document.documentElement.hasAttribute("data-loader-playing");

      sync(playing);
    };

    window.addEventListener("loader-playing-change", handleLoaderChange as EventListener);
    return () => window.removeEventListener("loader-playing-change", handleLoaderChange as EventListener);
  }, [open, setOpenImmediate]);

  useEffect(() => {
    const proxy = {
      open,
      close,
      setOpenImmediate,
    };

    registerMobileSocialNavController(proxy);
    return () => registerMobileSocialNavController(null);
  }, [open, close, setOpenImmediate]);

  return (
    <span
      ref={rootRef}
      data-mobile-header-item="true"
      data-mobile-header-role="social"
      className={cn("inline-flex", className)}
      style={{ visibility: "hidden", pointerEvents: "none" }}
    >
      {children}
    </span>
  );
}
