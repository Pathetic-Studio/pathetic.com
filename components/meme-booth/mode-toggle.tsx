// components/meme-booth/mode-toggle.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

export type InputMode = "camera" | "upload";

type ModeToggleProps = {
    mode: InputMode;
    onChange: (next: InputMode) => void;
};

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
    const cameraRef = useRef<HTMLButtonElement>(null);
    const uploadRef = useRef<HTMLButtonElement>(null);

    const [pill, setPill] = useState({ width: 0, left: 0 });

    useEffect(() => {
        const el = mode === "camera" ? cameraRef.current : uploadRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const parentRect = el.parentElement!.getBoundingClientRect();

        setPill({
            width: rect.width,
            left: rect.left - parentRect.left,
        });
    }, [mode]);

    return (
        <div className="mb-4 flex justify-center">
            <div className="relative inline-flex items-center border border-border rounded-full bg-background px-1 py-1 text-sm uppercase ">

                {/* Dynamic pill */}
                <motion.div
                    className="absolute inset-y-1 my-auto rounded-full  bg-[#363636]"
                    animate={{ width: pill.width, left: pill.left }}
                    transition={{ type: "spring", stiffness: 260, damping: 25 }}
                />

                {/* Camera */}
                <button
                    ref={cameraRef}
                    type="button"
                    onClick={() => onChange("camera")}
                    className={`relative z-10 flex items-center px-4 py-1 uppercase transition-colors ${mode === "camera"
                        ? "text-white font-bold"
                        : "text-muted-foreground"
                        }`}
                >
                    <Camera className="mr-1 h-4 w-4 shrink-0 [transform:scaleX(0.6)]" />
                    Camera
                </button>

                {/* Upload */}
                <button
                    ref={uploadRef}
                    type="button"
                    onClick={() => onChange("upload")}
                    className={`relative z-10 flex items-center px-4 py-1 uppercase transition-colors ${mode === "upload"
                        ? "text-white font-bold"
                        : "text-muted-foreground"
                        }`}
                >
                    <ImageIcon className="mr-1 h-4 w-4 shrink-0 [transform:scaleX(0.6)]" />
                    Image
                </button>
            </div>
        </div>
    );
}
