// components/contact/contact-form-trigger.tsx
"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useContactModal } from "@/components/contact/contact-modal-context";


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
            className={cn("cursor-pointer uppercase", className)}
        >
            {children ?? label ?? "Contact"}
        </button>
    );
}
