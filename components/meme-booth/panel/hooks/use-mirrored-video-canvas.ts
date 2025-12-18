//components/meme-booth/panel/hooks/use-mirrored-video-canvas.ts
"use client";

import { useEffect, useRef } from "react";

type Args = {
    enabled: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    outCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    srcCanvasRef: React.RefObject<HTMLCanvasElement | null>;
};

export function useMirroredVideoCanvas({
    enabled,
    videoRef,
    outCanvasRef,
    srcCanvasRef,
}: Args) {
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const loop = () => {
            const v = videoRef.current;
            const out = outCanvasRef.current;
            const src = srcCanvasRef.current;

            if (!v || !out || !src) {
                rafRef.current = requestAnimationFrame(loop);
                return;
            }

            const W = v.videoWidth;
            const H = v.videoHeight;

            if (!W || !H) {
                rafRef.current = requestAnimationFrame(loop);
                return;
            }

            if (out.width !== W || out.height !== H) {
                out.width = W;
                out.height = H;
            }
            if (src.width !== W || src.height !== H) {
                src.width = W;
                src.height = H;
            }

            const sctx = src.getContext("2d")!;
            const octx = out.getContext("2d")!;

            // mirrored source
            sctx.save();
            sctx.setTransform(-1, 0, 0, 1, W, 0);
            sctx.drawImage(v, 0, 0, W, H);
            sctx.restore();

            // copy to output
            octx.save();
            octx.clearRect(0, 0, W, H);
            octx.globalCompositeOperation = "copy";
            octx.drawImage(src, 0, 0, W, H);
            octx.restore();

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [enabled, videoRef, outCanvasRef, srcCanvasRef]);
}
