// components/header/mobile-header-logo.tsx
"use client";

import Link from "next/link";
import gsap from "gsap";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import LogoAnimated from "@/components/logo-animated";
import { cn } from "@/lib/utils";
import { useIntroHandoffPending } from "@/components/header/intro-handoff";
import { useInitialHashEntryPending } from "@/components/header/initial-hash-entry";
import { HeaderLogoVisualEffects } from "@/components/header/visual-effects";

function useLoaderPlaying(): boolean {
  const getSnapshot = () =>
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute("data-loader-playing");

  const subscribe = (onStoreChange: () => void) => {
    if (typeof window === "undefined") return () => { };

    const handler = () => onStoreChange();
    window.addEventListener("loader-playing-change", handler as any);
    return () => window.removeEventListener("loader-playing-change", handler as any);
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export default function MobileHeaderLogo({ className }: { className?: string }) {
  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => setHydrated(true), []);

  const loaderPlaying = useLoaderPlaying();
  const introHandoffPending = useIntroHandoffPending();
  const initialHashEntryPending = useInitialHashEntryPending();
  const headerEntryPending = loaderPlaying || introHandoffPending || initialHashEntryPending;
  const logoLinkRef = useRef<HTMLAnchorElement | null>(null);
  const shouldAnimateInitialHashLogoRef = useRef(initialHashEntryPending);

  useLayoutEffect(() => {
    const el = logoLinkRef.current;
    if (!el) return;

    gsap.killTweensOf(el);

    if (!hydrated || loaderPlaying || introHandoffPending) {
      gsap.set(el, {
        autoAlpha: 0,
        scale: 1,
        transformOrigin: "50% 50%",
      });
      return;
    }

    if (initialHashEntryPending) {
      gsap.set(el, {
        autoAlpha: 0,
        scale: 0.42,
        transformOrigin: "50% 50%",
      });
      return;
    }

    if (shouldAnimateInitialHashLogoRef.current) {
      shouldAnimateInitialHashLogoRef.current = false;

      gsap.fromTo(
        el,
        { autoAlpha: 0, scale: 0.42, transformOrigin: "50% 50%" },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.68,
          ease: "elastic.out(1, 1)",
          overwrite: "auto",
        }
      );
      return;
    }

    gsap.set(el, { autoAlpha: 1, scale: 1, transformOrigin: "50% 50%" });
  }, [hydrated, loaderPlaying, introHandoffPending, initialHashEntryPending]);

  // Hide ONLY the native SVG so any portal/teleport content isn’t accidentally hidden.
  const hideNative = !hydrated || headerEntryPending;
  const nativeStyle = hideNative
    ? ({ opacity: 0, visibility: "hidden" } as const)
    : undefined;

  return (
    <Link
      ref={logoLinkRef}
      href="/"
      aria-label="Home page"
      id="header-logo-main-mobile"
      data-header-logo-main="true"
      className={cn("relative flex items-center justify-center will-change-transform", className)}
    >
      <span
        data-header-logo-native="true"
        className="relative z-10 flex items-center justify-center"
        style={nativeStyle}
      >
        <LogoAnimated className="h-8 w-auto" />
      </span>
      <HeaderLogoVisualEffects />
    </Link>
  );
}
