// components/meme-booth/image-upload-panel.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";

type ImageUploadPanelProps = {
    disabled?: boolean;
    onImageLoaded: (file: File) => void;
};

const COMPRESSION_OPTIONS = {
    maxSizeMB: 3,           // Compress to under 3MB (safely under Vercel's 4.5MB limit)
    maxWidthOrHeight: 2048, // Resize if larger than 2048px
    useWebWorker: true,
    fileType: "image/jpeg", // Convert to JPEG for better compression
};

export default function ImageUploadPanel({
    disabled,
    onImageLoaded,
}: ImageUploadPanelProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressError, setCompressError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const processFile = async (file: File) => {
        setCompressError(null);

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        // Show preview immediately with original file
        const nextUrl = URL.createObjectURL(file);
        setPreviewUrl(nextUrl);

        // Compress if needed (over 3MB or not JPEG/PNG)
        const needsCompression = file.size > 3 * 1024 * 1024;

        if (needsCompression) {
            setIsCompressing(true);
            try {
                console.log(`[ImageUpload] Compressing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
                const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
                console.log(`[ImageUpload] Compressed to: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                onImageLoaded(compressedFile);
            } catch (err) {
                console.error("[ImageUpload] Compression failed:", err);
                // Still too large — don't send, just let the user know
                if (file.size > 4 * 1024 * 1024) {
                    setPreviewUrl(null);
                    setCompressError("Could not process this image. Please try a JPG or PNG under 4MB.");
                } else {
                    onImageLoaded(file);
                }
            } finally {
                setIsCompressing(false);
            }
        } else {
            onImageLoaded(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const handleClick = () => {
        if (disabled || isCompressing) return;
        inputRef.current?.click();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (disabled || isCompressing) return;

        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        processFile(file);
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
                className={`flex w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-none border border-dashed border-border bg-muted/40 px-6 py-8 text-center text-xs uppercase tracking-wide transition-all duration-150 ease-in-out hover:bg-muted/60 hover:border-foreground/40 ${isCompressing ? "opacity-50 pointer-events-none" : ""}`}
            >
                <p className="font-semibold">
                    {isCompressing ? "Optimizing image..." : "Drop a fit pic here"}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                    {isCompressing ? "Large images are automatically compressed" : "or click to browse from your files"}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                    JPG / PNG / WEBP / HEIC
                </p>
            </div>

            {compressError && (
                <div className="w-full max-w-sm bg-red-500 p-2">
                    <p className="text-center text-xs uppercase text-white">{compressError}</p>
                </div>
            )}

            {previewUrl && (
                <div className="w-full max-w-sm rounded-none border border-border bg-background/80 p-2 text-[11px]">
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {isCompressing ? "Optimizing..." : "Selected image"}
                    </div>
                    <img
                        src={previewUrl}
                        alt="Uploaded fit preview"
                        className={`h-auto w-full object-contain ${isCompressing ? "opacity-50" : ""}`}
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
