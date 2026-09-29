"use client";

import { useEffect } from "react";
import gsap from "gsap";
import styles from "./client-case-study.module.css";

/** Keep the existing transparent header readable over the new coloured panels. */
export default function CaseStudyHeaderContrast({ slug }: { slug: string }) {
  useEffect(() => {
    const header = document.getElementById("site-header-root");
    if (!header) return;
    const targets = Array.from(
      header.querySelectorAll<HTMLElement>(
        "[data-header-logo-main], [data-social-nav-item], [data-mobile-header-item]",
      ),
    );
    const surfaces = Array.from(
      document.querySelectorAll<HTMLElement>("[data-case-surface]"),
    );
    const sync = () => {
      const menuOpen = !!header.querySelector('[aria-label="Close Menu"]');
      const bounds = surfaces.map((surface) => ({
        rect: surface.getBoundingClientRect(),
        dark: surface.dataset.caseSurface === "dark",
      }));
      targets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const x = rect.left + rect.width / 2,
          y = rect.top + rect.height / 2;
        let dark = false;
        if (!menuOpen && rect.width)
          bounds.forEach((surface) => {
            if (
              x >= surface.rect.left &&
              x <= surface.rect.right &&
              y >= surface.rect.top &&
              y <= surface.rect.bottom
            )
              dark = surface.dark;
          });
        target.classList.toggle(styles.lightHeaderItem, dark);
      });
    };
    const content = document.getElementById("smooth-content");
    let previousPosition = "";
    const tick = () => {
      if (document.hidden) return;
      const position = `${window.scrollY}:${content?.style.transform}`;
      if (position === previousPosition) return;
      previousPosition = position;
      sync();
    };
    // Read after ScrollSmoother's interpolated transform changes, not just
    // when the browser scroll position first reaches its destination.
    gsap.ticker.add(tick);
    const observer = new MutationObserver(sync);
    observer.observe(header, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-label"],
    });
    window.addEventListener("resize", sync);
    sync();
    return () => {
      gsap.ticker.remove(tick);
      observer.disconnect();
      window.removeEventListener("resize", sync);
      targets.forEach((target) =>
        target.classList.remove(styles.lightHeaderItem),
      );
    };
  }, [slug]);
  return null;
}
