// components/effects/eye-follow.tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";

type EyeConfig = {
    _key?: string;
    x?: number | null; // percentage across section (desktop)
    y?: number | null; // percentage down section (desktop)
    size?: number | null; // base eye diameter in px (desktop)

    xMobile?: number | null; // percentage across section (mobile)
    yMobile?: number | null; // percentage down section (mobile)
    sizeMobile?: number | null; // base eye diameter in px (mobile)
};

type EyeFollowProps = {
    containerId: string;
    eyes?: EyeConfig[];
    enableClickToAdd?: boolean;
    minSpawnScale?: number;
    maxSpawnScale?: number;
    avoidSpawnOverlap?: boolean;
    rollOnExistingClick?: boolean;
    spawnGap?: number;
    edgePadding?: number;
    staggerOnEnter?: boolean;
    staggerEnterDelayMs?: number;
    staggerEnterRootMargin?: string;
};

type MousePos = { x: number; y: number } | null;
type Rect = { width: number; height: number } | null;

type Offset = { x: number; y: number };

type EyePhysics = {
    pos: Offset;
    vel: Offset;
    radius: number;
};

function getEyeMetrics(
    eye: EyeConfig,
    isMobile: boolean,
    rect: Rect,
    edgePadding: number,
) {
    const baseX = typeof eye.x === "number" ? eye.x : 50;
    const baseY = typeof eye.y === "number" ? eye.y : 50;
    const baseSize = eye.size ?? 72;
    const rawX =
        isMobile && typeof eye.xMobile === "number" ? eye.xMobile : baseX;
    const rawY =
        isMobile && typeof eye.yMobile === "number" ? eye.yMobile : baseY;
    const size =
        isMobile && typeof eye.sizeMobile === "number"
            ? eye.sizeMobile
            : baseSize;

    if (!rect?.width || !rect.height) {
        return { xPercent: rawX, yPercent: rawY, size };
    }

    const xInset = Math.min(50, ((size * 0.5 + edgePadding) / rect.width) * 100);
    const yInset = Math.min(50, ((size * 0.5 + edgePadding) / rect.height) * 100);

    return {
        xPercent: Math.min(100 - xInset, Math.max(xInset, rawX)),
        yPercent: Math.min(100 - yInset, Math.max(yInset, rawY)),
        size,
    };
}

