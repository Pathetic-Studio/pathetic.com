"use client";

import { useSyncExternalStore } from "react";

const INTRO_HANDOFF_PENDING_ATTR = "data-intro-handoff-pending";
const INTRO_HANDOFF_EVENT = "intro-handoff-change";

function getSnapshot() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute(INTRO_HANDOFF_PENDING_ATTR)
  );
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => { };

  const handler = () => onStoreChange();
  window.addEventListener(INTRO_HANDOFF_EVENT, handler as EventListener);
  return () => window.removeEventListener(INTRO_HANDOFF_EVENT, handler as EventListener);
}

export function setIntroHandoffPending(pending: boolean) {
  if (typeof document === "undefined") return;

  if (pending) {
    document.documentElement.setAttribute(INTRO_HANDOFF_PENDING_ATTR, "true");
  } else {
    document.documentElement.removeAttribute(INTRO_HANDOFF_PENDING_ATTR);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INTRO_HANDOFF_EVENT, { detail: { pending } }));
  }
}

export function useIntroHandoffPending() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
