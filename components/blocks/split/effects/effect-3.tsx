// components/blocks/split/effects/effect-3.tsx
"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { LensFlare, type LensFlareProps } from "./lens-flare";

type FlareOverrides = Partial<Omit<LensFlareProps, "isActive">>;

interface Effect3Props {
    isActive: boolean;
    hueRotateDeg?: number;
    hueSaturate?: number;
    hueBrightness?: number;
    hueOverlayOpacity?: number;
    flareAProps?: FlareOverrides;
    flareDProps?: FlareOverrides;
}

export function Effect3({
    isActive,
    hueRotateDeg = 155,
    hueSaturate = 1.25,
    hueBrightness = 1.02,
    hueOverlayOpacity = 0.9,
    flareAProps,
    flareDProps,
}: Effect3Props) {
    const active = isActive;
    const overlayOpacity = hueOverlayOpacity;
    const overlayStyle: CSSProperties = {
        backgroundColor: "rgba(18, 210, 255, 0.25)",
        mixBlendMode: "hue",
        filter: `hue-rotate(${hueRotateDeg}deg) saturate(${hueSaturate}) brightness(${hueBrightness})`,
    };
    return (
        <div className="absolute inset-0 pointer-events-none">
            <motion.div
                className="absolute inset-0 z-0"
                style={overlayStyle as any}
                initial={false}
                animate={active ? { opacity: overlayOpacity } : { opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
            />

            <motion.div
                className="absolute inset-0 z-10"
                style={{ transformOrigin: "center center" }}
                initial={false}
                animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.75, ease: "easeInOut" }}
            >
                <LensFlare
                    isActive={active}
                    preset="combo"
                    center={{ xPct: 50, yPct: 35 }}
                    size="100%"
                    clampToContainer
                    mixBlendMode="plus-lighter"
                    isolate
                    opacity={0.18}
                    hue={185}
                    intensity={1.5}
                    bloom={1.2}
                    blurAmount={10}
                    points={5}
                    animStyle="spin"
                    animSpeed={1.25}
                    appearDuration={0.7}
                    appearDelay={0.03}
                    appearScaleFrom={0.965}
                    disappearDuration={0.55}
                    {...flareAProps}
                />
                <LensFlare
                    isActive={active}
                    preset="star"
                    center={{ xPct: 50, yPct: 35 }}
                    size="62%"
                    clampToContainer
                    mixBlendMode="screen"
                    isolate
                    hue={210}
                    intensity={1.05}
                    bloom={0}
                    blurAmount={5}
                    opacity={1}
                    points={5}
                    animStyle="spin"
                    animSpeed={2.0}
                    appearDuration={0.65}
                    appearDelay={0.12}
                    appearScaleFrom={0.965}
                    disappearDuration={0.6}
                    {...flareDProps}
                />
            </motion.div>
        </div>
    );
}
