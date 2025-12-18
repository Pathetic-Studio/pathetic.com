//components/meme-booth/panel/hooks/use-starter-pack.ts
"use client";

import { useCallback, useState } from "react";

type Result =
    | { ok: true; image: string }
    | { ok: false; error: string };

export function useStarterPack() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async (imageBlob: Blob): Promise<Result> => {
        setLoading(true);
        setError(null);

        try {
            const fd = new FormData();
            fd.append("image", imageBlob, "fit.png");

            const res = await fetch("/api/starter-pack", {
                method: "POST",
                body: fd,
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data?.image) {
                const msg = data?.error || "Starter pack generation failed";
                setError(msg);
                return { ok: false, error: msg };
            }

            return { ok: true, image: data.image as string };
        } catch (err: any) {
            const msg = err?.message || "Starter pack failed";
            setError(msg);
            return { ok: false, error: msg };
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, setError, generate };
}
