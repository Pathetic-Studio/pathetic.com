// components/effects/rotating-images.tsx
"use client";

import { useEffect, useState } from "react";
import {
    motion,
    useAnimationFrame,
    useMotionValue,
    useTransform,
    useSpring,
    type MotionValue,
} from "framer-motion";

type RotatingImage = {
    _key?: string;
    url?: string | null;
};

type RotatingImagesProps = {
    images?: RotatingImage[];
    containerId: string;

    animatedIn?: boolean;
    showDotMarker?: boolean;
    showDottedTrack?: boolean;
    mouseControl?: boolean;

    // Base desktop size
    logoSize?: number;

    // Optional responsive overrides
    logoSizeTablet?: number;
    logoSizeMobile?: number;
};

type Bounds = {
    width: number;
    height: number;
};

const ORBIT_SPEED = 0.25;
const DEFAULT_LOGO_SIZE = 96;

const MAX_TILT_DEG = 35;
const MOUSE_INTENSITY = 1.6;

type OrbitingImageProps = {
    src: string;
    angleOffset: MotionValue<number>;
    baseAngle: number;
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
    size: number;
    index: number;
    count: number;
    animatedIn?: boolean;
    showDotMarker?: boolean;
};

function OrbitingImage({
    src,
    angleOffset,
    baseAngle,
    centerX,
    centerY,
    radiusX,
    radiusY,
    size,
    index,
    count,
    animatedIn,
    showDotMarker,
}: OrbitingImageProps) {
    const angle = useTransform(angleOffset, (o) => baseAngle + o);

    const x = useTransform(angle, (a) => centerX + radiusX * Math.cos(a) - size / 2);
    const y = useTransform(angle, (a) => centerY + radiusY * Math.sin(a) - size / 2);

    const depthScale = useTransform(angle, (a) => {
        const n = (Math.sin(a) + 1) / 2;
        return 0.8 + n * 0.4;
    });

    const zIndex = useTransform(angle, (a) => {
        const n = (Math.sin(a) + 1) / 2;
        return Math.round(10 + n * 10);
    });

    const opacity = useTransform(angle, (a) => {
        const n = (Math.sin(a) + 1) / 2;
        return 0.6 + n * 0.4;
    });

    const delay = animatedIn ? 0.15 + index * 0.06 : 0;

    return (
        <motion.div
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                x,
                y,
                zIndex,
                opacity,
                width: size,
                height: size,
                pointerEvents: "none",
            }}
            initial={animatedIn ? { opacity: 0, scale: 0.6 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: animatedIn ? 0.4 : 0, ease: "easeOut" }}
        >
            {showDotMarker && (
                <div
                    className="bg-primary"
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 6,
                        height: 6,
                        marginLeft: -3,
                        marginTop: -3,
                        borderRadius: 9999,
                        boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                    }}
                />
            )}

            <motion.img
                src={src}
                alt=""
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: size,
                    height: size,
                    marginLeft: -size / 2,
                    marginTop: showDotMarker ? -size * 1.2 : -size / 2,
                    objectFit: "contain",
                    scale: depthScale,
                }}
                className="drop-shadow-md"
            />
        </motion.div>
    );
}

export default function RotatingImages({
    images,
    containerId,
    animatedIn = false,
    showDotMarker = false,
    showDottedTrack = false,
    mouseControl = false,
    logoSize,
    logoSizeTablet,
    logoSizeMobile,
}: RotatingImagesProps) {
    const [bounds, setBounds] = useState<Bounds | null>(null);
    const angleOffset = useMotionValue(0);

    const rawTiltX = useMotionValue(0);
    const rawTiltY = useMotionValue(0);

    const tiltX = useSpring(rawTiltX, { stiffness: 60, damping: 18, mass: 1 });
    const tiltY = useSpring(rawTiltY, { stiffness: 60, damping: 18, mass: 1 });

    const baseSize = logoSize ?? DEFAULT_LOGO_SIZE;

    useEffect(() => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            if (rect.width && rect.height) {
                setBounds({ width: rect.width, height: rect.height });
            }
        };

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(container);

        const handleMouseMove = (e: MouseEvent) => {
            if (!mouseControl) return;

            const rect = container.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width - 0.5;
            const relY = (e.clientY - rect.top) / rect.height - 0.5;

            const ampX = Math.max(-1, Math.min(1, relX * MOUSE_INTENSITY));
            const ampY = Math.max(-1, Math.min(1, relY * MOUSE_INTENSITY));

            rawTiltY.set(ampX * MAX_TILT_DEG);
            rawTiltX.set(-ampY * MAX_TILT_DEG);
        };

        const handleMouseLeave = () => {
            if (mouseControl) {
                rawTiltX.set(0);
                rawTiltY.set(0);
            }
        };

        container.addEventListener("mousemove", handleMouseMove);
        container.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            resizeObserver.disconnect();
            container.removeEventListener("mousemove", handleMouseMove);
            container.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [containerId, mouseControl]);

    useAnimationFrame((_, delta) => {
        let next = angleOffset.get() + (ORBIT_SPEED * delta) / 1000;
        if (next > Math.PI * 2) next -= Math.PI * 2;
        angleOffset.set(next);
    });

    if (!images || images.length === 0) return null;
    const validImages = images.filter((img) => img?.url);
    if (validImages.length === 0) return null;

    const width = bounds?.width ?? 0;
    const height = bounds?.height ?? 0;
    const hasBounds = width > 0 && height > 0;

    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;

    // Responsive size resolution
    const size =
        isMobile
            ? logoSizeMobile ?? Math.round(baseSize * 0.55)
            : isTablet
                ? logoSizeTablet ?? Math.round(baseSize * 0.75)
                : baseSize;

    const centerX = width / 2;
    const centerY = height / 2;

    const radiusX = hasBounds ? width * (width < 768 ? 0.65 : 0.45) : 0;
    const radiusY = hasBounds ? height * 0.35 : 0;

    const count = validImages.length;

    return (
        <motion.div
            className="pointer-events-none absolute inset-0 z-0 transform-gpu"
            aria-hidden="true"
            style={
                mouseControl
                    ? { rotateX: tiltX, rotateY: tiltY, transformOrigin: "50% 50%" }
                    : undefined
            }
            initial={animatedIn ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={animatedIn ? { duration: 0.5, ease: "easeOut" } : { duration: 0 }}
        >
            {hasBounds && (
                <>
                    {showDottedTrack && (
                        <svg
                            className="absolute inset-0"
                            width={width}
                            height={height}
                            viewBox={`0 0 ${width} ${height}`}
                        >
                            <ellipse
                                cx={centerX}
                                cy={centerY}
                                rx={radiusX}
                                ry={radiusY}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={0.75}
                                strokeDasharray="3 4"
                                className="text-primary"
                            />
                        </svg>
                    )}

                    {validImages.map((img, index) => (
                        <OrbitingImage
                            key={img._key ?? `${img.url}-${index}`}
                            src={img.url!}
                            angleOffset={angleOffset}
                            baseAngle={(index / count) * Math.PI * 2}
                            centerX={centerX}
                            centerY={centerY}
                            radiusX={radiusX}
                            radiusY={radiusY}
                            size={size}
                            index={index}
                            count={count}
                            animatedIn={animatedIn}
                            showDotMarker={showDotMarker}
                        />
                    ))}
                </>
            )}
        </motion.div>
    );
}
