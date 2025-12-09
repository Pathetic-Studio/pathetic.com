// components/layout/main-layout-shell.tsx
"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import SmoothScroller from "@/components/scroll-smoother";

export default function MainLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hard disable smooth scroll on meme-booth for debugging
  if (pathname === "/meme-booth") {
    return <>{children}</>;
  }

  return <SmoothScroller>{children}</SmoothScroller>;
}
