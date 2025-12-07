// components/blocks/split/split-cards-item.tsx
"use client";

import PortableTextRenderer from "@/components/portable-text-renderer";
import { cn } from "@/lib/utils";
import { PAGE_QUERYResult, ColorVariant } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitCardsList = Extract<
  NonNullable<SplitRow["splitColumns"]>[number],
  { _type: "split-cards-list" }
>;
type SplitCardItem = NonNullable<NonNullable<SplitCardsList["list"]>[number]>;

interface SplitCardsItemProps extends SplitCardItem {
  color?: ColorVariant;
  isActive?: boolean;
}

export default function SplitCardsItem({
  color,
  tagLine,
  title,
  body,
  isActive = false,
}: SplitCardsItemProps) {
  const isPrimary = color === "primary";

  return (
    <div
      className={cn(
        "flex flex-col items-start border border-primary px-6 lg:px-8 py-6 lg:py-8 transition-colors duration-1000 ease-in-out",
        isActive ? "bg-foreground/85" : "bg-background",
        isPrimary ? "text-background" : undefined
      )}
    >
      {tagLine && (
        <div
          className={cn(
            "font-bold text-2xl lg:text-3xl transition-colors duration-1000 ease-in-out",
            isActive ? "text-background" : "text-foreground",
            isPrimary ? "text-background" : undefined
          )}
        >
          {tagLine}
        </div>
      )}

      {title && (
        <div
          className={cn(
            "my-2 font-semibold text-2xl uppercase transition-colors duration-1000 ease-in-out",
            isActive ? "text-background" : "text-foreground",
            isPrimary ? "text-background" : undefined
          )}
        >
          {title}
        </div>
      )}

      {body && (
        <div
          className={cn(
            "transition-colors duration-1000 ease-in-out",
            isActive ? "text-background" : "text-foreground"
          )}
        >
          <PortableTextRenderer value={body} />
        </div>
      )}
    </div>
  );
}
