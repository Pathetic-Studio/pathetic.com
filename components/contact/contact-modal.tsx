// components/contact/contact-modal.tsx
"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import Draggable from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useContactModal } from "./contact-modal-context";
import ContactForm from "./contact-form";

gsap.registerPlugin(Draggable, InertiaPlugin);

export default function ContactModal() {
    const { isOpen, close } = useContactModal();
    const constraintsRef = useRef<HTMLDivElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        if (!constraintsRef.current || !modalRef.current) return;

        const modal = modalRef.current;
        let draggableInstance: Draggable | null = null;

        // Intro animation handled by GSAP (no Framer Motion)
        gsap.set(modal, {
            opacity: 0,
            scale: 0.9,
            y: 20,
            transformOrigin: "50% 50%",
        });

        const intro = gsap.to(modal, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.45,
            ease: "power3.out",
            onComplete: () => {
                // Create Draggable AFTER the intro finishes so it uses the final transform
                const [draggable] = Draggable.create(modal, {
                    type: "x,y",
                    bounds: constraintsRef.current!,
                    inertia: true,
                    edgeResistance: 0.85,
                    allowContextMenu: true,
                    dragClickables: true,
                    allowEventDefault: true,
                    zIndexBoost: false,
                    cursor: "grab",
                    activeCursor: "grabbing",
                });
                draggableInstance = draggable;
            },
        });

        return () => {
            intro.kill();
            if (draggableInstance) draggableInstance.kill();
        };
    }, [isOpen]);

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
            <div
                ref={modalRef}
                className="absolute right-4 top-16 max-h-[80vh] w-[360px] border border-border bg-neutral-50"
            >
                {/* Title bar / drag handle */}
                <div className="flex cursor-move items-center justify-between px-3 py-2 text-sm font-semibold uppercase">
                    <span>Drop us a message</span>
                    <button
                        type="button"
                        onClick={close}
                        className="cursor-pointer scale-x-[0.6] text-4xl font-semibold leading-[14px]"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="p-3 text-xs">
                    <ContactForm />
                </div>
            </div>
        </div>,
        document.body,
    );
}
