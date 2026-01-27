// components/meme-booth/credits/credits-context.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type CreditsModalContextValue = {
  isPurchaseModalOpen: boolean;
  openPurchaseModal: () => void;
  closePurchaseModal: () => void;
  purchaseLoading: boolean;
  setPurchaseLoading: (loading: boolean) => void;
};

const CreditsModalContext = createContext<CreditsModalContextValue | null>(null);

export function CreditsModalProvider({ children }: { children: ReactNode }) {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const openPurchaseModal = useCallback(() => setIsPurchaseModalOpen(true), []);
  const closePurchaseModal = useCallback(() => setIsPurchaseModalOpen(false), []);

  return (
    <CreditsModalContext.Provider
      value={{
        isPurchaseModalOpen,
        openPurchaseModal,
        closePurchaseModal,
        purchaseLoading,
        setPurchaseLoading,
      }}
    >
      {children}
    </CreditsModalContext.Provider>
  );
}

export function useCreditsModal() {
  const context = useContext(CreditsModalContext);
  if (!context) {
    throw new Error("useCreditsModal must be used within a CreditsModalProvider");
  }
  return context;
}

// Credit pack definitions
export const CREDIT_PACKS = [
  {
    id: "starter",
    name: "Starter",
    credits: 10,
    price: 499, // in cents
    priceDisplay: "$4.99",
    popular: false,
  },
  {
    id: "popular",
    name: "Popular",
    credits: 25,
    price: 999,
    priceDisplay: "$9.99",
    popular: true,
  },
  {
    id: "best-value",
    name: "Best Value",
    credits: 60,
    price: 1999,
    priceDisplay: "$19.99",
    popular: false,
  },
  {
    id: "party-pack",
    name: "Party Pack",
    credits: 125,
    price: 3499,
    priceDisplay: "$34.99",
    popular: false,
  },
] as const;

export type CreditPack = (typeof CREDIT_PACKS)[number];

// Quick-buy pack for the always-visible Apple Pay / Google Pay button
export const QUICK_BUY_PACK = {
  id: "quick-buy",
  credits: 10,
  price: 999, // in cents
  priceDisplay: "$9.99",
} as const;
