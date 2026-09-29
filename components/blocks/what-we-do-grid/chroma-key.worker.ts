// Decode and key the source atlases away from scrolling, animation and input.
const workerScope = self as unknown as {
  onmessage:
    | ((event: MessageEvent<{ id: number; source: string }>) => void)
    | null;
  postMessage: (result: { id: number; blob: Blob | null }) => void;
};
let queue = Promise.resolve();
workerScope.onmessage = ({ data: { id, source } }) => {
  queue = queue.then(async () => {
    let bitmap: ImageBitmap | null = null;
    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error("Image unavailable");
      bitmap = await createImageBitmap(await response.blob());
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(bitmap, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = pixels.data;
      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const dominance = green - Math.max(red, blue);
        if (green > 105 && dominance > 20) {
          const strength = Math.max(0, Math.min(1, (dominance - 20) / 88));
          data[index + 3] = Math.round(data[index + 3] * (1 - strength));
          data[index + 1] = Math.min(
            green,
            Math.max(red, blue) + Math.round(10 * (1 - strength)),
          );
        }
      }
      context.putImageData(pixels, 0, 0);
      workerScope.postMessage({
        id,
        blob: await canvas.convertToBlob({ type: "image/png" }),
      });
    } catch {
      workerScope.postMessage({ id, blob: null });
    } finally {
      bitmap?.close();
    }
  });
};
export {};
