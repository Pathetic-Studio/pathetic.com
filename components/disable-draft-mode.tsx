"use client";
import { useDraftModeEnvironment } from "next-sanity/hooks";

export function DisableDraftMode() {
  const environment = useDraftModeEnvironment();

  // Only show the disable draft mode button when outside of Presentation Tool
  if (environment !== "live" && environment !== "unknown") {
    return null;
  }

  return (
    <a
      href="/api/draft-mode/disable"
      className="fixed bottom-4 right-4 z-[100] inline-flex h-9 items-center justify-center bg-primary px-4 py-2 font-sans text-sm font-semibold uppercase text-primary-foreground underline-offset-4 hover:underline"
    >
      Disable Draft Mode
    </a>
  );
}
