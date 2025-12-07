// components/meme-booth/starter-pack-result-view.tsx
"use client";

import React from "react";
import StarterPackSplitter from "@/components/effects/starter-pack-splitter";
import StarterPackSplitterYOLO from "@/components/effects/starter-pack-splitter-yolo";

type StarterPackResultViewProps = {
    image: string;
    imgRef: React.RefObject<HTMLImageElement | null>;
    useSpriteMode: boolean;
    useYoloSplitter: boolean;
    onSprites: (sprites: string[] | null) => void;
};

export default function StarterPackResultView({
    image,
    imgRef,
    useSpriteMode,
    useYoloSplitter,
    onSprites,
}: StarterPackResultViewProps) {
    return (
        <div className="flex flex-col">
            <img
                ref={imgRef}
                src={image}
                className="w-full max-h-[480px] object-contain"
                alt="generated starter pack"
            />

            {useYoloSplitter ? (
                <StarterPackSplitterYOLO
                    image={image}
                    enabled={useSpriteMode}
                    maxSprites={4}
                    onSprites={onSprites}
                />
            ) : (
                <StarterPackSplitter
                    image={image}
                    enabled={useSpriteMode}
                    onSprites={onSprites}
                />
            )}
        </div>
    );
}
