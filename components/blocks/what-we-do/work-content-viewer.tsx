"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import { buttonVariants } from "@/components/ui/button-variants";
import { CloseButton } from "@/components/ui/close-button";
import { cn } from "@/lib/utils";
import type { WorkGalleryImage } from "@/lib/instagram-posts";
import WorkImageGallery from "./work-image-gallery";

export type WorkViewerContent = {
  title: string;
  mediaType: "image" | "video" | "gallery";
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  videoPosterUrl?: string;
  caseStudyHref?: string;
  images?: WorkGalleryImage[];
  instagramHref?: string;
  initialIndex?: number;
  origin?: { left: number; top: number; width: number; height: number };
};

export default function WorkContentViewer({
  content,
  onClose,
}: {
  content: WorkViewerContent | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!content || !mounted || !overlay) return;
    const opener = document.activeElement as HTMLElement | null;
    const smoother = ScrollSmoother.get();
    const wasPaused = smoother?.paused();
    const body = document.body, html = document.documentElement;
    const x = window.scrollX, y = window.scrollY;
    const previous = {
      position: body.style.position, top: body.style.top, left: body.style.left,
      right: body.style.right, width: body.style.width, overflow: body.style.overflow,
    };
    const htmlOverflow = html.style.overflow;
    if (smoother) smoother.paused(true);
    else {
      Object.assign(body.style, { position: "fixed", top: `${-y}px`, left: `${-x}px`, right: "0", width: "100%", overflow: "hidden" });
      html.style.overflow = "hidden";
    }
    overlay.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (content.mediaType === "gallery" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        overlay.querySelector<HTMLButtonElement>(event.key === "ArrowRight" ? "[data-gallery-next]" : "[data-gallery-previous]")?.click();
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(overlay.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], video[controls], [tabindex="0"]',
      ));
      const first = controls[0], last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === overlay)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === overlay)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (smoother) smoother.paused(wasPaused ?? false);
      else {
        Object.assign(body.style, previous);
        html.style.overflow = htmlOverflow;
        window.scrollTo({ left: x, top: y, behavior: "instant" });
      }
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [content, mounted, onClose]);

  useLayoutEffect(() => {
    if (!content || !overlayRef.current || !panelRef.current) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const panel = panelRef.current;
    const selected = Math.max(0, Math.min((content.images?.length || 1) - 1, content.initialIndex || 0));
    const photo = panel.querySelector<HTMLImageElement>(`[data-work-gallery-slide="${selected}"] img`);
    let scale = reduced ? 1 : 0.94, x = 0, y = reduced ? 0 : 18;
    if (!reduced && content.origin && photo) {
      const source = content.origin, target = photo.getBoundingClientRect(), frame = panel.getBoundingClientRect();
      if (target.width > 0) {
        scale = Math.min(1, source.width / target.width);
        const cx = frame.left + frame.width / 2, cy = frame.top + frame.height / 2;
        x = source.left + source.width / 2 - (cx + (target.left + target.width / 2 - cx) * scale);
        y = source.top + source.height / 2 - (cy + (target.top + target.height / 2 - cy) * scale);
      }
    }
    const context = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: reduced ? 0 : 0.2, ease: "power2.out" },
      );
      gsap.fromTo(
        panelRef.current,
        { scale, x, y, autoAlpha: 0 },
        {
          scale: 1,
          x: 0,
          y: 0,
          autoAlpha: 1,
          duration: reduced ? 0 : content.origin ? 0.5 : 0.42,
          ease: "power3.out",
        },
      );
    });

    return () => context.revert();
  }, [content, mounted]);

  if (!mounted || !content) return null;

  const isVideo = content.mediaType === "video" && Boolean(content.videoUrl);
  const isGallery = content.mediaType === "gallery" && Boolean(content.images?.length);

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
      tabIndex={-1}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-white/96 px-3 pb-3 pt-16 text-black outline-none backdrop-blur-[2px] sm:px-6 sm:pb-6 sm:pt-20"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <CloseButton onClick={onClose} className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6" />

      <div
        ref={panelRef}
        className={
          isGallery
            ? "relative flex h-full max-h-[86svh] w-full max-w-[64rem] flex-col items-center gap-3 border border-black bg-white p-2 sm:p-4"
            : isVideo
            ? "relative flex max-h-[86svh] w-fit max-w-[calc(100vw-1.5rem)] flex-col items-center justify-center border border-black bg-white p-2 sm:max-w-[calc(100vw-3rem)] sm:p-4 lg:p-6"
            : "relative flex h-[86svh] max-h-[86svh] w-full max-w-[92rem] items-center justify-center border border-black bg-white p-2 sm:p-4 lg:p-6"
        }
      >
        {isGallery ? (
          <>
            <p className="shrink-0 text-center text-lg font-semibold uppercase">{content.title}</p>
            <WorkImageGallery key={`${content.instagramHref || content.title}-${content.initialIndex || 0}`} images={content.images!} title={content.title} initialIndex={content.initialIndex} />
          </>
        ) : isVideo ? (
          <video
            key={content.videoUrl}
            src={content.videoUrl}
            poster={content.videoPosterUrl || undefined}
            autoPlay
            controls
            playsInline
            className="block h-auto w-auto max-h-[calc(86svh-5rem)] max-w-full border border-black object-contain sm:max-h-[calc(86svh-6rem)] lg:max-h-[calc(86svh-7rem)]"
          />
        ) : content.imageUrl ? (
          <div className="relative h-full w-full border border-black">
            <Image
              src={content.imageUrl}
              alt={content.imageAlt || content.title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full max-w-5xl items-center justify-center border border-black bg-white text-center text-lg font-bold uppercase">
            Add fullscreen content in Sanity
          </div>
        )}
        {content.caseStudyHref && (
          <Link
            href={content.caseStudyHref}
            onClick={onClose}
            scroll={false}
            className={cn(buttonVariants({ variant: "outline" }), "mt-3")}
          >
            View the case study
          </Link>
        )}
        {content.instagramHref && (
          <a href={content.instagramHref} target="_blank" rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "shrink-0 border-black bg-white text-black shadow-none hover:bg-black hover:text-white", isVideo && "mt-3")}>
            See on Instagram
          </a>
        )}
      </div>
    </div>,
    document.body,
  );
}
