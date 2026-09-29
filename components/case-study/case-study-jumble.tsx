"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import gsap from "gsap";
import { useTransitionState } from "next-transition-router";
import type { CaseStudyImage, CaseStudyTile } from "@/lib/case-studies";
import CaseStudyLightbox from "./case-study-lightbox";
import CaseStudyObjectArt from "./case-study-object-art";
import styles from "./case-study-galleries.module.css";

function Preview({ item, active }: { item: CaseStudyTile; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !item.preview) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const hover = matchMedia("(hover: hover) and (pointer: fine)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    let visible = false;
    let cancelled = false;
    const sync = () => {
      if (
        active &&
        visible &&
        !document.hidden &&
        !motion.matches &&
        hover.matches &&
        !connection?.saveData
      ) {
        if (!video.getAttribute("src")) {
          video.src = item.preview!;
          setLoaded(true);
        }
        void video
          .play()
          .then(() => {
            if (!cancelled && active && visible && !document.hidden)
              setPlaying(true);
            else video.pause();
          })
          .catch(() => setPlaying(false));
      } else {
        video.pause();
        setPlaying(false);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    hover.addEventListener("change", sync);
    return () => {
      cancelled = true;
      observer.disconnect();
      video.pause();
      setPlaying(false);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      hover.removeEventListener("change", sync);
    };
  }, [active, item.preview]);
  return (
    <>
      <Image
        src={item.image.src}
        alt={item.image.alt}
        fill
        sizes="(max-width: 600px) 42vw, (max-width: 1000px) 28vw, 300px"
        style={{ objectFit: item.image.fit || "cover" }}
      />
      {item.preview && (
        <video
          ref={videoRef}
          className={styles.preview}
          data-playing={playing}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          data-preview-loaded={loaded}
        />
      )}
      {item.preview && (
        <span className={styles.previewMark} aria-hidden="true">
          ▶
        </span>
      )}
    </>
  );
}

export default function CaseStudyJumble({
  items,
  lightbox = false,
  collection = false,
}: {
  items: CaseStudyTile[];
  lightbox?: boolean;
  collection?: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [selected, setSelected] = useState<CaseStudyImage | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const popped = useRef(false);
  const popTween = useRef<gsap.core.Tween | null>(null);
  const { stage } = useTransitionState();
  useLayoutEffect(() => {
    if (!collection || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const objects = listRef.current?.querySelectorAll("[data-case-pop]");
    if (!objects) return;
    gsap.set(objects, { scale: 0, transformOrigin: "50% 50%" });
    return () => {
      popTween.current?.kill();
      gsap.set(objects, { clearProps: "transform" });
      popped.current = false;
    };
  }, [collection]);
  useLayoutEffect(() => {
    if (
      !collection ||
      stage === "leaving" ||
      popped.current ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const objects = listRef.current?.querySelectorAll("[data-case-pop]");
    if (!objects) return;
    popped.current = true;
    popTween.current = gsap.to(objects, {
      scale: 1,
      duration: 1.1,
      stagger: 0.14,
      ease: "elastic.out(1, 1)",
      clearProps: "transform",
    });
  }, [collection, stage]);
  return (
    <>
      <ul
        ref={listRef}
        className={`${styles.jumble} ${lightbox ? styles.communityJumble : ""} ${collection ? styles.collection : ""}`}
        data-case-jumble
      >
        {items.map((item, i) => {
          const portrait =
            !item.object && item.image.height / item.image.width > 1.3;
          const content = (
            <>
              <div
                className={`${styles.thumbnail} ${item.object || item.image.fit === "contain" ? styles.object : ""}`}
                style={{
                  aspectRatio:
                    item.object || item.image.fit === "contain"
                      ? "1 / 1"
                      : `${item.image.width} / ${item.image.height}`,
                }}
              >
                {collection && item.object ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                    }}
                    data-case-object-pair={
                      item.additionalObjects?.length ? "" : undefined
                    }
                  >
                    {[item.object, ...(item.additionalObjects || [])].map(
                      (object, index, objects) => (
                        <div
                          key={object.src}
                          data-case-object
                          data-case-object-key={object.src}
                          style={
                            objects.length > 1
                              ? {
                                  position: "absolute",
                                  width: "72%",
                                  height: "72%",
                                  left: index === 0 ? "-4%" : "34%",
                                  top: index === 0 ? "0%" : "26%",
                                }
                              : { width: "100%", height: "100%" }
                          }
                        >
                          <div
                            data-case-pop
                            style={{ width: "100%", height: "100%" }}
                          >
                            <CaseStudyObjectArt object={object} priority />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <Preview item={item} active={active === item.id} />
                )}
              </div>
              <span className={styles.tileCopy}>
                {item.title && <strong>{item.title}</strong>}
                {item.caption && <small>{item.caption}</small>}
              </span>
            </>
          );
          const shared = {
            className: styles.tile,
            onPointerEnter: (event: React.PointerEvent) => {
              if (event.pointerType === "mouse") setActive(item.id);
            },
            onPointerLeave: () => setActive(null),
            onFocus: () => setActive(item.id),
            onBlur: () => setActive(null),
          };
          return (
            <li
              key={item.id}
              className={portrait ? styles.portraitTile : styles.wideTile}
              style={
                {
                  "--offset": `${[24, 94, 0, 68, 54, 0, 72, 28][i % 8]}px`,
                } as CSSProperties
              }
            >
              {lightbox ? (
                <button
                  type="button"
                  {...shared}
                  onClick={() => setSelected(item.image)}
                  aria-label={`Enlarge: ${item.image.alt}`}
                >
                  {content}
                </button>
              ) : (
                <Link
                  {...shared}
                  href={item.href}
                  prefetch={false}
                  data-case-study-link={collection ? item.id : undefined}
                  data-case-accent={item.accent}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {lightbox && (
        <CaseStudyLightbox image={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
