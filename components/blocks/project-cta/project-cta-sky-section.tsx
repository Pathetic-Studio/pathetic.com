"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { stegaClean } from "next-sanity";
import gsap from "gsap";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
import TitleText from "@/components/ui/title-text";
import { XButton } from "@/components/ui/close-button";
import type { ProjectCtaSectionBlock } from "./project-cta-section";
import { createProjectObjectWeather, type FortuneWeatherMode } from "./project-cta-object-weather";
import { createProjectFuzzyStar } from "./project-cta-fuzzy-star";
import pixel from "./project-cta-pixel-font.module.css";
import styles from "./project-cta-sky.module.css";

// Default: rain. For the alternate, pass weatherMode="cannons" or preview with
// ?fortune=cannons. Both versions use the existing content without CMS changes.
export default function ProjectCtaSkySection({
  weatherMode = "rain", ...props
}: ProjectCtaSectionBlock & { weatherMode?: FortuneWeatherMode }) {
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLSpanElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLCanvasElement>(null);
  const weatherRef = useRef<HTMLCanvasElement>(null);
  const activateRef = useRef<(active: boolean) => void>(() => {});
  const scrollActivatedRef = useRef(false);
  const pointerRef = useRef<(x: number, y: number) => void>(() => {});
  const sectionId = stegaClean(props.anchor?.anchorId) || "work-with-us";
  const title = stegaClean(props.title) || "WORK WITH US";
  const sky = stegaClean(props.backgroundImage?.asset?.url) || "/images/project-cta/contact-sky.webp";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const section = sectionRef.current, portal = portalRef.current, anchor = anchorRef.current;
    const frame = windowRef.current, text = titleRef.current, button = buttonRef.current;
    const background = backdropRef.current, starCanvas = starRef.current, weatherCanvas = weatherRef.current;
    if (!mounted || !section || !portal || !anchor || !frame || !text || !button || !background || !starCanvas || !weatherCanvas) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const compact = matchMedia("(max-width: 1023px), (any-pointer: coarse)");
    const readStationaryLayout = () => compact.matches || navigator.maxTouchPoints > 0 || !fine.matches;
    let stationary = readStationaryLayout(), intersectionRatio = 0;
    scrollActivatedRef.current = stationary;
    portal.dataset.layout = stationary ? "stationary" : "bouncing";
    let disposed = false, visible = false, active = false, measured = false, prepared = false;
    let weather: ReturnType<typeof createProjectObjectWeather> = null;
    let fuzzy: ReturnType<typeof createProjectFuzzyStar> = null;
    const progress = { value: 0 };
    let tween: gsap.core.Tween | null = null;
    const bounce = { x: 0, y: 0, vx: 75, vy: 58 };
    let w = 0, h = 0, inkW = 0, inkH = 0, inkOffsetX = 0, inkOffsetY = 0;
    let titleX = 0, titleY = 0, lastTop = NaN, lastLeft = NaN;
    let lastProgress = NaN;
    const setX = gsap.quickSetter(text, "x", "px"), setY = gsap.quickSetter(text, "y", "px");
    const mode = new URLSearchParams(location.search).get("fortune") === "cannons" ? "cannons" : weatherMode;
    const prepare = () => {
      if (prepared || disposed) return;
      prepared = true;
      fuzzy = createProjectFuzzyStar(starCanvas);
      if (!reduced.matches && props.sparklesEnabled !== false) {
        weather = createProjectObjectWeather(weatherCanvas, mode);
        weather?.setVisible(visible && progress.value > 0);
        weather?.setActive(active);
      }
    };
    const activate = (next: boolean) => {
      if (next === active) return;
      if (!next) { bounce.x = titleX; bounce.y = titleY; }
      active = next; portal.dataset.active = String(next);
      if (next) prepare();
      weather?.setActive(next && !reduced.matches);
      if (next) weather?.setVisible(visible);
      tween?.kill();
      tween = gsap.to(progress, {
        value: next ? 1 : 0,
        duration: reduced.matches ? .15 : next ? .64 : .42,
        ease: next ? "power3.inOut" : "power2.out",
        onComplete: () => { if (!active) weather?.setVisible(false); },
      });
    };
    activateRef.current = activate;
    pointerRef.current = (x, y) => weather?.movePointer(x, y);
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !active) return;
      activate(false);
      if (anchor.contains(document.activeElement)) (document.activeElement as HTMLElement)?.blur();
    };
    document.addEventListener("keydown", dismiss);

    const measure = () => {
      const ink = text.querySelector<HTMLElement>("h2 > span");
      if (!ink) return;
      w = section.clientWidth; h = section.clientHeight;
      const a = ink.getBoundingClientRect(), b = text.getBoundingClientRect();
      inkW = a.width; inkH = a.height;
      inkOffsetX = a.left - b.left; inkOffsetY = a.top - b.top;
      button.style.top = `${(h - inkH) / 2 - 15 + inkH + 26}px`;
      anchor.style.width = `${w}px`; anchor.style.height = `${h}px`;
      const bounds = section.getBoundingClientRect();
      anchor.style.transform = `translate3d(${bounds.left}px,${bounds.top}px,0)`;
      lastTop = bounds.top; lastLeft = bounds.left;
      if (!measured && inkW > 0) {
        bounce.x = Math.max(12, (w - inkW) * .28);
        bounce.y = 46; measured = true;
      }
      bounce.x = Math.max(10, Math.min(w - inkW - 10, bounce.x));
      bounce.y = Math.max(36, Math.min(h - inkH - 12, bounce.y));
      if (stationary) {
        titleX = (w - inkW) / 2; titleY = (h - inkH) / 2 - 15;
        setX(titleX - inkOffsetX); setY(titleY - inkOffsetY);
        frame.style.inset = "0px";
        button.style.transform = "translate(-50%,0) scale(1)";
        button.style.opacity = "1";
      }
      lastProgress = NaN;
    };

    const render = (time: number, delta: number) => {
      if (document.hidden || !visible) return;
      const bounds = section.getBoundingClientRect();
      // The one real window stays in a portal throughout; changing hover state
      // never swaps/duplicates the title or its contact button. Follow scroll
      // coordinates directly so the sky can cover adjacent sections underneath.
      if (bounds.top !== lastTop || bounds.left !== lastLeft) {
        anchor.style.transform = `translate3d(${bounds.left}px,${bounds.top}px,0)`;
        lastTop = bounds.top; lastLeft = bounds.left;
      }
      const p = progress.value;
      const minX = 10, maxX = Math.max(minX, w - inkW - 10);
      const minY = 36, maxY = Math.max(minY, h - inkH - 12);
      if (measured && !stationary && !active && p < .001 && !reduced.matches) {
        const dt = Math.min(delta, 40) / 1000;
        bounce.x += bounce.vx * dt; bounce.y += bounce.vy * dt;
        if (bounce.x < minX || bounce.x > maxX) { bounce.vx *= -1; bounce.x = Math.max(minX, Math.min(maxX, bounce.x)); }
        if (bounce.y < minY || bounce.y > maxY) { bounce.vy *= -1; bounce.y = Math.max(minY, Math.min(maxY, bounce.y)); }
      }
      const insetX = stationary ? 0 : Math.max(0, Math.min(w * .1, (w - inkW - 38) / 2));
      const insetY = stationary ? 0 : Math.max(0, Math.min(h * .1, (h - inkH - 148) / 2));
      const centerX = (w - inkW) / 2;
      const centerY = (h - inkH) / 2 - 15;
      titleX = stationary || reduced.matches ? centerX : bounce.x + (centerX - bounce.x) * p;
      titleY = stationary || reduced.matches ? centerY : bounce.y + (centerY - bounce.y) * p;
      setX(titleX - inkOffsetX); setY(titleY - inkOffsetY);
      if (p !== lastProgress) {
        frame.style.inset = `${insetY * p}px ${insetX * p}px`;
        background.style.opacity = String(p);
        const pop = 1 + 2.1 * Math.pow(p - 1, 3) + 1.1 * Math.pow(p - 1, 2);
        starCanvas.style.transform = `translate(-50%,-50%) scale(${.45 + pop * .55})`;
        const buttonProgress = stationary ? 1 : Math.max(0, (p - .35) / .65);
        button.style.transform = `translate(-50%,0) scale(${buttonProgress})`;
        button.style.opacity = String(buttonProgress);
        lastProgress = p;
      }
      if (p > .005) fuzzy?.draw(time * 1000, reduced.matches);
    };
    gsap.ticker.add(render);
    const resize = new ResizeObserver(measure);
    resize.observe(section); resize.observe(text);
    document.fonts.ready.then(() => { if (!disposed) measure(); });
    const preloader = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) prepare(); }, { rootMargin: "400px" });
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      intersectionRatio = entry.intersectionRatio;
      portal.style.visibility = visible ? "visible" : "hidden";
      portal.inert = !visible;
      weather?.setVisible(visible && progress.value > .001);
      if (visible) measure();
      else activate(false);
      // Separate entry/exit thresholds prevent small touch-scroll reversals
      // from repeatedly restarting the window and button animations.
      if (stationary) activate(visible && intersectionRatio > (active ? .3 : .55));
    }, { threshold: [0, .3, .55, 1] });
    preloader.observe(section); observer.observe(section);
    const motionChange = () => {
      const nextStationary = readStationaryLayout();
      if (nextStationary !== stationary) {
        stationary = nextStationary;
        scrollActivatedRef.current = stationary;
        portal.dataset.layout = stationary ? "stationary" : "bouncing";
        activate(stationary
          ? visible && intersectionRatio > (active ? .3 : .55)
          : visible && (anchor.matches(":hover") || anchor.contains(document.activeElement)));
      }
      if (prepared && !weather && !reduced.matches && props.sparklesEnabled !== false) {
        weather = createProjectObjectWeather(weatherCanvas, mode);
      }
      weather?.setActive(active && !reduced.matches);
      weather?.setVisible(visible && active && !reduced.matches);
      measure();
    };
    reduced.addEventListener("change", motionChange);
    fine.addEventListener("change", motionChange);
    compact.addEventListener("change", motionChange);
    measure();
    return () => {
      disposed = true; tween?.kill(); gsap.ticker.remove(render);
      resize.disconnect(); observer.disconnect(); preloader.disconnect();
      weather?.dispose(); fuzzy?.dispose();
      activateRef.current = () => {}; pointerRef.current = () => {};
      document.removeEventListener("keydown", dismiss);
      reduced.removeEventListener("change", motionChange);
      fine.removeEventListener("change", motionChange);
      compact.removeEventListener("change", motionChange);
    };
  }, [mounted, weatherMode, props.sparklesEnabled]);

  return <>
    <section ref={sectionRef} id={sectionId} className={styles.section} data-project-cta-version="sky-98" aria-labelledby={`${sectionId}-title`}>
      {!mounted && <h2 className={styles.srOnly}>{title}</h2>}
    </section>
    {mounted && createPortal(
      <div ref={portalRef} className={styles.portal} data-project-cta-sky-portal>
        <div ref={backdropRef} className={styles.backdrop} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sky} alt="" className={styles.sky} decoding="async" />
          <canvas ref={starRef} className={styles.star} data-fortune-star />
          <canvas ref={weatherRef} className={styles.weather} data-fortune-weather />
        </div>
        <div ref={anchorRef} className={styles.anchor}
          onPointerEnter={event => { if (!scrollActivatedRef.current && event.pointerType !== "touch") activateRef.current(true); }}
          onPointerLeave={event => { if (!scrollActivatedRef.current && event.pointerType !== "touch" && !event.currentTarget.contains(document.activeElement)) activateRef.current(false); }}
          onPointerMove={event => pointerRef.current(event.clientX, event.clientY)}
          onFocusCapture={() => { if (!scrollActivatedRef.current) activateRef.current(true); }}
          onBlurCapture={event => { if (!scrollActivatedRef.current && !event.currentTarget.contains(event.relatedTarget as Node | null)) activateRef.current(false); }}>
          <div ref={windowRef} className={styles.window} data-project-cta-panel>
            <div className={`${styles.titlebar} ${pixel.pixel}`}>
              <span>Pathetic.exe</span>
              <XButton className={styles.close} aria-label="Close sky effect"
                onClick={event => { activateRef.current(false); event.currentTarget.blur(); }}>×</XButton>
            </div>
            <div className={styles.content} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sky} alt="" className={styles.sky} decoding="async" />
            </div>
            <ContactFormTrigger className={styles.trigger} aria-label="Work with us — contact PATHETIC" data-project-cta-section-trigger>
              <span className={styles.srOnly}>Contact us</span>
            </ContactFormTrigger>
          </div>
          <div ref={titleRef} id={`${sectionId}-title`} className={styles.title} data-project-cta-dvd-title>
            <TitleText as="h2" variant="stretched" size="contact-cta" maxChars={30} singleLine
              textColor="#ffffff" textOutline outlineColor="#000000" fontWeight="bold" animation="none" className={styles.titleText}>
              {title}
            </TitleText>
          </div>
          <span ref={buttonRef} className={`${styles.fortune} ${pixel.pixel}`} data-project-cta-button aria-hidden="true">Contact Us</span>
        </div>
      </div>, document.body,
    )}
  </>;
}
