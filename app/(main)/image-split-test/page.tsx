// app/image-split-test/page.tsx
"use client";

import React, { useState } from "react";
import StarterPackSplitterYOLO, {
    YoloDebugPayload,
} from "@/components/effects/starter-pack-splitter-yolo";

const TEST_IMAGE_SRC = "/split-test-6.png";

export default function ImageSplitTestPage() {
    const [sprites, setSprites] = useState<string[]>([]);
    const [debug, setDebug] = useState<YoloDebugPayload | null>(null);

    return (
        <main className="mx-auto max-w-5xl p-6 space-y-8">
            <header className="space-y-2">
                <h1 className="text-xl font-semibold uppercase tracking-wide">
                    Image Split Debug
                </h1>
                <p className="text-sm text-muted-foreground">
                    Source:{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {TEST_IMAGE_SRC}
                    </code>
                </p>
            </header>

            {/* Original + title-removed */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original image */}
                <div className="space-y-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wide">
                        Original
                    </h2>
                    <div className="border border-border bg-muted/20 p-3">
                        <img
                            src={TEST_IMAGE_SRC}
                            alt="Split test source"
                            className="w-full h-auto"
                        />
                    </div>
                </div>

                {/* Title removed (top ratio chopped) */}
                <div className="space-y-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wide">
                        Title Removed (Top Ratio)
                    </h2>
                    <div className="border border-border bg-muted/20 p-3 min-h-[100px] flex items-center justify-center">
                        {debug?.titleRemovedUrl ? (
                            <img
                                src={debug.titleRemovedUrl}
                                alt="Title removed"
                                className="w-full h-auto"
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Waiting for debug output…
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* Per-cell debug: grid cell, caption line, letterbox */}
            <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide">
                    Grid Cells & Caption Ratio
                </h2>

                {debug && debug.cells.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {debug.cells.map((cell, idx) => (
                            <div
                                key={idx}
                                className="border border-border bg-background p-3 space-y-3"
                            >
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        Cell row {cell.row}, col {cell.col}
                                    </span>
                                    <span>Index {idx}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Cell incl. caption + split line */}
                                    <figure className="space-y-1">
                                        <div className="border border-border bg-muted/40 p-1">
                                            {cell.cellWithCaptionUrl && (
                                                <img
                                                    src={cell.cellWithCaptionUrl}
                                                    alt={`Cell with caption ${idx}`}
                                                    className="w-full h-auto object-contain"
                                                />
                                            )}
                                        </div>
                                        <figcaption className="text-[11px] text-muted-foreground">
                                            Full cell + caption split line
                                        </figcaption>
                                    </figure>

                                    {/* Cell without caption (YOLO source) */}
                                    <figure className="space-y-1">
                                        <div className="border border-border bg-muted/40 p-1">
                                            {cell.cellNoCaptionUrl && (
                                                <img
                                                    src={cell.cellNoCaptionUrl}
                                                    alt={`Cell no caption ${idx}`}
                                                    className="w-full h-auto object-contain"
                                                />
                                            )}
                                        </div>
                                        <figcaption className="text-[11px] text-muted-foreground">
                                            Cell without caption (YOLO source)
                                        </figcaption>
                                    </figure>

                                    {/* Letterboxed 640x640 */}
                                    <figure className="space-y-1">
                                        <div className="border border-border bg-muted/40 p-1">
                                            {cell.letterboxUrl && (
                                                <img
                                                    src={cell.letterboxUrl}
                                                    alt={`Letterbox ${idx}`}
                                                    className="w-full h-auto object-contain"
                                                />
                                            )}
                                        </div>
                                        <figcaption className="text-[11px] text-muted-foreground">
                                            Letterboxed 640×640 input
                                        </figcaption>
                                    </figure>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No cell debug yet. Make sure the model loads and check the
                        console for any ONNX errors.
                    </p>
                )}
            </section>

            {/* Sprites output */}
            <section className="space-y-3">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide">
                        Detected Sprites
                    </h2>
                    <span className="text-xs text-muted-foreground">
                        Count: {sprites.length}
                    </span>
                </div>

                {sprites.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No sprites yet. Check the console logs for detection output.
                    </p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {sprites.map((src, idx) => (
                            <figure
                                key={idx}
                                className="border border-border bg-background p-2 flex flex-col gap-2"
                            >
                                <div className="aspect-auto w-full overflow-hidden">
                                    <img
                                        src={src}
                                        alt={`Sprite ${idx + 1}`}
                                        className="w-full h-auto object-contain"
                                    />
                                </div>
                                <figcaption className="text-xs text-muted-foreground">
                                    Sprite {idx + 1}
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                )}
            </section>

            {/* The splitter itself – runs entirely client-side, no UI */}
            <StarterPackSplitterYOLO
                image={TEST_IMAGE_SRC}
                enabled={true}
                onSprites={(next) => {
                    console.log("[ImageSplitTest] onSprites:", next);
                    setSprites(next);
                }}
                onDebugImages={(payload) => {
                    console.log("[ImageSplitTest] debug payload:", payload);
                    setDebug(payload);
                }}
            />
        </main>
    );
}
