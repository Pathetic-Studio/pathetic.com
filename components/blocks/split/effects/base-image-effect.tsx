// components/blocks/split/effects/base-image-effect.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface BaseImageEffectProps {
    src: string;
    imageStage: number;
}

export function BaseImageEffect({ src, imageStage }: BaseImageEffectProps) {
    return (
        <motion.div
            className="absolute inset-0"
            initial={{ scale: 0.9 }}
            animate={{ scale: imageStage >= 1 ? 1 : 0.9 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <Image
                src={src}
                alt="Animated base"
                fill
                className="object-cover scale-[1.04]"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                quality={100}
            />
        </motion.div>
    );
}
