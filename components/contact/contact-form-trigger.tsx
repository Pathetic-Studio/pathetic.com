// components/contact/contact-form-trigger.tsx
"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useContactModal } from "@/components/contact/contact-modal-context";


type ContactFormTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    className?: string;
    label?: string;
    children?: ReactNode;
};

const ContactFormTrigger = forwardRef<HTMLButtonElement, ContactFormTriggerProps>(function ContactFormTrigger({
    className,
    label,
    children,
    onClick,
    ...buttonProps
}, ref) {
    const { open } = useContactModal();

    return (
        <button
            ref={ref}
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
});

export default ContactFormTrigger;
