// components/blocks/split/effects/effect-1.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Effect1Props {
    src: string;
    isActive: boolean;
    /**
     * When true (i.e. Effect3 stage), the pulse gets brighter + a bit faster.
     * Keep this driven from the parent: effect3IsActive.
     */
    isBoosted?: boolean;
}

export function Effect1({
    src,
    isActive,
    isBoosted = false,
}: Effect1Props) {
    const pulseDuration = isBoosted ? "1.8s" : "2.4s";
    const pulseMaxOpacity = isBoosted ? 1 : 0.85;
    const pulseBrightness = isBoosted ? 4.2 : 3.1;

    return (
        <motion.div
            className="absolute inset-0"
            style={{
                mixBlendMode: "soft-light",
                transformOrigin: "center center",
            }}
            initial={false}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={{ opacity: { duration: 0.7, ease: "easeInOut" } }}
        >
            <div className="absolute inset-0">
                <Image
                    src={src}
                    alt="Effect 1"
                    fill
                    className="object-cover scale-[1.2]"
                    style={{ mixBlendMode: "soft-light", filter: "blur(22px)" }}
                    quality={100}
                />
            </div>

            <div
                className={`absolute inset-0 ${isActive ? "effect1-pulse" : ""}`}
                style={
                    {
                        ["--e1dur" as any]: pulseDuration,
                        ["--e1max" as any]: String(pulseMaxOpacity),
                    } as any
                }
            >
                <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover scale-[1.2]"
                    style={{
                        mixBlendMode: "soft-light",
                        filter: `brightness(${pulseBrightness}) blur(22px)`,
                    }}
                    quality={100}
                />
            </div>
        </motion.div>
    );
}
