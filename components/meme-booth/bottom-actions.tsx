//components/meme-booth/bottom-actions.tsx
"use client";

import { useCallback, useState } from "react";
import { Repeat, Share2, Download, Check } from "lucide-react";
import type { InputMode } from "./mode-toggle";

type BottomActionsProps = {
    mode: InputMode;
    hasBlob: boolean;
    hasGenerated: boolean;
    generatedImage: string | null;
    loading: boolean;
    onChangeImage: () => void;
    onGenerateUpload: () => void; // legacy (no longer used)
};

function dataUrlToBlob(dataUrl: string): Blob {
    const [header, b64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] || "image/png";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
}

export default function BottomActions({
    mode,
    hasBlob,
    hasGenerated,
    generatedImage,
    loading,
    onChangeImage,
}: BottomActionsProps) {
    const [saved, setSaved] = useState(false);

    const handleSave = useCallback(async () => {
        if (!generatedImage) return;

        const blob = dataUrlToBlob(generatedImage);
        const file = new File([blob], `pathetic-meme-${Date.now()}.png`, {
            type: blob.type,
        });

        // Mobile: use native share sheet (includes "Save Image" on iOS/Android)
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file] });
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
                return;
            } catch (err: any) {
                // User cancelled share — that's fine, don't fallback
                if (err?.name === "AbortError") return;
            }
        }

        // Desktop fallback: download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }, [generatedImage]);

    if (!hasBlob) return null;

    // Only show actions AFTER generation is complete (camera OR upload).
    if (!hasGenerated) return null;

    const isMobile =
        typeof navigator !== "undefined" &&
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const SaveIcon = saved ? Check : isMobile ? Share2 : Download;

    return (
        <div className="mt-4 flex justify-center gap-4 text-base font-semibold uppercase italic ">
            <button
                onClick={handleSave}
                disabled={loading || !generatedImage}
                className="inline-flex items-center gap-1 px-2 py-1 text-foreground transition-all duration-150 hover:text-foreground/80 disabled:opacity-50"
            >
                <SaveIcon className="h-4 w-4 shrink-0" />
                <span>{saved ? "Saved" : "Save"}</span>
            </button>

            <button
                onClick={onChangeImage}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2 py-1 text-muted-foreground transition-all duration-150 hover:text-foreground disabled:opacity-50"
            >
                <Repeat className="h-4 w-4 shrink-0 [transform:scaleX(0.8)]" />
                <span>New meme</span>
            </button>
        </div>
    );
}
