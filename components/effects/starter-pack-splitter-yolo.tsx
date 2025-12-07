//components/effects/starter-pack-splitter-yolo.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

export type YoloDetection = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    score: number;
    classId: number;
};

export type YoloDebugCell = {
    row: 0 | 1;
    col: 0 | 1;
    cellWithCaptionUrl: string;
    cellNoCaptionUrl: string;
    letterboxUrl: string;
};

export type YoloDebugPayload = {
    originalUrl: string;
    titleRemovedUrl: string;
    cells: YoloDebugCell[];
};

type Props = {
    image: string; // URL or data URL for the generated starter-pack image
    enabled?: boolean;
    onSprites: (sprites: string[]) => void;

    // optional controls
    confThreshold?: number;
    iouThreshold?: number;
    maxSprites?: number;

    // optional: aggregated detections callback (per-cell detections concatenated)
    onDetections?: (detections: YoloDetection[]) => void;

    // optional: debug images callback
    onDebugImages?: (debug: YoloDebugPayload) => void;
};

const MODEL_PATH = "/models/yolov8n.onnx"; // must exist in public/models/
const INPUT_WIDTH = 640;
const INPUT_HEIGHT = 640;

// detection defaults (your requested values)
const DEFAULT_CONF_THRESHOLD = 0.03;
const DEFAULT_IOU_THRESHOLD = 0.85;
const DEFAULT_MAX_SPRITES = 4;

// layout assumptions for the starter pack
// - top area is title
// - below: 2x2 grid
// - in each grid cell: object on top, caption text on bottom
const TITLE_HEIGHT_RATIO = 0.1;   // 20% of full image height is title area
const CAPTION_STRIP_RATIO = 0.2;  // bottom 30% of each cell is caption

type Box = YoloDetection;

function iou(a: Box, b: Box): number {
    const x1 = Math.max(a.x1, b.x1);
    const y1 = Math.max(a.y1, b.y1);
    const x2 = Math.min(a.x2, b.x2);
    const y2 = Math.min(a.y2, b.y2);

    const w = Math.max(0, x2 - x1);
    const h = Math.max(0, y2 - y1); // FIXED: was y2 - y2
    const inter = w * h;

    const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
    const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
    const union = areaA + areaB - inter;
    if (union <= 0) return 0;
    return inter / union;
}

function nonMaxSuppression(boxes: Box[], iouThreshold: number): Box[] {
    const result: Box[] = [];
    const sorted = boxes.slice().sort((a, b) => b.score - a.score);

    while (sorted.length) {
        const candidate = sorted.shift()!;
        result.push(candidate);

        for (let i = sorted.length - 1; i >= 0; i--) {
            const b = sorted[i];
            if (candidate.classId === b.classId && iou(candidate, b) > iouThreshold) {
                sorted.splice(i, 1);
            }
        }
    }

    return result;
}

function getGridGeometry(W: number, H: number) {
    const titleHeight = H * TITLE_HEIGHT_RATIO;
    const contentTop = titleHeight;
    const contentHeight = H - contentTop;

    const cellWidth = W / 2;
    const cellHeight = contentHeight / 2;

    return { titleHeight, contentTop, contentHeight, cellWidth, cellHeight };
}

function makeTransparentSprite(
    canvas: HTMLCanvasElement,
    bgTolerance = 30,
    alphaThreshold = 10
): string {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.warn("[StarterPackSplitterYOLO] No 2D ctx for transparency mask");
        return canvas.toDataURL("image/png");
    }

    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) {
        return canvas.toDataURL("image/png");
    }

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Estimate background color from the 4 corners
    const cornerIdxs = [
        0, // (0, 0)
        (w - 1) * 4, // (w-1, 0)
        (h - 1) * w * 4, // (0, h-1)
        ((h - 1) * w + (w - 1)) * 4, // (w-1, h-1)
    ];

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let count = 0;

    for (const idx of cornerIdxs) {
        const a = data[idx + 3];
        if (a < alphaThreshold) continue;

        const r = data[idx + 0];
        const g = data[idx + 1];
        const b = data[idx + 2];

        sumR += r;
        sumG += g;
        sumB += b;
        count++;
    }

    let bgR = 255;
    let bgG = 255;
    let bgB = 255;

    if (count > 0) {
        bgR = sumR / count;
        bgG = sumG / count;
        bgB = sumB / count;
    }

    const bgTolSq = bgTolerance * bgTolerance;

    // Walk all pixels, knock out anything close to background
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const a = data[i + 3];

            // Already basically transparent
            if (a < alphaThreshold) {
                data[i + 3] = 0;
                continue;
            }

            const r = data[i + 0];
            const g = data[i + 1];
            const b = data[i + 2];

            const dr = r - bgR;
            const dg = g - bgG;
            const db = b - bgB;
            const distSq = dr * dr + dg * dg + db * db;

            if (distSq <= bgTolSq) {
                // treat as background → transparent
                data[i + 3] = 0;
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
}


