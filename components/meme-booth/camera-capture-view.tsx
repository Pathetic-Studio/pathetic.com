// components/meme-booth/camera-capture-view.tsx
"use client";

import React from "react";
import { Camera, Scan } from "lucide-react";

type CameraCaptureViewProps = {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    outCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    segReady: boolean;
    segmentEnabled: boolean;
    onCapture: () => void;
    onToggleSegment: () => void;
    hasBlob: boolean;
};

export default function CameraCaptureView({
    videoRef,
    outCanvasRef,
    segReady,
    segmentEnabled,
    onCapture,
    onToggleSegment,
    hasBlob,
}: CameraCaptureViewProps) {
    return (
        <div className="flex flex-col">
            <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="absolute h-px w-px opacity-0"
            />

            {/* This canvas defines the camera tile size (no stretching) */}
            <canvas
                ref={outCanvasRef}
                className="w-full max-h-[480px] bg-gray-100 object-contain"
            />

            {!hasBlob && (
                <div className="mt-3 flex justify-center gap-3 text-base  font-semibold uppercase italic ">
                    <button
                        onClick={onCapture}
                        disabled={!segReady}
                        className="inline-flex items-center gap-1 px-3 py-1 text-foreground uppercase transition-all duration-150 hover:text-foreground/80 disabled:opacity-40"
                    >
                        <Camera className="h-4 w-4 shrink-0 [transform:scaleX(0.8)]" />
                        <span>Capture Fit</span>
                    </button>

                    <button
                        onClick={onToggleSegment}
                        disabled={!segReady}
                        className="inline-flex items-center gap-1 px-3 py-1 text-muted-foreground uppercase transition-all duration-150 hover:text-foreground/80 disabled:opacity-40"
                    >
                        <Scan className="h-4 w-4 shrink-0 [transform:scaleX(0.8)]" />
                        <span>
                            {segmentEnabled
                                ? "Show Original"
                                : "Show Cutout"}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
