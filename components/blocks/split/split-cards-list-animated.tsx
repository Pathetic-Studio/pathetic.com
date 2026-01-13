//components/blocks/split/split-cards-list-animated.tsx
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
  activeIndex?: number;
  onHoverCard?: (index: number) => void;
}

export default function SplitCardsListAnimated({
  color,
  list,
  animateInRight,
  activeIndex = -1,
  onHoverCard,
}: SplitCardsListAnimatedProps) {
  const colorParent = stegaClean(color);

  if (!list || list.length === 0) return null;

  return (
    <div
      className={cn(
        // Mobile stacked deck; Desktop normal flow
        "relative overflow-visible min-h-[260px] sm:min-h-[320px] lg:min-h-0 flex flex-col",
        animateInRight ? "gap-8 lg:gap-0" : "gap-24",
      )}
      data-split-cards-container
    >
      {list.map((item, index) => {
        const isActive = activeIndex === index;

        return (
          <div
            key={index}
            data-card-item
            className={cn(
              // Mobile: all cards overlap
              "absolute inset-0",
              // Desktop: normal flow so diagonal offsets work
              "lg:static lg:inset-auto",
              "will-change-transform",
            )}
            style={{
              // Ensures correct stacking on mobile
              zIndex: 10 + index + (isActive ? 100 : 0),
            }}
            onMouseEnter={() => onHoverCard?.(index)}
            onFocus={() => onHoverCard?.(index)}
          >
            <SplitCardsItemAnimated
              color={colorParent}
              tagLine={item.tagLine}
              title={item.title}
              body={item.body}
              active={isActive}
            />
          </div>
        );
      })}
    </div>
  );
}
