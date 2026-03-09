// components/meme-booth/credits/quick-buy-button.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { useBoothAuth } from "../auth/booth-auth-context";
import { useCreditsModal } from "./credits-context";
import { getStripeClient } from "@/lib/stripe-client";
import { cn } from "@/lib/utils";
import type { Stripe, PaymentRequest } from "@stripe/stripe-js";

const QUICK_BUY_CREDITS = 10;
const QUICK_BUY_PRICE_DISPLAY = "$9.99";
const QUICK_BUY_AMOUNT = 999; // cents

export default function QuickBuyButton() {
  const { user, refreshCredits } = useBoothAuth();
  const { openPurchaseModal } = useCreditsModal();

  const [canNativePay, setCanNativePay] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const stripeRef = useRef<Stripe | null>(null);
  const prRef = useRef<PaymentRequest | null>(null);

  // Initialize Stripe + PaymentRequest on mount (auth'd users only)
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function init() {
      const stripe = await getStripeClient();
      if (!stripe || cancelled) return;
      stripeRef.current = stripe;

      const pr = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: {
          label: `${QUICK_BUY_CREDITS} Meme Credits`,
          amount: QUICK_BUY_AMOUNT,
        },
        requestPayerEmail: false,
        requestPayerName: false,
      });

      // Attach the paymentmethod handler once
      pr.on("paymentmethod", async (ev) => {
        try {
          // 1. Create PaymentIntent on server
          const res = await fetch("/api/booth/quick-buy", { method: "POST" });
          const data = await res.json();

          if (!res.ok || !data.clientSecret) {
            ev.complete("fail");
            setError(data.error || "Payment failed");
            setLoading(false);
            return;
          }

          // 2. Confirm payment with the PaymentMethod from Apple Pay / Google Pay
          const { error: confirmError, paymentIntent } =
            await stripe.confirmCardPayment(
              data.clientSecret,
              { payment_method: ev.paymentMethod.id },
              { handleActions: false }
            );

          if (confirmError) {
            ev.complete("fail");
            setError(confirmError.message || "Payment failed");
            setLoading(false);
            return;
          }

          // 3. Complete the native payment sheet
          ev.complete("success");

          // 4. Handle 3D Secure if required
          if (paymentIntent?.status === "requires_action") {
            const { error: actionError } = await stripe.confirmCardPayment(
              data.clientSecret
            );
            if (actionError) {
              setError(actionError.message || "Payment authentication failed");
              setLoading(false);
              return;
            }
          }

          // 5. Success — refresh credits after webhook processes
          setSuccess(true);
          setLoading(false);
          setTimeout(() => {
            refreshCredits();
            setSuccess(false);
          }, 1500);
        } catch (err: any) {
          ev.complete("fail");
          setError(err?.message || "Payment failed");
          setLoading(false);
        }
      });

      const result = await pr.canMakePayment();
      if (cancelled) return;

      setCanNativePay(!!result);
      if (result) {
        prRef.current = pr;
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [user, refreshCredits]);

  // Show native Apple Pay / Google Pay sheet
  const handleNativePayment = useCallback(() => {
    const pr = prRef.current;
    if (!pr || loading) return;
    setLoading(true);
    setError(null);
    pr.show();
  }, [loading]);

  // Fallback: open the purchase modal
  const handleFallback = useCallback(() => {
    openPurchaseModal();
  }, [openPurchaseModal]);

  // Don't render for unauthenticated users
  if (!user) return null;

  // Still checking capability — don't flash anything
  if (canNativePay === null) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={canNativePay ? handleNativePayment : handleFallback}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 border px-4 py-2 text-xs font-semibold uppercase transition-colors",
          success
            ? "border-green-500 bg-green-500/10 text-green-600"
            : "border-border hover:bg-muted hover:text-foreground",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Processing...
          </>
        ) : success ? (
          "Credits added!"
        ) : (
          <>
            <CreditCard className="h-3.5 w-3.5" />
            {QUICK_BUY_CREDITS} credits &mdash; {QUICK_BUY_PRICE_DISPLAY}
          </>
        )}
      </button>
      {error && (
        <p className="text-[10px] text-red-500 uppercase">{error}</p>
      )}
    </div>
  );
}
