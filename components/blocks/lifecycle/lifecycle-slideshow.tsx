"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stegaClean } from "next-sanity";
import type { ColorVariant, PAGE_QUERYResult } from "@/sanity.types";
import { cn } from "@/lib/utils";
import TitleText from "@/components/ui/title-text";
import { BackgroundPanel } from "@/components/ui/background-panel";
import { getSectionSurfaceClass } from "@/components/blocks/shared/section-surface";
import LifecycleMemeSwarm from "./lifecycle-meme-swarm";
import LifecycleThreeScene from "./lifecycle-three-scene";
import {
  BUNDLED_SLIDE_TWO_CENTER,
} from "./lifecycle-slide-two-assets";
import { useHeaderVisualTheme } from "@/components/header/visual-theme";
import styles from "./lifecycle-slideshow.module.css";
import CredibilitySpaceSection, { type SpaceCredibilityBlock } from "../credibility/credibility-space-section";
import { spaceRadial, spaceRange } from "../credibility/credibility-space-transition";
import { radialRevealGradient } from "@/lib/radial-reveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type LifecycleBlock = Extract<PageBlock, { _type: "lifecycle-slideshow" }>;
type LifecycleObjectHeaderEffect = {
  enabled?: boolean | null;
  accentColor?: { hex?: string | null } | null;
  idleIntensity?: number | null;
};

const MEME_REVEAL_SCROLL_SCREENS = 2;
const MEME_POP_SCROLL_SCREENS = 0.16;
const COMPACT_SCROLL_SCREENS = 2.8;
const DESKTOP_GLASSES_DROP = 0.05;

function LifecycleTitleCharacters({ text, linkInstagram = false }: { text: string; linkInstagram?: boolean }) {
  return (
    <>
      <span aria-hidden={linkInstagram ? undefined : true}>
        {text.split(/(\s+)/).map((token, tokenIndex) => {
          if (/^\s+$/.test(token)) return token;

          const characters = Array.from(token).map((character, characterIndex) => (
            <span
              key={`${character}-${characterIndex}`}
              data-lifecycle-title-char
              className="inline-block lg:opacity-0"
            >
              {character}
            </span>
          ));
          return linkInstagram && /^@?pathetic[.,]?$/i.test(token) ? (
            <a
              key={`${token}-${tokenIndex}`}
              href="https://www.instagram.com/pathetic/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="PATHETIC on Instagram"
              className="pointer-events-auto inline-block no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {token.startsWith("@") && characters[0]}
              {/* Compensate for line-box leading so the underline follows the
                  letters when the shared heading's line height changes. */}
              <span className="relative inline-block after:absolute after:inset-x-0 after:bottom-[calc(0.5lh_-_0.48em)] after:h-[.045em] after:bg-current">
                {characters.slice(token.startsWith("@") ? 1 : 0)}
              </span>
            </a>
          ) : (
            <span key={`${token}-${tokenIndex}`} className="inline-block">
              {characters}
            </span>
          );
        })}
      </span>
      {!linkInstagram && <span className="sr-only">{text}</span>}
    </>
  );
}

function SlideCopy({
  centerText,
  textStyle,
  linkInstagram = false,
}: {
  centerText?: string | null;
  textStyle?: LifecycleBlock["displayTextStyle"] | null;
  linkInstagram?: boolean;
}) {
  const cleanCenterText = centerText ? stegaClean(centerText).replace(/\.\s*$/, "") : "";

  return (
    <div data-lifecycle-copy className="pointer-events-none absolute inset-0 z-[90] px-5 text-center">
      {cleanCenterText && (
        <div
          data-lifecycle-center-text
          className={cn(linkInstagram ? styles.memeCopy : styles.glassesCopy, "absolute left-1/2 top-1/2 w-[min(96vw,1200px)] -translate-x-1/2 -translate-y-1/2")}
        >
          <TitleText
            variant="stretched"
            as="h2"
            size="display"
            align="center"
            maxChars={38}
            animation="none"
            className={cn(styles.slideTitle, "whitespace-pre-line [text-wrap:balance]")}
            textColor={textStyle?.fillColor?.hex || undefined}
            textOutline
            outlineColor="#ffffff"
            outlineWidth={1.5}
            outlinePosition="outside"
            fontWeight={textStyle?.fontWeight ?? undefined}
          >
            <LifecycleTitleCharacters text={cleanCenterText} linkInstagram={linkInstagram} />
          </TitleText>
        </div>
      )}
    </div>
  );
}

