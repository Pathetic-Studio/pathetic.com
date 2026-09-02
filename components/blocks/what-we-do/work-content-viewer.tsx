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
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-white/96 p-3 text-black backdrop-blur-[2px] sm:p-6"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-20 border border-black bg-white px-4 py-2 text-sm font-bold uppercase tracking-[-.03em] shadow-[3px_3px_0_#000] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black sm:right-6 sm:top-6"
      >
        Close
      </button>

      <div
        ref={panelRef}
        className="relative flex h-[86svh] max-h-[86svh] w-full max-w-[92rem] items-center justify-center border border-black bg-white p-2 sm:p-4 lg:p-6"
      >
        {content.mediaType === "video" && content.videoUrl ? (
          <video
            key={content.videoUrl}
            src={content.videoUrl}
            poster={content.videoPosterUrl || undefined}
            autoPlay
            controls
            playsInline
            className="max-h-[calc(86svh-1rem)] max-w-full border border-black object-contain sm:max-h-[calc(86svh-2rem)] lg:max-h-[calc(86svh-3rem)]"
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
      </div>
    </div>,
    document.body,
  );
}
