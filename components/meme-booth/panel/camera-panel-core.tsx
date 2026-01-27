//components/meme-booth/panel/camera-panel-core.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { gsap } from "gsap";

import StarterPackParticles from "@/components/effects/starter-pack-particles";
import ImageUploadPanel from "@/components/meme-booth/image-upload-panel";
import ModeToggle, { type InputMode } from "@/components/meme-booth/mode-toggle";
import StyleToggle, { type StyleMode } from "@/components/meme-booth/style-toggle";
import BottomActions from "@/components/meme-booth/bottom-actions";
import StarterPackResultView from "@/components/meme-booth/starter-pack-result-view";

import UploadedImagePreview from "./ui/uploaded-image-preview";
import LoaderOverlay from "./ui/loader-overlay";

import { applyWatermark } from "@/lib/apply-watermark";
import { useUserMedia } from "./hooks/use-user-media";
import { captureCanvasToPngBlob } from "./hooks/use-capture-canvas-blob";
import { useBoothGeneration } from "./hooks/use-booth-generation";

const USE_SPRITE_MODE = true as const;
const USE_YOLO_SPLITTER = true as const;

function refreshScroll() {
    try {
        ScrollTrigger.refresh();
    } catch { }
}

export type CameraRendererProps = {
    enabled: boolean;
    hasBlob: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    outCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    srcCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    onCapture: () => void;

    canFlip: boolean;
    facingMode: "user" | "environment";
    onFlipCamera: () => void;
};

type Props = {
    CameraRenderer: React.ComponentType<CameraRendererProps>;
};

