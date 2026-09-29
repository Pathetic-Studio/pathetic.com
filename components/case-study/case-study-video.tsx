"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { CaseStudyFilm } from "@/lib/case-studies";
import styles from "./case-studies.module.css";

export default function CaseStudyVideo({
  film,
  title,
  aspectRatio,
}: {
  film: CaseStudyFilm;
  title: string;
  aspectRatio?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      className={styles.film}
      style={{ aspectRatio: aspectRatio ?? `${film.width} / ${film.height}` }}
    >
      {playing ? (
        <>
          <video
            ref={videoRef}
            src={film.src}
            poster={film.poster}
            controls
            autoPlay
            playsInline
            preload="none"
            aria-label={title}
            onError={() => setFailed(true)}
          />
          {failed && (
            <div className={styles.videoError} role="status">
              <p>The film couldn’t load.</p>
              <button
                onClick={() => {
                  setFailed(false);
                  videoRef.current?.load();
                  void videoRef.current?.play().catch(() => {});
                }}
              >
                Try again
              </button>
            </div>
          )}
        </>
      ) : (
        <button
          className={styles.play}
          onClick={() => setPlaying(true)}
          aria-label={`${film.label}: ${title}`}
        >
          <Image
            src={film.poster}
            alt=""
            style={
              aspectRatio === "513 / 378"
                ? { objectPosition: "center top" }
                : undefined
            }
            fill
            sizes="(min-width: 900px) 65vw, 92vw"
          />
          <span className={styles.playLabel}>
            <span aria-hidden="true">▶</span>
            {film.label}
          </span>
        </button>
      )}
    </div>
  );
}
