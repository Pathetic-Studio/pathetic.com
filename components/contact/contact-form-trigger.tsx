// components/contact/contact-form-trigger.tsx
"use client";

import { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useContactModal } from "./contact-modal-context";

type ContactFormTriggerProps = {
    className?: string;
    label?: string;
    children?: ReactNode;
};

export default function ContactFormTrigger({
    className,
    label,
    children,
}: ContactFormTriggerProps) {
    const { open } = useContactModal();

    return (
        <button
            type="button"
            onClick={open}
            className={cn(
                buttonVariants({
                    variant: "underline",
                    size: "sm",
                }),
                "transition-colors hover:text-foreground/90 text-foreground/70 h-8 px-3 rounded-full",
                className
            )}
        >
            {children ?? label ?? "Contact"}
        </button>
    );
}
