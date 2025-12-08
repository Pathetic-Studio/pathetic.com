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

const BUBBLE_WIDTH = "12rem";

export default function CaptionBubble({
  text,
  bgColor,
  textColor,
  side = "right",
  xPercent,
  yPercent,
}: CaptionBubbleProps) {
  const safeX = xPercent ?? 70;
  const safeY = yPercent ?? 20;

  const clampedX = Math.min(100, Math.max(0, safeX));
  const clampedY = Math.min(100, Math.max(0, safeY));

  // x%, y% are always from the image's top-left corner.
  // side === "right"  -> left edge of bubble at x%
  // side === "left"   -> right edge of bubble at x%
  const horizontalPosition: CSSProperties =
    side === "left"
      ? {
        left: `${clampedX}%`,
        transform: "translateX(-100%)", // anchor right edge at x%
      }
      : {
        left: `${clampedX}%`,
        transform: "translateX(0)", // anchor left edge at x%
      };

  const bubbleStyle: CSSProperties = {
    top: `${clampedY}%`,
    ...horizontalPosition,
    backgroundColor: bgColor || "rgba(0,0,0,0.85)",
    color: textColor || "#ffffff",
    width: BUBBLE_WIDTH, // fixed width, no shrink-to-fit
    transformOrigin: side === "left" ? "top right" : "top left",
  };

  return (
    <div
      className={cn(
        "caption-bubble absolute z-20 rounded-2xl px-3 py-2 text-xs  tracking-wide",
        "flex items-center justify-center"
      )}
      style={bubbleStyle}
    >
      <span className="block text-left">{text}</span>

      {/* Tail */}
      <span
        className={cn(
          "pointer-events-none absolute top-0",
          side === "left"
            ? "right-0 translate-x-1/2"
            : "left-0 -translate-x-1/2"
        )}
        style={{
          width: "24px",
          height: "20px",
        }}
      >
        <svg
          width="24"
          height="20"
          viewBox="0 0 24 20"
          xmlns="http://www.w3.org/2000/svg"
          className="origin-top"
          style={{
            transform:
              side === "left"
                ? "scaleX(1)"
                : "scaleY(-1) rotate(180deg)",
            transformOrigin: "top center",
          }}
        >
          <path
            d="M13.508 19.1958C20.6379 16.7242 23.4344 5.36875 23.9414 0C22.1375 9.9727 7.22912 12.5732 0.000399285 12.6268C1.53219 15.8463 6.37823 21.6674 13.508 19.1958Z"
            fill={bgColor || "rgba(0,0,0,0.85)"}
          />
        </svg>
      </span>
    </div>
  );
}
