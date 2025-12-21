"use client";

import React, { useMemo, useRef, useState } from "react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { gsap } from "gsap";

import StarterPackParticles from "@/components/effects/starter-pack-particles";
import ImageUploadPanel from "@/components/meme-booth/image-upload-panel";
import ModeToggle, { type InputMode } from "@/components/meme-booth/mode-toggle";
import BottomActions from "@/components/meme-booth/bottom-actions";
import StarterPackResultView from "@/components/meme-booth/starter-pack-result-view";

import UploadedImagePreview from "./ui/uploaded-image-preview";
import LoaderOverlay from "./ui/loader-overlay";

import { useUserMedia } from "./hooks/use-user-media";
import { captureCanvasToPngBlob } from "./hooks/use-capture-canvas-blob";
import { useStarterPack } from "./hooks/use-starter-pack";

const USE_SPRITE_MODE = true as const;
const USE_YOLO_SPLITTER = true as const;

function refreshScroll() {
    try {
        ScrollTrigger.refresh();
    } catch { }
}

/* =========================
   SHARED RENDERER CONTRACT
   ========================= */

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
    const { loading, error: apiError, setError: setApiError, generate } =
        useStarterPack();

    const srcCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const outCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const snapCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const activeSpaceRef = useRef<HTMLDivElement | null>(null);

    const [mode, setMode] = useState<InputMode>("camera");
    const [blob, setBlob] = useState<Blob | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [sprites, setSprites] = useState<string[] | null>(null);

    const cameraActive = mode === "camera" && !generatedImage && !blob;

    const {
        videoRef,
        error: cameraError,
        setError: setCameraError,
        facingMode,
        canFlip,
        flipCamera,
    } = useUserMedia({ active: cameraActive });

    const error = apiError || cameraError;

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

    const handleUploadedImage = (file: File) => {
        setSprites(null);
        setGeneratedImage(null);
        setBlob(file);
        refreshScroll();
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

    const generateFromBlob = async (b: Blob) => {
        const res = await generate(b);
        if (!res.ok || !res.image) return;
        animateHeightChange(() => setGeneratedImage(res.image));
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

        await generateFromBlob(b);
    };

    const handleGenerateUpload = async () => {
        if (loading || !blob) return;
        await generateFromBlob(blob);
    };

    const handleChangeImage = () => {
        resetState();
        setMode("camera");
    };

    const cameraEnabled = mode === "camera" && !blob && !generatedImage;

    return (
        <section className="mx-auto max-w-xl py-1">
            <div className="relative border border-border bg-background px-4 py-5">
                {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

                {USE_SPRITE_MODE && sprites && (
                    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                        <StarterPackParticles images={sprites} />
                    </div>
                )}

                <ModeToggle mode={mode} onChange={switchMode} />

                <div ref={activeSpaceRef} className="relative w-full">
                    {generatedImage ? (
                        <StarterPackResultView
                            image={generatedImage}
                            imgRef={React.createRef()}
                            useSpriteMode={USE_SPRITE_MODE}
                            useYoloSplitter={USE_YOLO_SPLITTER}
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
                        <ImageUploadPanel
                            disabled={loading}
                            onImageLoaded={handleUploadedImage}
                        />
                    )}

                    <LoaderOverlay
                        active={loading}
                        messages={loadingMessages}
                    />
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
                <canvas ref={snapCanvasRef} className="hidden" />
            </div>
        </section>
    );
}
