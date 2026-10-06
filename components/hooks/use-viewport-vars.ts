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
        let frame = 0;
        let lastHeight = 0;
        const header = document.getElementById("site-header-root");
        const measureHeader = () => {
            if (!header) return;
            document.documentElement.style.setProperty("--site-nav-height", `${header.offsetHeight}px`);
        };
        const headerObserver = new ResizeObserver(measureHeader);
        if (header) headerObserver.observe(header);
        measureHeader();

        const commitVars = () => {
            frame = 0;
            const height = Math.round((vv?.height ?? window.innerHeight) * 10) / 10;
            if (Math.abs(height - lastHeight) < 0.5) return;
            lastHeight = height;
            document.documentElement.style.setProperty("--app-height", `${height}px`);
            document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
        };

        const setVars = () => {
            if (frame) return;
            frame = requestAnimationFrame(commitVars);
        };

        setVars();

        vv?.addEventListener("resize", setVars);
        vv?.addEventListener("scroll", setVars); // iOS updates height during scroll
        window.addEventListener("resize", setVars);
        window.addEventListener("orientationchange", setVars);

        return () => {
            headerObserver.disconnect();
            if (frame) cancelAnimationFrame(frame);
            vv?.removeEventListener("resize", setVars);
            vv?.removeEventListener("scroll", setVars);
            window.removeEventListener("resize", setVars);
            window.removeEventListener("orientationchange", setVars);
        };
    }, []);
}
