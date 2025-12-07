// components/blocks/split/split-cards-list-animated.tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult, ColorVariant } from "@/sanity.types";
import { cn } from "@/lib/utils";
import SplitCardsItemAnimated from "./split-cards-item-animated";

gsap.registerPlugin(ScrollTrigger);

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
  onActiveIndexChange?: (index: number) => void;
}

export default function SplitCardsListAnimated({
  color,
  list,
  animateInRight,
  activeIndex = 0,
  onActiveIndexChange,
}: SplitCardsListAnimatedProps) {
  const colorParent = stegaClean(color);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !list || list.length === 0) return;

    const isDesktop =
      typeof window !== "undefined" ? window.innerWidth >= 1024 : false;

    // On desktop when animateInRight is true, the parent pinned GSAP
    // timeline controls the cards, so we skip here.
    if (animateInRight && isDesktop) return;

    const container = containerRef.current;
    const elements = Array.from(
      container.querySelectorAll<HTMLElement>("[data-card-item]"),
    );

    const triggers: ScrollTrigger[] = [];

    elements.forEach((el, index) => {
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: "top center+=15%",
        end: "bottom center-=15%",
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
  }, [list?.length, onActiveIndexChange, animateInRight]);

  if (!list || list.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col overflow-visible",
        animateInRight ? "gap-8 lg:gap-0" : "gap-24",
      )}
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
              !animateInRight && (isActive ? "opacity-100" : "opacity-50"),
            )}
          >
            <SplitCardsItemAnimated
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
