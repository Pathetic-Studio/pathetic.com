import type { SceneArtworkRequest } from "./scene-artwork";
import { drawMatrixArtwork } from "@/components/blocks/talent-matrix/matrix-texture-artwork";
import { drawProfileArtwork } from "@/components/blocks/network-reach/network-profile-artwork";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<{ id: number; request: SceneArtworkRequest; inputs: Array<ImageBitmap | null> }>) => void) | null;
  postMessage: (message: unknown, transfer: Transferable[]) => void;
};

scope.onmessage = async ({ data: { id, request, inputs } }) => {
  let images: ImageBitmap[] | null = null;
  try {
    if (request.kind === "matrix") {
      const canvases = await drawMatrixArtwork(request.options);
      images = canvases?.map(canvas => (canvas as OffscreenCanvas).transferToImageBitmap()) ?? null;
    } else {
      const canvas = new OffscreenCanvas(600, 1300);
      await drawProfileArtwork(canvas, request.profile, inputs);
      images = [canvas.transferToImageBitmap()];
    }
    scope.postMessage({ id, images }, images ?? []);
  } catch {
    images?.forEach(image => image.close());
    scope.postMessage({ id, images: null }, []);
  } finally {
    inputs.forEach(image => image?.close());
  }
};