/** Keep the layout pinned while individual objects pop into place on scroll. */
function createMemeCascade(images: HTMLElement[], surface: HTMLElement, revealScreens: number, popScreens: number) {
  const items = [...images].sort((a, b) => {
    const first = a.closest<HTMLElement>("[data-lifecycle-meme-image]");
    const second = b.closest<HTMLElement>("[data-lifecycle-meme-image]");
    return Number(second?.dataset.restY) - Number(first?.dataset.restY);
  });
  const floats = surface.querySelectorAll<HTMLElement>("[data-lifecycle-meme-float]");
  let floating = false;
  const setFloating = (next: boolean) => {
    if (next === floating) return;
    floating = next;
    floats.forEach(element => gsap.getTweensOf(element).forEach(tween => next ? tween.resume() : tween.pause()));
  };
  floats.forEach(element => gsap.getTweensOf(element).forEach(tween => tween.pause()));
  const backdrop = surface.querySelector<HTMLElement>("[data-lifecycle-meme-surface]");
  const originals = [backdrop, ...items].filter((item): item is HTMLElement => Boolean(item)).map(item => [item, item.getAttribute("style")] as const);
  const ease = gsap.parseEase("back.out(1.6)");
  let lastProgress = -1;
  const render = (progress: number, allowFloat: boolean) => {
    setFloating(progress >= 1 && allowFloat);
    // Once the reveal has settled, the gathering timeline owns the motion.
    // Avoid touching every image's reveal styles throughout the glasses scene.
    if (progress === lastProgress && (progress === 0 || progress === 1)) return;
    lastProgress = progress;
    if (backdrop) backdrop.style.clipPath = `inset(${(1 - progress) * 100}% 0% 0%)`;
    // Read the final laid-out Y positions, including any text-safe-zone shifts.
    // Explicit progress keeps a refresh from re-showing future stagger items.
    items.forEach(item => {
      // Edge images can overhang the frame, but must still start hidden.
      const y = gsap.utils.clamp(0, 100, Number(item.closest<HTMLElement>("[data-lifecycle-meme-image]")?.dataset.restY || 50));
      // Keep each pop quick, including the shorter touch-screen sequence.
      const start = (revealScreens - popScreens) * (1 - y / 100);
      const local = gsap.utils.clamp(0, 1,
        (progress * revealScreens - start) / popScreens,
      );
      item.style.opacity = "1";
      item.style.visibility = local ? "visible" : "hidden";
      item.style.transform = `scale(${ease(local)})`;
    });
  };
  return {
    render,
    dispose: () => {
      originals.forEach(([item, style]) => style === null ? item.removeAttribute("style") : item.setAttribute("style", style));
    },
  };
}

