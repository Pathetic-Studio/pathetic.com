// components/meme-booth/credits/credit-balance.tsx
"use client";

import { Sparkles, LogOut, User } from "lucide-react";
import { useBoothAuth } from "../auth/booth-auth-context";
import { useCreditsModal } from "./credits-context";
import { cn } from "@/lib/utils";

export default function CreditBalance() {
  const { user, credits, loading, signOut, openAuthModal } = useBoothAuth();
  const { openPurchaseModal } = useCreditsModal();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-16 animate-pulse bg-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className={cn(
          "flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-semibold uppercase transition-colors",
          "hover:bg-muted"
        )}
      >
        <User className="h-3.5 w-3.5" />
        Sign In
      </button>
    );
  }

  const hasNoCredits = credits !== null && credits <= 0;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={openPurchaseModal}
        className={cn(
          "flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold uppercase transition-colors",
          hasNoCredits
            ? "border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20"
            : "border-border hover:bg-muted"
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {credits ?? 0} {credits === 1 ? "Credit" : "Credits"}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("[CreditBalance] Sign out clicked");
          signOut();
        }}
        className={cn(
          "flex items-center gap-1 border border-border p-1.5 text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground"
        )}
        title="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
