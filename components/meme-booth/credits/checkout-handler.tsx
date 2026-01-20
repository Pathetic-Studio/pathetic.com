// components/meme-booth/credits/checkout-handler.tsx
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useBoothAuth } from "../auth/booth-auth-context";

export default function CheckoutHandler() {
  const searchParams = useSearchParams();
  const { refreshCredits, credits } = useBoothAuth();
  const hasHandled = useRef(false);
  const initialCredits = useRef<number | null>(null);

  useEffect(() => {
    if (hasHandled.current) return;

    const checkout = searchParams.get("checkout");

    if (checkout === "success") {
      hasHandled.current = true;
      initialCredits.current = credits;

      console.log("[CheckoutHandler] Checkout success detected, refreshing credits...");

      // Delay to allow webhook to process, then retry a few times
      const refreshWithRetry = async (attempts = 0) => {
        await refreshCredits();

        // Wait a bit for state to update
        await new Promise((r) => setTimeout(r, 500));

        // If credits haven't changed and we haven't exhausted retries, try again
        if (attempts < 3) {
          console.log(`[CheckoutHandler] Retry ${attempts + 1}/3...`);
          setTimeout(() => refreshWithRetry(attempts + 1), 1500);
        } else {
          console.log("[CheckoutHandler] Finished refresh attempts");
          toast.success("Purchase successful! Your credits have been added.");
        }
      };

      // Initial delay to give webhook time to process
      setTimeout(() => refreshWithRetry(0), 1000);

      // Clean up URL immediately
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    } else if (checkout === "cancelled") {
      hasHandled.current = true;
      toast.info("Purchase cancelled.");

      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, refreshCredits, credits]);

  return null;
}
