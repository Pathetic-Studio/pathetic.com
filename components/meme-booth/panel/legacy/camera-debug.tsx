// components/meme-booth/CameraDebug.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraDebug() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let stream: MediaStream | undefined;

        (async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: "user" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            } catch (e: any) {
                console.error(e);
                setError(e?.message || "Camera access failed");
            }
        })();

        return () => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, []);

    return (
        <section style={{ maxWidth: 520, margin: "16px auto", padding: 16 }}>
            {error && <p style={{ color: "#b00" }}>Error: {error}</p>}
            <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                style={{
                    width: "100%",
                    borderRadius: 12,
                    background: "#000",
                    display: "block",
                }}
            />
        </section>
    );
}
