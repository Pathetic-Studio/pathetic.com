// components/blocks/split/effects/effect-2.tsx
"use client";

import { motion } from "framer-motion";
import { LensFlare, type LensFlareProps } from "./lens-flare";

type FlareOverrides = Partial<Omit<LensFlareProps, "isActive">>;

interface Effect2Props {
    isActive: boolean;
    mode?: "base" | "ramped";
    flareProps?: FlareOverrides;
    rampProps?: FlareOverrides;
}

export function Effect2({
    isActive,
    mode = "base",
    flareProps,
    rampProps,
}: Effect2Props) {
    const rampOn = isActive && mode === "ramped";

    const baseDefaults: FlareOverrides = {
        preset: "cluster-star",
        center: { xPct: 50, yPct: 35 },
        size: "100%",
        clampToContainer: true,
        mixBlendMode: "plus-lighter",
        isolate: true,

        hue: 30,
        intensity: 1.0,
        opacity: 0.55,
        blurAmount: 12,
        bloom: 1.35,

        points: 7,
        clusterLinesRange: { min: 3, max: 6 },
        clusterSpreadDeg: 8,

        animStyle: "spin",
        animSpeed: 1.0,

        appearDuration: 0.7,
        appearDelay: 0.02,
        appearScaleFrom: 0.97,

        disappearDuration: 0.5,
    };

    // This is the “dial up” layer that smoothly fades in/out while stage 4 is active.
    const rampDefaults: FlareOverrides = {
        preset: "combo",
        hue: 190,
        intensity: 1.25,
        opacity: 0.15,
        blurAmount: 16,
        bloom: 2.1,

        animStyle: "spin",
        animSpeed: 2.1,

        appearDuration: 0.55,
        appearDelay: 0,
        appearScaleFrom: 0.965,

        disappearDuration: 0.55,
    };

    const resolvedBase: FlareOverrides = { ...baseDefaults, ...flareProps };
    const resolvedRamp: FlareOverrides = { ...resolvedBase, ...rampDefaults, ...rampProps };

    return (
        <motion.div
            className="absolute inset-0"
            style={{ transformOrigin: "center center" }}
            initial={false}
            animate={isActive ? { scale: 1 } : { scale: 0.985 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
        >
            {/* Base layer (stage 3+) */}
            <LensFlare isActive={isActive} animStyle="spin" {...resolvedBase} />

            {/* Secondary crisp layer (stage 3+) */}
            <LensFlare
                isActive={isActive}
                preset="cluster-star"
                center={{ xPct: 50, yPct: 35 }}
                size="100%"
                clampToContainer
                mixBlendMode="plus-lighter"
                isolate
                opacity={0.12}
                intensity={1.35}
                bloom={0}
                blurAmount={0}
                hue={215}
                animStyle="spin"
                animSpeed={1.55}
                appearDuration={0.85}
                appearDelay={0.12}
                appearScaleFrom={0.965}
                disappearDuration={0.55}
            />

            {/* Ramp layer (stage 4 only) — fades in/out smoothly so it “dials up” and “dials down” */}
            <motion.div
                className="absolute inset-0"
                initial={false}
                animate={rampOn ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.75, ease: "easeInOut" }}
            >
                <LensFlare isActive={rampOn} animStyle="spin" {...resolvedRamp} />

                {/* Extra ramp sparkle */}
                <LensFlare
                    isActive={rampOn}
                    preset="star"
                    center={{ xPct: 52, yPct: 33 }}
                    size="92%"
                    clampToContainer
                    mixBlendMode="screen"
                    isolate
                    hue={200}
                    intensity={1.05}
                    opacity={0.22}
                    bloom={1.0}
                    blurAmount={6}
                    points={6}
                    animStyle="wobble"
                    animSpeed={1.8}
                    appearDuration={0.55}
                    appearDelay={0.02}
                    appearScaleFrom={0.97}
                    disappearDuration={0.55}
                />
            </motion.div>
        </motion.div>
    );
}
