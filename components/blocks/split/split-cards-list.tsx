// components/blocks/split/split-cards-list.tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stegaClean } from "next-sanity";
import SplitCardsItem from "@/components/blocks/split/split-cards-item";
import { PAGE_QUERYResult, ColorVariant } from "@/sanity.types";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitCardsListBase = Extract<
  NonNullable<SplitRow["splitColumns"]>[number],
  { _type: "split-cards-list" }
>;

interface SplitCardsListProps extends SplitCardsListBase {
  color?: ColorVariant;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

export default function SplitCardsList({
  color,
  list,
  activeIndex = 0,
  onActiveIndexChange,
}: SplitCardsListProps) {
  const colorParent = stegaClean(color);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ScrollTrigger drives activeIndex in both directions
  useEffect(() => {
    if (!containerRef.current || !list || list.length === 0) return;

    const container = containerRef.current;
    const elements = Array.from(
      container.querySelectorAll<HTMLElement>("[data-card-item]")
    );

    const triggers: ScrollTrigger[] = [];

    elements.forEach((el, index) => {
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: "top center+=10%",
        end: "bottom center-=10%",
        onEnter: () => onActiveIndexChange?.(index),
        onEnterBack: () => onActiveIndexChange?.(index),
      });

      triggers.push(trigger);
    });

    if (list.length > 0) {
      onActiveIndexChange?.(0);
    }

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [list?.length, onActiveIndexChange]);

  if (!list || list.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col justify-center gap-12"
      data-split-cards-container
    >
      {list.map((item, index) => {
        const isActive = index === activeIndex;

        return (
          <div
            key={index}
            data-card-item
            data-card-active={isActive ? "true" : "false"}
            className={cn(
              "transition-opacity duration-300",
              isActive ? "opacity-100" : "opacity-50"
            )}
          >
            <SplitCardsItem
              color={colorParent}
              tagLine={item.tagLine}
              title={item.title}
              body={item.body}
              isActive={isActive}
            />
          </div>
        );
      })}
    </div>
  );
}
