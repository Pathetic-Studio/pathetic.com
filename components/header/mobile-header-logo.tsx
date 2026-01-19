// components/header/mobile-header-logo.tsx
"use client";

import Link from "next/link";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import LogoAnimated from "@/components/logo-animated";
import { cn } from "@/lib/utils";

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

  // Hide ONLY the native SVG so any portal/teleport content isn’t accidentally hidden.
  const hideNative = !hydrated || loaderPlaying;
  const nativeStyle = hideNative
    ? ({ opacity: 0, visibility: "hidden" } as const)
    : undefined;

  return (
    <Link
      href="/"
      aria-label="Home page"
      id="header-logo-main-mobile"
      data-header-logo-main="true"
      className={cn("flex items-center justify-center", className)}
    >
      <span
        data-header-logo-native="true"
        className="flex items-center justify-center"
        style={nativeStyle}
      >
        <LogoAnimated className="h-8 w-auto" />
      </span>
    </Link>
  );
}
