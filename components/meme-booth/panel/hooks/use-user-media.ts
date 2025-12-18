//components/meme-booth/panel/hooks/use-user-media.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseUserMediaOptions = {
    active: boolean;
};

export function useUserMedia({ active }: UseUserMediaOptions) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [error, setError] = useState<string | null>(null);
    const startingRef = useRef(false);

    const stop = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        const v = videoRef.current;
        if (v) {

            v.srcObject = null;
        }
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
            // ignore autoplay quirks; user gesture will usually resolve
        }
    }, []);

    const start = useCallback(async () => {
        if (startingRef.current) return;
        if (
            typeof navigator === "undefined" ||
            !navigator.mediaDevices?.getUserMedia
        ) {
            setError("Camera not supported in this browser.");
            return;
        }

        // if we already have a live stream, just re-attach (covers remounts)
        const existing = streamRef.current;
        if (existing && existing.getTracks().some((t) => t.readyState === "live")) {
            await attachToVideo();
            setError(null);
            return;
        }

        startingRef.current = true;

        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: { ideal: "user" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            await attachToVideo();
            setError(null);
        } catch (err: any) {
            // fallback
            try {
                const fallback = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
                streamRef.current = fallback;

                await attachToVideo();
                setError(null);
            } catch (err2: any) {
                console.error("[useUserMedia] getUserMedia failed", err2);
                setError(err2?.message || "Camera access failed.");
            }
        } finally {
            startingRef.current = false;
        }
    }, [attachToVideo]);

    // Start/stop based on active flag
    useEffect(() => {
        if (!active) {
            stop();
            return;
        }

        let cancelled = false;

        (async () => {
            await start();
            if (cancelled) return;
        })();

        return () => {
            cancelled = true;
        };
    }, [active, start, stop]);

    // If the <video> element gets recreated (because the renderer unmounted),
    // re-attach the stream once it exists again.
    useEffect(() => {
        if (!active) return;
        if (!streamRef.current) return;

        const id = window.setInterval(() => {
            if (!active) return;
            if (!streamRef.current) return;

            const v = videoRef.current;
            if (!v) return;


            const bound = v.srcObject === streamRef.current;
            if (!bound) attachToVideo();
        }, 250);

        return () => window.clearInterval(id);
    }, [active, attachToVideo]);

    return { videoRef, streamRef, error, setError, start, stop };
}
