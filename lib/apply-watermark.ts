// lib/apply-watermark.ts
// Burns a "pathetic.com/booth" watermark into the bottom-right corner of an image data URL.

const WATERMARK_TEXT = "pathetic.com/booth";

export async function applyWatermark(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Scale font size to image width (2.5%, min 14px)
        const fontSize = Math.max(14, Math.round(img.naturalWidth * 0.025));
        const padding = Math.round(fontSize * 0.6);

        ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";

        const x = canvas.width - padding;
        const y = canvas.height - padding;

        // Black outline
        ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.15));
        ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
        ctx.lineJoin = "round";
        ctx.strokeText(WATERMARK_TEXT, x, y);

        // White fill
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillText(WATERMARK_TEXT, x, y);

        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
