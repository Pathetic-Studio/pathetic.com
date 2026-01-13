// components/blocks/split/effects/lens-flare.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type LensFlarePreset = "star" | "cluster-star" | "conic" | "streak" | "combo";
type CenterPoint = { xPct?: number; yPct?: number };
type IntRange = { min: number; max: number };

export type LensFlareAnimStyle = "none" | "spin" | "drift" | "wobble";

export interface LensFlareProps {
    isActive: boolean;
    preset?: LensFlarePreset;

    center?: CenterPoint;
    size?: string;
    clampToContainer?: boolean;

    hue?: number;

    /**
     * Strength: affects color punch. Does NOT add blur.
     * (Visibility is controlled by `opacity` + intensity + active fade.)
     */
    intensity?: number;

    /** Global wrapper blur (px). */
    blurAmount?: number;

    /** Glow multiplier. bloom=0 removes glow layers but keeps crisp cores visible. */
    bloom?: number;

    points?: number;
    clusterLinesRange?: IntRange;
    clusterSpreadDeg?: number;
    seed?: number;

    /**
     * Blend mode over the image.
     * Applied on the positioned wrapper to ensure it blends with parent content.
     */
    mixBlendMode?: React.CSSProperties["mixBlendMode"];

    /** Helps contain blend interactions. */
    isolate?: boolean;

    debugCenter?: boolean;

    /** Animation style applied to the flare group. */
    animStyle?: LensFlareAnimStyle;

    /** Animation speed multiplier (1 = default). */
    animSpeed?: number;

    /** Entrance/exit animation for turning on/off. */
    appearDuration?: number;
    appearDelay?: number;
    appearEase?: "easeOut" | "easeInOut" | "linear";
    appearScaleFrom?: number;
    disappearDuration?: number;
    disappearEase?: "easeOut" | "easeInOut" | "linear";

    /**
     * Opacity multiplier (0..1 typical).
     * Final opacity = opacity * clamp(0.9*intensity) * active fade
     */
    opacity?: number;

