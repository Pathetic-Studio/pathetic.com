"use client";

import { useSyncExternalStore } from "react";

const INITIAL_HASH_PENDING_ATTR = "data-initial-hash-pending";
const INITIAL_HASH_READY_ATTR = "data-initial-hash-ready";
const INITIAL_HASH_READY_EVENT = "initial-hash-ready";

function getSnapshot() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute(INITIAL_HASH_PENDING_ATTR) &&
    !document.documentElement.hasAttribute(INITIAL_HASH_READY_ATTR)
  );
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const handler = () => onStoreChange();
  window.addEventListener(INITIAL_HASH_READY_EVENT, handler as EventListener);
  return () =>
    window.removeEventListener(INITIAL_HASH_READY_EVENT, handler as EventListener);
}

export function useInitialHashEntryPending() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