export default function CameraPanelCore({ CameraRenderer }: Props) {
    const srcCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const outCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const snapCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const activeSpaceRef = useRef<HTMLDivElement | null>(null);

    const [mode, setMode] = useState<InputMode>("camera");
    const [styleMode, setStyleMode] = useState<StyleMode>("pathetic");

const handleStyleModeChange = (newMode: StyleMode) => {
    if (newMode === styleMode) return;
    resetState();
    setStyleMode(newMode);
};
const { loading, error: apiError, setError: setApiError, generate } = useBoothGeneration(styleMode);

    const [blob, setBlob] = useState<Blob | null>(null);

    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [pendingImage, setPendingImage] = useState<string | null>(null);

    const [sprites, setSprites] = useState<string[] | null>(null);

    const cameraActive = mode === "camera" && !generatedImage && !blob && !pendingImage;

    const {
        videoRef,
        error: cameraError,
        setError: setCameraError,
        facingMode,
        canFlip,
        flipCamera,
        stop: stopCamera,
    } = useUserMedia({ active: cameraActive });

    // Fully release camera when a result is displayed.
    // pause() alone keeps the stream alive, which causes mobile browsers
    // to show the camera permission popup over the result.
    useEffect(() => {
        if (generatedImage) {
            stopCamera();
        }
    }, [generatedImage, stopCamera]);

    const error = apiError || cameraError;

    // If it's the quota/daily cap message (or similar), show yellow instead of red.
    const isQuotaError =
        typeof error === "string" &&
        /daily meme limit reached|try again tomorrow|quota|rate limit|resource_exhausted|too many requests/i.test(error);

    const errorBoxClass = isQuotaError ? "bg-[#e1ff04]" : "bg-red-500";
    const errorTextClass = isQuotaError ? "text-black" : "text-white";

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

    const resetState = () => {
        setBlob(null);
        setGeneratedImage(null);
        setPendingImage(null);
        setSprites(null);
        setApiError(null);
        setCameraError(null);
        refreshScroll();
    };

    const switchMode = (next: InputMode) => {
        if (next === mode) return;
        resetState();
        setMode(next);
    };

    const animateHeightChange = (fn: () => void) => {
        const container = activeSpaceRef.current;
        if (!container) {
            fn();
            refreshScroll();
            return;
        }

        const start = container.offsetHeight;
        fn();

        requestAnimationFrame(() => {
            const end = container.offsetHeight;
            if (!start || !end || start === end) {
                refreshScroll();
                return;
            }

            gsap.fromTo(
                container,
                { height: start, overflow: "hidden" },
                {
                    height: end,
                    duration: 0.5,
                    ease: "power2.out",
                    onComplete: () => {
                        container.style.height = "auto";
                        container.style.overflow = "visible";
                        refreshScroll();
                    },
                }
            );
        });
    };

    // IMPORTANT: do NOT setGeneratedImage here.
    // Set pendingImage, let LoaderOverlay finish+fade, then reveal.
    const generateFromBlob = async (b: Blob) => {
        const res = await generate(b);
        if (!res.ok || !res.image) return;

        const watermarked = await applyWatermark(res.image as string);
        setPendingImage(watermarked);
    };

    const handleCaptureAndGenerate = async () => {
        if (loading) return;

        const out = outCanvasRef.current;
        const snap = snapCanvasRef.current;
        if (!out || !snap) return;

        const b = await captureCanvasToPngBlob(out, snap);
        if (!b) return;

        setBlob(b);
        setSprites(null);
        setGeneratedImage(null);
        setPendingImage(null);

        await generateFromBlob(b);
    };

    const handleUploadedImage = async (file: File) => {
        if (loading) return;

        setSprites(null);
        setGeneratedImage(null);
        setPendingImage(null);
        setBlob(file);
        refreshScroll();

        await generateFromBlob(file);
    };

    const handleChangeImage = () => {
        resetState();
        // keep mode
    };

    const cameraEnabled = mode === "camera" && !blob && !generatedImage && !pendingImage;

    return (
        <section className="mx-auto max-w-xl py-1">
            <div className="relative border border-border bg-background px-4 py-5">
                {error && (
                    <div className={`${errorBoxClass} flex items-center justify-center mb-4`}>
                        <p className={`text-xs p-2 uppercase ${errorTextClass}`}>{error}</p>
                    </div>
                )}

                {USE_SPRITE_MODE && sprites && (
                    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                        <StarterPackParticles images={sprites} />
                    </div>
                )}

                {/* Hide mode toggle when showing result — prevents accidental meme loss */}
                {!generatedImage && <ModeToggle mode={mode} onChange={switchMode} />}

                <div ref={activeSpaceRef} className="relative w-full">
                    {generatedImage ? (
                        <StarterPackResultView
                            image={generatedImage}
                            imgRef={React.createRef()}
                            useSpriteMode={USE_SPRITE_MODE && styleMode === "pathetic"}
                            useYoloSplitter={USE_YOLO_SPLITTER && styleMode === "pathetic"}
                            onSprites={setSprites}
                        />
                    ) : mode === "camera" ? (
                        <CameraRenderer
                            enabled={cameraEnabled}
                            hasBlob={!!blob}
                            videoRef={videoRef}
                            outCanvasRef={outCanvasRef}
                            srcCanvasRef={srcCanvasRef}
                            onCapture={handleCaptureAndGenerate}
                            canFlip={canFlip}
                            facingMode={facingMode}
                            onFlipCamera={flipCamera}
                        />
                    ) : blob ? (
                        <UploadedImagePreview blob={blob} />
                    ) : (
                        <ImageUploadPanel disabled={loading} onImageLoaded={handleUploadedImage} />
                    )}
                    <LoaderOverlay
                        active={loading}
                        messages={loadingMessages}
                        onHidden={() => {
                            if (!pendingImage) return;
                            animateHeightChange(() => setGeneratedImage(pendingImage));
                            setPendingImage(null);
                        }}
                    />
                </div>

                {/* Style toggle - shown when no generated image yet, not during loading */}
                {!generatedImage && !loading && (
                    <StyleToggle mode={styleMode} onChange={handleStyleModeChange} />
                )}

                <BottomActions
                    mode={mode}
                    hasBlob={!!blob}
                    hasGenerated={!!generatedImage}
                    generatedImage={generatedImage}
                    loading={loading}
                    onChangeImage={handleChangeImage}
                    onGenerateUpload={() => {
                        /* no-op */
                    }}
                />

                <canvas ref={srcCanvasRef} className="hidden" />
                <canvas ref={snapCanvasRef} className="hidden" />
            </div>
        </section>
    );
}
