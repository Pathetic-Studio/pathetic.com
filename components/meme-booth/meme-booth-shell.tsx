"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useNewsletterModal } from "@/components/contact/contact-modal-context";

const CameraPanel = dynamic(() => import("./camera-panel"), { ssr: false });

interface MemeBoothShellProps {
    showNewsletterModalOnView?: boolean;
}

export default function MemeBoothShell({
    showNewsletterModalOnView = false,
}: MemeBoothShellProps) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const { open: openNewsletter } = useNewsletterModal();

    useEffect(() => {
        if (!showNewsletterModalOnView) return;
        if (!rootRef.current) return;

        const target = rootRef.current;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry && entry.isIntersecting) {
                    openNewsletter();
                    observer.disconnect();
                }
            },
            {
                threshold: 0.3,
            },
        );

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [showNewsletterModalOnView, openNewsletter]);

    return (
        <div ref={rootRef}>
            <CameraPanel />
        </div>
    );
}
