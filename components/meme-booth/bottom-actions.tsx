"use client";

import { Repeat, Sparkles, Camera } from "lucide-react";
import type { InputMode } from "./mode-toggle";

type BottomActionsProps = {
    mode: InputMode;
    hasBlob: boolean;
    hasGenerated: boolean;
    loading: boolean;
    onChangeImage: () => void;
    onGenerateUpload: () => void; // only used in upload mode
};

export default function BottomActions({
    mode,
    hasBlob,
    hasGenerated,
    loading,
    onChangeImage,
    onGenerateUpload,
}: BottomActionsProps) {
    if (!hasBlob) return null;

    // CAMERA MODE:
    // - Pre-generation: controls live in CameraCaptureView (Generate + Show Cutout)
    // - Post-generation: only "Change image"
    if (mode === "camera") {
        if (!hasGenerated) return null;

        return (
            <div className="mt-4 flex justify-center gap-4 text-base font-semibold uppercase italic ">
                <button
                    onClick={onChangeImage}
                    disabled={loading}
                    className="inline-flex items-center gap-1 px-2 py-1 text-muted-foreground transition-all duration-150 hover:text-foreground disabled:opacity-50"
                >
                    <Repeat className="h-4 w-4 shrink-0 [transform:scaleX(0.8)]" />
                    <span>Change image</span>
                </button>
            </div>
        );
    }

    // UPLOAD MODE:
    // - Pre-generation: Generate + Change image
    // - Post-generation: only Change image
    if (!hasGenerated) {
        return (
            <div className="mt-4 flex justify-center gap-4 text-base font-semibold uppercase italic ">
                <button
                    onClick={onGenerateUpload}
                    disabled={loading}
                    className="relative inline-flex items-center px-4 py-1 text-base font-semibold uppercase italic disabled:opacity-60"
                >
                    <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-[#7A68FF] blur-[1px]"
                    />
                    <span className="relative inline-flex items-center gap-1 text-white">
                        <Camera className="h-4 w-4 shrink-0 [transform:scaleX(0.8)]" />
                        <span>{loading ? "Generating…" : "Generate"}</span>
                    </span>
                </button>

                <button
                    onClick={onChangeImage}
                    disabled={loading}
                    className="inline-flex items-center gap-1 px-2 py-1 text-muted-foreground transition-all duration-150 hover:text-foreground disabled:opacity-50"
                >
                    <Repeat className="h-4 w-4 shrink-0 [transform:scaleX(0.8)]" />
                    <span>Change image</span>
                </button>
            </div>
        );
    }

    // Upload mode, post-generation
    return (
        <div className="mt-4 flex justify-center gap-4 text-base font-semibold uppercase italic ">
            <button
                onClick={onChangeImage}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2 py-1 text-muted-foreground transition-all duration-150 hover:text-foreground disabled:opacity-50"
            >
                <Repeat className="h-4 w-4 shrink-0 [transform:scaleX(0.8)]" />
                <span>Change image</span>
            </button>
        </div>
    );
}
