"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type CloseButtonProps = ComponentPropsWithoutRef<"button">;

/** Shared dismissal control. A native button also works with Radix asChild. */
export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  function CloseButton({ className, children = "Close", type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        data-close-control="text"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "shrink-0 rounded-none border-black bg-white text-black shadow-none transition-colors duration-150 hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black focus-visible:ring-0 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

export function CloseIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="butt" aria-hidden="true" focusable="false">
      <path d="m5 5 14 14M19 5 5 19" />
    </svg>
  );
}

export const XButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  function XButton({ className, children, "aria-label": label = "Close", ...props }, ref) {
    return (
      <CloseButton
        ref={ref}
        aria-label={label}
        data-close-control="icon"
        className={cn("size-11 p-0 has-[>svg]:px-0", className)}
        {...props}
      >
        {children ?? <CloseIcon />}
      </CloseButton>
    );
  },
);
