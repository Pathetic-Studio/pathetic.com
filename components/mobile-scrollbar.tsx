"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "./mobile-scrollbar.module.css";

/** Native mobile scrollbars ignore the site's track styling. Keep native page
 * scrolling, with a small matching track that also supports touch dragging. */
export default function MobileScrollbar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;
    const html = document.documentElement;
    const media = matchMedia("(max-width: 1023px), (pointer: coarse)");
    let frame = 0;
    let maximum = 0;
    let travel = 0;
    let thumbHeight = 0;
    let drag: { pointer: number; offset: number } | null = null;

    const update = () => {
      frame = 0;
      const enabled = media.matches && pathname !== "/jobs";
      html.toggleAttribute("data-mobile-scrollbar", enabled);
      const viewport = window.visualViewport;
      const visibleHeight = viewport?.height ?? window.innerHeight;
      maximum = Math.max(0, html.scrollHeight - html.clientHeight);
      const locked = document.body.style.position === "fixed" || html.style.overflow === "hidden";
      track.hidden = !enabled || maximum <= 1 || locked;
      if (track.hidden) return;
      track.style.top = `${(viewport?.offsetTop ?? 0) + 2}px`;
      track.style.height = `${Math.max(0, visibleHeight - 4)}px`;
      const innerHeight = Math.max(0, visibleHeight - 8);
      thumbHeight = Math.min(innerHeight, Math.max(32, innerHeight * visibleHeight / html.scrollHeight));
      travel = Math.max(0, innerHeight - thumbHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / maximum));
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${progress * travel}px)`;
      track.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const moveTo = (clientY: number, offset: number) => {
      if (!travel) return;
      const localY = clientY - track.getBoundingClientRect().top - 2 - offset;
      window.scrollTo({ top: Math.max(0, Math.min(1, localY / travel)) * maximum, behavior: "instant" });
      schedule();
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const bounds = thumb.getBoundingClientRect();
      const onThumb = event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      drag = { pointer: event.pointerId, offset: onThumb ? event.clientY - bounds.top : thumbHeight / 2 };
      track.setPointerCapture(event.pointerId);
      moveTo(event.clientY, drag.offset);
    };
    const move = (event: PointerEvent) => {
      if (drag?.pointer === event.pointerId) moveTo(event.clientY, drag.offset);
    };
    const release = () => { drag = null; };
    const keyDown = (event: KeyboardEvent) => {
      const positions: Record<string, number> = {
        ArrowDown: window.scrollY + 80, ArrowUp: window.scrollY - 80,
        PageDown: window.scrollY + window.innerHeight * 0.85,
        PageUp: window.scrollY - window.innerHeight * 0.85,
        Home: 0, End: maximum,
      };
      if (!(event.key in positions)) return;
      event.preventDefault();
      window.scrollTo({ top: positions[event.key], behavior: "instant" });
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    const lockChanges = new MutationObserver(schedule);
    lockChanges.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    lockChanges.observe(html, { attributes: true, attributeFilter: ["style"] });
    media.addEventListener("change", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    track.addEventListener("pointerdown", down);
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", release);
    track.addEventListener("pointercancel", release);
    track.addEventListener("lostpointercapture", release);
    track.addEventListener("keydown", keyDown);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      lockChanges.disconnect();
      html.removeAttribute("data-mobile-scrollbar");
      media.removeEventListener("change", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      track.removeEventListener("pointerdown", down);
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", release);
      track.removeEventListener("pointercancel", release);
      track.removeEventListener("lostpointercapture", release);
      track.removeEventListener("keydown", keyDown);
    };
  }, [pathname]);

  return (
    <div ref={trackRef} className={styles.track} data-mobile-scroll-track hidden
      role="scrollbar" aria-label="Page scroll" aria-orientation="vertical"
      aria-controls="smooth-content" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} tabIndex={0}>
      <div ref={thumbRef} className={styles.thumb} />
    </div>
  );
}
