// components/blocks/section-spacer.tsx

import { PAGE_QUERYResult } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SectionSpacerBlock = Extract<Block, { _type: "section-spacer" }>;

export default function SectionSpacer({ _key, height }: SectionSpacerBlock) {
  const spacerId = `_sectionSpacer-${_key}`;
  const inlineHeight = height || "4rem"; // default height if not set

  return (
    <section
      id={spacerId}
      className="relative w-full"
      style={{ height: inlineHeight }}
      aria-hidden="true"
    />
  );
}
