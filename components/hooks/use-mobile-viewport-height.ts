"use client";

import { useEffect } from "react";

/**
 * Sets CSS vars:
 *  --app-height: px value of the *visual* viewport height (stable vs mobile chrome)
 *  --vh: 1% of that height (legacy-friendly)
 */
export function useMobileViewportHeight() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const vv = window.visualViewport;

        const setVars = () => {
            const h = vv?.height ?? window.innerHeight;
            document.documentElement.style.setProperty("--app-height", `${h}px`);
            document.documentElement.style.setProperty("--vh", `${h * 0.01}px`);
        };

        setVars();

        // visualViewport is the key for iOS/Safari chrome changes
        vv?.addEventListener("resize", setVars);
        vv?.addEventListener("scroll", setVars); // iOS can change height while scrolling

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
