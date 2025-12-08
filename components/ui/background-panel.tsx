//components/ui/background-panel.tsx
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";

export type BackgroundSettings = {
  enabled?: boolean;
  layout?: "inset" | "full" | null;
  border?: boolean | null;

  style?: "solid" | "gradient" | "image" | null;
  color?: string | null;
  fromColor?: string | null;
  toColor?: string | null;
  angle?: number | null;

  // Image background
  image?: any | null;

  // Custom sizing / placement (for inset)
  customHeight?: string | null; // e.g. "60vh", "400px", "clamp(20rem, 40vh, 30rem)"
  verticalOffsetPercent?: number | null; // 0–100, top offset as %
};

type BackgroundPanelProps = {
  background?: BackgroundSettings | null;
  className?: string;
};

export function BackgroundPanel({
  background,
  className,
}: BackgroundPanelProps) {
  if (!background?.enabled) return null;

  let style: CSSProperties = {};

  // Solid
  if (background.style === "solid" && background.color) {
    style.background = background.color;
  }
  // Gradient
  else if (
    background.style === "gradient" &&
    background.fromColor &&
    background.toColor
  ) {
    const angle = background.angle ?? 135;
    style.backgroundImage = `linear-gradient(${angle}deg, ${background.fromColor}, ${background.toColor})`;
  }
  // Image
  else if (background.style === "image" && background.image?.asset) {
    try {
      const url = urlFor(background.image).url();
      style.backgroundImage = `url(${url})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    } catch {
      // ignore urlFor failure
    }
  }

  // If we still have no background style, bail
  if (!style.background && !style.backgroundImage) return null;

  const layout = background.layout ?? "inset";
  const hasCustomHeight = Boolean(background.customHeight);

  let baseLayoutClass: string;

  if (layout === "full") {
    baseLayoutClass =
      "absolute inset-0 overflow-hidden z-0 pointer-events-none";
  } else {
    // INSET LAYOUT
    if (hasCustomHeight) {
      // Custom sizing mode: we control height + top in inline styles
      baseLayoutClass =
        "absolute left-4 right-4 md:left-8 md:right-8 overflow-hidden z-0 pointer-events-none";

      // Height
      style.height = background.customHeight as string;

      // Top offset (percent of section height), or default
      if (typeof background.verticalOffsetPercent === "number") {
        const clamped = Math.min(
          100,
          Math.max(0, background.verticalOffsetPercent),
        );
        style.top = `${clamped}%`;
      } else {
        style.top = "3rem";
      }
    } else {
      // Legacy/default inset behavior: use your original sizing/positioning
      baseLayoutClass =
        "absolute inset-4 md:inset-8 md:top-12 overflow-hidden z-0 pointer-events-none";
      // No custom height or top here – height comes from top+bottom insets
    }
  }

  const borderClass = background.border ? "border border-border" : "";

  return (
    <div
      className={cn(baseLayoutClass, borderClass, className)}
      style={style}
    />
  );
}

