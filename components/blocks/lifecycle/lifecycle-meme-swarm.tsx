"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { PAGE_QUERYResult } from "@/sanity.types";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type LifecycleBlock = Extract<PageBlock, { _type: "lifecycle-slideshow" }>;
type MemeSlide = NonNullable<LifecycleBlock["memeSlide"]>;

type LifecycleMemeSwarmProps = {
  memes?: MemeSlide["memes"];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getScatterPosition(index: number, total: number) {
  const angle = index * 2.399963 + (index % 3) * 0.16;
  const band = (index % 5) / 4;
  const radiusX = 30 + band * 13;
  const radiusY = 27 + ((index * 3) % 5) * 3.2;
  const crowdOffset = total > 18 ? ((index % 2) - 0.5) * 4 : 0;

  return {
    x: clamp(50 + Math.cos(angle) * radiusX + crowdOffset, 6, 94),
    y: clamp(51 + Math.sin(angle) * radiusY, 14, 90),
  };
}

function getGatherPosition(index: number, total: number) {
  const columns = Math.min(3, Math.max(1, total));
  const rows = Math.ceil(total / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: 50 + (column - (columns - 1) / 2) * 11,
    y: 50 + (row - (rows - 1) / 2) * 19,
  };
}

export default function LifecycleMemeSwarm({
  memes,
}: LifecycleMemeSwarmProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const groups = (memes ?? []).filter((meme) => meme?.images?.length);
  const totalImages = groups.reduce(
    (total, meme) => total + (meme.images?.length ?? 0),
    0,
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = gsap.utils.toArray<HTMLElement>(
      "[data-lifecycle-meme-image]",
      root,
    );

    items.forEach((item) => {
      const groupIndex = Number(item.dataset.groupIndex ?? 0);
      const itemIndex = Number(item.dataset.itemIndex ?? 0);
      const groupSize = Number(item.dataset.groupSize ?? 1);
      const scatterX = Number(item.dataset.scatterX ?? 50);
      const scatterY = Number(item.dataset.scatterY ?? 50);
      const gather = getGatherPosition(itemIndex, groupSize);
      const belongsToActiveGroup = groupIndex === activeGroup;

      gsap.to(item, {
        left: `${activeGroup === null || !belongsToActiveGroup ? scatterX : gather.x}%`,
        top: `${activeGroup === null || !belongsToActiveGroup ? scatterY : gather.y}%`,
        autoAlpha:
          activeGroup === null || belongsToActiveGroup ? 1 : 0.12,
        scale: activeGroup === null ? 1 : belongsToActiveGroup ? 1.28 : 0.72,
        rotation: 0,
        rotationX: 0,
        rotationY: 0,
        zIndex: belongsToActiveGroup ? 30 + itemIndex : 10 + groupIndex,
        duration: 0.65,
        ease: "power3.inOut",
        overwrite: "auto",
      });
    });
  }, [activeGroup]);

  let globalIndex = 0;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0"
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") setActiveGroup(null);
      }}
    >
      {groups.map((meme, groupIndex) =>
        meme.images?.map((image, itemIndex) => {
          const itemGlobalIndex = globalIndex++;
          const position = getScatterPosition(itemGlobalIndex, totalImages);
          const imageUrl = image.asset?.url;
          if (!imageUrl) return null;

          const width = 48 + ((itemGlobalIndex * 17) % 42);
          const height = 48 + ((itemGlobalIndex * 11) % 38);
          return (
            <button
              type="button"
              key={image._key}
              data-lifecycle-meme-image
              data-group-index={groupIndex}
              data-item-index={itemIndex}
              data-group-size={meme.images?.length ?? 1}
              data-scatter-x={position.x}
              data-scatter-y={position.y}
              aria-label={`Gather ${meme.title || `meme ${groupIndex + 1}`}`}
              onPointerEnter={() => setActiveGroup(groupIndex)}
              onFocus={() => setActiveGroup(groupIndex)}
              onClick={() =>
                setActiveGroup((current) =>
                  current === groupIndex ? null : groupIndex,
                )
              }
              className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-foreground"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                width: `clamp(2.8rem, ${width / 12}vw, ${width}px)`,
                height: `clamp(2.8rem, ${height / 12}vw, ${height}px)`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span className="absolute -inset-1 rounded-sm bg-background/45 opacity-0 shadow-[0_12px_35px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-opacity group-hover:opacity-100" />
              <Image
                src={imageUrl}
                alt={image.alt || ""}
                fill
                sizes="(min-width: 1024px) 110px, 76px"
                className="relative object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.12)]"
              />
            </button>
          );
        }),
      )}

      {groups.length > 0 && (
        <div className="pointer-events-none absolute bottom-5 left-5 z-50 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-50 lg:bottom-8 lg:left-8 lg:text-xs">
          {activeGroup === null
            ? "Hover a fragment"
            : groups[activeGroup]?.title || `Meme ${activeGroup + 1}`}
        </div>
      )}
    </div>
  );
}
