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
  active?: boolean;
}

export default function SplitCardsItemAnimated({
  color,
  tagLine,
  title,
  body,
  active = false,
}: SplitCardsItemAnimatedProps) {
  const isPrimary = color === "primary";
  const baseTextClass = isPrimary ? "text-primary" : "text-foreground";

  return (
    <div
      className={cn(
        "flex flex-col items-start border px-6 lg:px-8 py-6 lg:py-8 transition-colors duration-500 ease-out h-full lg:h-auto",
        isPrimary ? "border-primary" : "border-foreground/40",
        // default look
        "bg-background",
        baseTextClass,
        // ACTIVE state: colour change only, no movement
        active && "bg-primary text-background",
      )}
    >
      {tagLine && (
        <div className="font-bold text-2xl lg:text-3xl transition-colors duration-500 ease-out">
          {tagLine}
        </div>
      )}

      {title && (
        <div className="my-2 font-semibold text-2xl uppercase transition-colors duration-500 ease-out">
          {title}
        </div>
      )}

      {body && (
        <div className="transition-colors duration-500 ease-out">
          <PortableTextRenderer value={body} />
        </div>
      )}
    </div>
  );
}
