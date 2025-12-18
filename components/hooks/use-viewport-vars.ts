"use client";

import { useEffect } from "react";

/**
 * Keeps a stable CSS variable for the *visual viewport* height.
 * Fixes mobile layout shift caused by address bar show/hide.
 *
 * Provides:
 *  --app-height: <px>
 *  --vh: <px> (1% of app height)
 */
export function useViewportVars() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const vv = window.visualViewport;

        const setVars = () => {
            const h = vv?.height ?? window.innerHeight;
            document.documentElement.style.setProperty("--app-height", `${h}px`);
            document.documentElement.style.setProperty("--vh", `${h * 0.01}px`);
        };

        setVars();

        vv?.addEventListener("resize", setVars);
        vv?.addEventListener("scroll", setVars); // iOS updates height during scroll
        window.addEventListener("resize", setVars);
        window.addEventListener("orientationchange", setVars);

        return () => {
            vv?.removeEventListener("resize", setVars);
            vv?.removeEventListener("scroll", setVars);
            window.removeEventListener("resize", setVars);
            window.removeEventListener("orientationchange", setVars);
        };
    }, []);
}
