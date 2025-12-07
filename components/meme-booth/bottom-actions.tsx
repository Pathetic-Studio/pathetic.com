// components/meme-booth/bottom-actions.tsx
"use client";

import { Repeat, Sparkles } from "lucide-react";
import type { InputMode } from "./mode-toggle";

type BottomActionsProps = {
    mode: InputMode;
    hasBlob: boolean;
    loading: boolean;
    onRetake: () => void;
    onGenerate: () => void;
};

export default function BottomActions({
    mode,
    hasBlob,
    loading,
    onRetake,
    onGenerate,
}: BottomActionsProps) {
    if (!hasBlob) return null;

    return (
        <div className="mt-4 flex justify-center gap-4 text-base font-semibold uppercase italic ">
            {/* Retake / Change Image – no border/bg */}
            <button
                onClick={onRetake}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2 py-1 text-muted-foreground transition-all duration-150 hover:text-foreground disabled:opacity-50"
            >
                <Repeat className="h-4 w-4 shrink-0 [transform:scaleX(0.8)]" />
                <span>
                    {mode === "camera" ? "Retake" : "Change Image"}
                </span>
            </button>

            {/* Generate – blurred pill behind content */}
            <button
                onClick={onGenerate}
                disabled={loading}
                className="relative inline-flex items-center px-4 py-1 text-base font-semibold uppercase italic  disabled:opacity-60"
            >
                <span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-[#7A68FF]  blur-[1px]"
                />
                <span className="relative inline-flex items-center gap-1 text-white">
                    <Sparkles className="h-4 w-4 shrink-0 [transform:scaleX(0.8)]" />
                    <span>{loading ? "Generating…" : "What's my style?"}</span>
                </span>
            </button>
        </div>
    );
}
