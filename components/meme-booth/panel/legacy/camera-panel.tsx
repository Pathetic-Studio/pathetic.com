"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    FilesetResolver,
    ImageSegmenter,
    MPMask,
} from "@mediapipe/tasks-vision";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

import StarterPackParticles from "@/components/effects/starter-pack-particles";
import LoadingBar from "@/components/ui/loading-bar";
import ImageUploadPanel from "@/components/meme-booth/image-upload-panel";

import ModeToggle, { type InputMode } from "@/components/meme-booth/mode-toggle";
import BottomActions from "@/components/meme-booth/bottom-actions";
import CameraCaptureView from "@/components/meme-booth/camera-capture-view";
import StarterPackResultView from "@/components/meme-booth/starter-pack-result-view";



if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const refreshScroll = () => {
    if (typeof window === "undefined") return;
    try {
        ScrollTrigger.refresh();
    } catch (err) {
        console.warn("[CameraPanel] scroll refresh failed", err);
    }
};

const USE_SPRITE_MODE = true as const;
const USE_YOLO_SPLITTER = true as const;

function UploadedImagePreview({ blob }: { blob: Blob }) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        const objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [blob]);

    if (!url) {
        return (
            <div className="aspect-[3/4] w-full max-h-[480px] bg-gray-100" />
        );
    }

    return (
        <img
            src={url}
            alt="Uploaded fit"
            className="w-full max-h-[480px] object-contain"
        />
    );
}

