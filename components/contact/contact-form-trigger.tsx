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
                    variant: "menu",
                    size: "sm",
                }),
                "cursor-pointer",
                className
            )}
        >
            {children ?? label ?? "Contact"}
        </button>
    );
}
