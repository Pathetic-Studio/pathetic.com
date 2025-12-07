// components/blocks/split/split-cards-item-animated.tsx
"use client";

import PortableTextRenderer from "@/components/portable-text-renderer";
import { cn } from "@/lib/utils";
import { PAGE_QUERYResult, ColorVariant } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRowAnimated = Extract<Block, { _type: "split-row-animated" }>;
type SplitColumnsAnimated = NonNullable<SplitRowAnimated["splitColumns"]>[number];
type SplitCardsListAnimated = Extract<
  SplitColumnsAnimated,
  { _type: "split-cards-list-animated" }
>;
type SplitCardItem = NonNullable<
  NonNullable<SplitCardsListAnimated["list"]>[number]
>;

interface SplitCardsItemAnimatedProps extends SplitCardItem {
  color?: ColorVariant;
}

export default function SplitCardsItemAnimated({
  color,
  tagLine,
  title,
  body,
}: SplitCardsItemAnimatedProps) {
  const isPrimary = color === "primary";

  return (
    <div
      className={cn(
        "group flex flex-col items-start border px-6 lg:px-8 py-6 lg:py-8 transition-colors duration-700 ease-out cursor-pointer",
        "bg-background text-foreground",
        isPrimary ? "border-primary" : "border-foreground/40",
        // Hover = old “active” look
        "group-hover:bg-foreground group-hover:text-background",
      )}
    >
      {tagLine && (
        <div className="font-bold text-2xl lg:text-3xl transition-colors duration-700 ease-out">
          {tagLine}
        </div>
      )}

      {title && (
        <div className="my-2 font-semibold text-2xl uppercase transition-colors duration-700 ease-out">
          {title}
        </div>
      )}

      {body && (
        <div className="transition-colors duration-700 ease-out">
          <PortableTextRenderer value={body} />
        </div>
      )}
    </div>
  );
}
