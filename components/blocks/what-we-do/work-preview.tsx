"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** A title card, one preview play-through, then the title card again. */
export default function WorkPreview({
  src,
  poster,
  titleCard,
  videoScale = 1,
  title,
  suspended,
  cover,
}: {
  src: string;
  poster?: string;
  titleCard?: string;
  videoScale?: number;
  title: string;
  suspended: boolean;
  cover: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    let visible = false;
    let disposed = false;
    let timer = 0;
    let playRequest = 0;
    const canPlay = () =>
      visible &&
      !document.hidden &&
      !motion.matches &&
      !connection?.saveData &&
      !suspended;
    const showCard = () => {
      playRequest++;
      clearTimeout(timer);
      video.pause();
      setPlaying(false);
    };
    const schedule = () => {
      showCard();
      if (!canPlay()) return;
      if (!video.getAttribute("src")) {
        video.src = src;
        setLoaded(true);
      }
      timer = window.setTimeout(
        () => {
          if (!canPlay()) return;
          if (titleCard) video.currentTime = 0;
          const request = ++playRequest;
          void video
            .play()
            .then(() => {
              if (!disposed && request === playRequest && canPlay())
                setPlaying(true);
              else video.pause();
            })
            .catch(() => {
              if (!disposed) setPlaying(false);
            });
        },
        titleCard ? 3200 : 550,
      );
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const nextVisible =
          entries[entries.length - 1]?.isIntersecting ?? false;
        if (nextVisible === visible) return;
        visible = nextVisible;
        schedule();
      },
      { threshold: 0.15 },
    );
    observer.observe(root);
    video.addEventListener("ended", schedule);
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", schedule);
    return () => {
      disposed = true;
      showCard();
      observer.disconnect();
      video.removeEventListener("ended", schedule);
      document.removeEventListener("visibilitychange", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, [src, titleCard, suspended]);

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full"
      data-work-preview={title}
      data-preview-phase={playing ? "video" : "card"}
      data-preview-loaded={loaded}
    >
      {(titleCard || poster) && (
        <Image
          src={titleCard || poster!}
          alt={title}
          fill
          sizes="(min-width: 1024px) 15vw, 30vw"
          className={cn(
            "transition-opacity duration-300 motion-reduce:transition-none",
            titleCard || !cover ? "object-contain" : "object-cover",
            playing ? "opacity-0" : "opacity-100",
          )}
        />
      )}
      <video
        ref={videoRef}
        poster={titleCard ? undefined : poster}
        muted
        loop={!titleCard}
        playsInline
        preload="metadata"
        aria-hidden="true"
        style={{ transform: `scale(${videoScale})` }}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-300 motion-reduce:transition-none",
          playing ? "opacity-100" : "opacity-0",
          cover ? "object-cover" : "object-contain",
        )}
      />
    </div>
  );
}
