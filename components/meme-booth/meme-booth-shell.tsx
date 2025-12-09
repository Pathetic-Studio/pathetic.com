// components/meme-booth/meme-booth-shell.tsx
"use client";

import dynamic from "next/dynamic";

const CameraPanel = dynamic(
    () => import("./camera-panel"),
    { ssr: false }
);

export default function MemeBoothShell() {
    return <CameraPanel />;
}
