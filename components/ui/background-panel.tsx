//components/ui/background-panel.tsx
import type { CSSProperties } from "react";
import { stegaClean } from "next-sanity";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";

export type BackgroundSettings = {
  enabled?: boolean | null;
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
  if (!background || stegaClean(background.enabled) !== true) return null;

  // Production Draft Mode adds Sanity's click-to-edit metadata to strings.
  // Clean every value that participates in an equality check or CSS rule while
  // leaving the image reference intact for the image URL builder.
  const backgroundStyle = stegaClean(background.style);
  const backgroundColor = stegaClean(background.color);
  const fromColor = stegaClean(background.fromColor);
  const toColor = stegaClean(background.toColor);
  const layout = stegaClean(background.layout) ?? "inset";
  const customHeight = stegaClean(background.customHeight);
  const border = stegaClean(background.border) === true;

  let style: CSSProperties = {};

  // Solid
  if (backgroundStyle === "solid" && backgroundColor) {
    style.background = backgroundColor;
  }
  // Gradient
  else if (
    backgroundStyle === "gradient" &&
    fromColor &&
    toColor
  ) {
    const angle = background.angle ?? 135;
    style.backgroundImage = `linear-gradient(${angle}deg, ${fromColor}, ${toColor})`;
  }
  // Image
  else if (backgroundStyle === "image" && background.image?.asset) {
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

  const hasCustomHeight = Boolean(customHeight);

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
      style.height = customHeight as string;

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
        "absolute inset-4 md:inset-8  overflow-hidden z-0 pointer-events-none";
      // No custom height or top here – height comes from top+bottom insets
    }
  }

  const borderClass = border ? "border border-border" : "";

  return (
    <div
      className={cn(baseLayoutClass, borderClass, className)}
      style={style}
    />
  );
}
