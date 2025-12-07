// components/meme-booth/image-upload-panel.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

type ImageUploadPanelProps = {
    disabled?: boolean;
    onImageLoaded: (file: File) => void;
};

export default function ImageUploadPanel({
    disabled,
    onImageLoaded,
}: ImageUploadPanelProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        const nextUrl = URL.createObjectURL(file);
        setPreviewUrl(nextUrl);
        onImageLoaded(file);
    };

    const handleClick = () => {
        if (disabled) return;
        inputRef.current?.click();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (disabled) return;

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        const nextUrl = URL.createObjectURL(file);
        setPreviewUrl(nextUrl);
        onImageLoaded(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="flex w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-none border border-dashed border-border bg-muted/40 px-6 py-8 text-center text-xs uppercase tracking-wide transition-all duration-150 ease-in-out hover:bg-muted/60 hover:border-foreground/40"
            >
                <p className="font-semibold">
                    Drop a fit pic here
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                    or click to browse from your files
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                    Max ~20MB • JPG / PNG / WEBP
                </p>
            </div>

            {previewUrl && (
                <div className="w-full max-w-sm rounded-none border border-border bg-background/80 p-2 text-[11px]">
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        Selected image
                    </div>
                    <img
                        src={previewUrl}
                        alt="Uploaded fit preview"
                        className="h-auto w-full object-contain"
                    />
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
            />
        </div>
    );
}
