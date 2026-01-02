// components/meme-booth/meme-booth-shell.tsx
"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useTransitionState } from "next-transition-router";
import { useNewsletterModal } from "@/components/contact/contact-modal-context";

const CameraPanel = dynamic(() => import("./panel/camera-panel"), { ssr: true });

interface MemeBoothShellProps {
    showNewsletterModalOnView?: boolean;
}

const NEWSLETTER_DELAY_MS = 1500;

export default function MemeBoothShell({
    showNewsletterModalOnView = false,
}: MemeBoothShellProps) {
    const pathname = usePathname();
    const { isOpen, open } = useNewsletterModal();
    const { isReady } = useTransitionState();

    const timerRef = useRef<number | null>(null);

    const autoOpenedThisEntryRef = useRef(false);
    const lastPathRef = useRef<string | null>(null);

    useEffect(() => {
        const last = lastPathRef.current;
        lastPathRef.current = pathname;

        const onMemeBooth = pathname === "/booth";
        const wasOnMemeBooth = last === "/booth";

        const clearTimer = () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            timerRef.current = null;
        };

        // Leaving page resets latch
        if (!onMemeBooth && wasOnMemeBooth) {
            autoOpenedThisEntryRef.current = false;
            clearTimer();
            return;
        }

        // Entering page resets latch
        if (onMemeBooth && !wasOnMemeBooth) {
            autoOpenedThisEntryRef.current = false;
            clearTimer();
        }

        // wrong page or flag off => do nothing
        if (!onMemeBooth || !showNewsletterModalOnView) {
            clearTimer();
            return;
        }

        // already auto-opened this visit => never schedule again (even if user closes)
        if (autoOpenedThisEntryRef.current) return;

        // if it's already open, mark as done so it won't re-open after close
        if (isOpen) {
            autoOpenedThisEntryRef.current = true;
            clearTimer();
            return;
        }

        // only one timer at a time
        if (timerRef.current) return;

        timerRef.current = window.setTimeout(() => {
            timerRef.current = null;

            // latch before opening so close won’t retrigger later
            autoOpenedThisEntryRef.current = true;

            // If transition router isn't ready yet (cold hydration), still open.
            // If it is ready, open as well.
            open();
        }, NEWSLETTER_DELAY_MS);

        return () => clearTimer();
    }, [pathname, showNewsletterModalOnView, isOpen, open, isReady]);

    return (
        <div>
            <CameraPanel />
        </div>
    );
}
