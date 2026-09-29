"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import TitleText from "@/components/ui/title-text";
import { TEXT_STYLES } from "@/components/ui/text-styles";
import NetworkPhoneModel from "./network-phone-model";
import { INSTAGRAM_SNAPSHOT } from "@/lib/instagram/profile";
import styles from "./network-phone-scene.module.css";

type ReachPoint = { key: string; value: string; label: string };
type DetailStat = { key: string; title: string; value: string };

export default function NetworkPhoneScene({
  reachPoints,
  detailStats,
}: {
  reachPoints: ReachPoint[];
  detailStats: DetailStat[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState(INSTAGRAM_SNAPSHOT);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const root = rootRef.current;
    const section = root?.closest("section");
    if (!root || !section) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-network-floating-point]"),
    );
    let frame = 0;
    let visible = false;
    let lastTime = 0;
    let elapsed = 0;
    let amplitude = root.clientWidth < 640 ? 0.35 : 1;
    const resize = new ResizeObserver(() => {
      amplitude = root.clientWidth < 640 ? 0.35 : 1;
    });
    resize.observe(root);
    let x = 0,
      y = 0;
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reduced) return;
      const bounds = root.getBoundingClientRect();
      pointer.current = {
        x: Math.max(
          -1,
          Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1),
        ),
        y: Math.max(
          -1,
          Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1),
        ),
      };
    };
    const leave = () => {
      pointer.current = { x: 0, y: 0 };
    };
    const render = (time: number) => {
      frame = 0;
      if (!visible || document.hidden || reduced) {
        lastTime = 0;
        return;
      }
      const delta = Math.min(
        lastTime ? (time - lastTime) / 1000 : 1 / 60,
        0.05,
      );
      lastTime = time;
      elapsed += delta;
      const ease = 1 - Math.exp(-delta * 5);
      x += (pointer.current.x - x) * ease;
      y += (pointer.current.y - y) * ease;
      items.forEach((item, index) => {
        const depth = 10 + (index % 3) * 9;
        const dx =
          (x * depth + Math.sin(elapsed * 0.6 + index * 1.7) * 6) * amplitude;
        const dy =
          (y * depth + Math.cos(elapsed * 0.8 + index * 1.3) * 8) * amplitude;
        item.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
      frame = requestAnimationFrame(render);
    };
    const resume = () => {
      if (!frame && visible && !reduced) frame = requestAnimationFrame(render);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    observer.observe(root);
    section.addEventListener("pointermove", move, { passive: true });
    section.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", resume);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);

  // Interleave metrics and audience details around the phone, then keep the
  // same reading order in the compact layout below it on small screens.
  const orderedReach = [reachPoints[0], reachPoints[2], reachPoints[1]]
    .filter(Boolean)
    .map((point) => ({
      ...point,
      value: /followers/i.test(point.label)
        ? `${profile.followers.toLocaleString("en-US")}+`
        : point.value,
    }));
  const points = orderedReach.flatMap((point, index) => [
    { key: point.key, title: point.label, value: point.value, metric: true },
    ...(detailStats[index]
      ? [
          {
            key: detailStats[index].key,
            title: detailStats[index].title,
            value: detailStats[index].value,
            metric: false,
          },
        ]
      : []),
  ]);

  return (
    <div ref={rootRef} className={styles.scene} data-network-phone-scene>
      <div className={styles.phone}>
        <div className={styles.shadow} aria-hidden="true" />
        <NetworkPhoneModel pointer={pointer} onProfile={setProfile} />
      </div>
      <div className={styles.points}>
        {points.map((point, index) => (
          <div
            key={point.key}
            data-network-floating-point
            className={`${styles.point} ${point.metric ? styles.metric : styles.detail}`}
            style={{ "--point-index": index } as CSSProperties}
          >
            <div className={styles.pointContent}>
              {point.metric ? (
                <>
                  <TitleText
                    variant="stretched"
                    size="network-reach"
                    as="p"
                    maxChars={16}
                    fontWeight="bold"
                    stretchScaleX={0.68}
                    overallScale={1.04}
                    animation="none"
                    className="!w-auto [&_p]:whitespace-nowrap [&_p]:leading-[.82] [&_p]:tracking-[-.06em]"
                  >
                    {point.value}
                  </TitleText>
                  <p className={`mt-2 uppercase ${TEXT_STYLES.label}`}>
                    {point.title}
                  </p>
                </>
              ) : (
                <>
                  <p className={`uppercase ${TEXT_STYLES.dataTitle}`}>
                    {point.title}
                  </p>
                  <p
                    className={`mt-2 whitespace-pre-line uppercase ${TEXT_STYLES.dataValue}`}
                  >
                    {point.value}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