/**
 * Run YOLO on a given source canvas (one grid cell with caption removed).
 * This version LETTERBOXES into 640x640 instead of stretching, so aspect ratio is preserved.
 * Returns sprites and the raw detection boxes (in 640x640 coords).
 * Optionally collects the letterboxed canvas as a debug data URL.
 */
async function runYoloOnCanvas(
    sourceCanvas: HTMLCanvasElement,
    session: ort.InferenceSession,
    confThreshold: number,
    iouThreshold: number,
    maxSprites: number,
    debugLetterboxes?: string[]
): Promise<{ sprites: string[]; boxes: Box[] }> {
    // Letterboxed detection canvas
    const detectionCanvas = document.createElement("canvas");
    detectionCanvas.width = INPUT_WIDTH;
    detectionCanvas.height = INPUT_HEIGHT;
    const ctx = detectionCanvas.getContext("2d");
    if (!ctx) {
        console.warn("[StarterPackSplitterYOLO] No 2D ctx for detection");
        return { sprites: [], boxes: [] };
    }

    // Fill with white (or any neutral color)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, INPUT_WIDTH, INPUT_HEIGHT);

    // Compute letterbox scale + offsets
    const srcW = sourceCanvas.width;
    const srcH = sourceCanvas.height;

    const scale = Math.min(INPUT_WIDTH / srcW, INPUT_HEIGHT / srcH);
    const newW = Math.round(srcW * scale);
    const newH = Math.round(srcH * scale);
    const offsetX = Math.floor((INPUT_WIDTH - newW) / 2);
    const offsetY = Math.floor((INPUT_HEIGHT - newH) / 2);

    // Draw scaled cell into detection canvas with letterboxing
    ctx.drawImage(sourceCanvas, 0, 0, srcW, srcH, offsetX, offsetY, newW, newH);

    // DEBUG: capture the letterboxed canvas
    if (debugLetterboxes) {
        debugLetterboxes.push(detectionCanvas.toDataURL("image/png"));
    }

    const imageData = ctx.getImageData(0, 0, INPUT_WIDTH, INPUT_HEIGHT);
    const { data } = imageData;

    // Build input tensor [1, 3, 640, 640], CHW, normalized
    const inputData = new Float32Array(1 * 3 * INPUT_HEIGHT * INPUT_WIDTH);
    let idx = 0;
    for (let c = 0; c < 3; c++) {
        for (let y = 0; y < INPUT_HEIGHT; y++) {
            for (let x = 0; x < INPUT_WIDTH; x++) {
                const i = (y * INPUT_WIDTH + x) * 4;
                const value = data[i + c] / 255.0;
                inputData[idx++] = value;
            }
        }
    }

    const feeds: Record<string, ort.Tensor> = {};
    const inputName = session.inputNames[0];
    feeds[inputName] = new ort.Tensor("float32", inputData, [
        1,
        3,
        INPUT_HEIGHT,
        INPUT_WIDTH,
    ]);

    // Run inference
    let results: ort.InferenceSession.OnnxValueMapType;
    try {
        results = await session.run(feeds);
    } catch (err) {
        console.error("[StarterPackSplitterYOLO] Inference failed", err);
        return { sprites: [], boxes: [] };
    }

    const outputName = session.outputNames[0];
    const output = results[outputName] as ort.Tensor;
    const outputData = output.data as Float32Array;
    const dims = output.dims;

    console.log("[StarterPackSplitterYOLO] output dims:", dims);

    if (dims.length !== 3) {
        console.warn("[StarterPackSplitterYOLO] Unexpected output rank", dims);
        return { sprites: [], boxes: [] };
    }

    const boxes: Box[] = [];

    // Case A: [1, C, N] (YOLOv8 style: 4 box + numClasses scores)
    if (dims[0] === 1 && dims[1] >= 6 && dims[2] > 10) {
        const [batch, channels, numDet] = dims;
        const numClasses = channels - 4;

        console.log(
            "[StarterPackSplitterYOLO] Interpreting output as [1, C, N], C=",
            channels,
            "N=",
            numDet
        );

        for (let i = 0; i < numDet; i++) {
            const xCenter = outputData[0 * numDet + i];
            const yCenter = outputData[1 * numDet + i];
            const w = outputData[2 * numDet + i];
            const h = outputData[3 * numDet + i];

            let bestClass = -1;
            let bestScore = 0;

            for (let c = 0; c < numClasses; c++) {
                const score = outputData[(4 + c) * numDet + i];
                if (score > bestScore) {
                    bestScore = score;
                    bestClass = c;
                }
            }

            if (bestScore < confThreshold) continue;

            const x1 = xCenter - w / 2;
            const y1 = yCenter - h / 2;
            const x2 = xCenter + w / 2;
            const y2 = yCenter + h / 2;

            boxes.push({
                x1,
                y1,
                x2,
                y2,
                score: bestScore,
                classId: bestClass,
            });
        }
    }
    // Case B: [1, N, C] (YOLOv5 style: x y w h obj cls0 cls1 …)
    else if (dims[0] === 1 && dims[1] > 0 && dims[2] >= 6) {
        const [batch, numDet, features] = dims;

        console.log(
            "[StarterPackSplitterYOLO] Interpreting output as [1, N, C], N=",
            numDet,
            "C=",
            features
        );

        for (let i = 0; i < numDet; i++) {
            const offset = i * features;

            const xCenter = outputData[offset + 0];
            const yCenter = outputData[offset + 1];
            const w = outputData[offset + 2];
            const h = outputData[offset + 3];
            const objectness = outputData[offset + 4];

            let bestClass = -1;
            let bestScore = 0;

            for (let c = 5; c < features; c++) {
                const classScore = outputData[offset + c];
                if (classScore > bestScore) {
                    bestScore = classScore;
                    bestClass = c - 5;
                }
            }

            const score = objectness * bestScore;
            if (score < confThreshold) continue;

            const x1 = xCenter - w / 2;
            const y1 = yCenter - h / 2;
            const x2 = xCenter + w / 2;
            const y2 = yCenter + h / 2;

            boxes.push({
                x1,
                y1,
                x2,
                y2,
                score,
                classId: bestClass,
            });
        }
    } else {
        console.warn(
            "[StarterPackSplitterYOLO] Output dims not recognised, skipping",
            dims
        );
        return { sprites: [], boxes: [] };
    }

    console.log("[StarterPackSplitterYOLO] raw boxes before NMS:", boxes.length);

    const nmsBoxes = nonMaxSuppression(boxes, iouThreshold);
    console.log("[StarterPackSplitterYOLO] boxes after NMS:", nmsBoxes.length);

    const finalBoxes = nmsBoxes
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, maxSprites);

    if (!finalBoxes.length) {
        return { sprites: [], boxes: [] };
    }

    // Crop directly from 640x640 detection canvas
    const spriteCanvas = document.createElement("canvas");
    const spriteCtx = spriteCanvas.getContext("2d");
    if (!spriteCtx) {
        console.warn("[StarterPackSplitterYOLO] No sprite ctx");
        return { sprites: [], boxes: [] };
    }

    const sprites: string[] = [];

    for (const b of finalBoxes) {
        let x1 = Math.min(b.x1, b.x2);
        let y1 = Math.min(b.y1, b.y2);
        let x2 = Math.max(b.x1, b.x2);
        let y2 = Math.max(b.y1, b.y2);

        x1 = Math.max(0, Math.min(INPUT_WIDTH, x1));
        y1 = Math.max(0, Math.min(INPUT_HEIGHT, y1));
        x2 = Math.max(0, Math.min(INPUT_WIDTH, x2));
        y2 = Math.max(0, Math.min(INPUT_HEIGHT, y2));

        const boxW = x2 - x1;
        const boxH = y2 - y1;

        if (boxW <= 0 || boxH <= 0) continue;

        const cw = Math.max(1, Math.round(boxW));
        const ch = Math.max(1, Math.round(boxH));

        spriteCanvas.width = cw;
        spriteCanvas.height = ch;
        spriteCtx.clearRect(0, 0, cw, ch);

        spriteCtx.drawImage(
            detectionCanvas,
            x1,
            y1,
            boxW,
            boxH,
            0,
            0,
            cw,
            ch
        );

        // NEW: knock out the white background → transparent PNG
        const maskedUrl = makeTransparentSprite(spriteCanvas, 35, 5);
        sprites.push(maskedUrl);
    }


    console.log("[StarterPackSplitterYOLO] sprites from canvas:", sprites.length);

    return { sprites, boxes: finalBoxes };
}

