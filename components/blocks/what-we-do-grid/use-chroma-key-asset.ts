"use client";

import { useEffect, useState } from "react";

export default function useChromaKeyAsset(
  source: string,
  enabled: boolean,
) {
  const [assetUrl, setAssetUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let objectUrl: string | null = null;
    let processTimer = 0;
    const sourceImage = new window.Image();
    sourceImage.decoding = "async";

    sourceImage.onload = () => {
      processTimer = window.setTimeout(() => {
        if (disposed) return;

        const canvas = document.createElement("canvas");
        canvas.width = sourceImage.naturalWidth;
        canvas.height = sourceImage.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;

        context.drawImage(sourceImage, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = pixels.data;

        for (let index = 0; index < data.length; index += 4) {
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const greenDominance = green - Math.max(red, blue);

          if (green > 105 && greenDominance > 20) {
            const keyStrength = Math.max(
              0,
              Math.min(1, (greenDominance - 20) / 88),
            );
            data[index + 3] = Math.round(data[index + 3] * (1 - keyStrength));
            data[index + 1] = Math.min(
              green,
              Math.max(red, blue) + Math.round(10 * (1 - keyStrength)),
            );
          }
        }

        context.putImageData(pixels, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob || disposed) return;
          objectUrl = URL.createObjectURL(blob);
          setAssetUrl(objectUrl);
        }, "image/png");
      }, 0);
    };

    sourceImage.src = source;

    return () => {
      disposed = true;
      window.clearTimeout(processTimer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enabled, source]);

  return assetUrl;
}
