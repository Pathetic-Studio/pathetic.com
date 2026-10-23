import type { InstagramProfile } from "@/lib/instagram/profile";
import type { drawMatrixArtwork } from "@/components/blocks/talent-matrix/matrix-texture-artwork";

export type SceneArtworkRequest =
  | { kind: "matrix"; options: Parameters<typeof drawMatrixArtwork>[0] }
  | { kind: "profile"; profile: InstagramProfile };

let worker: Worker | null = null;
let nextId = 0;
const requests = new Map<number, (images: ImageBitmap[] | null) => void>();

/** Rasterize expensive canvas text off the scrolling thread, keeping a fallback. */
export async function renderSceneArtwork(
  request: SceneArtworkRequest,
  sources: Array<HTMLImageElement | null> = [],
): Promise<ImageBitmap[] | null> {
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined" ||
      typeof createImageBitmap === "undefined") return null;
  let inputs: Array<ImageBitmap | null> = [];
  try {
    for (const image of sources) {
      if (!image) { inputs.push(null); continue; }
      if (image.src.split("?")[0].endsWith(".svg")) {
        // Chrome cannot create a bitmap directly from an SVG image. Rasterize
        // only this small avatar, while the feed's text and layout stay off-thread.
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
        inputs.push(await createImageBitmap(canvas));
      } else {
        inputs.push(await createImageBitmap(image));
      }
    }
    if (!worker) {
      worker = new Worker(new URL("./scene-artwork.worker.ts", import.meta.url));
      worker.onmessage = ({ data }: MessageEvent<{ id: number; images: ImageBitmap[] | null }>) => {
        const resolve = requests.get(data.id);
        if (resolve) resolve(data.images);
        else data.images?.forEach(image => image.close());
        requests.delete(data.id);
      };
      worker.onerror = () => {
        requests.forEach(resolve => resolve(null));
        requests.clear();
        worker?.terminate();
        worker = null;
      };
    }
    const id = nextId++;
    return await new Promise<ImageBitmap[] | null>((resolve) => {
      const timeout = setTimeout(() => {
        requests.delete(id);
        resolve(null);
      }, 10000);
      requests.set(id, (images) => {
        clearTimeout(timeout);
        resolve(images);
      });
      try {
        worker!.postMessage({ id, request, inputs }, inputs.filter((image): image is ImageBitmap => image !== null));
      } catch {
        requests.get(id)?.(null);
        requests.delete(id);
        inputs.forEach(image => image?.close());
      }
    });
  } catch {
    inputs.forEach(image => image?.close());
    return null;
  }
}