/**
 * Crop a single grid cell from the original starter-pack image,
 * removing the caption strip at the bottom of that cell.
 * Works with your ~5:6 Gemini output – everything here is relative to the
 * actual image width/height reported by the browser.
 */
function cropCellWithoutCaption(
    srcImg: HTMLImageElement,
    col: 0 | 1,
    row: 0 | 1
): HTMLCanvasElement {
    const W = srcImg.width;
    const H = srcImg.height;

    const { contentTop, cellWidth, cellHeight } = getGridGeometry(W, H);

    const x = col * cellWidth;
    const yCellTop = contentTop + row * cellHeight;

    // Drop the bottom caption strip within this cell
    const cropHeightWithoutCaption = cellHeight * (1 - CAPTION_STRIP_RATIO);

    const canvas = document.createElement("canvas");
    canvas.width = cellWidth;
    canvas.height = cropHeightWithoutCaption;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.warn("[StarterPackSplitterYOLO] No 2D ctx for cell crop");
        return canvas;
    }

    ctx.drawImage(
        srcImg,
        x,
        yCellTop,
        cellWidth,
        cropHeightWithoutCaption,
        0,
        0,
        cellWidth,
        cropHeightWithoutCaption
    );

    return canvas;
}

export default function StarterPackSplitterYOLO({
    image,
    enabled = true,
    onSprites,
    confThreshold,
    iouThreshold,
    maxSprites,
    onDetections,
    onDebugImages,
}: Props) {
    const sessionRef = useRef<ort.InferenceSession | null>(null);
    const [sessionReady, setSessionReady] = useState(false);

    const CONF_THRESHOLD = confThreshold ?? DEFAULT_CONF_THRESHOLD;
    const IOU_THRESHOLD = iouThreshold ?? DEFAULT_IOU_THRESHOLD;
    const MAX_SPRITES = maxSprites ?? DEFAULT_MAX_SPRITES;

    // Load YOLO ONNX once
    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        (async () => {
            try {
                const session = await ort.InferenceSession.create(MODEL_PATH, {
                    executionProviders: ["wasm"],
                });

                if (cancelled) return;

                sessionRef.current = session;
                setSessionReady(true);
                console.log("[StarterPackSplitterYOLO] ONNX session ready");
            } catch (err) {
                console.error("[StarterPackSplitterYOLO] Failed to load ONNX model", err);
                setSessionReady(false);
            }
        })();

        return () => {
            cancelled = true;
            sessionRef.current = null;
        };
    }, [enabled]);

    // Run detection when image/session are ready
    useEffect(() => {
        if (!enabled || !image || !sessionReady) return;

        let cancelled = false;

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = async () => {
            if (cancelled) return;

            const origW = img.width;
            const origH = img.height;
            if (!origW || !origH) {
                console.warn("[StarterPackSplitterYOLO] Invalid image dims");
                onSprites([]);
                onDetections?.([]);
                onDebugImages?.({
                    originalUrl: image,
                    titleRemovedUrl: "",
                    cells: [],
                });
                return;
            }

            const session = sessionRef.current;
            if (!session) {
                console.warn("[StarterPackSplitterYOLO] Session not ready");
                onSprites([]);
                onDetections?.([]);
                onDebugImages?.({
                    originalUrl: image,
                    titleRemovedUrl: "",
                    cells: [],
                });
                return;
            }

            const allSprites: string[] = [];
            const allBoxes: Box[] = [];

            const { titleHeight, contentTop, cellWidth, cellHeight } =
                getGridGeometry(origW, origH);

            // Build "title removed" canvas
            const titleRemovedCanvas = document.createElement("canvas");
            titleRemovedCanvas.width = origW;
            titleRemovedCanvas.height = origH - titleHeight;
            const trCtx = titleRemovedCanvas.getContext("2d");
            if (trCtx) {
                trCtx.drawImage(
                    img,
                    0,
                    titleHeight,
                    origW,
                    origH - titleHeight,
                    0,
                    0,
                    origW,
                    origH - titleHeight
                );
            }
            const titleRemovedUrl = titleRemovedCanvas.toDataURL("image/png");

            const debugCells: YoloDebugCell[] = [];
            const debugLetterboxes: string[] = [];

            // Expect 4 cells; split MAX_SPRITES across them
            const perCellMaxSprites = Math.max(
                1,
                Math.floor(MAX_SPRITES / 4) || 1
            );

            for (let row = 0 as 0 | 1; row < 2; row = (row + 1) as 0 | 1) {
                for (let col = 0 as 0 | 1; col < 2; col = (col + 1) as 0 | 1) {
                    if (cancelled) return;

                    // Full grid cell including caption
                    const x = col * cellWidth;
                    const yCellTop = contentTop + row * cellHeight;

                    const fullCellCanvas = document.createElement("canvas");
                    fullCellCanvas.width = cellWidth;
                    fullCellCanvas.height = cellHeight;
                    const fullCtx = fullCellCanvas.getContext("2d");

                    let cellWithCaptionUrl = "";
                    if (fullCtx) {
                        fullCtx.drawImage(
                            img,
                            x,
                            yCellTop,
                            cellWidth,
                            cellHeight,
                            0,
                            0,
                            cellWidth,
                            cellHeight
                        );

                        // Draw line at caption split
                        const captionStripHeight = cellHeight * CAPTION_STRIP_RATIO;
                        const lineY = cellHeight - captionStripHeight;

                        fullCtx.beginPath();
                        fullCtx.moveTo(0, lineY);
                        fullCtx.lineTo(cellWidth, lineY);
                        fullCtx.lineWidth = 2;
                        fullCtx.strokeStyle = "red";
                        fullCtx.stroke();

                        cellWithCaptionUrl = fullCellCanvas.toDataURL("image/png");
                    }

                    // Cell without caption (what YOLO sees)
                    const cellCanvas = cropCellWithoutCaption(img, col, row);
                    const cellNoCaptionUrl = cellCanvas.toDataURL("image/png");

                    const letterboxIndex = debugLetterboxes.length;

                    const { sprites, boxes } = await runYoloOnCanvas(
                        cellCanvas,
                        session,
                        CONF_THRESHOLD,
                        IOU_THRESHOLD,
                        perCellMaxSprites,
                        debugLetterboxes
                    );

                    const letterboxUrl =
                        debugLetterboxes[letterboxIndex] ?? "";

                    allSprites.push(...sprites);
                    allBoxes.push(...boxes);

                    debugCells.push({
                        row,
                        col,
                        cellWithCaptionUrl,
                        cellNoCaptionUrl,
                        letterboxUrl,
                    });
                }
            }

            const finalSprites =
                allSprites.length > MAX_SPRITES
                    ? allSprites.slice(0, MAX_SPRITES)
                    : allSprites;

            console.log(
                "[StarterPackSplitterYOLO] total sprites from grid:",
                finalSprites.length
            );

            if (!cancelled) {
                onSprites(finalSprites);
                onDetections?.(allBoxes);
                onDebugImages?.({
                    originalUrl: image,
                    titleRemovedUrl,
                    cells: debugCells,
                });
            }
        };

        img.onerror = (err) => {
            console.error("[StarterPackSplitterYOLO] Failed to load image", err);
            onSprites([]);
            onDetections?.([]);
            onDebugImages?.({
                originalUrl: image,
                titleRemovedUrl: "",
                cells: [],
            });
        };

        img.src = image;

        return () => {
            cancelled = true;
        };
    }, [
        image,
        enabled,
        sessionReady,
        CONF_THRESHOLD,
        IOU_THRESHOLD,
        MAX_SPRITES,
        onSprites,
        onDetections,
        onDebugImages,
    ]);

    return null;
}