export default function EyeFollow({
    containerId,
    eyes,
    enableClickToAdd,
    minSpawnScale,
    maxSpawnScale,
    avoidSpawnOverlap = false,
    rollOnExistingClick = false,
    spawnGap = 8,
    edgePadding = 0,
    staggerOnEnter = false,
    staggerEnterDelayMs = 0,
    staggerEnterRootMargin = "0px 0px -22% 0px",
}: EyeFollowProps) {
    const [mouse, setMouse] = useState<MousePos>(null);
    const [rect, setRect] = useState<Rect>(null);
    const [pupilOffsets, setPupilOffsets] = useState<Record<string, Offset>>({});
    const [internalEyes, setInternalEyes] = useState<EyeConfig[]>(() => eyes ?? []);
    const [isMobile, setIsMobile] = useState(false);
    const [eyeRolls, setEyeRolls] = useState<Record<string, number>>({});
    const [activeEyeRolls, setActiveEyeRolls] = useState<Record<string, boolean>>({});
    const [eyesVisible, setEyesVisible] = useState(!staggerOnEnter);

    const mouseRef = useRef<MousePos>(null);
    const rectRef = useRef<Rect>(null);
    const physicsRef = useRef<Record<string, EyePhysics>>({});
    const rollTimersRef = useRef<Record<string, number>>({});
    const activeEyeRollsRef = useRef<Record<string, boolean>>({});

    const baseSpawnSize = 72;
    const rawMin = minSpawnScale ?? 0.3;
    const rawMax = maxSpawnScale ?? 1.7;
    const spawnMin = Math.min(rawMin, rawMax);
    const spawnMax = Math.max(rawMin, rawMax);

    // Sync internal eyes with CMS
    useEffect(() => {
        setInternalEyes(eyes ?? []);
    }, [eyes]);

    // Track mobile vs desktop (TS-safe)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const mq = window.matchMedia("(max-width: 767px)");

        const handleChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        // Initial
        setIsMobile(mq.matches);

        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", handleChange);
            return () => mq.removeEventListener("change", handleChange);
        } else {
            // Safari / older browsers
            mq.addListener(handleChange as any);
            return () => mq.removeListener(handleChange as any);
        }
    }, []);

    // Keep refs in sync for RAF loop
    useEffect(() => {
        mouseRef.current = mouse;
    }, [mouse]);

    useEffect(() => {
        rectRef.current = rect;
    }, [rect]);

    useEffect(() => {
        const timers = rollTimersRef.current;
        return () => {
            Object.values(timers).forEach((timer) => window.clearTimeout(timer));
        };
    }, []);

    // Measure immediately so CMS-authored eyes are kept fully inside the area,
    // even before the pointer first enters it.
    useEffect(() => {
        const el = document.getElementById(containerId);
        if (!el) return;

        const updateRect = () => {
            const nextRect = el.getBoundingClientRect();
            setRect({ width: nextRect.width, height: nextRect.height });
        };

        updateRect();
        const observer = new ResizeObserver(updateRect);
        observer.observe(el);

        return () => observer.disconnect();
    }, [containerId]);

    useEffect(() => {
        if (!staggerOnEnter) {
            setEyesVisible(true);
            return;
        }

        const el = document.getElementById(containerId);
        if (!el) return;

        setEyesVisible(false);
        let revealTimer = 0;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting) return;
                const reduceMotion = window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                ).matches;
                revealTimer = window.setTimeout(
                    () => setEyesVisible(true),
                    reduceMotion ? 0 : Math.max(0, staggerEnterDelayMs),
                );
                observer.disconnect();
            },
            { rootMargin: staggerEnterRootMargin, threshold: 0.01 },
        );

        observer.observe(el);
        return () => {
            window.clearTimeout(revealTimer);
            observer.disconnect();
        };
    }, [
        containerId,
        staggerEnterDelayMs,
        staggerEnterRootMargin,
        staggerOnEnter,
    ]);

    // Pointer tracking and click-to-add
    useEffect(() => {
        if (!internalEyes || internalEyes.length === 0) return;

        const el = document.getElementById(containerId);
        if (!el) return;

        const handleMove = (event: PointerEvent) => {
            if (event.pointerType === "touch") {
                setMouse(null);
                return;
            }
            const r = el.getBoundingClientRect();
            const localX = event.clientX - r.left;
            const localY = event.clientY - r.top;

            if (localX < 0 || localY < 0 || localX > r.width || localY > r.height) {
                setMouse(null);
                return;
            }

            setMouse({ x: localX, y: localY });
            setRect({ width: r.width, height: r.height });
        };

        const handleLeave = () => {
            setMouse(null);
        };

        const handleDown = (event: PointerEvent) => {
            if (!enableClickToAdd) return;

            const r = el.getBoundingClientRect();
            const localX = event.clientX - r.left;
            const localY = event.clientY - r.top;

            if (localX < 0 || localY < 0 || localX > r.width || localY > r.height) {
                return;
            }

            const xPercent = (localX / r.width) * 100;
            const yPercent = (localY / r.height) * 100;

            const scale =
                spawnMin === spawnMax
                    ? spawnMin
                    : spawnMin + Math.random() * (spawnMax - spawnMin);

            const size = baseSpawnSize * scale;

            const occupiedEye = internalEyes.find((eye) => {
                const metrics = getEyeMetrics(eye, isMobile, rectRef.current, edgePadding);
                const centerX = (metrics.xPercent / 100) * r.width;
                const centerY = (metrics.yPercent / 100) * r.height;
                const distance = Math.hypot(localX - centerX, localY - centerY);

                return distance <= metrics.size * 0.5;
            });

            if (occupiedEye) {
                if (rollOnExistingClick) {
                    const metrics = getEyeMetrics(
                        occupiedEye,
                        isMobile,
                        rectRef.current,
                        edgePadding,
                    );
                    const key =
                        occupiedEye._key ??
                        `${metrics.xPercent}-${metrics.yPercent}-${metrics.size}-${isMobile ? "m" : "d"}`;

                    setEyeRolls((current) => ({
                        ...current,
                        [key]: (current[key] ?? 0) + 1,
                    }));
                    activeEyeRollsRef.current[key] = true;
                    setActiveEyeRolls((current) => ({ ...current, [key]: true }));
                    window.clearTimeout(rollTimersRef.current[key]);
                    rollTimersRef.current[key] = window.setTimeout(() => {
                        activeEyeRollsRef.current[key] = false;
                        const physics = physicsRef.current[key];
                        if (physics) {
                            physics.vel.x = 0;
                            physics.vel.y = 0;
                        }
                        setActiveEyeRolls((current) => ({
                            ...current,
                            [key]: false,
                        }));
                    }, 780);
                }
                return;
            }

            if (avoidSpawnOverlap) {
                const wouldOverlap = internalEyes.some((eye) => {
                    const metrics = getEyeMetrics(eye, isMobile, rectRef.current, edgePadding);
                    const centerX = (metrics.xPercent / 100) * r.width;
                    const centerY = (metrics.yPercent / 100) * r.height;
                    const distance = Math.hypot(localX - centerX, localY - centerY);
                    const minimumDistance =
                        metrics.size * 0.5 + size * 0.5 + Math.max(0, spawnGap);

                    return distance < minimumDistance;
                });

                if (wouldOverlap) return;
            }

            const xInset = Math.min(50, ((size * 0.5 + edgePadding) / r.width) * 100);
            const yInset = Math.min(50, ((size * 0.5 + edgePadding) / r.height) * 100);
            const newEye: EyeConfig = {
                _key: `spawn-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                x: Math.min(100 - xInset, Math.max(xInset, xPercent)),
                y: Math.min(100 - yInset, Math.max(yInset, yPercent)),
                size,
            };

            setInternalEyes((prev) => [...prev, newEye]);
        };

        el.addEventListener("pointermove", handleMove);
        el.addEventListener("pointerleave", handleLeave);
        el.addEventListener("pointerdown", handleDown);

        return () => {
            el.removeEventListener("pointermove", handleMove);
            el.removeEventListener("pointerleave", handleLeave);
            el.removeEventListener("pointerdown", handleDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        avoidSpawnOverlap,
        containerId,
        edgePadding,
        enableClickToAdd,
        internalEyes,
        isMobile,
        rollOnExistingClick,
        spawnGap,
        spawnMax,
        spawnMin,
    ]);

    // Physics loop
    useEffect(() => {
        if (!internalEyes || internalEyes.length === 0) return;

        const nextPhysics: Record<string, EyePhysics> = { ...physicsRef.current };

        for (const eye of internalEyes) {
            const { xPercent, yPercent, size } = getEyeMetrics(
                eye,
                isMobile,
                rectRef.current,
                edgePadding,
            );
            const radius = size * 0.2;
            const key =
                eye._key ?? `${xPercent}-${yPercent}-${size}-${isMobile ? "m" : "d"}`;

            if (!nextPhysics[key]) {
                nextPhysics[key] = {
                    pos: { x: 0, y: radius },
                    vel: { x: 0, y: 0 },
                    radius,
                };
            } else {
                nextPhysics[key].radius = radius;
            }
        }

        physicsRef.current = nextPhysics;

        let rafId: number;
        let lastTime = performance.now();
        let visible = false;
        const container = document.getElementById(containerId);
        const visibilityObserver = container
            ? new IntersectionObserver(
                ([entry]) => {
                    visible = entry?.isIntersecting ?? false;
                },
                { rootMargin: "20% 0px" },
            )
            : null;
        if (container) visibilityObserver?.observe(container);

        const step = (time: number) => {
            if (!visible) {
                lastTime = time;
                rafId = requestAnimationFrame(step);
                return;
            }
            const dt = Math.min((time - lastTime) / 1000, 0.032);
            lastTime = time;

            const mouseLocal = mouseRef.current;
            const rectLocal = rectRef.current;

            const gravity = 1800;
            const globalDamping = 1;
            const springK = 600;
            const springDamping = 20;

            const newOffsets: Record<string, Offset> = {};

            for (const eye of internalEyes) {
                const { xPercent, yPercent, size } = getEyeMetrics(
                    eye,
                    isMobile,
                    rectRef.current,
                    edgePadding,
                );
                const key =
                    eye._key ?? `${xPercent}-${yPercent}-${size}-${isMobile ? "m" : "d"}`;

                const phys = physicsRef.current[key];
                if (!phys) continue;

                const { pos, vel } = phys;
                const radius = phys.radius;

                if (activeEyeRollsRef.current[key]) {
                    vel.x = 0;
                    vel.y = 0;
                    newOffsets[key] = { x: pos.x, y: pos.y };
                    continue;
                }

                const hasMouse = !!mouseLocal && !!rectLocal;

                if (!hasMouse) {
                    vel.y += gravity * dt;
                } else {
                    const centerX = (xPercent / 100) * rectLocal!.width;
                    const centerY = (yPercent / 100) * rectLocal!.height;
                    const dx = mouseLocal!.x - centerX;
                    const dy = mouseLocal!.y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                    const targetMag = Math.min(dist, radius);
                    const target = {
                        x: (dx / dist) * targetMag,
                        y: (dy / dist) * targetMag,
                    };

                    const ax = (target.x - pos.x) * springK - vel.x * springDamping;
                    const ay = (target.y - pos.y) * springK - vel.y * springDamping;

                    vel.x += ax * dt;
                    vel.y += ay * dt;
                }

                // Integrate
                pos.x += vel.x * dt;
                pos.y += vel.y * dt;

                // Constraint + bounce
                const len = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
                if (len > radius) {
                    const nx = pos.x / len;
                    const ny = pos.y / len;

                    pos.x = nx * radius;
                    pos.y = ny * radius;

                    const dot = vel.x * nx + vel.y * ny;
                    vel.x = (vel.x - 1.6 * dot * nx) * globalDamping;
                    vel.y = (vel.y - 1.6 * dot * ny) * globalDamping;
                } else {
                    vel.x *= globalDamping;
                    vel.y *= globalDamping;
                }

                newOffsets[key] = { x: pos.x, y: pos.y };
            }

            setPupilOffsets(newOffsets);
            rafId = requestAnimationFrame(step);
        };

        rafId = requestAnimationFrame((t) => {
            lastTime = t;
            step(t);
        });

        return () => {
            cancelAnimationFrame(rafId);
            visibilityObserver?.disconnect();
        };
    }, [containerId, edgePadding, internalEyes, isMobile]);

    if (!internalEyes || internalEyes.length === 0) return null;

    return (
        <div
            className={`pointer-events-none absolute inset-0 z-10 ${eyesVisible ? "eyes-visible" : ""}`}
            aria-hidden="true"
        >
            {internalEyes.map((eye, index) => {
                const { xPercent, yPercent, size } = getEyeMetrics(
                    eye,
                    isMobile,
                    rect,
                    edgePadding,
                );

                const pupilMaxOffset = size * 0.2;
                const key =
                    eye._key ?? `${xPercent}-${yPercent}-${size}-${isMobile ? "m" : "d"}`;
                const isSpawnedEye = key.startsWith("spawn-");
                const offset = pupilOffsets[key] ?? {
                    x: 0,
                    y: pupilMaxOffset,
                };
                const rollCount = eyeRolls[key] ?? 0;
                const isRolling = activeEyeRolls[key] === true;
                const rollRadius = Math.min(
                    pupilMaxOffset,
                    Math.hypot(offset.x, offset.y),
                );
                const rollStartAngle =
                    (Math.atan2(offset.y, offset.x) * 180) / Math.PI + 90;

                return (
                    <div
                        key={key}
                        className="eye-entry absolute"
                        style={{
                            left: `${xPercent}%`,
                            top: `${yPercent}%`,
                            width: size,
                            height: size,
                            animationDelay: isSpawnedEye ? "0ms" : `${index * 95}ms`,
                            animationDuration: isSpawnedEye ? "240ms" : "560ms",
                        }}
                    >
                        <div
                            className="relative w-full h-full overflow-hidden"
                            style={{
                                borderRadius: size * 0.5,
                                boxShadow:
                                    "0 8px 18px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.18) inset",
                            }}
                        >
                            <Image
                                src="/eye/base.png"
                                alt="Eye base"
                                fill
                                priority={false}
                                draggable={false}
                                style={{
                                    objectFit: "cover",
                                }}
                            />

                            <div
                                key={`${key}-roll-${rollCount}`}
                                className={isRolling ? "eye-roll" : undefined}
                                style={
                                    {
                                        position: "absolute",
                                        inset: 0,
                                        "--eye-roll-start-angle": `${rollStartAngle}deg`,
                                    } as CSSProperties
                                }
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        width: size * 0.45,
                                        height: size * 0.45,
                                        transform: isRolling
                                            ? `translate(-50%, -50%) translateY(-${rollRadius}px)`
                                            : `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                                        borderRadius: "9999px",
                                        background: "black",
                                        boxShadow:
                                            "0 0 0 2px rgba(0,0,0,0.7), 0 0 10px rgba(0,0,0,0.5) inset",
                                    }}
                                />
                            </div>

                            <Image
                                src="/eye/highlight.png"
                                alt="Eye highlight"
                                fill
                                priority={false}
                                draggable={false}
                                style={{
                                    opacity: "75%",
                                    objectFit: "cover",
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                    </div>
                );
            })}
            <style jsx>{`
                .eye-entry {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.25);
                }

                .eyes-visible .eye-entry {
                    animation: eye-pop 560ms cubic-bezier(0.2, 1.5, 0.42, 1) both;
                }

                .eye-roll {
                    animation: eye-roll 760ms cubic-bezier(0.45, 0, 0.2, 1) both;
                    transform-origin: center;
                }

                @keyframes eye-pop {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.25);
                    }
                    68% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.12);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }

                @keyframes eye-roll {
                    from {
                        transform: rotate(var(--eye-roll-start-angle));
                    }
                    to {
                        transform: rotate(calc(var(--eye-roll-start-angle) + 360deg));
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .eyes-visible .eye-entry,
                    .eye-roll {
                        animation-duration: 1ms;
                    }
                }
            `}</style>
        </div>
    );
}
