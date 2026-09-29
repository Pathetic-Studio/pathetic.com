"use client";

import { useEffect, useState } from "react";

// Four local atlases share one worker and one cached result each, including
// across client navigation. Object URLs belong to each mounted consumer.
const assets = new Map<string, Promise<Blob | null>>();
const requests = new Map<number, (blob: Blob | null) => void>();
let worker: Worker | null = null;
let nextRequest = 0;

async function keyOnMainThread(source: string): Promise<Blob | null> {
  const image = new Image();
  image.decoding = "async";
  image.src = source;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  // Older browsers yield between strips instead of running one long pixel loop.
  const strip = canvas.width * 4 * 16;
  for (let start = 0; start < data.length; start += strip) {
    const end = Math.min(data.length, start + strip);
    for (let index = start; index < end; index += 4) {
      const red = data[index],
        green = data[index + 1],
        blue = data[index + 2];
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
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }
  context.putImageData(pixels, 0, 0);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function processAsset(source: string): Promise<Blob | null> {
  const cached = assets.get(source);
  if (cached) return cached;
  const result = (async () => {
    if (
      typeof Worker !== "undefined" &&
      typeof OffscreenCanvas !== "undefined"
    ) {
      try {
        if (!worker) {
          worker = new Worker(
            new URL("./chroma-key.worker.ts", import.meta.url),
          );
          worker.onmessage = ({
            data,
          }: MessageEvent<{ id: number; blob: Blob | null }>) => {
            requests.get(data.id)?.(data.blob);
            requests.delete(data.id);
          };
          worker.onerror = () => {
            requests.forEach((resolve) => resolve(null));
            requests.clear();
            worker?.terminate();
            worker = null;
          };
        }
        const id = nextRequest++;
        const blob = await new Promise<Blob | null>((resolve) => {
          requests.set(id, resolve);
          worker!.postMessage({
            id,
            source: new URL(source, window.location.href).href,
          });
        });
        if (blob) return blob;
      } catch {
        /* Fall back to the same keying operation in yielding strips. */
      }
    }
    return keyOnMainThread(source);
  })().catch(() => null);
  assets.set(source, result);
  void result.then((blob) => {
    if (!blob) assets.delete(source);
  });
  return result;
}

export default function useChromaKeyAsset(source: string, enabled: boolean) {
  const [asset, setAsset] = useState<{ source: string; url: string } | null>(
    null,
  );
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let objectUrl: string | null = null;
    void processAsset(source).then((blob) => {
      if (disposed || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setAsset({ source, url: objectUrl });
    });
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enabled, source]);
  return enabled && asset?.source === source ? asset.url : null;
}
