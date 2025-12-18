"use client";

import React, { useEffect, useRef, useState } from "react";
import { FilesetResolver, ImageSegmenter, MPMask } from "@mediapipe/tasks-vision";

type Props = {
    enabled: boolean; // camera active (mode === camera && !blob && !generated)
    hasBlob: boolean;

    videoRef: React.RefObject<HTMLVideoElement | null>;
    outCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    srcCanvasRef: React.RefObject<HTMLCanvasElement | null>;

    onCapture: () => void;
};

export default function CameraRendererCutout({
    enabled,
    hasBlob,
    videoRef,
    outCanvasRef,
    srcCanvasRef,
    onCapture,
}: Props) {
    const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const imgDataRef = useRef<ImageData | null>(null);
    const segRef = useRef<ImageSegmenter | null>(null);
    const rafRef = useRef<number | null>(null);
    const busyRef = useRef(false);

    const [segReady, setSegReady] = useState(false);
    const [segmentEnabled, setSegmentEnabled] = useState(false);
    const [cameraStarted, setCameraStarted] = useState(false);

    // SEGMENTER INIT
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );

                const seg = await ImageSegmenter.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
                    },
                    runningMode: "IMAGE",
                    outputCategoryMask: true,
                });

                if (!alive) return;
                segRef.current = seg;
                setSegReady(true);
            } catch (e) {
                console.error("[CameraRendererCutout] Segmenter init failed", e);
                setSegReady(false);
            }
        })();

        return () => {
            alive = false;
            segRef.current = null;
        };
    }, []);

    // REALTIME LOOP (mirrored draw + optional cutout mask)
    useEffect(() => {
        if (!enabled) return;

        const loop = async () => {
            const v = videoRef.current;
            const out = outCanvasRef.current;
            const src = srcCanvasRef.current;
            const mask = maskCanvasRef.current;

            if (!v || !out || !src) {
                rafRef.current = requestAnimationFrame(loop);
                return;
            }

            const W = v.videoWidth;
            const H = v.videoHeight;

            if (!W || !H) {
                rafRef.current = requestAnimationFrame(loop);
                return;
            }

            if (out.width !== W || out.height !== H) {
                out.width = W;
                out.height = H;
            }
            if (src.width !== W || src.height !== H) {
                src.width = W;
                src.height = H;
            }
            if (mask && (mask.width !== W || mask.height !== H)) {
                mask.width = W;
                mask.height = H;
            }

            const sctx = src.getContext("2d")!;
            const octx = out.getContext("2d")!;

            // Mirror feed into src
            sctx.save();
            sctx.setTransform(-1, 0, 0, 1, W, 0);
            sctx.drawImage(v, 0, 0, W, H);
            sctx.restore();

            // Base camera on out
            octx.save();
            octx.clearRect(0, 0, W, H);
            octx.globalCompositeOperation = "copy";
            octx.drawImage(src, 0, 0, W, H);

            // Optional segmentation cutout
            const seg = segRef.current;
            if (segmentEnabled && segReady && seg && mask && !busyRef.current) {
                busyRef.current = true;

                try {
                    if (!imgDataRef.current) {
                        imgDataRef.current = mask.getContext("2d")!.createImageData(W, H);
                    }

                    const imgData = imgDataRef.current!;
                    const mctx = mask.getContext("2d")!;

                    const res = await seg.segment(src);
                    const categoryMask = res?.categoryMask as MPMask | undefined;

                    if (categoryMask) {
                        const labels = categoryMask.getAsUint8Array();
                        const data = imgData.data;

                        for (let i = 0, j = 0; i < labels.length; i++, j += 4) {
                            // your original: labels[i] === 0 ? 255 : 0
                            const a = labels[i] === 0 ? 255 : 0;
                            data[j] = 0;
                            data[j + 1] = 0;
                            data[j + 2] = 0;
                            data[j + 3] = a;
                        }

                        mctx.clearRect(0, 0, W, H);
                        mctx.putImageData(imgData, 0, 0);

                        octx.globalCompositeOperation = "destination-in";
                        octx.drawImage(mask, 0, 0, W, H);
                    }
                } catch (err) {
                    console.error("[CameraRendererCutout] segment loop error", err);
                } finally {
                    busyRef.current = false;
                }
            }

            octx.restore();
            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [enabled, videoRef, outCanvasRef, srcCanvasRef, segReady, segmentEnabled]);

    const handleStartCamera = async () => {
        const video = videoRef.current;
        if (!video?.srcObject) return;

        try {
            await video.play();
            setCameraStarted(true);
        } catch {
            // ignore
        }
    };

    return (
        <div className="flex flex-col">
            <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                width={1280}
                height={720}
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
            />

            <canvas
                ref={outCanvasRef}
                className="w-full max-h-[480px] bg-gray-100 object-contain"
            />

            {!hasBlob && !cameraStarted && (
                <button
                    type="button"
                    onClick={handleStartCamera}
                    className="mt-3 self-center text-xs uppercase tracking-wide text-muted-foreground underline"
                >
                    Tap to start camera
                </button>
            )}

            {!hasBlob && (
                <div className="mt-3 flex items-center justify-center gap-4">
                    <button
                        type="button"
                        onClick={() => setSegmentEnabled((p) => !p)}
                        disabled={!segReady}
                        className="text-xs uppercase tracking-wide underline text-muted-foreground disabled:opacity-50"
                    >
                        {segmentEnabled ? "Cutout: on" : "Cutout: off"}
                    </button>

                    <button
                        onClick={onCapture}
                        className="relative inline-flex items-center px-4 py-1 text-base font-semibold uppercase italic disabled:opacity-60"
                    >
                        <span className="relative inline-flex items-center gap-1 text-primary hover:[transform:scale(1.1)] duration-150 ease-in-out">
                            {/* keep your icon styling elsewhere if you want */}
                            Generate
                        </span>
                    </button>
                </div>
            )}

            {/* internal-only canvases */}
            <canvas ref={maskCanvasRef} className="hidden" />
        </div>
    );
}
