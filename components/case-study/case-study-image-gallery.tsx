"use client";

import Image from "next/image";
import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import type { CaseStudyImage } from "@/lib/case-studies";
import WorkContentViewer, { type WorkViewerContent } from "@/components/blocks/what-we-do/work-content-viewer";
import styles from "./case-study-image-gallery.module.css";

// Stable offsets keep the collage identical on the server and client. The
// grid reserves room for every photograph, including its drift and hover.
const PLACEMENTS = [
  { x: -16, y: -18, size: 0.94, driftX: 6, driftY: -9 },
  { x: 18, y: 22, size: 1, driftX: -5, driftY: 11 },
  { x: -20, y: -8, size: 0.9, driftX: 7, driftY: -8 },
  { x: 26, y: 20, size: 0.96, driftX: -6, driftY: -10 },
  { x: -12, y: -14, size: 0.9, driftX: 5, driftY: 9 },
  { x: 16, y: 12, size: 1, driftX: -5, driftY: 8 },
];
const column = (index: number, count: number, columns: number) => {
  const rowCount = Math.min(columns, count - Math.floor(index / columns) * columns);
  return `${columns - rowCount + (index % columns) * 2 + 1} / span 2`;
};

export default function CaseStudyImageGallery({ images, label, framed = true }: {
  images: CaseStudyImage[];
  label: string;
  framed?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<WorkViewerContent | null>(null);
  const close = useCallback(() => setViewer(null), []);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !images.length) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const pop = el.querySelectorAll<HTMLElement>("[data-gallery-pop]");
      const scroll = el.querySelectorAll<HTMLElement>("[data-gallery-scroll]");
      const reveal = gsap.fromTo(pop, { scale: 0 }, {
        scale: 1, duration: 0.5, stagger: 0.06, ease: "back.out(1.35)", paused: true,
      });
      const drift = gsap.timeline({ scrollTrigger: {
        trigger: el, start: "top bottom", end: "bottom top", scrub: 0.7,
      } });
      scroll.forEach((item, i) => drift.fromTo(item,
        { y: i % 2 ? 10 : -10 }, { y: i % 2 ? -10 : 10, ease: "none", duration: 1 }, 0));
      const observer = new IntersectionObserver(([entry]) => {
        el.dataset.visible = String(entry.isIntersecting);
        if (entry.isIntersecting) reveal.play();
        else reveal.reverse();
      }, { rootMargin: "0px 0px -24px 0px" });
      observer.observe(el);
      const visibility = () => { el.dataset.tabHidden = String(document.hidden); };
      visibility();
      document.addEventListener("visibilitychange", visibility);
      return () => {
        observer.disconnect();
        document.removeEventListener("visibilitychange", visibility);
        delete el.dataset.visible;
        delete el.dataset.tabHidden;
      };
    });
    return () => media.revert();
  }, [images.length]);

  if (!images.length) return null;
  return <>
    <div ref={root} className={styles.gallery} data-case-image-gallery data-count={images.length}
      data-framed={framed} data-viewing={Boolean(viewer)} role="region" aria-label={label}>
      <ul className={styles.stage}>
        {images.map((photo, index) => {
          const placement = PLACEMENTS[index % PLACEMENTS.length];
          const spread = photo.width < photo.height ? 2.4 : 1;
          return <li key={photo.src} className={styles.slot} style={{
            "--desktop-column": column(index, images.length, 3),
            "--mobile-column": column(index, images.length, 2),
            "--offset-x": `${placement.x * spread}px`, "--offset-y": `${placement.y}px`,
            "--photo-ratio": photo.width / photo.height, "--photo-size": placement.size,
            "--drift-x": `${placement.driftX}px`, "--drift-y": `${placement.driftY}px`,
            "--float-duration": `${5.2 + index % 4 * 0.6}s`, "--float-delay": `${-index * 0.8}s`,
          } as CSSProperties}>
            <div className={styles.offset}>
              <div data-gallery-scroll>
                <div data-gallery-pop>
                  <div className={styles.float}>
                    <button type="button" className={styles.imageButton} aria-label={`Enlarge image ${index + 1}: ${photo.alt}`}
                      aria-haspopup="dialog" onClick={(event) => {
                        event.currentTarget.focus({ preventScroll: true });
                        const rect = event.currentTarget.getBoundingClientRect();
                        setViewer({ title: label, mediaType: "gallery", images, initialIndex: index,
                          origin: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } });
                      }}>
                      <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height}
                        sizes="(max-width: 600px) 42vw, (max-width: 1000px) 28vw, 360px"
                        draggable={false} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>;
        })}
      </ul>
    </div>
    <WorkContentViewer content={viewer} onClose={close} />
  </>;
}
