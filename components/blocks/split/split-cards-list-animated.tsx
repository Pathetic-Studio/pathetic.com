// components/blocks/split/split-cards-list-animated.tsx
"use client";

import type { PAGE_QUERYResult, ColorVariant } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import { cn } from "@/lib/utils";
import SplitCardsItemAnimated from "./split-cards-item-animated";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRowAnimated = Extract<Block, { _type: "split-row-animated" }>;
type SplitColumnsAnimated = NonNullable<SplitRowAnimated["splitColumns"]>[number];
type SplitCardsListAnimatedBase = Extract<
  SplitColumnsAnimated,
  { _type: "split-cards-list-animated" }
>;

interface SplitCardsListAnimatedProps extends SplitCardsListAnimatedBase {
  color?: ColorVariant;
}

export default function SplitCardsListAnimated({
  color,
  list,
  animateInRight,
}: SplitCardsListAnimatedProps) {
  const colorParent = stegaClean(color);

  if (!list || list.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-visible",
        animateInRight ? "gap-8 lg:gap-0" : "gap-24",
      )}
      data-split-cards-container
    >
      {list.map((item, index) => {
        return (
          <div
            key={index}
            data-card-item
            className="transition-opacity duration-300"
          >
            <SplitCardsItemAnimated
              color={colorParent}
              tagLine={item.tagLine}
              title={item.title}
              body={item.body}
            />
          </div>
        );
      })}
    </div>
  );
}