export default function LifecycleSlideshow(props: LifecycleBlock & { space?: SpaceCredibilityBlock }) {
  const {
    _key,
    anchor,
    colorVariant,
    background,
    displayTextStyle,
    pinDuration,
    memeSlide,
    orbitSlide,
    objectSlide,
    space,
  } = props;
  const rootRef = useRef<HTMLElement | null>(null);
  const objectArticleRef = useRef<HTMLElement | null>(null);
  const [boosted, setBoosted] = useState(false);
  const glassesEntryRef = useRef({ progress: 0 });
  const spaceTransitionRef = useRef({ progress: 0 });
  const [memeResetKey, setMemeResetKey] = useState(0);
  const boostedRef = useRef(false);
  const objectSlideActiveRef = useRef(false);
  const {
    setHeaderVisualTheme,
    clearHeaderVisualTheme,
  } = useHeaderVisualTheme();

  const cleanColor = (stegaClean(colorVariant) || "background") as ColorVariant;
  const cleanAnchor = stegaClean(anchor?.anchorId) || undefined;
  const duration = Math.min(8.5, Math.max(5.5, (pinDuration || 7) - 1.5));
  const spaceDuration = space ? 2.1 : 0;
  const objectHeaderEffect = (
    objectSlide as
      | (typeof objectSlide & { headerEffect?: LifecycleObjectHeaderEffect | null })
      | undefined
  )?.headerEffect;
  const electricHeaderEnabled = stegaClean(objectHeaderEffect?.enabled) !== false;
  const electricAccent =
    stegaClean(objectHeaderEffect?.accentColor?.hex) || "#7ed7ff";
  const electricIntensity = Math.max(
    0.15,
    Math.min(1, stegaClean(objectHeaderEffect?.idleIntensity) ?? 1),
  );
  const headerThemeSource = `lifecycle:${stegaClean(_key) || _key}`;
  const spaceHeaderSource = `${headerThemeSource}:space`;

  useEffect(() => {
    boostedRef.current = boosted;
    document.documentElement.toggleAttribute(
      "data-lifecycle-fun-active",
      boosted,
    );
    if (boosted && objectSlideActiveRef.current && electricHeaderEnabled) {
      setHeaderVisualTheme(headerThemeSource, {
        mode: "electric",
        accent: electricAccent,
        intensity: electricIntensity,
        progress: 1,
        priority: 10,
      });
    } else {
      clearHeaderVisualTheme(headerThemeSource);
    }

    return () => {
      document.documentElement.removeAttribute("data-lifecycle-fun-active");
    };
  }, [
    boosted,
    clearHeaderVisualTheme,
    electricAccent,
    electricHeaderEnabled,
    electricIntensity,
    headerThemeSource,
    setHeaderVisualTheme,
  ]);

  useEffect(() => {
    if (!boosted) return;
    const stop = () => setBoosted(false);
    const onVisibility = () => { if (document.hidden) stop(); };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) stop();
    });
    if (objectArticleRef.current) observer.observe(objectArticleRef.current);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [boosted]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add({
        desktop: "(min-width: 1024px)",
        motion: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      }, ({ conditions }) => {
        const surface = root.querySelector<HTMLElement>("[data-pin-target]")!;
        const meme = root.querySelector<HTMLElement>('[data-lifecycle-slide="meme"]')!;
        const object = root.querySelector<HTMLElement>('[data-lifecycle-slide="object"]')!;
        const memeCopy = meme.querySelector<HTMLElement>("[data-lifecycle-copy]")!;
        const stage = object.querySelector<HTMLElement>("[data-lifecycle-three-stage]")!;
        const button = object.querySelector<HTMLElement>("[data-lifecycle-fun-button]")!;
        const images = [...meme.querySelectorAll<HTMLElement>("[data-lifecycle-meme-image]")];
        const arrivals = images.map(image => image.querySelector<HTMLElement>("[data-lifecycle-meme-transition]")!);
        const reveals = images.map(image => image.querySelector<HTMLElement>("[data-lifecycle-meme-reveal]")!);
        const titleChars = [...object.querySelectorAll<HTMLElement>("[data-lifecycle-title-char]")];
        const compact = !conditions?.desktop;
        const spaceLayer = root.querySelector<HTMLElement>("[data-space-takeover]");
        const radialLayer = root.querySelector<HTMLElement>("[data-space-radial]");
        const objectCopy = object.querySelector<HTMLElement>("[data-lifecycle-copy]");
        const revealScreens = compact ? 0.85 : MEME_REVEAL_SCROLL_SCREENS;
        const gatherStart = revealScreens + (compact ? 0.18 : 0.35);
        const gatherDuration = compact ? 0.8 : 1.5;
        const glassesArrived = gatherStart + gatherDuration;
        const glassesTextStart = glassesArrived + (compact ? 0.06 : 0.08);
        const entryDelay = compact ? 0.03 : 0.08;
        const baseScreens = compact ? COMPACT_SCROLL_SCREENS : duration;
        const extraScreens = space ? compact ? 1.55 : spaceDuration : 0;
        const scrollScreens = baseScreens + extraScreens;
        const spaceStart = baseScreens - .05;
        const renderSpace = () => {
          if (!spaceLayer || !radialLayer) return;
          const p = spaceTransitionRef.current.progress;
          const bounds = surface.getBoundingClientRect();
          const radial = spaceRadial(p, surface.clientWidth, surface.clientHeight);
          radialLayer.style.background = radialRevealGradient(radial, "16 18 14");
          radialLayer.style.opacity = p > 0 ? "1" : "0";
          spaceLayer.style.setProperty("--space-scene-visible", p > .5 ? "1" : "0");
          spaceLayer.style.setProperty("--space-title-opacity", String(spaceRange(p, .67, .86)));
          spaceLayer.style.setProperty("--space-title-y", `${(1 - spaceRange(p, .67, .86)) * 24}px`);
          spaceLayer.inert = p < .78;
          spaceLayer.style.setProperty("--space-pointer-events", p >= .78 ? "auto" : "none");
          if (p > .001 && bounds.bottom > 0 && bounds.top < innerHeight) {
            setHeaderVisualTheme(spaceHeaderSource, {
              mode: "space", priority: 20,
              radial: { ...radial, x: radial.x + bounds.left, y: radial.y + bounds.top, bottom: bounds.bottom },
            });
          } else clearHeaderVisualTheme(spaceHeaderSource);
        };

        if (conditions?.reduced) {
          glassesEntryRef.current.progress = 1;
          gsap.set([meme, object, button, ...reveals, ...arrivals, ...root.querySelectorAll("[data-lifecycle-title-char]")], { autoAlpha: 1, scale: 1 });
          objectSlideActiveRef.current = true;
          spaceTransitionRef.current.progress = 1;
          if (spaceLayer) { spaceLayer.style.setProperty("--space-scene-visible", "1"); spaceLayer.inert = false; }
          if (spaceLayer) spaceLayer.style.setProperty("--space-pointer-events", "auto");
          const syncReducedHeader = () => {
            if (!spaceLayer) return;
            const bounds = spaceLayer.getBoundingClientRect();
            if (bounds.top <= 0 && bounds.bottom > 0) setHeaderVisualTheme(spaceHeaderSource, { mode: "space", priority: 20, radial: { ...spaceRadial(1, bounds.width, bounds.height, bounds.top), x: bounds.left + bounds.width / 2 } });
            else clearHeaderVisualTheme(spaceHeaderSource);
          };
          const staticEdge = spaceLayer ? ScrollTrigger.create({ trigger: spaceLayer, start: "top bottom", end: "bottom top", onUpdate: syncReducedHeader, onToggle: syncReducedHeader }) : null;
          return () => { staticEdge?.kill(); clearHeaderVisualTheme(spaceHeaderSource); };
        }

        glassesEntryRef.current.progress = 0;
        spaceTransitionRef.current.progress = 0;
        gsap.set(meme, { autoAlpha: 1 });
        gsap.set(meme.querySelectorAll("[data-lifecycle-title-char]"), { autoAlpha: 1 });
        gsap.set(arrivals, { x: 0, y: 0, scale: 1, rotation: 0, autoAlpha: 1 });
        gsap.set(object, { autoAlpha: 0 });
        // On touch layouts the mesh rises inside a stationary canvas. Moving
        // the entire tall canvas hides most of its entrance below the clip edge.
        gsap.set(stage, { yPercent: compact ? 0 : 110 });
        gsap.set(titleChars, { autoAlpha: 0, yPercent: 20 });
        gsap.set(button, { autoAlpha: 0, scale: 0 });
        const cascade = createMemeCascade(reveals, surface, revealScreens, compact ? 0.12 : MEME_POP_SCROLL_SCREENS);
        const playhead = { screens: 0 };
        let collecting = false;
        let disposed = false;
        // Compact layouts use CSS sticky, so the browser keeps the title in
        // place during momentum scrolling, even before a JS frame can run.
        const nativePin = !compact && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
        const clamp = gsap.utils.clamp(0, 1);
        const sync = () => {
          const screens = playhead.screens;
          cascade.render(clamp(screens / revealScreens), screens < gatherStart);
          const nextCollecting = screens > gatherStart;
          if (nextCollecting !== collecting) {
            collecting = nextCollecting;
            meme.inert = collecting;
            setMemeResetKey(current => current + 1);
          }
          const ready = screens >= glassesTextStart && (!space || screens < spaceStart);
          object.inert = !ready;
          objectSlideActiveRef.current = ready;
          if (!ready && boostedRef.current) {
            boostedRef.current = false;
            setBoosted(false);
            clearHeaderVisualTheme(headerThemeSource);
          }
          renderSpace();
        };
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: sync,
          scrollTrigger: {
            id: "lifecycle-meme-to-glasses",
            trigger: root,
            start: "top top",
            end: () => `+=${(compact || nativePin ? surface.clientHeight : innerHeight) * scrollScreens}`,
            scrub: compact ? 0.16 : 0.25,
            invalidateOnRefresh: true,
            ...(nativePin ? { pin: surface, pinSpacing: true, anticipatePin: 1 } : {}),
            onRefresh: () => { sync(); },
          },
        });
        timeline.to(playhead, { screens: scrollScreens, duration: scrollScreens }, 0);
        timeline.to(memeCopy, { autoAlpha: 0, duration: compact ? 0.16 : 0.24 }, gatherStart);

        // Each image keeps its own wrapper: its existing hover/meme interaction
        // never competes with the scroll transforms. End inside the lens area.
        const destination = (index: number, element: Element, axis: "x" | "y") => {
          const item = element.closest<HTMLElement>("[data-lifecycle-meme-image]")!;
          const width = surface.clientWidth;
          const height = surface.clientHeight;
          const angle = index * 2.399963;
          const radius = Math.sqrt((index + 0.5) / images.length);
          if (axis === "x") {
            return width * (0.5 - Number(item.dataset.restX) / 100)
              + Math.cos(angle) * radius * Math.min(width * 0.075, 80);
          }
          const lensCenterY = conditions?.desktop
            ? 0.64 + DESKTOP_GLASSES_DROP
            : width < 640 ? 0.64 : 0.61;
          return height * (lensCenterY - Number(item.dataset.restY) / 100)
            + Math.sin(angle) * radius * Math.min(width * 0.035, 34);
        };
        timeline.to(arrivals, {
          x: (index, element) => destination(index, element, "x"),
          y: (index, element) => destination(index, element, "y"),
          scale: 0.38,
          rotation: index => (index % 2 ? 1 : -1) * (12 + index % 5 * 4),
          duration: gatherDuration - (compact ? 0.12 : 0.22),
          ease: "power2.inOut",
        }, gatherStart);
        timeline.set(object, { autoAlpha: 1 }, gatherStart + entryDelay);
        if (!compact) {
          timeline.to(stage, { yPercent: 0, duration: gatherDuration - entryDelay, ease: "power2.inOut" }, gatherStart + entryDelay);
        }
        timeline.to(glassesEntryRef.current, { progress: 1, duration: gatherDuration - entryDelay, ease: compact ? "power1.out" : "power2.inOut" }, gatherStart + entryDelay);
        const encapsulateDuration = compact ? 0.12 : 0.22;
        timeline.to(arrivals, { scale: 0, autoAlpha: 0, duration: encapsulateDuration, ease: "power2.in" }, glassesArrived - encapsulateDuration);
        timeline.to(meme, { autoAlpha: 0, duration: 0.08 }, glassesArrived - 0.08);
        timeline.to(titleChars, {
          autoAlpha: 1, yPercent: 0, duration: 0.09,
          stagger: { amount: compact ? 0.22 : 0.3 }, ease: "power2.out",
        }, glassesTextStart);
        timeline.to(button, { autoAlpha: 1, scale: 1, duration: 0.24, ease: "back.out(1.7)" }, glassesTextStart + (compact ? 0.22 : 0.3));
        if (space) {
          const transferDuration = compact ? 1.05 : 1.55;
          timeline.to(spaceTransitionRef.current, { progress: 1, duration: transferDuration }, spaceStart);
          timeline.to([objectCopy, button], { autoAlpha: 0, duration: .22 }, spaceStart);
        }
        // Track the hard bottom edge after the pin has ended as well as the
        // scrubbed entrance. Header masks use viewport coordinates throughout.
        const syncEdge = (trigger: ScrollTrigger) => {
          if (trigger.isActive) renderSpace();
          else clearHeaderVisualTheme(spaceHeaderSource);
        };
        const edgeTrigger = space ? ScrollTrigger.create({ trigger: root, start: "top bottom", end: "bottom top", onUpdate: syncEdge, onToggle: syncEdge }) : null;
        // Intersection runs after the smoother has moved the pinned surface.
        // It also clears a claim after a fast jump skips the last scroll frame.
        const spaceVisibility = spaceLayer ? new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) clearHeaderVisualTheme(spaceHeaderSource);
          else renderSpace();
        }, { threshold: [0, .001] }) : null;
        if (spaceLayer) spaceVisibility?.observe(spaceLayer);
        sync();

        // Fonts and the swarm's safe-zone layout settle before caching the
        // convergence coordinates. Recalculate them on viewport refreshes too.
        const refresh = () => requestAnimationFrame(() => {
          if (!disposed) ScrollTrigger.refresh();
        });
        document.fonts.ready.then(refresh);
        const frame = refresh();
        return () => {
          disposed = true;
          cancelAnimationFrame(frame);
          timeline.scrollTrigger?.kill();
          timeline.kill();
          edgeTrigger?.kill();
          spaceVisibility?.disconnect();
          clearHeaderVisualTheme(spaceHeaderSource);
          cascade.dispose();
          meme.inert = false;
          object.inert = false;
          glassesEntryRef.current.progress = 1;
          objectSlideActiveRef.current = false;
        };
      });
    }, root);
    return () => {
      objectSlideActiveRef.current = false;
      clearHeaderVisualTheme(headerThemeSource);
      clearHeaderVisualTheme(spaceHeaderSource);
      media.revert();
      context.revert();
    };
  }, [clearHeaderVisualTheme, setHeaderVisualTheme, duration, headerThemeSource, spaceHeaderSource, space, spaceDuration]);

  const modelAsset = objectSlide?.model?.asset;
  // Keep the refined source export local; no CMS asset replacement is needed.
  // Explicitly different custom models can still be supplied through Sanity.
  const modelUrl = !modelAsset?.url || /goggles/i.test(modelAsset.originalFilename || modelAsset.url)
    ? "/models/pathetic-goggles-smooth.glb"
    : modelAsset.url;
  const fallbackImageUrl = objectSlide?.fallbackImage?.asset?.url;
  const orbitArtworkSettings = orbitSlide as unknown as
    | { useSanityArtwork?: boolean }
    | undefined;
  const useSanityArtwork = orbitArtworkSettings?.useSanityArtwork === true;
  const sanityCenterArtwork = orbitSlide?.centerImage?.asset?.url
    ? {
        key: "sanity-center",
        src: orbitSlide.centerImage.asset.url,
        alt: orbitSlide.centerImage.alt || "",
      }
    : null;
  const resolvedOrbitCenter =
    useSanityArtwork && sanityCenterArtwork
      ? sanityCenterArtwork
      : BUNDLED_SLIDE_TWO_CENTER;

  return (
    <section
      ref={rootRef}
      id={cleanAnchor || `_lifecycle-${_key}`}
      data-lifecycle-root="true"
      data-lifecycle-fun-active={boosted ? "true" : undefined}
      data-pin-to-viewport="true"
      data-pin-duration={duration + spaceDuration}
      data-pin-spacing="true"
      className={cn(styles.root, "relative motion-safe:lg:-mt-[50svh]", getSectionSurfaceClass(cleanColor), "!bg-transparent")}
      data-lifecycle-space={space ? "true" : undefined}
      style={{ "--lifecycle-scroll-length": COMPACT_SCROLL_SCREENS + 1 + (space ? 1.55 : 0), "--space-anchor-desktop": duration + 1.5, "--space-anchor-compact": COMPACT_SCROLL_SCREENS + 1 } as CSSProperties}
    >
      {space && <div id={stegaClean(space.anchor?.anchorId) || "our-clients"} data-space-anchor className={styles.spaceAnchor} aria-hidden="true" />}
      <div
        data-pin-target="true"
        className={cn(styles.viewport, "relative h-[100svh] overflow-x-clip overflow-y-visible lg:min-h-[680px] motion-reduce:!h-auto motion-reduce:min-h-0")}
      >
        <BackgroundPanel background={background} />

        <article
          data-lifecycle-slide="meme"
          className="relative z-10 overflow-visible motion-safe:absolute motion-safe:inset-0 motion-reduce:h-[100lvh]"
        >
          <div data-lifecycle-meme-surface className="pointer-events-none absolute inset-0 bg-background" aria-hidden="true" />
          <LifecycleMemeSwarm
            memes={memeSlide?.memes}
            bridgeImage={resolvedOrbitCenter}
            resetKey={memeResetKey}
          />
          <SlideCopy
            centerText="@PATHETIC STARTED AS AN INSTAGRAM PAGE DOCUMENTING CULTURE WITH MEMES"
            textStyle={displayTextStyle}
            linkInstagram
          />
        </article>

        <article
          ref={objectArticleRef}
          data-lifecycle-slide="object"
          className="pointer-events-none relative z-20 overflow-hidden motion-safe:invisible motion-safe:absolute motion-safe:inset-0 motion-safe:opacity-0 motion-reduce:h-[100lvh]"
        >
          <div
            data-lifecycle-fun-background
            className="pointer-events-none absolute inset-0 z-[15] opacity-0 will-change-[opacity]"
            style={{
              background:
                "radial-gradient(ellipse 62% 58% at 50% 50%, #2789ff 0%, #2030a8 28%, #10165e 48%, #030515 72%, #000 100%)",
            }}
            aria-hidden="true"
          />
          <div
            data-lifecycle-three-stage
            className="absolute inset-0 z-20 will-change-transform"
          >
            {fallbackImageUrl && !modelUrl && (
              <Image
                src={fallbackImageUrl}
                alt={objectSlide?.fallbackImage?.alt || ""}
                fill
                sizes="80vw"
                className="object-contain opacity-20 blur-[1px]"
              />
            )}
            <LifecycleThreeScene
              modelUrl={modelUrl}
              modelScale={objectSlide?.modelScale ?? 0.72}
              rotationSpeed={objectSlide?.rotationSpeed}
              boosted={boosted}
              entryProgress={glassesEntryRef}
              desktopDrop={DESKTOP_GLASSES_DROP}
              spaceTransition={space ? spaceTransitionRef : undefined}
              environmentRoot={rootRef}
            />
          </div>

          <SlideCopy
            centerText="TODAY, WE’RE A FULL STACK CREATIVE STUDIO"
            textStyle={displayTextStyle}
          />

          <button
            type="button"
            data-lifecycle-fun-button
            aria-pressed={boosted}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setBoosted(true);
            }}
            onBlur={() => setBoosted(false)}
            onPointerUp={() => setBoosted(false)}
            onPointerCancel={() => setBoosted(false)}
            onLostPointerCapture={() => setBoosted(false)}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                setBoosted(true);
              }
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") {
                setBoosted(false);
              }
            }}
            className={cn(styles.funButton, "pointer-events-auto absolute bottom-6 right-5 z-50 flex h-20 w-20 touch-none select-none items-center justify-center rounded-full bg-[#ff241a] px-3 text-center text-[10px] font-bold uppercase leading-[0.95] text-white hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 lg:bottom-8 lg:right-8 lg:h-28 lg:w-28 lg:text-xs")}
          >
            Fun Button
          </button>
        </article>

        {space && <div className={styles.spaceTakeover} data-space-takeover data-lifecycle-environment-preserve>
          <div className={styles.spaceRadial} data-space-radial aria-hidden="true" />
          <CredibilitySpaceSection {...space} transition={spaceTransitionRef} />
        </div>}

      </div>
    </section>
  );
}
