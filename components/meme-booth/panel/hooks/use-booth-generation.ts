// components/meme-booth/panel/hooks/use-booth-generation.ts
"use client";

import { useCallback, useState } from "react";
import { useBoothAuth } from "../../auth/booth-auth-context";
import { useCreditsModal } from "../../credits/credits-context";

type GenerationResult =
  | { ok: true; image: string; credits: number }
  | { ok: false; error: string; requireAuth?: boolean; requireCredits?: boolean; refunded?: boolean; credits?: number };

export function useBoothGeneration(styleMode: string = "pathetic") {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, setCredits, openAuthModal } = useBoothAuth();
  const { openPurchaseModal } = useCreditsModal();

  const generate = useCallback(
    async (imageBlob: Blob): Promise<GenerationResult> => {
      setLoading(true);
      setError(null);

      // Check if user is logged in BEFORE making request
      if (!user) {
        setLoading(false);
        openAuthModal();
        return { ok: false, error: "Please sign in to generate memes", requireAuth: true };
      }

      try {
        const fd = new FormData();
        fd.append("image", imageBlob, "fit.png");
        fd.append("styleMode", styleMode);

        const res = await fetch("/api/booth/generate", {
          method: "POST",
          body: fd,
        });

        const data = await res.json().catch(() => ({}));

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
          const msg = data?.error || "Generation failed";
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

        return { ok: true, image: data.image as string, credits: data.credits };
      } catch (err: any) {
        const msg = err?.message || "Generation failed";
        setError(msg);
        return { ok: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [styleMode, user, openAuthModal, openPurchaseModal, setCredits]
  );

  return { loading, error, setError, generate };
}
