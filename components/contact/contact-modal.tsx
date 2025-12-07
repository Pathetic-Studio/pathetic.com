//components/contact/contact-modal.tsx
"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useContactModal } from "./contact-modal-context";
import ContactForm from "./contact-form";

export default function ContactModal() {
    const { isOpen, close } = useContactModal();
    const constraintsRef = useRef<HTMLDivElement | null>(null);

    if (typeof document === "undefined") return null;
    if (!isOpen) return null;

    return createPortal(
        <div
            ref={constraintsRef}
            className="fixed inset-0 z-[9999]"
            onMouseDown={(e) => {
                // Close when clicking backdrop only
                if (e.target === e.currentTarget) {
                    close();
                }
            }}
        >
            <motion.div
                drag
                dragConstraints={constraintsRef}
                dragElastic={0.15}
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute right-4 top-16 max-h-[80vh] w-[360px] border border-border bg-neutral-50"

            >
                {/* Title bar / drag handle */}
                <div className="flex cursor-move items-center justify-between   uppercase px-3 py-2 text-sm font-semibold">
                    <span>Drop us a message</span>
                    <button
                        type="button"
                        onClick={close}
                        className="h-5 w-5  border border-neutral-400 bg-neutral-100 text-[10px] leading-[14px]"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="p-3 text-xs">
                    <ContactForm />
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
