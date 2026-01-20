"use client";

export type StyleMode = "pathetic" | "wojak";

interface StyleToggleProps {
    mode: StyleMode;
    onChange: (mode: StyleMode) => void;
}

export default function StyleToggle({ mode, onChange }: StyleToggleProps) {
    return (
        <div className="mt-4 flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold uppercase ${mode === "pathetic" ? "text-black" : "text-gray-400"}`}>
                Starter Pack
            </span>
            <button
                onClick={() => onChange(mode === "pathetic" ? "wojak" : "pathetic")}
                className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                style={{ backgroundColor: mode === "pathetic" ? "#000" : "#666" }}
                aria-label="Toggle between PATHETIC and Wojak modes"
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        mode === "wojak" ? "translate-x-8" : "translate-x-1"
                    }`}
                />
            </button>
            <span className={`text-sm font-semibold uppercase ${mode === "wojak" ? "text-black" : "text-gray-400"}`}>
                WOJAK
            </span>
        </div>
    );
}