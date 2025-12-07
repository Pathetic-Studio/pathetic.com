// components/layout/main-layout-shell.tsx
"use client";

import type React from "react";
import SmoothScroller from "@/components/scroll-smoother";

export default function MainLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SmoothScroller>{children}</SmoothScroller>;
}
