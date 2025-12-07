// components/effects/starter-pack-splitter.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
    FilesetResolver,
    ObjectDetector,
    ObjectDetectorResult,
} from "@mediapipe/tasks-vision";

type Props = {
    image: string;
    enabled?: boolean;
    onSprites: (sprites: string[]) => void;
};

export default function StarterPackSplitter({
    image,
    enabled = true,
    onSprites,
}: Props) {
    const detectorRef = useRef<ObjectDetector | null>(null);
    const [detectorReady, setDetectorReady] = useState(false);

    // Init ObjectDetector once
    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        (async () => {
            try {
                const fileset = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );

                const detector = await ObjectDetector.createFromOptions(fileset, {
                    baseOptions: {
                        // swap this to lite0/lite1/lite2 as you want
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float16/latest/efficientdet_lite2.tflite",
                    },
                    runningMode: "IMAGE",
                    scoreThreshold: 0.1, // lowered as requested
                    maxResults: 50,
                });

                if (cancelled) {
                    const d = detector as any;
                    if (d && typeof d.close === "function") d.close();
                    return;
                }

                detectorRef.current = detector;
                setDetectorReady(true);
            } catch (err) {
                console.error("ObjectDetector init failed", err);
                setDetectorReady(false);
            }
        })();

        return () => {
            cancelled = true;
            const d = detectorRef.current as any;
            if (d && typeof d.close === "function") {
                d.close();
            }
            detectorRef.current = null;
        };
    }, [enabled]);

    // Pure: raw detection → one sprite per detection, no clamping, no scaling
    useEffect(() => {
        if (!enabled || !image || !detectorReady) return;

        let cancelled = false;

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = async () => {
            if (cancelled) return;

            const W = img.width;
            const H = img.height;
            if (!W || !H) {
                console.warn("[StarterPackSplitter] Image has invalid dimensions");
                onSprites([]);
                return;
            }

            const detector = detectorRef.current;
            if (!detector) {
                console.warn("[StarterPackSplitter] Detector not ready at run time");
                onSprites([]);
                return;
            }

            const detectionCanvas = document.createElement("canvas");
            detectionCanvas.width = W;
            detectionCanvas.height = H;
            const detectionCtx = detectionCanvas.getContext("2d");

            if (!detectionCtx) {
                console.warn("[StarterPackSplitter] No 2D context for detection canvas");
                onSprites([]);
                return;
            }

            detectionCtx.drawImage(img, 0, 0, W, H);

            let detections: ObjectDetectorResult["detections"] | undefined;

            try {
                const result = await detector.detect(detectionCanvas as any);
                detections = result.detections ?? [];
            } catch (err) {
                console.error("[StarterPackSplitter] Object detection failed", err);
                onSprites([]);
                return;
            }

            console.log(
                "[StarterPackSplitter] raw detections:",
                detections?.map((d) => ({
                    box: d.boundingBox,
                    category: d.categories?.[0]?.categoryName,
                    score: d.categories?.[0]?.score,
                }))
            );

            if (!detections || detections.length === 0) {
                console.warn("[StarterPackSplitter] No detections");
                onSprites([]);
                return;
            }

            const spriteCanvas = document.createElement("canvas");
            const spriteCtx = spriteCanvas.getContext("2d");

            if (!spriteCtx) {
                console.warn("[StarterPackSplitter] No 2D context for sprite canvas");
                onSprites([]);
                return;
            }

            const sprites: string[] = [];

            for (const d of detections) {
                const b = (d.boundingBox || {}) as any;

                // Use the raw bounding box values as-is
                const x = b.originX ?? 0;
                const y = b.originY ?? 0;
                const w = b.width ?? 0;
                const h = b.height ?? 0;

                if (w <= 0 || h <= 0) continue;

                const cw = Math.max(1, Math.round(w));
                const ch = Math.max(1, Math.round(h));

                spriteCanvas.width = cw;
                spriteCanvas.height = ch;
                spriteCtx.clearRect(0, 0, cw, ch);

                // No clamping, no adjustments — straight from the detector
                spriteCtx.drawImage(
                    img,
                    x,
                    y,
                    w,
                    h,
                    0,
                    0,
                    cw,
                    ch
                );

                const dataUrl = spriteCanvas.toDataURL("image/png");
                sprites.push(dataUrl);
            }

            console.log(
                "[StarterPackSplitter] final sprite count from detector:",
                sprites.length
            );

            if (!cancelled) {
                onSprites(sprites);
            }
        };

        img.onerror = (err) => {
            console.error("[StarterPackSplitter] Failed to load starter-pack image", err);
            onSprites([]);
        };

        img.src = image;

        return () => {
            cancelled = true;
        };
    }, [image, enabled, detectorReady, onSprites]);

    return null;
}