    className?: string;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function clampInt(n: number, min: number, max: number) {
    return Math.round(clamp(n, min, max));
}

function hsl(h: number, s: number, l: number, a: number) {
    // Higher saturation defaults elsewhere now so hue is actually visible (was near-white before).
    return `hsl(${h} ${s}% ${l}% / ${a})`;
}

function normalizeRange(r?: IntRange): IntRange {
    const min = clampInt(r?.min ?? 3, 1, 24);
    const max = clampInt(r?.max ?? 5, 1, 24);
    return { min: Math.min(min, max), max: Math.max(min, max) };
}

function scaleDuration(base: number, speed: number) {
    const s = clamp(speed, 0.05, 20);
    return base / s;
}

/** Deterministic string->uint32 hash */
function hashToSeed(input: string) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** Small deterministic PRNG */
function mulberry32(seed: number) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function coreLineGradient(hue: number, a: number) {
    // Was effectively white before (low sat / very high lightness), so hue barely showed.
    return `linear-gradient(90deg,
    transparent 0%,
    ${hsl(hue, 78, 92, a)} 46%,
    ${hsl(hue, 78, 92, a)} 54%,
    transparent 100%
  )`;
}

function glowLineGradient(hue: number, aStrong: number, aMid: number) {
    return `radial-gradient(ellipse at center,
    ${hsl(hue, 90, 78, aStrong)} 0%,
    ${hsl(hue, 78, 65, aMid)} 34%,
    transparent 82%
  )`;
}

function getCssAnimClass(style: LensFlareAnimStyle) {
    switch (style) {
        case "spin":
            return "lensflare-spin";
        case "drift":
            return "lensflare-drift";
        case "wobble":
            return "lensflare-wobble";
        default:
            return "";
    }
}

export function LensFlare({
    isActive,
    preset = "combo",
    center,
    size = "100%",
    clampToContainer = true,
    hue = 4,
    intensity = 1,
    blurAmount = 0,
    bloom = 1,
    points = 4,
    clusterLinesRange,
    clusterSpreadDeg = 8,
    seed,
    mixBlendMode = "screen",
    isolate = true,
    debugCenter = false,
    animStyle = "spin",
    animSpeed = 1,
    appearDuration = 0.65,
    appearDelay = 0,
    appearEase = "easeOut",
    appearScaleFrom = 0.975,
    disappearDuration = 0.45,
    disappearEase = "easeOut",
    opacity = 1,
    className,
}: LensFlareProps) {
    const x = center?.xPct ?? 50;
    const y = center?.yPct ?? 50;

    const i = clamp(intensity, 0, 3);
    const blurMul = clamp(blurAmount, 0, 40);
    const bloomMul = clamp(bloom, 0, 3);

    // base visibility from intensity + explicit opacity multiplier
    const baseOpacity = clamp(0.9 * i, 0, 1) * clamp(opacity, 0, 1);

    // Color punch from intensity, blur only from blurAmount.
    const filter = `brightness(${1.08 + 0.35 * i}) contrast(${1.02 + 0.15 * i}) saturate(${1.15 + 0.55 * i
        }) blur(${blurMul}px)`;

    const pointsClamped = clampInt(points, 1, 24);
    const range = normalizeRange(clusterLinesRange);

    const resolvedSeed = useMemo(() => {
        return (
            seed ??
            hashToSeed(
                [
                    // Only include geometry-driving inputs so we don't regenerate rays while fading.
                    preset,
                    hue,
                    pointsClamped,
                    range.min,
                    range.max,
                    clusterSpreadDeg,
                ].join("|"),
            )
        );
    }, [seed, preset, hue, pointsClamped, range.min, range.max, clusterSpreadDeg]);

    const initialSpinReady = isActive && appearDuration + appearDelay === 0;
    const [spinReady, setSpinReady] = useState(initialSpinReady);
    const wasActiveRef = useRef(isActive);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        if (isActive) {
            const isEntering = !wasActiveRef.current;
            const delayMs = Math.max(0, (appearDuration + appearDelay) * 1000);
            if (delayMs === 0 && !isEntering) {
                setSpinReady(true);
            } else {
                setSpinReady(false);
                timer = setTimeout(() => setSpinReady(true), delayMs);
            }
        } else {
            setSpinReady(false);
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [isActive, appearDelay, appearDuration]);

    useEffect(() => {
        wasActiveRef.current = isActive;
    }, [isActive]);

    const cssAnimClass = isActive && spinReady ? getCssAnimClass(animStyle) : "";
    const baseAnimDuration =
        animStyle === "spin" ? 28 : animStyle === "drift" ? 14 : animStyle === "wobble" ? 6 : 0.6;
    const cssAnimDuration = scaleDuration(baseAnimDuration, animSpeed);

    return (
        <div
            className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
            style={{ contain: "paint" }}
        >
            {/* Positioned wrapper (blend here) */}
            <div
                className="absolute"
                style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                    width: size,
                    height: size,
                    ...(clampToContainer ? { maxWidth: "100%", maxHeight: "100%" } : {}),
                    mixBlendMode,
                    ...(isolate ? { isolation: "isolate" as const } : {}),
                }}
            >
                <motion.div
                    className="absolute inset-0"
                    style={{ filter, willChange: "transform, opacity" }}
                    initial={false}
                    animate={
                        isActive ? { opacity: baseOpacity, scale: 1 } : { opacity: 0, scale: appearScaleFrom }
                    }
                    transition={
                        isActive
                            ? { duration: appearDuration, delay: appearDelay, ease: appearEase }
                            : { duration: disappearDuration, ease: disappearEase }
                    }
                >
                    <div
                        className="absolute inset-0"
                        style={{ transformOrigin: "center center" }}
                    >
                        <div
                            className={`absolute inset-0 ${cssAnimClass}`}
                            style={
                                cssAnimClass
                                    ? ({ ["--lf-dur" as any]: `${cssAnimDuration}s` } as any)
                                    : undefined
                            }
                        >
                            {debugCenter && (
                                <div
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                                    style={{ width: 8, height: 8, background: "white", opacity: 0.95 }}
                                />
                            )}

                            <CenterCore hue={hue} bloom={bloomMul} blurAmount={blurMul} />

                            {(preset === "streak" || preset === "combo") && (
                                <StreakGroup hue={hue} bloom={bloomMul} blurAmount={blurMul} />
                            )}

                            {(preset === "star" || preset === "combo") && (
                                <StarRays hue={hue} bloom={bloomMul} blurAmount={blurMul} points={pointsClamped} />
                            )}

                            {preset === "cluster-star" && (
                                <ClusterStarRays
                                    hue={hue}
                                    bloom={bloomMul}
                                    blurAmount={blurMul}
                                    points={pointsClamped}
                                    range={range}
                                    spreadDeg={clusterSpreadDeg}
                                    seed={resolvedSeed}
                                />
                            )}

