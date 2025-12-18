//components/meme-booth/panel/renderers/camera-renderer-basic.tsx
"use client";

import React from "react";
import { Camera } from "lucide-react";
import { useMirroredVideoCanvas } from "../hooks/use-mirrored-video-canvas";

type Props = {
    enabled: boolean;
    hasBlob: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    outCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    srcCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    onCapture: () => void;
};

export default function CameraRendererBasic({
    enabled,
    hasBlob,
    videoRef,
    outCanvasRef,
    srcCanvasRef,
    onCapture,
}: Props) {
    useMirroredVideoCanvas({ enabled, videoRef, outCanvasRef, srcCanvasRef });

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

            {!hasBlob && (
                <div className="mt-3 flex justify-center">
                    <button
                        onClick={onCapture}
                        className="relative inline-flex items-center px-4 py-1 text-base font-semibold uppercase italic disabled:opacity-60"
                    >
                        <span className="relative inline-flex items-center gap-1 text-primary hover:[transform:scale(1.1)] duration-150 ease-in-out">
                            <Camera className="h-12 w-12 shrink-0 [transform:scaleX(0.6)] cursor-pointer" />
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
