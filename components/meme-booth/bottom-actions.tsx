//components/meme-booth/bottom-actions.tsx
"use client";

import { Repeat } from "lucide-react";
import type { InputMode } from "./mode-toggle";

type BottomActionsProps = {
    mode: InputMode;
    hasBlob: boolean;
    hasGenerated: boolean;
    loading: boolean;
    onChangeImage: () => void;
    onGenerateUpload: () => void; // legacy (no longer used)
};

export default function BottomActions({
    mode,
    hasBlob,
    hasGenerated,
    loading,
    onChangeImage,
}: BottomActionsProps) {
    if (!hasBlob) return null;

    // Only show actions AFTER generation is complete (camera OR upload).
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