                            {(preset === "conic" || preset === "combo") && (
                                <ConicGroup hue={hue} bloom={bloomMul} blurAmount={blurMul} />
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

/* --------------------------- Pieces / Presets --------------------------- */

function CenterCore({
    hue,
    bloom,
    blurAmount,
}: {
    hue: number;
    bloom: number;
    blurAmount: number;
}) {
    const core = `radial-gradient(closest-side circle at center,
    ${hsl(hue, 85, 92, 1)} 0%,
    ${hsl(hue, 85, 92, 1)} 10%,
    ${hsl(hue, 78, 72, 0.75)} 28%,
    ${hsl(hue, 65, 52, 0.22)} 52%,
    ${hsl(hue, 30, 18, 0.06)} 74%,
    transparent 99%
  )`;

    const bloomGrad = `radial-gradient(closest-side circle at center,
    ${hsl(hue, 88, 70, 0.22)} 0%,
    transparent 100%
  )`;

    const ring = `radial-gradient(closest-side circle at center,
    transparent 58%,
    ${hsl(hue, 80, 72, 0.35)} 72%,
    transparent 100%
  )`;

    const bloomSize = 76 + 10 * (bloom - 1);

    return (
        <div className="absolute inset-0">
            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                    width: "30%",
                    height: "30%",
                    background: core,
                    filter: `blur(${2.5 + 0.25 * blurAmount}px)`,
                    opacity: 0.95,
                }}
            />

            {bloom > 0 && (
                <>
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                            width: `${bloomSize}%`,
                            height: `${bloomSize}%`,
                            background: bloomGrad,
                            filter: `blur(${10 + 0.6 * blurAmount}px)`,
                            opacity: clamp(0.9 * bloom, 0, 1),
                        }}
                    />
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                            width: "56%",
                            height: "56%",
                            background: ring,
                            filter: `blur(${3 + 0.35 * blurAmount}px)`,
                            opacity: clamp(0.85 * bloom, 0, 1),
                        }}
                    />
                </>
            )}
        </div>
    );
}

function StreakGroup({ hue, bloom, blurAmount }: { hue: number; bloom: number; blurAmount: number }) {
    const glowOp = clamp(0.25 + 0.75 * bloom, 0, 2);

    const streakBg = (strong: number) =>
        `radial-gradient(ellipse at center,
      ${hsl(hue, 88, 80, 0.7 * strong)} 0%,
      ${hsl(hue, 78, 62, 0.32 * strong)} 30%,
      transparent 80%
    )`;

    const lines = [
        { h: 9, blur: 6.5, o: 0.55, y: 50, s: 1.0, w: 150 },
        { h: 5, blur: 5.0, o: 0.42, y: 48, s: 0.85, w: 140 },
        { h: 3, blur: 4.0, o: 0.38, y: 52, s: 0.75, w: 135 },
    ];

    return (
        <div className="absolute inset-0" style={{ opacity: glowOp }}>
            {lines.map((l, idx) => (
                <div
                    key={idx}
                    className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{
                        top: `${l.y}%`,
                        width: `${l.w}%`,
                        height: `${l.h}%`,
                        background: streakBg(l.s),
                        filter: `blur(${l.blur + 0.45 * blurAmount}px)`,
                        opacity: l.o,
                        borderRadius: 999,
                    }}
                />
            ))}
        </div>
    );
}

function StarRays({
    hue,
    bloom,
    blurAmount,
    points,
}: {
    hue: number;
    bloom: number;
    blurAmount: number;
    points: number;
}) {
    const step = 180 / Math.max(1, points);
    const angles = useMemo(() => Array.from({ length: Math.max(1, points) }, (_, i) => i * step), [points, step]);

    const coreBg = coreLineGradient(hue, 0.9);
    const glowBg = glowLineGradient(hue, 0.75, 0.28);
    const glowOpacity = clamp(0.9 * bloom, 0, 2);

    return (
        <div className="absolute inset-0" style={{ opacity: 0.95 }}>
            {bloom > 0 &&
                angles.map((deg) => (
                    <div
                        key={`glow-${deg}`}
                        className="absolute left-1/2 top-1/2"
                        style={{
                            width: "150%",
                            height: "10%",
                            background: glowBg,
                            filter: `blur(${6.5 + 0.5 * blurAmount}px)`,
                            opacity: 0.7 * glowOpacity,
                            borderRadius: 999,
                            transform: `translate(-50%, -50%) rotate(${deg}deg)`,
                        }}
                    />
                ))}

            {angles.map((deg) => (
                <div
                    key={`core-${deg}`}
                    className="absolute left-1/2 top-1/2"
                    style={{
                        width: "155%",
                        height: "1.25%",
                        background: coreBg,
                        filter: "none",
                        opacity: 0.65,
                        borderRadius: 999,
                        transform: `translate(-50%, -50%) rotate(${deg}deg)`,
                    }}
                />
            ))}

            {angles.map((deg) => (
                <div
                    key={`core2-${deg}`}
                    className="absolute left-1/2 top-1/2"
                    style={{
                        width: "145%",
                        height: "0.9%",
                        background: coreLineGradient(hue, 0.7),
                        filter: "none",
                        opacity: 0.4,
                        borderRadius: 999,
                        transform: `translate(-50%, -50%) rotate(${deg + step / 2}deg)`,
                    }}
                />
            ))}
        </div>
    );
}

