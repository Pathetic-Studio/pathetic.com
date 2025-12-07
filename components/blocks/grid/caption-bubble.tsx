// components/blocks/grid/caption-bubble.tsx
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type CaptionSide = "left" | "right";

export interface CaptionBubbleProps {
  text: string;
  bgColor?: string | null;
  textColor?: string | null;
  side?: CaptionSide | null;
  xPercent?: number | null;
  yPercent?: number | null;
}

export default function CaptionBubble({
  text,
  bgColor,
  textColor,
  side = "right",
  xPercent,
  yPercent,
}: CaptionBubbleProps) {
  // Fallback to defaults if null/undefined
  const safeX = xPercent ?? 70;
  const safeY = yPercent ?? 20;

  const clampedX = Math.min(100, Math.max(0, safeX));
  const clampedY = Math.min(100, Math.max(0, safeY));

  const bubbleStyle: CSSProperties = {
    left: `${clampedX}%`,
    top: `${clampedY}%`,
    transform: "translate(-50%, -50%)",
    backgroundColor: bgColor || "rgba(0,0,0,0.85)",
    color: textColor || "#ffffff",
  };

  return (
    <div
      className={cn(
        "caption-bubble absolute z-20 max-w-[12rem] rounded-2xl px-3 py-2 text-xs uppercase tracking-wide shadow-lg",
        "flex items-center justify-center"
      )}
      style={bubbleStyle}
    >
      <span className="block text-center">{text}</span>

      {/* Tail */}
      <span
        className={cn(
          "pointer-events-none absolute -bottom-2 h-3 w-3 rotate-45",
          side === "right" ? "right-4" : "left-4"
        )}
        style={{
          backgroundColor: bgColor || "rgba(0,0,0,0.85)",
        }}
      />
    </div>
  );
}
