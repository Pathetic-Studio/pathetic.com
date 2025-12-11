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
  activeIndex?: number;
  onHoverCard?: (index: number) => void;
}

export default function SplitCardsListAnimated({
  color,
  list,
  animateInRight,
  activeIndex = 0,
  onHoverCard,
}: SplitCardsListAnimatedProps) {
  const colorParent = stegaClean(color);

  if (!list || list.length === 0) return null;

  return (
    <div
      className={cn(
        // Mobile: relative, fixed min height, stacked children via absolute
        // Desktop: same container, but children revert to normal layout
        "relative flex flex-col overflow-visible min-h-[260px] sm:min-h-[320px]",
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
              "transition-opacity duration-300 will-change-transform",
              // Mobile: all cards occupy the same space, stacked
              // Desktop: normal flow for diagonal offsets
              "absolute inset-0 lg:relative lg:inset-auto",
            )}
            style={{
              // ensure the active card is visually on top when stacked
              zIndex: isActive ? 100 : 10 + index,
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
