// components/meme-booth/credits/checkout-handler.tsx
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useBoothAuth } from "../auth/booth-auth-context";

export default function CheckoutHandler() {
  const searchParams = useSearchParams();
  const { refreshCredits } = useBoothAuth();
  const hasHandled = useRef(false);

  useEffect(() => {
    if (hasHandled.current) return;

    const checkout = searchParams.get("checkout");

    if (checkout === "success") {
      hasHandled.current = true;
      // Refresh credits after successful purchase
      refreshCredits();
      toast.success("Purchase successful! Your credits have been added.");

      // Clean up URL
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
  }, [searchParams, refreshCredits]);

  return null;
}
