"use client";

import GalleryImage from "@/components/ui/gallery-image";
import { useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import type { WorkGalleryImage } from "@/lib/instagram-posts";
import { cn } from "@/lib/utils";
import styles from "./work-image-gallery.module.css";

export default function WorkImageGallery({ images, title, initialIndex = 0 }: {
  images: WorkGalleryImage[];
  title: string;
  initialIndex?: number;
}) {
  const start = Math.max(0, Math.min(images.length - 1, initialIndex));
  const track = useRef<HTMLDivElement>(null);
  const active = useRef(start);
  const [index, setIndex] = useState(start);

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    active.current = start;
    setIndex(start);
    let width = el.clientWidth;
    // Centre the selected image before the opening animation is measured.
    el.scrollTo({ left: start * width, behavior: "instant" });
    const resize = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      el.scrollTo({ left: active.current * width, behavior: "instant" });
    });
    resize.observe(el);
    return () => resize.disconnect();
  }, [start, images.length]);
  const goTo = (next: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({
      left: Math.max(0, Math.min(images.length - 1, next)) * el.clientWidth,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };
  const control = cn(buttonVariants({ variant: "outline", size: "icon" }),
    "size-11 shrink-0 p-0 has-[>svg]:px-0 border-black bg-white text-black shadow-none hover:bg-black hover:text-white", styles.control);

  return (
    <div className={styles.gallery}>
      <div
        ref={track}
        data-work-image-gallery
        role="region"
        aria-roledescription="carousel"
        aria-label={title}
        tabIndex={0}
        className={styles.track}
        onScroll={(event) => {
          const el = event.currentTarget;
          const next = Math.max(0, Math.min(images.length - 1,
            Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
          active.current = next;
          setIndex(next);
        }}
      >
        {images.map((item, i) => (
          <div key={item.src} data-work-gallery-slide={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${images.length}`}
            className={styles.slide}>
            <GalleryImage image={item}
              loading={i === start ? "eager" : "lazy"} unoptimized
              className={styles.image} />
          </div>
        ))}
      </div>
      {images.length > 1 && <div className={styles.controls}>
        <button type="button" data-gallery-previous className={control} aria-label="Previous image" disabled={index === 0} onClick={() => goTo(index - 1)}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <span className={styles.count} role="status" aria-live="polite" aria-atomic="true">{index + 1} / {images.length}</span>
        <button type="button" data-gallery-next className={control} aria-label="Next image" disabled={index === images.length - 1} onClick={() => goTo(index + 1)}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>}
    </div>
  );
}
