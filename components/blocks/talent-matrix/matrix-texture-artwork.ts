import { yieldToBrowser } from "@/lib/yield-to-browser";

const MATRIX_GLYPHS =
  "0011010100110101PATHETICPATHETIC<>/{}[]$#@+-*";
const MATRIX_TEXTURE_FRAME_COUNT = 4;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export async function drawMatrixArtwork({
  color,
  seed,
  width,
  height,
  columns,
  background,
  lineOpacity = 0.08,
  gapChance = 0.1,
  minStrength = 0.18,
  maxStrength = 0.9,
  glowScale = 0.12,
  glyphWidth = 0.5,
}: {
  color: string;
  seed: number;
  width: number;
  height: number;
  columns: number;
  background: string;
  lineOpacity?: number;
  gapChance?: number;
  minStrength?: number;
  maxStrength?: number;
  glowScale?: number;
  glyphWidth?: number;
}) {
  const random = seededRandom(seed);
  const columnWidth = width / columns;
  const glyphSize = columnWidth * 0.86;
  const rowHeight = glyphSize * 1.18;
  const colorStyle = color;
  const columnData: Array<{
    x: number;
    opacity: number;
  }> = [];
  const glyphData: Array<{
    x: number;
    y: number;
    opacity: number;
    glyphIndex: number;
    changes: boolean;
    changeRate: number;
  }> = [];

  for (let column = 0; column < columns; column += 1) {
    const x = (column + 0.5) * columnWidth;
    const phase = random() * rowHeight;
    const streamStrength = minStrength + random() * (maxStrength - minStrength);
    columnData.push({
      x,
      opacity: lineOpacity * (0.55 + random() * 0.9),
    });

    for (
      let y = -rowHeight + phase, row = -1;
      y < height + rowHeight;
      y += rowHeight, row += 1
    ) {
      if (random() < gapChance) continue;
      glyphData.push({
        x,
        y,
        opacity: streamStrength * (0.28 + random() * 0.72),
        glyphIndex: Math.floor(random() * MATRIX_GLYPHS.length),
        changes: random() < 0.34,
        changeRate: 1 + Math.floor(random() * 3) + Math.abs(row % 2),
      });
    }
  }

  const renderFrame = (matrixFrame: number) => {
    const canvas = typeof document === "undefined"
      ? new OffscreenCanvas(width, height)
      : document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context) return null;

    context.globalAlpha = 1;
    context.shadowBlur = 0;
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.fillStyle = colorStyle;

    columnData.forEach((column) => {
      context.globalAlpha = column.opacity;
      context.fillRect(
        column.x - Math.max(0.35, columnWidth * 0.025),
        0,
        Math.max(0.7, columnWidth * 0.05),
        height,
      );
    });

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `400 ${glyphSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    context.shadowColor = colorStyle;
    context.shadowBlur = Math.max(0.5, glyphSize * glowScale);

    glyphData.forEach((glyph) => {
      const glyphIndex = glyph.changes
        ? (glyph.glyphIndex + matrixFrame * glyph.changeRate) %
          MATRIX_GLYPHS.length
        : glyph.glyphIndex;
      context.globalAlpha = glyph.opacity;
      context.fillText(
        MATRIX_GLYPHS[glyphIndex],
        glyph.x,
        glyph.y,
        columnWidth * glyphWidth,
      );
    });

    context.globalAlpha = 1;
    context.shadowBlur = 0;

    return canvas;
  };

  const canvases: Array<HTMLCanvasElement | OffscreenCanvas> = [];
  for (let frameIndex = 0; frameIndex < MATRIX_TEXTURE_FRAME_COUNT; frameIndex++) {
    await yieldToBrowser();
    const canvas = renderFrame(frameIndex);
    if (!canvas) return null;
    canvases.push(canvas);
  }

  return canvases;
}
