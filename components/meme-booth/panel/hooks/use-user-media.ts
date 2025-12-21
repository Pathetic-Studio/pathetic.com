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

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === "videoinput");
            setCanFlip(videoInputs.length > 1);
        } catch {
            setCanFlip(false);
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
            // ignore autoplay quirks
        }
    }, []);

    const inferFacingModeFromStream = useCallback((stream: MediaStream): FacingMode => {
        const track = stream.getVideoTracks()?.[0];
        const settings = track?.getSettings?.();
        const fm = settings?.facingMode;
        return fm === "environment" ? "environment" : "user";
    }, []);

    const start = useCallback(
        async (requestedMode?: FacingMode) => {
            if (startingRef.current) return;

            if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
                setError("Camera not supported in this browser.");
                return;
            }

            startingRef.current = true;
            stop();

            const modeToTry: FacingMode = requestedMode ?? "user"; // DEFAULT SELFIE

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: modeToTry },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });

                streamRef.current = stream;
                setFacingMode(inferFacingModeFromStream(stream));
                await attachToVideo();
                setError(null);

                // iOS/Safari often needs permission before this is accurate
                await detectFlipSupport();
            } catch {
                try {
                    const fallback = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false,
                    });

                    streamRef.current = fallback;
                    setFacingMode(inferFacingModeFromStream(fallback));
                    await attachToVideo();
                    setError(null);

                    await detectFlipSupport();
                } catch (err2: any) {
                    console.error("[useUserMedia] getUserMedia failed", err2);
                    setError(err2?.message || "Camera access failed.");
                    setCanFlip(false);
                }
            } finally {
                startingRef.current = false;
            }
        },
        [attachToVideo, detectFlipSupport, inferFacingModeFromStream, stop]
    );

    const flipCamera = useCallback(() => {
        const next: FacingMode = facingMode === "user" ? "environment" : "user";
        start(next);
    }, [facingMode, start]);

    useEffect(() => {
        if (!active) {
            stop();
            return;
        }

        start();
    }, [active, start, stop]);

    return {
        videoRef,
        streamRef,
        error,
        setError,
        facingMode,
        canFlip,
        flipCamera,
        start,
        stop,
    };
}
