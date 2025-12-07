// components/effects/mouse-trail.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type MouseTrailImage = {
    _key?: string;
    url?: string | null;
};

type MouseTrailProps = {
    images?: MouseTrailImage[];
    containerId: string;
};

type TrailPoint = {
    id: number;
    x: number;
    y: number;
    imageIndex: number;
    createdAt: number;
};

const MAX_TRAIL_POINTS = 24;
const MIN_DISTANCE = 8; // smaller = closer to cursor path
const POINT_LIFETIME_MS = 1800; // total life
const CLEANUP_INTERVAL_MS = 60;
const TRAIL_IMAGE_SIZE = 150;

export default function MouseTrail({ images, containerId }: MouseTrailProps) {
    const [trail, setTrail] = useState<TrailPoint[]>([]);
    const lastSpawnPosRef = useRef<{ x: number; y: number } | null>(null);
    const containerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!images || images.length === 0) return;

        const el = document.getElementById(containerId);
        if (!el) return;
        containerRef.current = el;

        const handleMove = (event: PointerEvent) => {
            const rect = el.getBoundingClientRect();
            const localX = event.clientX - rect.left;
            const localY = event.clientY - rect.top;

            // ignore moves outside the section
            if (
                localX < 0 ||
                localY < 0 ||
                localX > rect.width ||
                localY > rect.height
            ) {
                return;
            }

            const lastSpawn = lastSpawnPosRef.current;
            if (lastSpawn) {
                const dx = localX - lastSpawn.x;
                const dy = localY - lastSpawn.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MIN_DISTANCE) return; // keep them spaced but not laggy
            }

            // update last spawn position to current pointer position
            lastSpawnPosRef.current = { x: localX, y: localY };

            setTrail((prev) => {
                const now = Date.now();
                const next: TrailPoint[] = [
                    ...prev,
                    {
                        id: now + Math.random(),
                        x: localX,
                        y: localY,
                        imageIndex: Math.floor(Math.random() * images.length),
                        createdAt: now,
                    },
                ];

                if (next.length > MAX_TRAIL_POINTS) {
                    return next.slice(next.length - MAX_TRAIL_POINTS);
                }

                return next;
            });
        };

        el.addEventListener("pointermove", handleMove, { passive: true });

        return () => {
            el.removeEventListener("pointermove", handleMove);
        };
    }, [images, containerId]);

    // Cleanup: remove after POINT_LIFETIME_MS → triggers exit animation
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setTrail((prev) =>
                prev.filter((point) => now - point.createdAt < POINT_LIFETIME_MS),
            );
        }, CLEANUP_INTERVAL_MS);

        return () => clearInterval(interval);
    }, []);

    if (!images || images.length === 0) return null;

    return (
        <div
            className="pointer-events-none absolute inset-0 z-[60]"
            aria-hidden="true"
        >
            <AnimatePresence>
                {trail.map((point) => {
                    const img = images[point.imageIndex];
                    if (!img?.url) return null;

                    return (
                        <motion.img
                            key={point.id}
                            src={img.url ?? ""}
                            alt=""
                            style={{
                                position: "absolute",
                                left: point.x,
                                top: point.y,
                                width: TRAIL_IMAGE_SIZE,
                                height: TRAIL_IMAGE_SIZE,
                                objectFit: "contain",
                                transform: "translate(-50%, -50%)",
                                willChange: "transform, opacity",
                            }}
                            initial={{
                                scale: 0.85,
                                opacity: 0.9,
                            }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                            }}
                            exit={{
                                scale: 0.7,
                                opacity: 0,
                                transition: {
                                    duration: 0.25,
                                    ease: "easeInOut",
                                },
                            }}
                            transition={{
                                duration: 0.12,
                                ease: "easeOut",
                            }}
                        />
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