export default function CameraPanel() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const srcCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const outCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const snapCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const imgDataRef = useRef<ImageData | null>(null);
    const segRef = useRef<ImageSegmenter | null>(null);
    const rafRef = useRef<number | null>(null);
    const busyRef = useRef(false);

    const [segReady, setSegReady] = useState(false);
    const [segmentEnabled, setSegmentEnabled] = useState(false);
    const [mode, setMode] = useState<InputMode>("camera");

    const [error, setError] = useState<string | null>(null);
    const [blob, setBlob] = useState<Blob | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const scrimRef = useRef<HTMLDivElement | null>(null);
    const [loading, setLoading] = useState(false);
    const [sprites, setSprites] = useState<string[] | null>(null);

    // Layout / animation refs
    const activeSpaceRef = useRef<HTMLDivElement | null>(null);
    const baseContentRef = useRef<HTMLDivElement | null>(null);
    const loaderOverlayRef = useRef<HTMLDivElement | null>(null);
    const resultImageRef = useRef<HTMLImageElement | null>(null);

    const loadingMessages = useMemo(
        () => [
            { at: 0.05, text: "Analyzing fit" },
            { at: 0.3, text: "Dissecting personality" },
            { at: 0.6, text: "Removing individuality" },
            { at: 0.85, text: "Clowning your whole life" },
            { at: 0.9, text: "Adding finishing touches" },
        ],
        []
    );

    const refreshScroll = () => {
        if (typeof window === "undefined") return;
        try {
            const smoother = ScrollSmoother.get();
            if (smoother) {
                smoother.refresh();
            } else {
                ScrollTrigger.refresh();
            }
        } catch (err) {
            console.warn("[CameraPanel] scroll refresh failed", err);
        }
    };

    // CAMERA INIT
    useEffect(() => {
        if (
            typeof navigator === "undefined" ||
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {
            setError("Camera not supported in this browser.");
            return;
        }

        let cancelled = false;

        const startCamera = async () => {
            try {
                const constraints: MediaStreamConstraints = {
                    video: {
                        facingMode: { ideal: "user" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                };

                let stream = await navigator.mediaDevices.getUserMedia(constraints);

                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                streamRef.current = stream;

                const video = videoRef.current;
                if (video) {
                    video.srcObject = stream;
                    video.playsInline = true;
                    video.muted = true;

                    try {
                        const playPromise = video.play();
                        if (playPromise && typeof playPromise.then === "function") {
                            playPromise.catch((err) => {
                                console.warn("[CameraPanel] video.play() blocked:", err);
                            });
                        }
                    } catch (err) {
                        console.warn("[CameraPanel] video.play() error:", err);
                    }
                }
            } catch (err: any) {
                console.error("[CameraPanel] getUserMedia failed", err);

                if (
                    err?.name === "OverconstrainedError" ||
                    err?.name === "NotReadableError"
                ) {
                    try {
                        const fallbackStream =
                            await navigator.mediaDevices.getUserMedia({
                                video: true,
                                audio: false,
                            });

                        if (cancelled) {
                            fallbackStream.getTracks().forEach((t) => t.stop());
                            return;
                        }

                        streamRef.current = fallbackStream;

                        const video = videoRef.current;
                        if (video) {
                            video.srcObject = fallbackStream;
                            video.playsInline = true;
                            video.muted = true;
                            try {
                                const playPromise = video.play();
                                if (playPromise && typeof playPromise.then === "function") {
                                    playPromise.catch((err2) => {
                                        console.warn(
                                            "[CameraPanel] fallback video.play() blocked:",
                                            err2
                                        );
                                    });
                                }
                            } catch (err2) {
                                console.warn(
                                    "[CameraPanel] fallback video.play() error:",
                                    err2
                                );
                            }
                        }

                        setError(null);
                        return;
                    } catch (err2: any) {
                        console.error(
                            "[CameraPanel] fallback getUserMedia failed",
                            err2
                        );
                        setError(
                            err2?.message || "Camera access failed (fallback)."
                        );
                        return;
                    }
                }

                setError(
                    err?.message ||
                    "Camera access failed. On some mobile browsers, camera is blocked."
                );
            }
        };

        startCamera();

        return () => {
            cancelled = true;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
        };
    }, []);

    // Ensure camera resumes when switching back to camera mode and no blob
    useEffect(() => {
        if (mode !== "camera" || blob) return;

        const video = videoRef.current;
        const stream = streamRef.current;

        if (video && stream) {
            if (video.srcObject !== stream) {
                video.srcObject = stream;
            }

            if (video.paused) {
                video.play().catch(() => {
                    /* ignore autoplay failure */
                });
            }
        }
    }, [mode, blob]);

    // SEGMENTER INIT
    useEffect(() => {
        (async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );

                segRef.current = await ImageSegmenter.createFromOptions(
                    filesetResolver,
                    {
                        baseOptions: {
                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
                        },
                        runningMode: "IMAGE",
                        outputCategoryMask: true,
                    }
                );

                setSegReady(true);
            } catch (e: any) {
                console.error("[CameraPanel] Segmenter init failed", e);
                setError(e?.message || "Segmenter init failed");
            }
        })();

        return () => {
            segRef.current = null;
        };
    }, []);

    // REALTIME LOOP
    useEffect(() => {
        if (blob || mode !== "camera") return;

        const loop = async () => {
            const v = videoRef.current;
            const out = outCanvasRef.current;
            const src = srcCanvasRef.current;
            const maskCanvas = maskCanvasRef.current;

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
            if (maskCanvas && (maskCanvas.width !== W || maskCanvas.height !== H)) {
                maskCanvas.width = W;
                maskCanvas.height = H;
            }

            const sctx = src.getContext("2d")!;
            const octx = out.getContext("2d")!;

            // Mirror feed into src
            sctx.save();
            sctx.setTransform(-1, 0, 0, 1, W, 0);
            sctx.drawImage(v, 0, 0, W, H);
            sctx.restore();

            // Base camera on out canvas
            octx.save();
            octx.clearRect(0, 0, W, H);
            octx.globalCompositeOperation = "copy";
            octx.drawImage(src, 0, 0, W, H);

            // Segmentation
            const seg = segRef.current;
            if (segReady && segmentEnabled && seg && maskCanvas) {
                if (!imgDataRef.current) {
                    imgDataRef.current =
                        maskCanvas.getContext("2d")!.createImageData(W, H);
                }
                const imgData = imgDataRef.current!;
                const mctx = maskCanvas.getContext("2d")!;

                if (!busyRef.current) {
                    busyRef.current = true;
                    try {
                        const res = await seg.segment(src);
                        const categoryMask = res?.categoryMask as MPMask | undefined;

                        if (categoryMask) {
                            const labels = categoryMask.getAsUint8Array();
                            const data = imgData.data;

                            for (let i = 0, j = 0; i < labels.length; i++, j += 4) {
                                const a = labels[i] === 0 ? 255 : 0;
                                data[j] = 0;
                                data[j + 1] = 0;
                                data[j + 2] = 0;
                                data[j + 3] = a;
                            }

                            mctx.clearRect(0, 0, W, H);
                            mctx.putImageData(imgData, 0, 0);

                            octx.globalCompositeOperation = "destination-in";
                            octx.drawImage(maskCanvas, 0, 0, W, H);
                        }
                    } catch (err) {
                        console.error("[CameraPanel] segment loop error", err);
                    } finally {
                        busyRef.current = false;
                    }
                }
            }

            octx.restore();
            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [blob, mode, segReady, segmentEnabled]);

    // CAPTURE from camera – returns the blob
    const capture = async (): Promise<Blob | null> => {
        const out = outCanvasRef.current;
        const snap = snapCanvasRef.current;
        const video = videoRef.current;

        if (!out || !snap) {
            console.warn("[CameraPanel] capture: missing canvases");
            return null;
        }

        let width = out.width;
        let height = out.height;

        if ((!width || !height) && video) {
            width = video.videoWidth;
            height = video.videoHeight;
        }

        if (!width || !height) {
            console.warn(
                "[CameraPanel] capture: no valid dimensions (out canvas and video are 0)"
            );
            return null;
        }

        snap.width = width;
        snap.height = height;
        snap.getContext("2d")!.drawImage(out, 0, 0, width, height);

        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
        });

        return new Promise<Blob | null>((resolve) => {
            snap.toBlob(
                (b) => {
                    if (!b) {
                        console.warn("[CameraPanel] capture: toBlob returned null");
                        resolve(null);
                        return;
                    }

                    setSprites(null);
                    setGeneratedImage(null);
                    setBlob(b);
                    refreshScroll();
                    resolve(b);
                },
                "image/png"
            );
        });
    };

    const resetState = () => {
        setBlob(null);
        setGeneratedImage(null);
        setSprites(null);
        setLoading(false);
        setError(null);

        const loader = loaderOverlayRef.current;
        const base = baseContentRef.current;

        if (base) {
            base.style.opacity = "1";
        }
        if (loader) {
            gsap.set(loader, { autoAlpha: 0 });
        }

        refreshScroll();
    };

    const handleChangeImage = () => {
        resetState();
        setMode("camera");
    };

    const switchMode = (next: InputMode) => {
        if (next === mode) return;
        resetState();
        setMode(next);
    };

    const handleUploadedImage = (file: File) => {
        setSprites(null);
        setGeneratedImage(null);
        setBlob(file);
        refreshScroll();
    };

    const generateStarterPack = async (sourceBlob?: Blob | null) => {
        const imageBlob = sourceBlob ?? blob;
        if (!imageBlob) return;

        let success = false;
        setLoading(true);
        setError(null);

        try {
            const fd = new FormData();
            fd.append("image", imageBlob, "fit.png");

            const res = await fetch("/api/starter-pack", {
                method: "POST",
                body: fd,
            });

            const data = await res.json();

            if (!res.ok || !data.image) {
                setError(data.error || "Starter pack generation failed");
                return;
            }

            const container = activeSpaceRef.current;
            const startHeight = container?.offsetHeight ?? 0;

            setGeneratedImage(data.image);

            requestAnimationFrame(() => {
                if (!container) {
                    refreshScroll();
                    return;
                }

                const endHeight = container.offsetHeight;

                if (startHeight && endHeight && startHeight !== endHeight) {
                    gsap.fromTo(
                        container,
                        { height: startHeight, overflow: "hidden" },
                        {
                            height: endHeight,
                            duration: 0.5,
                            ease: "power2.out",
                            onComplete: () => {
                                container.style.height = "auto";
                                container.style.overflow = "visible";
                                refreshScroll();
                            },
                        }
                    );
                } else {
                    refreshScroll();
                }
            });

            success = true;
        } catch (err: any) {
            setError(err?.message || "Starter pack failed");
        } finally {
            setLoading(false);
            if (!success) {
                // no-op
            }
        }
    };

    // Generate in CAMERA mode: capture + send
    const handleCaptureAndGenerate = async () => {
        if (loading) return;

        const captured = await capture();
        if (!captured) return;

        await generateStarterPack(captured);
    };

    // Generate in UPLOAD mode
    const handleGenerateUpload = async () => {
        if (loading) return;
        await generateStarterPack();
    };

    // Extra safety: refresh when generatedImage changes
    useEffect(() => {
        if (!generatedImage) return;
        refreshScroll();
    }, [generatedImage]);

    // Loader overlay visibility
    useEffect(() => {
        const loader = loaderOverlayRef.current;
        const scrim = scrimRef.current;
        if (!loader || !scrim) return;

        const ctx = gsap.context(() => {
            gsap.to([loader, scrim], {
                autoAlpha: loading ? 1 : 0,
                duration: 0.3,
                ease: "power2.out",
            });
        });

        return () => ctx.revert();
    }, [loading]);

    return (
        <section className="mx-auto max-w-xl py-1">
            <div className="relative border border-border bg-background px-4 py-5">
                {error && (
                    <p className="mb-2 text-xs text-red-600">
                        {error}
                    </p>
                )}

                {USE_SPRITE_MODE && sprites && (
                    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                        <StarterPackParticles images={sprites} />
                    </div>
                )}

                <ModeToggle mode={mode} onChange={switchMode} />

                <div
                    ref={activeSpaceRef}
                    className="relative w-full"
                >
                    <div
                        className="pointer-events-none absolute inset-0 bg-background opacity-0"
                        ref={scrimRef}
                    />

                    <div ref={baseContentRef} className="h-full">
                        {generatedImage ? (
                            <StarterPackResultView
                                image={generatedImage}
                                imgRef={resultImageRef}
                                useSpriteMode={USE_SPRITE_MODE}
                                useYoloSplitter={USE_YOLO_SPLITTER}
                                onSprites={setSprites}
                            />
                        ) : mode === "camera" ? (
                            <CameraCaptureView
                                videoRef={videoRef}
                                outCanvasRef={outCanvasRef}
                                segReady={segReady}
                                segmentEnabled={segmentEnabled}
                                onCapture={handleCaptureAndGenerate} // generate button here
                                onToggleSegment={() =>
                                    setSegmentEnabled((p) => !p)
                                }
                                hasBlob={!!blob}
                            />
                        ) : blob ? (
                            <UploadedImagePreview blob={blob} />
                        ) : (
                            <div className="flex flex-col">
                                <ImageUploadPanel
                                    disabled={loading}
                                    onImageLoaded={handleUploadedImage}
                                />
                            </div>
                        )}
                    </div>

                    <div
                        ref={loaderOverlayRef}
                        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0"
                    >
                        <div className="w-full px-10">
                            <LoadingBar
                                active={loading}
                                label="Cooking your meme…"
                                messages={loadingMessages}
                            />
                        </div>
                    </div>
                </div>

                <BottomActions
                    mode={mode}
                    hasBlob={!!blob}
                    hasGenerated={!!generatedImage}
                    loading={loading}
                    onChangeImage={handleChangeImage}
                    onGenerateUpload={handleGenerateUpload}
                />

                <canvas ref={srcCanvasRef} className="hidden" />
                <canvas ref={maskCanvasRef} className="hidden" />
                <canvas ref={snapCanvasRef} className="hidden" />
            </div>
        </section>
    );
}
