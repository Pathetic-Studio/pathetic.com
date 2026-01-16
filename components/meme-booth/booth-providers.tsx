// components/meme-booth/booth-providers.tsx
"use client";

import { type ReactNode, Suspense } from "react";
import { BoothAuthProvider } from "./auth/booth-auth-context";
import { CreditsModalProvider } from "./credits/credits-context";
import AuthModal from "./auth/auth-modal";
import PurchaseModal from "./credits/purchase-modal";
import CheckoutHandler from "./credits/checkout-handler";

type BoothProvidersProps = {
  children: ReactNode;
};

export default function BoothProviders({ children }: BoothProvidersProps) {
  return (
    <BoothAuthProvider>
      <CreditsModalProvider>
        {children}
        <AuthModal />
        <PurchaseModal />
        <Suspense fallback={null}>
          <CheckoutHandler />
        </Suspense>
      </CreditsModalProvider>
    </BoothAuthProvider>
  );
}
