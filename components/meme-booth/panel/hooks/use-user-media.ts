//components/meme-booth/panel/hooks/use-user-media.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FacingMode = "user" | "environment";

type UseUserMediaOptions = {
    active: boolean;
};

export function useUserMedia({ active }: UseUserMediaOptions) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<FacingMode>("user");
    const [canFlip, setCanFlip] = useState(false);

    const startingRef = useRef(false);

    const stop = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const detectFlipSupport = useCallback(async () => {
        if (!navigator.mediaDevices?.enumerateDevices) return;

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");

        setCanFlip(videoInputs.length > 1);
    }, []);

    const attachToVideo = useCallback(async () => {
        const v = videoRef.current;
        const s = streamRef.current;
        if (!v || !s) return;

        if (v.srcObject !== s) v.srcObject = s;
        v.playsInline = true;
        v.muted = true;

        try {
            await v.play();
        } catch {
            // autoplay quirks ignored
        }
    }, []);

    const start = useCallback(
        async (mode: FacingMode = facingMode) => {
            if (startingRef.current) return;
            if (!navigator.mediaDevices?.getUserMedia) {
                setError("Camera not supported.");
                return;
            }

            startingRef.current = true;
            stop();

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { exact: mode },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });

                streamRef.current = stream;
                setFacingMode(mode);
                await attachToVideo();
                setError(null);
            } catch {
                try {
                    const fallback = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false,
                    });
                    streamRef.current = fallback;
                    await attachToVideo();
                } catch (err: any) {
                    setError(err?.message || "Camera access failed.");
                }
            } finally {
                startingRef.current = false;
            }
        },
        [attachToVideo, facingMode, stop]
    );

    const flipCamera = useCallback(() => {
        const next: FacingMode =
            facingMode === "user" ? "environment" : "user";
        start(next);
    }, [facingMode, start]);

    useEffect(() => {
        if (!active) {
            stop();
            return;
        }

        detectFlipSupport();
        start();
    }, [active, detectFlipSupport, start, stop]);

    return {
        videoRef,
        error,
        setError,
        facingMode,
        canFlip,
        flipCamera,
    };
}
