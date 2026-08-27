// components/contact/contact-form-trigger.tsx
"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useContactModal } from "@/components/contact/contact-modal-context";


type ContactFormTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    className?: string;
    label?: string;
    children?: ReactNode;
};

export default function ContactFormTrigger({
    className,
    label,
    children,
    onClick,
    ...buttonProps
}: ContactFormTriggerProps) {
    const { open } = useContactModal();

    return (
        <button
            {...buttonProps}
            type="button"
            onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) open();
            }}
            className={cn("cursor-pointer uppercase", className)}
        >
            {children ?? label ?? "Contact"}
        </button>
    );
}
