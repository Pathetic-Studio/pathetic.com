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
    const [hasStream, setHasStream] = useState(false);

    const startingRef = useRef(false);
    const activeRef = useRef(active);
    activeRef.current = active;

    // Track if we've ever successfully gotten a stream (to avoid re-prompting)
    const hasEverHadStreamRef = useRef(false);

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

    // Pause video without stopping the stream (keeps permission)
    const pause = useCallback(() => {
        const v = videoRef.current;
        if (v) {
            v.pause();
        }
    }, []);

    // Resume video from existing stream (no permission prompt)
    const resume = useCallback(async () => {
        const v = videoRef.current;
        const s = streamRef.current;
        if (!v || !s) return false;

        // Check if stream is still active
        const tracks = s.getVideoTracks();
        if (tracks.length === 0 || tracks[0].readyState === "ended") {
            return false;
        }

        if (v.srcObject !== s) v.srcObject = s;

        try {
            await v.play();
            return true;
        } catch {
            return false;
        }
    }, []);

    // Full stop - actually releases the camera (only for cleanup)
    const stop = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setHasStream(false);
    }, []);

    const start = useCallback(
        async (requestedMode?: FacingMode) => {
            if (startingRef.current) return;

            // If we already have an active stream, just resume it
            if (streamRef.current) {
                const tracks = streamRef.current.getVideoTracks();
                if (tracks.length > 0 && tracks[0].readyState !== "ended") {
                    const resumed = await resume();
                    if (resumed) return;
                }
            }

            if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
                setError("Camera not supported in this browser.");
                return;
            }

            startingRef.current = true;

            // Only stop existing stream if we're switching cameras
            if (requestedMode && streamRef.current) {
                stop();
            }

            const modeToTry: FacingMode = requestedMode ?? facingMode ?? "user";

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
                hasEverHadStreamRef.current = true;
                setHasStream(true);
                setFacingMode(inferFacingModeFromStream(stream));
                await attachToVideo();
                setError(null);

                await detectFlipSupport();
            } catch {
                try {
                    const fallback = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false,
                    });

                    streamRef.current = fallback;
                    hasEverHadStreamRef.current = true;
                    setHasStream(true);
                    setFacingMode(inferFacingModeFromStream(fallback));
                    await attachToVideo();
                    setError(null);

                    await detectFlipSupport();
                } catch (err2: any) {
                    console.error("[useUserMedia] getUserMedia failed", err2);
                    setError(err2?.message || "Camera access failed.");
                    setCanFlip(false);
                    setHasStream(false);
                }
            } finally {
                startingRef.current = false;
            }
        },
        [attachToVideo, detectFlipSupport, inferFacingModeFromStream, stop, resume, facingMode]
    );

    const flipCamera = useCallback(() => {
        const next: FacingMode = facingMode === "user" ? "environment" : "user";
        // For flip, we need to get a new stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        start(next);
    }, [facingMode, start]);

    // Effect to start/stop camera based on active state.
    // IMPORTANT: We fully stop() instead of pause() when inactive.
    // pause() keeps the stream alive, which on mobile causes the browser
    // to show camera permission popups over the loading screen / result.
    useEffect(() => {
        if (active) {
            // Try to resume existing stream first, only start new if needed
            if (streamRef.current) {
                const tracks = streamRef.current.getVideoTracks();
                if (tracks.length > 0 && tracks[0].readyState !== "ended") {
                    resume();
                    return;
                }
            }
            // No existing stream, start fresh
            start();
        } else {
            stop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    // Cleanup on unmount - fully stop the stream
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
        };
    }, []);

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
        pause,
        resume,
        hasStream,
    };
}
