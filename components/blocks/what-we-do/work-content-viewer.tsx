"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";

export type WorkViewerContent = {
  title: string;
  mediaType: "image" | "video";
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  videoPosterUrl?: string;
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

  useEffect(() => {
    if (!content) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [content, onClose]);

  useLayoutEffect(() => {
    if (!content || !overlayRef.current || !panelRef.current) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.2, ease: "power2.out" },
      );
      gsap.fromTo(
        panelRef.current,
        { scale: 0.94, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.42,
          ease: "power3.out",
        },
      );
    });

    return () => context.revert();
  }, [content]);

  if (!mounted || !content) return null;

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-3 text-white sm:p-6"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-20 border border-white bg-black px-4 py-2 text-sm font-bold uppercase tracking-[-.03em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:right-6 sm:top-6"
      >
        Close
      </button>

      <div
        ref={panelRef}
        className="relative flex h-full max-h-[92svh] w-full max-w-[96rem] items-center justify-center overflow-hidden"
      >
        {content.mediaType === "video" && content.videoUrl ? (
          <video
            key={content.videoUrl}
            src={content.videoUrl}
            poster={content.videoPosterUrl || undefined}
            autoPlay
            controls
            playsInline
            className="max-h-full max-w-full object-contain"
          />
        ) : content.imageUrl ? (
          <Image
            src={content.imageUrl}
            alt={content.imageAlt || content.title}
            fill
            sizes="100vw"
            className="object-contain"
          />
        ) : (
          <div className="flex aspect-video w-full max-w-5xl items-center justify-center border border-white/30 bg-white/5 text-center text-lg font-bold uppercase">
            Add fullscreen content in Sanity
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
