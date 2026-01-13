// components/blocks/split/split-cards-list-animated.tsx
"use client";

import { useLayoutEffect, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync stacked card heights on tablet/mobile so the deck doesn't jump.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mql = window.matchMedia("(max-width: 1023.98px)");
    let rafId = 0;
    let ro: ResizeObserver | null = null;
    let items: HTMLElement[] = [];

    const collectItems = () => {
      items = Array.from(
        container.querySelectorAll<HTMLElement>("[data-card-item]"),
      );
    };

    const clearHeights = () => {
      container.style.height = "";
      container.style.removeProperty("--split-card-max-h");
      items.forEach((el) => {
        el.style.height = "";
      });
    };

    const applyHeights = () => {
      if (!mql.matches) {
        clearHeights();
        return;
      }

      if (!items.length) {
        clearHeights();
        return;
      }

      items.forEach((el) => {
        el.style.height = "";
      });
      container.style.height = "";

      let max = 0;
      items.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.height > max) max = rect.height;
      });

      if (!max) {
        clearHeights();
        return;
      }

      const height = Math.ceil(max);
      container.style.setProperty("--split-card-max-h", `${height}px`);
      container.style.height = `${height}px`;
      items.forEach((el) => {
        el.style.height = `${height}px`;
      });
    };

    const schedule = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(applyHeights);
    };

    const onChange = () => schedule();

    collectItems();
    schedule();

    window.addEventListener("resize", schedule);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(schedule);
      ro = observer;
      items.forEach((el) => observer.observe(el));
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", schedule);
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
      ro?.disconnect();
    };
  }, [list]);

  if (!list || list.length === 0) return null;

  return (
    <div
      className={cn(
        "relative overflow-visible min-h-[260px] sm:min-h-[320px] lg:min-h-0 flex flex-col",
        animateInRight ? "gap-8 lg:gap-0" : "gap-24",
      )}
      data-split-cards-container
      ref={containerRef}
    >
      {list.map((item, index) => {
        const isActive = activeIndex === index;

        return (
          <div
            key={index}
            data-card-item
            className={cn(
              // Mobile: overlap, but DON'T use inset-0 (it forces right:0 and blocks width shrinking)
              "absolute top-0 left-0 w-full",
              // Desktop: normal flow
              "lg:static lg:w-auto",
              "will-change-transform",
            )}
            style={{
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
