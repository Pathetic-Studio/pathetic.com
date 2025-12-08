// components/blocks/grid/draggable-grid-item.tsx
"use client";

import React, { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type DraggableGridItemProps = {
  id: string;
  children: React.ReactNode;
  isActive: boolean;
  onActivate: (id: string) => void;
  className?: string;
};

const DRAG_THRESHOLD = 4; // px before we consider it a drag

export default function DraggableGridItem({
  id,
  children,
  isActive,
  onActivate,
  className,
}: DraggableGridItemProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragState = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    hasMoved: boolean;
    bounds:
    | {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    }
    | null;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    hasMoved: false,
    bounds: null,
  });

  const getContainerRect = () => {
    const el = ref.current;
    if (!el) return null;

    // Bound to the grid wrapper (data-grab-container),
    // not the whole section, so items butt up to the grid edges.
    const container = el.closest(
      "[data-grab-container]"
    ) as HTMLElement | null;
    if (!container) return null;

    return container.getBoundingClientRect();
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Only primary button / pointer
    if (e.button !== 0) return;

    const el = ref.current;
    if (!el) return;

    const containerRect = getContainerRect();
    const itemRect = el.getBoundingClientRect();
    if (!containerRect) return;

    onActivate(id);

    const pointerId = e.pointerId;
    const originX = pos.x;
    const originY = pos.y;

    const minX = containerRect.left - itemRect.left + originX;
    const maxX = containerRect.right - itemRect.right + originX;
    const minY = containerRect.top - itemRect.top + originY;
    const maxY = containerRect.bottom - itemRect.bottom + originY;

    dragState.current = {
      pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX,
      originY,
      hasMoved: false,
      bounds: { minX, maxX, minY, maxY },
    };

    setIsDragging(false);
    el.setPointerCapture(pointerId);

    (document.activeElement as HTMLElement | null)?.blur();
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (state.pointerId === null || state.pointerId !== e.pointerId) return;
    if (!state.bounds) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    const distanceSq = dx * dx + dy * dy;

    if (!state.hasMoved) {
      if (distanceSq < DRAG_THRESHOLD * DRAG_THRESHOLD) {
        return;
      }

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // On touch: bail if it's mostly vertical so page can still scroll
      if (e.pointerType === "touch" && absDy > absDx) {
        dragState.current.pointerId = null;
        dragState.current.bounds = null;
        return;
      }

      state.hasMoved = true;
      setIsDragging(true);
    }

    let nextX = state.originX + dx;
    let nextY = state.originY + dy;

    // Clamp within the grid container bounds
    nextX = Math.min(state.bounds.maxX, Math.max(state.bounds.minX, nextX));
    nextY = Math.min(state.bounds.maxY, Math.max(state.bounds.minY, nextY));

    setPos({ x: nextX, y: nextY });

    // Once dragging, block default scroll/selection for this pointer
    e.preventDefault();
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (state.pointerId === null || state.pointerId !== e.pointerId) return;

    const el = ref.current;
    if (el && state.pointerId !== null) {
      try {
        el.releasePointerCapture(state.pointerId);
      } catch {
        // ignore
      }
    }

    dragState.current.pointerId = null;
    dragState.current.bounds = null;

    if (state.hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsDragging(false);
  };

  const style: CSSProperties = {
    transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "pan-y", // vertical page scroll still works when not dragging
    zIndex: isActive ? 40 : 10,
  };

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "relative transition-shadow duration-150",
        isActive && "",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {children}
    </div>
  );
}
