"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { stegaClean } from "next-sanity";
import gsap from "gsap";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
import TitleText from "@/components/ui/title-text";
import type { ProjectCtaSectionBlock } from "./project-cta-section";
import type { createProjectStarPile } from "./project-cta-star-pile";
import styles from "./project-cta-window.module.css";
import pixel from "./project-cta-pixel-font.module.css";

// The previous sky/rainbow section remains in project-cta-section.tsx.
export default function ProjectCtaWindowSection(props: ProjectCtaSectionBlock) {
  const panelRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLSpanElement>(null);
  const pileRef = useRef<ReturnType<typeof createProjectStarPile> | null>(null);
  const activeRef = useRef(false);
  const hoverRef = useRef<((active: boolean) => void) | null>(null);
  const title = stegaClean(props.title) || "WORK WITH US";
  const authoredButtonLabel = stegaClean(props.buttonLabel);
  const buttonLabel = !authoredButtonLabel || authoredButtonLabel === "START A PROJECT"
    ? "Incredible Fortune Ahead Button" : authoredButtonLabel;
  const sectionId = stegaClean(props.anchor?.anchorId) || "work-with-us";

  useEffect(() => {
    const panel = panelRef.current, host = starsRef.current;
    const motion = motionRef.current, titleNode = titleRef.current;
    const button = buttonRef.current;
    if (!panel || !host || !motion || !titleNode || !button) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false, loading = false, visible = false;
    const position = { x: 0, y: 0 };
    let vx = 75, vy = 58, minX = 0, minY = 0, maxX = 0, maxY = 0;
    let measured = false;
    let centering: gsap.core.Tween | null = null;
    const setX = gsap.quickSetter(titleNode, "x", "px");
    const setY = gsap.quickSetter(titleNode, "y", "px");
    const paint = () => { setX(position.x); setY(position.y); };
    gsap.set(button, { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%" });
    const centre = (duration: number) => {
      centering?.kill();
      centering = gsap.to(position, {
        x: (minX + maxX) / 2, y: (minY + maxY) / 2,
        duration: reduced.matches ? 0 : duration, ease: "power3.inOut", onUpdate: paint,
        onComplete: () => {
          if (activeRef.current) gsap.to(button, {
            scale: 1, autoAlpha: 1, duration: reduced.matches ? 0 : .34,
            ease: "back.out(1.75)", overwrite: true,
          });
        },
      });
    };
    hoverRef.current = active => {
      centering?.kill();
      if (active) centre(.42);
      else gsap.to(button, { scale: 0, autoAlpha: 0, duration: reduced.matches ? 0 : .18, ease: "power2.in", overwrite: true });
    };
    function measure() {
      const ink = titleNode!.querySelector("h2 > span") as HTMLElement | null;
      if (!ink) return;
      const bounds = ink.getBoundingClientRect();
      const box = titleNode!.getBoundingClientRect();
      // Use the stretched ink, rather than its wider, unscaled layout box.
      minX = -(bounds.left - box.left);
      maxX = Math.max(minX, motion!.clientWidth - (bounds.right - box.left));
      minY = -(bounds.top - box.top);
      maxY = Math.max(minY, motion!.clientHeight - (bounds.bottom - box.top));
      if (!measured) { position.x = minX; position.y = minY; measured = true; }
      position.x = Math.max(minX, Math.min(maxX, position.x));
      position.y = Math.max(minY, Math.min(maxY, position.y));
      if (activeRef.current) centre(.18);
      else if (reduced.matches) { position.x = (minX + maxX) / 2; position.y = (minY + maxY) / 2; }
      paint();
    }
    const bounce = (_time: number, delta: number) => {
      if (!visible || document.hidden || reduced.matches || !measured || activeRef.current) return;
      const dt = Math.min(delta, 40) / 1000;
      position.x += vx * dt; position.y += vy * dt;
      if (position.x > maxX || position.x < minX) { vx *= -1; position.x = Math.max(minX, Math.min(maxX, position.x)); }
      if (position.y > maxY || position.y < minY) { vy *= -1; position.y = Math.max(minY, Math.min(maxY, position.y)); }
      paint();
    };
    gsap.ticker.add(bounce);
    const resize = new ResizeObserver(measure);
    resize.observe(motion); resize.observe(titleNode);
    document.fonts.ready.then(() => { if (!disposed) measure(); });
    const prepare = async () => {
      if (loading || reduced.matches || props.sparklesEnabled === false) return;
      loading = true;
      try {
        const { createProjectStarPile } = await import("./project-cta-star-pile");
        if (disposed || reduced.matches) { loading = false; return; }
        pileRef.current = createProjectStarPile(host);
        pileRef.current.setVisible(visible);
        pileRef.current.setActive(activeRef.current);
      } catch {
        // The window/contact action remains usable on devices without WebGL.
        host.dataset.webglFallback = "true";
      }
    };
    const preload = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void prepare(); }, { rootMargin: "450px" });
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      pileRef.current?.setVisible(visible);
      if (visible) measure();
    });
    preload.observe(panel); visibility.observe(panel);
    const motionChange = () => {
      if (reduced.matches) { pileRef.current?.setActive(false); centering?.kill(); measure(); }
      else if (visible) { void prepare(); pileRef.current?.setActive(activeRef.current); }
    };
    reduced.addEventListener("change", motionChange);
    measure();
    return () => {
      disposed = true; gsap.ticker.remove(bounce); resize.disconnect();
      centering?.kill(); gsap.killTweensOf(button); hoverRef.current = null;
      preload.disconnect(); visibility.disconnect(); reduced.removeEventListener("change", motionChange);
      pileRef.current?.dispose(); pileRef.current = null;
    };
  }, [props.sparklesEnabled]);

  const activate = (active: boolean) => {
    if (active === activeRef.current) return;
    activeRef.current = active;
    hoverRef.current?.(active);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) pileRef.current?.setActive(active);
  };

  return (
    <section id={sectionId} className={styles.section} data-project-cta-version="window-98">
      <div ref={panelRef} className={styles.window} data-project-cta-panel data-abyss-surface
        onPointerEnter={event => { if (event.pointerType !== "touch") activate(true); }}
        onPointerLeave={event => { if (event.pointerType !== "touch") activate(false); }}
        onPointerMove={event => { if (event.pointerType !== "touch") pileRef.current?.movePointer(event.clientX, event.clientY); }}
        onFocusCapture={() => activate(true)}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) activate(false); }}>
        <div className={`${styles.titlebar} ${pixel.pixel}`} aria-hidden="true">
          <span>System Message</span><span className={styles.close}>×</span>
        </div>
        <div className={styles.content}>
          <Image src={stegaClean(props.backgroundImage?.asset?.url) || "/images/project-cta/contact-sky.webp"}
            alt="" fill sizes="100vw" className={styles.sky} />
          <div className={styles.skyTint} aria-hidden="true" />
          <div ref={starsRef} className={styles.stars} aria-hidden="true" />
          <div ref={motionRef} className={styles.motion} data-project-cta-motion-surface>
            <div ref={titleRef} className={styles.title} data-project-cta-dvd-title>
              <TitleText as="h2" variant="stretched" size="contact-cta" maxChars={30} singleLine
                textColor="#000000" fontWeight="bold" animation="none" className={styles.titleText}>
                {title}
              </TitleText>
            </div>
          </div>
          <span className={styles.buttonPosition} aria-hidden="true">
            <span ref={buttonRef} className={`${styles.fortune} ${pixel.pixel}`} data-project-cta-button><span>{buttonLabel}</span></span>
          </span>
        </div>
        <ContactFormTrigger className={styles.trigger} aria-label="Work with us — contact PATHETIC" data-project-cta-section-trigger>
          <span className={styles.srOnly}>Contact us</span>
        </ContactFormTrigger>
      </div>
    </section>
  );
}
