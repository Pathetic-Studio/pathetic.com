// components/meme-booth/camera-panel.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    FilesetResolver,
    ImageSegmenter,
    MPMask,
} from "@mediapipe/tasks-vision";
import { gsap } from "gsap";

import StarterPackParticles from "@/components/effects/starter-pack-particles";
import LoadingBar from "@/components/ui/loading-bar";
import ImageUploadPanel from "@/components/meme-booth/image-upload-panel";

import ModeToggle, { type InputMode } from "@/components/meme-booth/mode-toggle";
import BottomActions from "@/components/meme-booth/bottom-actions";
import CameraCaptureView from "@/components/meme-booth/camera-capture-view";
import StarterPackResultView from "@/components/meme-booth/starter-pack-result-view";

const USE_SPRITE_MODE = true as const;
const USE_YOLO_SPLITTER = true as const;
const ACTIVE_MAX_HEIGHT = 480; // px – cap active space height

function UploadedImagePreview({ blob }: { blob: Blob }) {
    const [url, setUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
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

    const loadingMessages = React.useMemo(
        () => [
            { at: 0.05, text: "Scanning your fit…" },
            { at: 0.3, text: "Cutting you out of the background…" },
            { at: 0.6, text: "Arranging your starter pack…" },
            { at: 0.85, text: "Adding unrequested spice…" },
        ],
        []
    );

    // CAMERA INIT
    useEffect(() => {
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: "user" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    try {
                        await videoRef.current.play();
                    } catch {
                        // autoplay restrictions
                    }
                }
            } catch (e: any) {
                setError(e?.message || "Camera access failed");
            }
        })();

        return () => {
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
                setError(e?.message || "Segmenter init failed");
            }
        })();

        return () => {
            segRef.current = null;
        };
    }, []);

    // REALTIME SEGMENTATION LOOP (camera mode only, and only before capture)
    useEffect(() => {
        if (!segReady || blob || mode !== "camera") return;

        const loop = async () => {
            const v = videoRef.current;
            const seg = segRef.current;
            const out = outCanvasRef.current;
            const maskCanvas = maskCanvasRef.current;
            const src = srcCanvasRef.current;

            if (!v || !seg || !out || !maskCanvas || !src || blob || mode !== "camera") {
                rafRef.current = requestAnimationFrame(loop);
                return;
            }

            const W = v.videoWidth;
            const H = v.videoHeight;

            if (!W || !H) {
                rafRef.current = requestAnimationFrame(loop);
                return;
            }

            if (out.width !== W || out.height !== H || !imgDataRef.current) {
                out.width = W;
                out.height = H;
                maskCanvas.width = W;
                maskCanvas.height = H;
                src.width = W;
                src.height = H;
                imgDataRef.current =
                    maskCanvas.getContext("2d")!.createImageData(W, H);
            }

            const imgData = imgDataRef.current!;
            const sctx = src.getContext("2d")!;

            // Mirror feed
            sctx.save();
            sctx.setTransform(-1, 0, 0, 1, W, 0);
            sctx.drawImage(v, 0, 0, W, H);
            sctx.restore();

            if (!busyRef.current) {
                busyRef.current = true;

                try {
                    const res = await seg.segment(src);
                    const categoryMask = res?.categoryMask as MPMask | undefined;
                    const octx = out.getContext("2d")!;

                    octx.save();
                    octx.clearRect(0, 0, W, H);
                    octx.globalCompositeOperation = "copy";
                    octx.drawImage(src, 0, 0, W, H);

                    if (segmentEnabled && categoryMask && imgData) {
                        const labels = categoryMask.getAsUint8Array();
                        const data = imgData.data;

                        for (let i = 0, j = 0; i < labels.length; i++, j += 4) {
                            const a = labels[i] === 0 ? 255 : 0;
                            data[j] = 0;
                            data[j + 1] = 0;
                            data[j + 2] = 0;
                            data[j + 3] = a;
                        }

                        const mctx = maskCanvas.getContext("2d")!;
                        mctx.clearRect(0, 0, W, H);
                        mctx.putImageData(imgData, 0, 0);

                        octx.globalCompositeOperation = "destination-in";
                        octx.drawImage(maskCanvas, 0, 0, W, H);
                    }

                    octx.restore();
                } catch {
                } finally {
                    busyRef.current = false;
                }
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [segReady, segmentEnabled, blob, mode]);

    // CAPTURE from camera
    const capture = async () => {
        const out = outCanvasRef.current;
        const snap = snapCanvasRef.current;

        if (!out || !snap) return;

        snap.width = out.width;
        snap.height = out.height;
        snap.getContext("2d")!.drawImage(out, 0, 0);

        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
        });

        snap.toBlob((b) => {
            if (b) {
                setSprites(null);
                setGeneratedImage(null);
                setBlob(b);
            }
        }, "image/png");
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
    };

    const handleRetake = () => {
        resetState();
        // Camera mode: retake; upload mode: "change image" but stay in upload
        setMode((prev) => (prev === "camera" ? "camera" : "upload"));
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
    };

    const generateStarterPack = async () => {
        if (!blob) return;

        let success = false;
        setLoading(true);
        setError(null);

        try {
            const fd = new FormData();
            fd.append("image", blob, "fit.png");

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

            // Animate container height to new content, but don't tie this to loading
            requestAnimationFrame(() => {
                if (!container) return;
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
                            },
                        }
                    );
                }
            });

            success = true;
        } catch (err: any) {
            setError(err?.message || "Starter pack failed");
        } finally {
            // This is what triggers LoadingBar's "finish to 100% then fade" path
            setLoading(false);
            if (!success) {
                // nothing extra
            }
        }
    };

    // Loader overlay visibility: just track `loading`
    // Loader overlay visibility
    useEffect(() => {
        const loader = loaderOverlayRef.current;
        const scrim = scrimRef.current;
        if (!loader || !scrim) return;

        const ctx = gsap.context(() => {
            // fade in scrim + loader together
            gsap.to([loader, scrim], {
                autoAlpha: loading ? 1 : 0,
                duration: 0.3,
                ease: "power2.out",
            });
        });

        return () => ctx.revert();
    }, [loading]);


    return (
        <section className="mx-auto py-6 max-w-xl">
            {/* Title + subtitle */}
            <div className="pb-4 text-center">
                <h1 className="text-5xl font-semibold uppercase">
                    Starter Pack yourself
                </h1>
                <p className="mt-1 text-2xl text-muted-foreground">
                    Upload a fit pic, generate a starter pack and stare into your soul
                </p>
            </div>

            <div className="relative overflow-hidden border border-border bg-background/90 px-4 py-5">
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

                {/* MODE TOGGLE */}
                <ModeToggle mode={mode} onChange={switchMode} />

                {/* ACTIVE SPACE */}
                <div
                    ref={activeSpaceRef}
                    className="relative w-full max-h-[480px]"
                    style={{ maxHeight: ACTIVE_MAX_HEIGHT }}
                >
                    <div
                        className="pointer-events-none absolute inset-0 bg-background/80 opacity-0"
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
                                onCapture={capture}
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

                    {/* Loader overlay */}
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

                {/* Bottom actions */}
                <BottomActions
                    mode={mode}
                    hasBlob={!!blob}
                    loading={loading}
                    onRetake={handleRetake}
                    onGenerate={generateStarterPack}
                />

                {/* hidden helper canvases */}
                <canvas ref={srcCanvasRef} className="hidden" />
                <canvas ref={maskCanvasRef} className="hidden" />
                <canvas ref={snapCanvasRef} className="hidden" />
            </div>
        </section>
    );
}
