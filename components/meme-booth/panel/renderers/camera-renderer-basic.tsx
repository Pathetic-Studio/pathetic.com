//components/meme-booth/panel/renderers/camera-renderer-basic.tsx
"use client";

import React from "react";
import { Camera, SwitchCamera } from "lucide-react";
import { useMirroredVideoCanvas } from "../hooks/use-mirrored-video-canvas";
import type { CameraRendererProps } from "../camera-panel-core";

export default function CameraRendererBasic({
    enabled,
    hasBlob,
    videoRef,
    outCanvasRef,
    srcCanvasRef,
    onCapture,
    canFlip,
    facingMode,
    onFlipCamera,
}: CameraRendererProps) {
    // Always render frames to canvas; only mirror on selfie camera.
    useMirroredVideoCanvas({
        enabled,
        mirror: facingMode === "user",
        videoRef,
        outCanvasRef,
        srcCanvasRef,
    });

    const showFlip = canFlip && !hasBlob;

    return (
        <div className="flex flex-col">
            <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
            />

            <canvas
                ref={outCanvasRef}
                className="w-full max-h-[480px] bg-gray-100 object-contain"
            />

            {!hasBlob && (
                <div className="mt-3 flex justify-center gap-2">


                    <button
                        type="button"
                        onClick={onCapture}
                        className="relative inline-flex items-center px-0 py-1 disabled:opacity-60"
                        aria-label="Capture"
                    >
                        <Camera className="h-12 w-12 shrink-0 [transform:scaleX(0.6)] text-primary hover:scale-110 transition" />
                    </button>

                    {showFlip && (
                        <button
                            type="button"
                            onClick={onFlipCamera}
                            className="relative inline-flex items-center px-0 py-1 disabled:opacity-60"
                            aria-label="Flip camera"
                        >
                            <SwitchCamera className="h-12 w-12 shrink-0 [transform:scaleX(0.6)] text-primary hover:scale-110 transition" />
                        </button>
                    )}

                </div>
            )}
        </div>
    );
}
