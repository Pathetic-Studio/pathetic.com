// components/meme-booth/panel/hooks/use-booth-generation.ts
"use client";

import { useCallback, useState } from "react";
import { useBoothAuth } from "../../auth/booth-auth-context";
import { useCreditsModal } from "../../credits/credits-context";

type GenerationResult =
  | { ok: true; image: string; credits: number }
  | { ok: false; error: string; requireAuth?: boolean; requireCredits?: boolean; refunded?: boolean; credits?: number };

// 90 second timeout for generation (Gemini can be slow for image generation)
const GENERATION_TIMEOUT_MS = 90000;

export function useBoothGeneration(styleMode: string = "pathetic") {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setCredits, openAuthModal } = useBoothAuth();
  const { openPurchaseModal } = useCreditsModal();

  const generate = useCallback(
    async (imageBlob: Blob): Promise<GenerationResult> => {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, GENERATION_TIMEOUT_MS);

      try {
        const fd = new FormData();
        fd.append("image", imageBlob, "fit.png");
        fd.append("styleMode", styleMode);

        console.log(`[useBoothGeneration] Starting ${styleMode} generation...`);

        const res = await fetch("/api/booth/generate", {
          method: "POST",
          body: fd,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let data: any = {};
        try {
          data = await res.json();
        } catch (jsonErr) {
          console.error("[useBoothGeneration] Failed to parse response:", jsonErr);
        }

        console.log("[useBoothGeneration] Response status:", res.status, "data:", data);

        // Handle Vercel/platform body size rejection (non-JSON 413 response)
        if (res.status === 413) {
          const msg = "Image too large. Please use a smaller image.";
          setError(msg);
          return { ok: false, error: msg };
        }

        // Handle auth required
        if (res.status === 401 || data?.requireAuth) {
          openAuthModal();
          return { ok: false, error: "Please sign in to generate memes", requireAuth: true };
        }

        // Handle credits required
        if (res.status === 402 || data?.requireCredits) {
          if (typeof data?.credits === "number") {
            setCredits(data.credits);
          }
          openPurchaseModal();
          return { ok: false, error: "No credits remaining", requireCredits: true, credits: data?.credits };
        }

        // Handle rate limit
        if (res.status === 429) {
          const msg = data?.error || "Rate limit exceeded. Please wait a moment.";
          setError(msg);
          if (data?.refunded && typeof data?.credits === "number") {
            setCredits(data.credits);
          }
          return { ok: false, error: msg, refunded: data?.refunded, credits: data?.credits };
        }

        // Handle other errors
        if (!res.ok || !data?.image) {
          const msg = data?.error || "Generation failed. Please try again.";
          console.error("[useBoothGeneration] Generation failed:", msg);
          setError(msg);
          if (data?.refunded && typeof data?.credits === "number") {
            setCredits(data.credits);
          }
          return { ok: false, error: msg, refunded: data?.refunded, credits: data?.credits };
        }

        // Success - update credits
        if (typeof data.credits === "number") {
          setCredits(data.credits);
        }

        console.log("[useBoothGeneration] Generation successful");
        return { ok: true, image: data.image as string, credits: data.credits };
      } catch (err: any) {
        clearTimeout(timeoutId);

        let msg = "Generation failed. Please try again.";

        if (err.name === "AbortError") {
          msg = "Generation timed out. Please try again.";
          console.error("[useBoothGeneration] Request timed out after", GENERATION_TIMEOUT_MS, "ms");
        } else {
          console.error("[useBoothGeneration] Error:", err);
          msg = err?.message || msg;
        }

        setError(msg);
        return { ok: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [styleMode, openAuthModal, openPurchaseModal, setCredits]
  );

  return { loading, error, setError, generate };
}
