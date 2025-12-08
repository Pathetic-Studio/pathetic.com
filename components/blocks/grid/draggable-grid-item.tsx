"use client";

import React, { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type DraggableGridItemProps = {
  id: string;
  children: React.ReactNode;
  // For z-index control from parent
  isActive: boolean;
  onActivate: (id: string) => void;
};

const DRAG_THRESHOLD = 4; // px before we consider it a drag

export default function DraggableGridItem({
  id,
  children,
  isActive,
  onActivate,
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

    // Container is the closest parent marked as grab container
    const container = el.closest("[data-grab-container]") as HTMLElement | null;
    if (!container) return null;

    return container.getBoundingClientRect();
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Only left mouse or primary pointer
    if (e.button !== 0) return;

    const el = ref.current;
    if (!el) return;

    const containerRect = getContainerRect();
    const itemRect = el.getBoundingClientRect();

    if (!containerRect) return;

    // Restrict drag to mouse / fine pointers so touch scroll still works
    if (e.pointerType === "touch" || e.pointerType === "pen") return;

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

    // Prevent text selection
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (state.pointerId === null || state.pointerId !== e.pointerId) return;
    if (!state.bounds) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    const distanceSq = dx * dx + dy * dy;

    // Don’t start a drag until the pointer has moved enough
    if (!state.hasMoved && distanceSq < DRAG_THRESHOLD * DRAG_THRESHOLD) {
      return;
    }

    if (!state.hasMoved) {
      state.hasMoved = true;
      setIsDragging(true);
    }

    let nextX = state.originX + dx;
    let nextY = state.originY + dy;

    // Clamp inside container
    nextX = Math.min(state.bounds.maxX, Math.max(state.bounds.minX, nextX));
    nextY = Math.min(state.bounds.maxY, Math.max(state.bounds.minY, nextY));

    setPos({ x: nextX, y: nextY });

    // Stop page from scrolling while dragging with mouse
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

    // If we actually dragged, don’t treat this as a click
    if (state.hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsDragging(false);
  };

  const style: CSSProperties = {
    transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "pan-y", // allow vertical scroll on touch
    zIndex: isActive ? 40 : 10,
  };

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "relative",
        "transition-shadow duration-150",
        isActive && ""
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
