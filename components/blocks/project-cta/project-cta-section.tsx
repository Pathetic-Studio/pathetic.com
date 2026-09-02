"use client";

import { useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { stegaClean } from "next-sanity";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
import TitleText from "@/components/ui/title-text";
import { DISPLAY_OUTLINE_WIDTHS } from "@/components/ui/text-styles";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Physics2DPlugin);
}

export type ProjectCtaSectionBlock = {
  _type: "project-cta-section";
  _key: string;
  anchor?: { anchorId?: string | null } | null;
  title?: string | null;
  buttonLabel?: string | null;
  panelColor?: { hex?: string | null } | null;
  textColor?: { hex?: string | null } | null;
  outlineColor?: { hex?: string | null } | null;
  accentColor?: { hex?: string | null } | null;
  sparklesEnabled?: boolean | null;
  backgroundImage?: {
    alt?: string | null;
    asset?: { url?: string | null } | null;
  } | null;
};

const SPARKLE_COUNT = 20;
const CANNON_STAR_COUNT = 36;
const CANNON_STARS_PER_VOLLEY = 6;
const CANNON_VOLLEY_INTERVAL_MS = 260;
const CANNON_STAR_COLORS = ["#F22978", "#168CF2", "#40ED78"] as const;

function GreenStarSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 71 37"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
    >
      <path
        d="M35.5 0 42 13.1 71 13.5 47.8 21.7 57.3 37 35.5 27.7 13.7 37 23.2 21.7 0 13.5l29-0.4L35.5 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DefaultSky() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Image
        src="/images/project-cta/contact-sky.webp"
        alt=""
        fill
        sizes="100vw"
        className="z-0 object-cover object-center"
      />
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(88,174,244,.03),rgba(111,186,246,.1))]" />
      <div
        data-project-cta-rays
        className="absolute inset-0 z-[3] opacity-0 mix-blend-screen will-change-transform"
      >
        <div className="absolute left-1/2 top-1/2 h-[132%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,239,1)_0%,rgba(255,250,202,.72)_20%,rgba(255,255,255,.28)_43%,transparent_72%)] blur-[9px]" />
        <div className="absolute left-1/2 top-1/2 aspect-square w-[min(115vw,120rem)] -translate-x-1/2 -translate-y-1/2">
          <div
            data-project-cta-ray-wheel
            className="absolute inset-0 will-change-transform"
          >
            <div
              data-project-cta-ray
              className="absolute inset-0 rounded-full opacity-80 blur-[12px]"
              style={{
                background: "conic-gradient(from 4deg, transparent 0deg 5deg, rgba(255,252,214,.38) 11deg, transparent 22deg 38deg, rgba(255,255,235,.56) 47deg, transparent 58deg 82deg, rgba(255,247,194,.35) 91deg, transparent 103deg 128deg, rgba(255,255,240,.5) 139deg, transparent 151deg 181deg, rgba(255,248,205,.42) 191deg, transparent 204deg 228deg, rgba(255,255,238,.54) 239deg, transparent 251deg 280deg, rgba(255,246,192,.34) 290deg, transparent 302deg 330deg, rgba(255,255,236,.5) 340deg, transparent 352deg 360deg)",
                maskImage: "radial-gradient(circle, rgba(0,0,0,.98) 0%, rgba(0,0,0,.88) 38%, rgba(0,0,0,.28) 70%, transparent 88%)",
                WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,.98) 0%, rgba(0,0,0,.88) 38%, rgba(0,0,0,.28) 70%, transparent 88%)",
              }}
            />
            <div
              data-project-cta-ray
              className="absolute inset-[2%] rounded-full opacity-90 blur-[2px]"
              style={{
                background: "conic-gradient(from 1deg, transparent 0deg 8deg, rgba(255,255,231,.7) 10deg, transparent 14deg 42deg, rgba(255,250,207,.58) 45deg, transparent 50deg 87deg, rgba(255,255,238,.74) 89deg, transparent 94deg 134deg, rgba(255,249,202,.56) 137deg, transparent 142deg 186deg, rgba(255,255,238,.68) 189deg, transparent 194deg 233deg, rgba(255,249,206,.62) 236deg, transparent 241deg 284deg, rgba(255,255,239,.72) 287deg, transparent 292deg 335deg, rgba(255,249,205,.58) 338deg, transparent 343deg 360deg)",
                maskImage: "radial-gradient(circle, rgba(0,0,0,.96) 0%, rgba(0,0,0,.76) 45%, rgba(0,0,0,.18) 73%, transparent 90%)",
                WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,.96) 0%, rgba(0,0,0,.76) 45%, rgba(0,0,0,.18) 73%, transparent 90%)",
              }}
            />
          </div>
        </div>
      </div>
      <div
        data-project-cta-rainbow
        className="absolute inset-x-[8%] bottom-[-58%] z-[5] h-[152%] overflow-hidden opacity-0 [contain:paint] [will-change:clip-path,opacity]"
      >
        <Image
          src="/images/project-cta/rainbow-arch.webp"
          alt=""
          fill
          sizes="84vw"
          loading="eager"
          unoptimized
          className="object-fill"
        />
      </div>
    </div>
  );
}

