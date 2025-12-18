import { PAGE_QUERYResult } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SectionSpacerBlock = Extract<Block, { _type: "section-spacer" }>;

// simple helper so empty strings don't break styles
function cssHeight(value: unknown, fallback: string) {
  const v = typeof value === "string" ? value.trim() : "";
  return v || fallback;
}

export default function SectionSpacer({
  _key,
  height,
  heightTablet,
  heightMobile,
}: SectionSpacerBlock) {
  const spacerId = `_sectionSpacer-${_key}`;

  // Defaults:
  // - desktop: required in schema (but still fallback-safe)
  // - tablet: defaults to desktop unless set
  // - mobile: defaults to tablet if set, else desktop
  const desktopH = cssHeight(height, "4rem");
  const tabletH = cssHeight(heightTablet, desktopH);
  const mobileH = cssHeight(heightMobile, tabletH);

  return (
    <section
      id={spacerId}
      className="relative w-full"
      style={{ height: desktopH }}
      aria-hidden="true"
    >
      <style>
        {`
          /* Tablet (Tailwind md breakpoint and below: 768px) */
          @media (max-width: 768px) {
            #${spacerId} { height: ${tabletH}; }
          }

          /* Mobile (Tailwind sm breakpoint and below: 640px) */
          @media (max-width: 640px) {
            #${spacerId} { height: ${mobileH}; }
          }
        `}
      </style>
    </section>
  );
}
