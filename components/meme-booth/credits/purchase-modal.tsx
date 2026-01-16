// components/meme-booth/credits/purchase-modal.tsx
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Star, Loader2 } from "lucide-react";
import { useCreditsModal, CREDIT_PACKS, type CreditPack } from "./credits-context";
import { cn } from "@/lib/utils";

export default function PurchaseModal() {
  const { isPurchaseModalOpen, closePurchaseModal } = useCreditsModal();
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(
    CREDIT_PACKS.find((p) => p.popular) || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isPurchaseModalOpen || typeof document === "undefined") return null;

  const handlePurchase = async () => {
    if (!selectedPack || loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/booth/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: selectedPack.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Payment failed, please try again");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      closePurchaseModal();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-md border border-border bg-background"
        role="dialog"
        aria-label="Get more memes"
      >
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <h2 className="mb-1 text-center text-xl font-bold uppercase">
            Get More Memes
          </h2>
          <p className="mb-6 text-center text-xs uppercase text-muted-foreground">
            Choose a credit pack to continue generating
          </p>

          {error && (
            <div className="mb-4 bg-red-500 p-2">
              <p className="text-center text-xs uppercase text-white">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            {CREDIT_PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelectedPack(pack)}
                disabled={loading}
                className={cn(
                  "relative w-full border p-4 text-left transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  selectedPack?.id === pack.id
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-foreground/50"
                )}
              >
                {pack.popular && (
                  <div className="absolute -top-2.5 left-4 flex items-center gap-1 bg-foreground px-2 py-0.5">
                    <Star className="h-3 w-3 fill-background text-background" />
                    <span className="text-[10px] font-bold uppercase text-background">
                      Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase">{pack.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pack.credits} credits
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{pack.priceDisplay}</p>
                    <p className="text-[10px] text-muted-foreground">
                      ${(pack.price / pack.credits / 100).toFixed(2)}/meme
                    </p>
                  </div>
                </div>

                {selectedPack?.id === pack.id && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 rounded-full border-2 border-foreground bg-foreground">
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-background" />
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePurchase}
            disabled={!selectedPack || loading}
            className={cn(
              "mt-6 w-full bg-foreground py-3 text-sm font-semibold uppercase text-background transition-opacity",
              "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Get {selectedPack?.credits || 0} Credits for{" "}
                {selectedPack?.priceDisplay || "$0"}
              </>
            )}
          </button>

          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            Secure payment powered by Stripe. Credits never expire.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