export default function ProjectCtaSection(props: ProjectCtaSectionBlock) {
  const rootRef = useRef<HTMLElement | null>(null);
  const hoverTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const cannonIntervalRef = useRef<number | null>(null);
  const cannonIndexRef = useRef(0);
  const cannonPointerRef = useRef({ x: 0.5, y: 0.5 });
  const raySpinTweenRef = useRef<gsap.core.Tween | null>(null);
  const dvdTweenRefs = useRef<Array<gsap.core.Animation>>([]);
  const resumeDvdRef = useRef<(() => void) | null>(null);
  const hoverActiveRef = useRef(false);
  const hoverEffectsActiveRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const canHoverRef = useRef(false);
  const sparkleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const sparkleIndexRef = useRef(0);
  const lastSparkleRef = useRef({ x: -100, y: -100, time: 0 });

  const title = stegaClean(props.title) || "WORK WITH US";
  const authoredButtonLabel = stegaClean(props.buttonLabel);
  const buttonLabel =
    !authoredButtonLabel || authoredButtonLabel === "START A PROJECT"
      ? "Incredible Fortune Ahead Button"
      : authoredButtonLabel;
  const panelColor = stegaClean(props.panelColor?.hex) || "#93A7FF";
  const textColor = stegaClean(props.textColor?.hex) || "#FFFFFF";
  const outlineColor = stegaClean(props.outlineColor?.hex) || "#050505";
  const backgroundImage = props.backgroundImage?.asset?.url || null;
  const sparklesEnabled = stegaClean(props.sparklesEnabled) !== false;
  const sectionId = stegaClean(props.anchor?.anchorId) || "work-with-us";

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const rainbow = root.querySelector<HTMLElement>("[data-project-cta-rainbow]");
      const rays = root.querySelector<HTMLElement>("[data-project-cta-rays]");
      const rayWheel = root.querySelector<HTMLElement>("[data-project-cta-ray-wheel]");
      const motionSurface = root.querySelector<HTMLElement>("[data-project-cta-motion-surface]");
      const dvdTitle = root.querySelector<HTMLElement>("[data-project-cta-dvd-title]");
      const button = root.querySelector<HTMLElement>("[data-project-cta-button]");
      reduceMotionRef.current = reduceMotion;
      canHoverRef.current = canHover;

      if (rainbow) {
        gsap.set(rainbow, {
          opacity: 0,
          clipPath: "inset(0% 50% 0% 50%)",
        });
      }
      if (rays) {
        gsap.set(rays, {
          opacity: 0,
        });
      }
      if (rayWheel) gsap.set(rayWheel, { rotation: -8, transformOrigin: "50% 50%" });
      if (button) {
        gsap.set(button, {
          scale: canHover ? 0 : 1,
          visibility: "visible",
          transformOrigin: "50% 50%",
        });
      }

      const stopDvd = () => {
        dvdTweenRefs.current.forEach((tween) => tween.kill());
        dvdTweenRefs.current = [];
      };

      const layoutDvd = (preservePosition = false) => {
        if (!motionSurface || !dvdTitle) return;
        const previousX = Number(gsap.getProperty(dvdTitle, "x")) || 0;
        const previousY = Number(gsap.getProperty(dvdTitle, "y")) || 0;
        stopDvd();
        const titleBounds = dvdTitle.getBoundingClientRect();
        const titleVisual =
          dvdTitle.querySelector<HTMLElement>("h2 > span") ?? dvdTitle;
        const visualBounds = titleVisual.getBoundingClientRect();
        const visualLeft = visualBounds.left - titleBounds.left;
        const visualTop = visualBounds.top - titleBounds.top;
        const visualRight = visualBounds.right - titleBounds.left;
        const visualBottom = visualBounds.bottom - titleBounds.top;
        const minX = -visualLeft;
        const maxX = Math.max(minX, motionSurface.clientWidth - visualRight);
        const minY = -visualTop;
        const maxY = Math.max(minY, motionSurface.clientHeight - visualBottom);
        const currentX = preservePosition
          ? gsap.utils.clamp(minX, maxX, previousX)
          : minX;
        const currentY = preservePosition
          ? gsap.utils.clamp(minY, maxY, previousY)
          : minY;
        gsap.set(dvdTitle, { x: currentX, y: currentY });

        if (reduceMotion) {
          gsap.set(dvdTitle, {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
          });
          return;
        }

        if (maxX - minX > 1) {
          const targetX = currentX >= (minX + maxX) / 2 ? minX : maxX;
          const oppositeX = targetX === maxX ? minX : maxX;
          const xTimeline = gsap.timeline();
          xTimeline
            .to(dvdTitle, {
              x: targetX,
              duration: Math.max(0.2, Math.abs(targetX - currentX) / 75),
              ease: "none",
            })
            .to(dvdTitle, {
              x: oppositeX,
              duration: Math.max(4.6, (maxX - minX) / 75),
              repeat: -1,
              yoyo: true,
              ease: "none",
            });
          dvdTweenRefs.current.push(xTimeline);
        }
        if (maxY - minY > 1) {
          const targetY = currentY >= (minY + maxY) / 2 ? minY : maxY;
          const oppositeY = targetY === maxY ? minY : maxY;
          const yTimeline = gsap.timeline();
          yTimeline
            .to(dvdTitle, {
              y: targetY,
              duration: Math.max(0.2, Math.abs(targetY - currentY) / 58),
              ease: "none",
            })
            .to(dvdTitle, {
              y: oppositeY,
              duration: Math.max(3.7, (maxY - minY) / 58),
              repeat: -1,
              yoyo: true,
              ease: "none",
            });
          dvdTweenRefs.current.push(yTimeline);
        }
      };

      layoutDvd();
      resumeDvdRef.current = () => layoutDvd(true);
      let resizeFrame = 0;
      const relayoutDvd = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          if (!motionSurface || !dvdTitle) return;
          if (hoverActiveRef.current) {
            stopDvd();
            const titleVisual =
              dvdTitle.querySelector<HTMLElement>("h2 > span") ?? dvdTitle;
            const visualBounds = titleVisual.getBoundingClientRect();
            gsap.set(dvdTitle, {
              x:
                (Number(gsap.getProperty(dvdTitle, "x")) || 0) +
                motionSurface.getBoundingClientRect().left +
                motionSurface.clientWidth / 2 -
                (visualBounds.left + visualBounds.width / 2),
              y:
                (Number(gsap.getProperty(dvdTitle, "y")) || 0) +
                motionSurface.getBoundingClientRect().top +
                motionSurface.clientHeight / 2 -
                (visualBounds.top + visualBounds.height / 2),
            });
            return;
          }
          layoutDvd(true);
        });
      };
      const resizeObserver = new ResizeObserver(relayoutDvd);
      if (motionSurface) resizeObserver.observe(motionSurface);
      if (dvdTitle) resizeObserver.observe(dvdTitle);
      window.addEventListener("resize", relayoutDvd);

      return () => {
        cancelAnimationFrame(resizeFrame);
        resizeObserver.disconnect();
        window.removeEventListener("resize", relayoutDvd);
        resumeDvdRef.current = null;
        stopDvd();
      };
    }, root);

    return () => {
      hoverTimelineRef.current?.kill();
      if (cannonIntervalRef.current != null) {
        window.clearInterval(cannonIntervalRef.current);
        cannonIntervalRef.current = null;
      }
      raySpinTweenRef.current?.kill();
      dvdTweenRefs.current.forEach((tween) => tween.kill());
      dvdTweenRefs.current = [];
      context.revert();
    };
  }, []);

  const fireCannonVolley = () => {
    const root = rootRef.current;
    if (!root) return;
    const panel = root.querySelector<HTMLElement>("[data-project-cta-panel]");
    if (!panel) return;

    const panelWidth = panel.clientWidth;
    const panelHeight = panel.clientHeight;
    const targetX = cannonPointerRef.current.x * panelWidth;
    const targetY = cannonPointerRef.current.y * panelHeight;
    const volleyIndex = cannonIndexRef.current;
    cannonIndexRef.current += CANNON_STARS_PER_VOLLEY;

    (["left", "right"] as const).forEach((side) => {
      const originX = panelWidth * (side === "left" ? 0.035 : 0.965);
      const originY = panelHeight * 0.5;
      const deltaX = targetX - originX;
      const deltaY = targetY - originY;
      const aimedAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      const aimedVelocity = gsap.utils.clamp(
        250,
        430,
        Math.hypot(deltaX, deltaY) * 0.72,
      );
      const stars = gsap.utils.toArray<HTMLElement>(
        `[data-project-cta-cannon-star="${side}"]`,
        root,
      );
      if (!stars.length) return;

      Array.from({ length: CANNON_STARS_PER_VOLLEY }, (_, offset) => {
        const star = stars[(volleyIndex + offset) % stars.length];
        const velocity = aimedVelocity * gsap.utils.random(0.82, 1.08);
        const angle = aimedAngle + gsap.utils.random(-13, 13);
        const duration = gsap.utils.random(1.22, 1.48);

        gsap.killTweensOf(star);
        gsap
          .timeline()
          .set(star, {
            x: 0,
            y: gsap.utils.random(-22, 22),
            autoAlpha: 1,
            scale: gsap.utils.random(0.28, 0.52),
            rotation: gsap.utils.random(-70, 70),
          })
          .to(star, {
            physics2D: {
              velocity,
              angle,
              gravity: gsap.utils.random(350, 440),
              friction: gsap.utils.random(0.005, 0.018),
            },
            scale: gsap.utils.random(0.8, 1.22),
            rotation: `${gsap.utils.random(0, 1) > 0.5 ? "+" : "-"}=${gsap.utils.random(210, 430)}`,
            duration,
            ease: "none",
          }, 0)
          .to(star, {
            autoAlpha: 0,
            duration: 0.24,
            ease: "power1.in",
          }, duration - 0.24);
      });
    });
  };

  const setProjectHoverEffects = (active: boolean) => {
    const root = rootRef.current;
    if (!root) return;

    const rainbow = root.querySelector<HTMLElement>("[data-project-cta-rainbow]");
    const rays = root.querySelector<HTMLElement>("[data-project-cta-rays]");
    const rayWheel = root.querySelector<HTMLElement>("[data-project-cta-ray-wheel]");
    const button = root.querySelector<HTMLElement>("[data-project-cta-button]");
    if (!rainbow || !rays || !rayWheel || !button) return;

    hoverEffectsActiveRef.current = active;
    hoverTimelineRef.current?.kill();
    raySpinTweenRef.current?.kill();
    gsap.killTweensOf([rainbow, rays, rayWheel, button]);

    if (canHoverRef.current) {
      if (active) {
        gsap.fromTo(
          button,
          { scale: 0 },
          {
            scale: 1,
            duration: 0.34,
            ease: "back.out(1.75)",
            overwrite: "auto",
          },
        );
      } else {
        gsap.to(button, {
          scale: 0,
          duration: 0.2,
          ease: "power2.in",
          overwrite: "auto",
        });
      }
    }

    if (reduceMotionRef.current) {
      gsap.set(rainbow, {
        opacity: active ? 1 : 0,
        clipPath: active ? "inset(0% 0% 0% 0%)" : "inset(0% 50% 0% 50%)",
      });
      gsap.set(rays, { opacity: active ? 1 : 0 });
      return;
    }

    const timeline = gsap.timeline();
    hoverTimelineRef.current = timeline;

    if (active) {
      if (cannonIntervalRef.current == null) {
        fireCannonVolley();
        cannonIntervalRef.current = window.setInterval(
          fireCannonVolley,
          CANNON_VOLLEY_INTERVAL_MS,
        );
      }

      raySpinTweenRef.current = gsap.to(rayWheel, {
        rotation: "+=360",
        duration: 34,
        repeat: -1,
        ease: "none",
      });
      timeline
        .to(
          rainbow,
          {
            opacity: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.68,
            ease: "power3.inOut",
          },
          0,
        )
        .to(
          rays,
          { opacity: 1, duration: 0.42, ease: "power2.out" },
          0.06,
        );
      return;
    }

    if (cannonIntervalRef.current != null) {
      window.clearInterval(cannonIntervalRef.current);
      cannonIntervalRef.current = null;
    }
    cannonPointerRef.current = { x: 0.5, y: 0.5 };

    timeline
      .to(rays, { opacity: 0, duration: 0.24, ease: "power2.in" }, 0)
      .to(
        rainbow,
        {
          opacity: 0,
          clipPath: "inset(0% 50% 0% 50%)",
          duration: 0.38,
          ease: "power3.inOut",
        },
        0.02,
      );
  };

  const setProjectHover = (active: boolean) => {
    const root = rootRef.current;
    if (!root) return;
    const panel = root.querySelector<HTMLElement>("[data-project-cta-motion-surface]");
    const dvdTitle = root.querySelector<HTMLElement>("[data-project-cta-dvd-title]");
    if (!panel || !dvdTitle) return;

    hoverActiveRef.current = active;
    gsap.killTweensOf(dvdTitle);

    if (!active) {
      setProjectHoverEffects(false);
      resumeDvdRef.current?.();
      return;
    }

    dvdTweenRefs.current.forEach((animation) => animation.kill());
    dvdTweenRefs.current = [];
    const panelBounds = panel.getBoundingClientRect();
    const titleBounds = dvdTitle.getBoundingClientRect();
    const currentX = Number(gsap.getProperty(dvdTitle, "x")) || 0;
    const currentY = Number(gsap.getProperty(dvdTitle, "y")) || 0;
    const centeredX =
      currentX + panelBounds.left + panelBounds.width / 2 -
      (titleBounds.left + titleBounds.width / 2);
    const centeredY =
      currentY + panelBounds.top + panelBounds.height / 2 -
      (titleBounds.top + titleBounds.height / 2);

    gsap.to(dvdTitle, {
      x: centeredX,
      y: centeredY,
      duration: reduceMotionRef.current ? 0 : 0.42,
      ease: "power3.inOut",
      overwrite: "auto",
      onComplete: () => {
        if (hoverActiveRef.current) setProjectHoverEffects(true);
      },
    });
  };

  const moveProjectCannons = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch" || reduceMotionRef.current) return;
    const root = rootRef.current;
    if (!root) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    cannonPointerRef.current = {
      x: gsap.utils.clamp(0, 1, (event.clientX - bounds.left) / bounds.width),
      y: gsap.utils.clamp(0, 1, (event.clientY - bounds.top) / bounds.height),
    };
  };

  const emitSparkle = (event: ReactPointerEvent<HTMLElement>) => {
    if (
      !sparklesEnabled ||
      event.pointerType === "touch" ||
      !hoverEffectsActiveRef.current
    ) return;
    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const now = performance.now();
    const previous = lastSparkleRef.current;
    const distance = Math.hypot(x - previous.x, y - previous.y);
    if (distance < 13 && now - previous.time < 38) return;

    lastSparkleRef.current = { x, y, time: now };
    const index = sparkleIndexRef.current % SPARKLE_COUNT;
    sparkleIndexRef.current += 1;
    const sparkle = sparkleRefs.current[index];
    if (!sparkle) return;

    gsap.killTweensOf(sparkle);
    gsap.fromTo(
      sparkle,
      {
        x: x - 9,
        y: y - 9,
        autoAlpha: 1,
        scale: 0.2,
        rotation: Math.random() * 80 - 40,
      },
      {
        x: x - 9 + (Math.random() - 0.5) * 42,
        y: y - 28 - Math.random() * 34,
        autoAlpha: 0,
        scale: 1.15 + Math.random() * 0.75,
        rotation: Math.random() * 220 - 110,
        duration: 0.62 + Math.random() * 0.32,
        ease: "power2.out",
      },
    );
  };

  return (
    <section
      ref={rootRef}
      id={sectionId}
      className="relative isolate bg-background p-3 sm:p-4 lg:p-6"
    >
      <div
        data-project-cta-panel
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setProjectHover(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "touch") setProjectHover(false);
        }}
        onPointerMove={(event) => {
          emitSparkle(event);
          moveProjectCannons(event);
        }}
        className="relative min-h-[clamp(14rem,24vw,20rem)] overflow-hidden border border-current"
        style={{ backgroundColor: panelColor, borderColor: outlineColor }}
      >
        <DefaultSky />
        {backgroundImage && (
          <Image
            src={backgroundImage}
            alt={stegaClean(props.backgroundImage?.alt) || ""}
            fill
            sizes="100vw"
            className="z-[1] object-cover"
          />
        )}

        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden="true">
          {Array.from({ length: SPARKLE_COUNT }, (_, index) => (
            <span
              key={index}
              ref={(node) => { sparkleRefs.current[index] = node; }}
              className="absolute left-0 top-0 aspect-[71/37] w-[clamp(1.5rem,2.8vw,2.8rem)] text-[#D8FF56] opacity-0 will-change-transform"
            >
              <GreenStarSvg className="h-full w-full" />
            </span>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 z-[35] overflow-hidden" aria-hidden="true">
          {(["left", "right"] as const).map((side) => (
            <span
              key={side}
              data-project-cta-cannon-origin={side}
              className={`absolute top-1/2 h-px w-px will-change-transform ${
                side === "left" ? "left-[3.5%]" : "right-[3.5%]"
              }`}
            >
              {Array.from({ length: CANNON_STAR_COUNT }, (_, index) => (
                <span
                  key={`${side}-${index}`}
                  data-project-cta-cannon-star={side}
                  className="absolute left-0 top-0 w-[clamp(1.35rem,2.35vw,2.65rem)] opacity-0 will-change-transform"
                  style={{ color: CANNON_STAR_COLORS[index % CANNON_STAR_COLORS.length] }}
                >
                  <GreenStarSvg className="h-auto w-full" />
                </span>
              ))}
            </span>
          ))}
        </div>

        <div
          data-project-cta-motion-surface
          className="relative z-20 min-h-[clamp(14rem,24vw,20rem)] w-full"
        >
          <span
            data-project-cta-dvd-title
            className="pointer-events-none absolute left-0 top-0 block w-fit will-change-transform"
          >
            <TitleText
              as="h2"
              variant="stretched"
              size="contact-cta"
              maxChars={30}
              singleLine
              fontWeight="bold"
              textColor={textColor}
              textOutline
              outlineColor={outlineColor}
              outlineWidth={DISPLAY_OUTLINE_WIDTHS.monumental}
              outlinePosition="outside"
              animation="none"
              className="!w-max [&_h2]:leading-[.78] [&_h2]:tracking-[-.055em]"
            >
              {title}
            </TitleText>
          </span>
          <span className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 translate-y-[clamp(3.75rem,5.3vw,4.75rem)]">
            <ContactFormTrigger
              data-project-cta-button
              onFocus={() => setProjectHover(true)}
              onBlur={() => setProjectHover(false)}
              className="inline-flex h-10 items-center justify-center border border-current bg-background px-6 font-sans text-sm font-semibold uppercase leading-none text-foreground will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {buttonLabel}
            </ContactFormTrigger>
          </span>
        </div>
      </div>
    </section>
  );
}