function ClusterStarRays({
    hue,
    bloom,
    blurAmount,
    points,
    range,
    spreadDeg,
    seed,
}: {
    hue: number;
    bloom: number;
    blurAmount: number;
    points: number;
    range: IntRange;
    spreadDeg: number;
    seed: number;
}) {
    const step = 180 / Math.max(1, points);
    const glowOpacity = clamp(0.95 * bloom, 0, 2);

    const rays = useMemo(() => {
        const rng = mulberry32(seed);
        const baseAngles = Array.from({ length: Math.max(1, points) }, (_, i) => i * step);

        const out: Array<{
            key: string;
            angle: number;
            widthPct: number;
            coreHeightPct: number;
            coreOpacity: number;
            glowHeightPct: number;
            glowOpacity: number;
            glowBlurPx: number;
            thin: boolean;
        }> = [];

        for (let i = 0; i < baseAngles.length; i++) {
            const base = baseAngles[i];
            const linesForPoint = range.min + Math.floor(rng() * (range.max - range.min + 1));

            for (let j = 0; j < linesForPoint; j++) {
                const jitter = (rng() * 2 - 1) * spreadDeg;
                const angle = base + jitter;

                const thin = rng() < 0.55;
                const widthPct = thin ? 125 + rng() * 35 : 140 + rng() * 35;

                const coreHeightPct = thin ? 0.55 + rng() * 0.55 : 0.85 + rng() * 0.85;
                const coreOpacity = thin ? 0.28 + rng() * 0.22 : 0.4 + rng() * 0.35;

                const glowHeightPct = thin ? 2.2 + rng() * 2.4 : 6.0 + rng() * 8.5;
                const glowOpacityLocal = thin ? 0.18 + rng() * 0.18 : 0.28 + rng() * 0.35;
                const glowBlurPx = (thin ? 4.0 : 6.0) + rng() * 3.5 + 0.45 * blurAmount;

                out.push({
                    key: `${i}-${j}-${angle.toFixed(3)}`,
                    angle,
                    widthPct,
                    coreHeightPct,
                    coreOpacity,
                    glowHeightPct,
                    glowOpacity: glowOpacityLocal,
                    glowBlurPx,
                    thin,
                });
            }
        }

        return out;
    }, [seed, points, step, range.min, range.max, spreadDeg, blurAmount]);

    const coreBgStrong = coreLineGradient(hue, 0.92);
    const coreBgThin = coreLineGradient(hue, 0.75);

    const glowBgStrong = glowLineGradient(hue, 0.78, 0.3);
    const glowBgThin = glowLineGradient(hue, 0.62, 0.22);

    return (
        <div className="absolute inset-0" style={{ opacity: 0.95 }}>
            {bloom > 0 &&
                rays.map((r) => (
                    <div
                        key={`g-${r.key}`}
                        className="absolute left-1/2 top-1/2"
                        style={{
                            width: `${r.widthPct}%`,
                            height: `${r.glowHeightPct}%`,
                            background: r.thin ? glowBgThin : glowBgStrong,
                            filter: `blur(${r.glowBlurPx}px)`,
                            opacity: r.glowOpacity * glowOpacity,
                            borderRadius: 999,
                            transform: `translate(-50%, -50%) rotate(${r.angle}deg)`,
                        }}
                    />
                ))}

            {rays.map((r) => (
                <div
                    key={`c-${r.key}`}
                    className="absolute left-1/2 top-1/2"
                    style={{
                        width: `${Math.min(170, r.widthPct + 5)}%`,
                        height: `${r.coreHeightPct}%`,
                        background: r.thin ? coreBgThin : coreBgStrong,
                        filter: "none",
                        opacity: r.coreOpacity,
                        borderRadius: 999,
                        transform: `translate(-50%, -50%) rotate(${r.angle}deg)`,
                    }}
                />
            ))}
        </div>
    );
}

function ConicGroup({ hue, bloom, blurAmount }: { hue: number; bloom: number; blurAmount: number }) {
    const op = clamp(0.15 + 0.7 * bloom, 0, 1.5);

    const conicA = `conic-gradient(from 0deg at 50% 50%,
    transparent 0deg,
    ${hsl(hue, 80, 72, 0.28)} 18deg,
    transparent 44deg
  )`;

    const conicB = `conic-gradient(from 0deg at 50% 50%,
    transparent 0deg,
    ${hsl(hue, 76, 62, 0.18)} 44deg,
    transparent 95deg
  )`;

    return (
        <div className="absolute inset-0" style={{ opacity: op }}>
            <div
                className="absolute inset-0"
                style={{
                    background: conicA,
                    filter: `blur(${5.5 + 0.45 * blurAmount}px)`,
                    opacity: 0.7,
                }}
            />
            <div
                className="absolute inset-0"
                style={{
                    background: conicB,
                    transform: "rotate(-35deg)",
                    opacity: 0.55,
                }}
            />
        </div>
    );
}
