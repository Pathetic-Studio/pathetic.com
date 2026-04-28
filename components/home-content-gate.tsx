// components/home-content-gate.tsx
"use client";

import { useEffect, useState } from "react";

const LOADER_FLAG_ATTR = "data-loader-playing";
const LOADER_EVENT = "loader-playing-change";
const HOME_LOADER_PENDING_ATTR = "data-home-loader-pending";
const HOME_LOADER_PENDING_EVENT = "home-loader-pending-change";

function shouldStayHidden() {
  if (typeof document === "undefined") return true;

  const root = document.documentElement;
  return (
    root.hasAttribute(LOADER_FLAG_ATTR) ||
    root.hasAttribute(HOME_LOADER_PENDING_ATTR)
  );
}

export default function HomeContentGate({
  children,
  initiallyHidden,
}: {
  children: React.ReactNode;
  initiallyHidden: boolean;
}) {
  const [hidden, setHidden] = useState(initiallyHidden);

  useEffect(() => {
    if (!initiallyHidden) return;

    const revealIfReady = () => {
      if (!shouldStayHidden()) setHidden(false);
    };

    revealIfReady();

    window.addEventListener(LOADER_EVENT, revealIfReady as EventListener);
    window.addEventListener(HOME_LOADER_PENDING_EVENT, revealIfReady as EventListener);

    return () => {
      window.removeEventListener(LOADER_EVENT, revealIfReady as EventListener);
      window.removeEventListener(HOME_LOADER_PENDING_EVENT, revealIfReady as EventListener);
    };
  }, [initiallyHidden]);

  return (
    <div
      data-home-content-gate="true"
      style={
        hidden
          ? { opacity: 0, visibility: "hidden", pointerEvents: "none" }
          : undefined
      }
    >
      {children}
    </div>
  );
}
