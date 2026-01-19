// components/blocks/section-spacer.tsx
import type { CSSProperties } from "react";
import { PAGE_QUERYResult } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SectionSpacerBlock = Extract<Block, { _type: "section-spacer" }>;

function cssHeight(value: unknown, fallback: string) {
  const v = typeof value === "string" ? value.trim() : "";
  return v || fallback;
}

// If CMS gives "10vh", return "10svh" for stability on mobile.
// For anything else, pass through.
function stabilizeMobileHeight(raw: string) {
  return raw.replace(/(-?\d+(\.\d+)?)vh\b/g, "$1svh");
}

export default function SectionSpacer({
  _key,
  height,
  heightTablet,
  heightMobile,
}: SectionSpacerBlock) {
  const spacerId = `_sectionSpacer-${_key}`;

  const desktopH = cssHeight(height, "4rem");
  const tabletH = cssHeight(heightTablet, desktopH);
  const mobileH = cssHeight(heightMobile, tabletH);

  const desktopStable = stabilizeMobileHeight(desktopH);
  const tabletStable = stabilizeMobileHeight(tabletH);
  const mobileStable = stabilizeMobileHeight(mobileH);

  // Use CSS vars inline, and set the actual `height` via CSS so media queries can override it.
  // (Inline `style={{ height: ... }}` will always win and block your media-query overrides.)
  const cssVars = {
    ["--spacer-h-desktop" as any]: desktopStable,
    ["--spacer-h-tablet" as any]: tabletStable,
    ["--spacer-h-mobile" as any]: mobileStable,
  } as CSSProperties;

  return (
    <section
      id={spacerId}
      className="relative w-full"
      style={cssVars}
      aria-hidden="true"
    >
      <style>
        {`
          #${spacerId} { height: var(--spacer-h-desktop); }
          @media (max-width: 768px) {
            #${spacerId} { height: var(--spacer-h-tablet); }
          }
          @media (max-width: 640px) {
            #${spacerId} { height: var(--spacer-h-mobile); }
          }
        `}
      </style>
    </section>
  );
}
