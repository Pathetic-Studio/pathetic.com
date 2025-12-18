//components/meme-booth/panel/hooks/use-capture-canvas-blob.ts
"use client";

export async function captureCanvasToPngBlob(
    outCanvas: HTMLCanvasElement,
    snapCanvas: HTMLCanvasElement
): Promise<Blob | null> {
    const width = outCanvas.width;
    const height = outCanvas.height;

    if (!width || !height) return null;

    snapCanvas.width = width;
    snapCanvas.height = height;
    snapCanvas.getContext("2d")!.drawImage(outCanvas, 0, 0, width, height);

    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    return new Promise((resolve) => {
        snapCanvas.toBlob((b) => resolve(b ?? null), "image/png");
    });
}
