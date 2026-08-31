"use client";

import { useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { stegaClean } from "next-sanity";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
import TitleText from "@/components/ui/title-text";

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
const CTA_STAR_COLOR = "#D8FF56";
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

function CtaStar({
  delay = "0s",
}: {
  delay?: string;
}) {
  return (
    <span
      data-project-cta-reveal
      aria-hidden="true"
      className="block [perspective:700px]"
    >
      <span
        data-header-feature-image-rotator
        className="block text-[#D8FF56] [transform-style:preserve-3d]"
        style={{ animationDelay: delay, color: CTA_STAR_COLOR }}
      >
        <GreenStarSvg className="block aspect-[71/37] w-[clamp(5rem,10vw,9rem)] drop-shadow-[0_2px_0_rgba(0,0,0,.14)]" />
      </span>
    </span>
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
  const cannonPointerRef = useRef({ x: 0, y: 0 });
  const raySpinTweenRef = useRef<gsap.core.Tween | null>(null);
  const reduceMotionRef = useRef(false);
  const sparkleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const sparkleIndexRef = useRef(0);
  const lastSparkleRef = useRef({ x: -100, y: -100, time: 0 });

  const title = stegaClean(props.title) || "WORK WITH US";
  const buttonLabel = stegaClean(props.buttonLabel) || "START A PROJECT";
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
      const reveal = gsap.utils.toArray<HTMLElement>("[data-project-cta-reveal]", root);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const rainbow = root.querySelector<HTMLElement>("[data-project-cta-rainbow]");
      const rays = root.querySelector<HTMLElement>("[data-project-cta-rays]");
      const rayWheel = root.querySelector<HTMLElement>("[data-project-cta-ray-wheel]");
      reduceMotionRef.current = reduceMotion;

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

      if (reduceMotion) {
        gsap.set(reveal, { clearProps: "opacity,transform" });
        return;
      }

      gsap.fromTo(
        reveal,
        { autoAlpha: 0, scale: 0.72, rotation: (index) => (index % 2 ? 20 : -20) },
        {
          autoAlpha: 1,
          scale: 1,
          rotation: 0,
          duration: 0.8,
          stagger: 0.09,
          ease: "back.out(1.7)",
          scrollTrigger: { trigger: root, start: "top 76%", once: true },
        },
      );
    }, root);

    return () => {
      hoverTimelineRef.current?.kill();
      if (cannonIntervalRef.current != null) {
        window.clearInterval(cannonIntervalRef.current);
        cannonIntervalRef.current = null;
      }
      raySpinTweenRef.current?.kill();
      context.revert();
    };
  }, []);

  const fireCannonVolley = () => {
    const root = rootRef.current;
    if (!root) return;
    const panel = root.querySelector<HTMLElement>("[data-project-cta-panel]");
    if (!panel) return;

    const panelWidth = panel.clientWidth;
    const horizontalSpeed = gsap.utils.clamp(245, 390, panelWidth * 0.3);
    const pointerBias = cannonPointerRef.current.x * panelWidth * 0.15;
    const verticalBias = cannonPointerRef.current.y * 38;
    const volleyIndex = cannonIndexRef.current;
    cannonIndexRef.current += CANNON_STARS_PER_VOLLEY;

    (["left", "right"] as const).forEach((side) => {
      const direction = side === "left" ? 1 : -1;
      const stars = gsap.utils.toArray<HTMLElement>(
        `[data-project-cta-cannon-star="${side}"]`,
        root,
      );
      if (!stars.length) return;

      Array.from({ length: CANNON_STARS_PER_VOLLEY }, (_, offset) => {
        const star = stars[(volleyIndex + offset) % stars.length];
        const velocityX =
          direction * horizontalSpeed * gsap.utils.random(0.82, 1.08) +
          pointerBias;
        const velocityY = -gsap.utils.random(215, 305) + verticalBias;
        const velocity = Math.hypot(velocityX, velocityY);
        const angle = Math.atan2(velocityY, velocityX) * (180 / Math.PI);
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

  const setProjectHover = (active: boolean) => {
    const root = rootRef.current;
    if (!root) return;

    const rainbow = root.querySelector<HTMLElement>("[data-project-cta-rainbow]");
    const rays = root.querySelector<HTMLElement>("[data-project-cta-rays]");
    const rayWheel = root.querySelector<HTMLElement>("[data-project-cta-ray-wheel]");
    if (!rainbow || !rays || !rayWheel) return;

    const cannonStars = gsap.utils.toArray<HTMLElement>(
      "[data-project-cta-cannon-star]",
      root,
    );
    const cannonOrigins = gsap.utils.toArray<HTMLElement>(
      "[data-project-cta-cannon-origin]",
      root,
    );

    hoverTimelineRef.current?.kill();
    raySpinTweenRef.current?.kill();
    gsap.killTweensOf([rainbow, rays, rayWheel, ...cannonStars]);

    if (reduceMotionRef.current) {
      gsap.set(rainbow, {
        opacity: active ? 1 : 0,
        clipPath: active ? "inset(0% 0% 0% 0%)" : "inset(0% 50% 0% 50%)",
      });
      gsap.set(rays, { opacity: active ? 1 : 0 });
      gsap.set(cannonStars, { autoAlpha: 0 });
      gsap.set(cannonOrigins, { x: 0, y: 0, rotation: 0 });
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
    cannonPointerRef.current = { x: 0, y: 0 };

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
    gsap.to(cannonStars, {
      autoAlpha: 0,
      duration: 0.14,
      ease: "power2.out",
      overwrite: true,
    });
    gsap.to(cannonOrigins, {
      x: 0,
      y: 0,
      rotation: 0,
      duration: 0.24,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const moveProjectCannons = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "touch" || reduceMotionRef.current) return;
    const root = rootRef.current;
    if (!root) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = Math.max(
      -1,
      Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2),
    );
    const normalizedY = Math.max(
      -1,
      Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2),
    );
    const origins = gsap.utils.toArray<HTMLElement>(
      "[data-project-cta-cannon-origin]",
      root,
    );
    cannonPointerRef.current = { x: normalizedX, y: normalizedY };

    origins.forEach((origin) => {
      gsap.to(origin, {
        x: normalizedX * 28,
        y: normalizedY * 34,
        rotation: normalizedX * 6 + normalizedY * 2.5,
        duration: 0.28,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  };

  const emitSparkle = (event: ReactPointerEvent<HTMLElement>) => {
    if (!sparklesEnabled || event.pointerType === "touch") return;
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
      onPointerMove={emitSparkle}
      className="relative isolate bg-background p-3 sm:p-4 lg:p-6"
    >
      <div
        data-project-cta-panel
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

        <div className="relative z-20 flex min-h-[clamp(14rem,24vw,20rem)] w-full items-center justify-center px-[clamp(3.5rem,14vw,13rem)] py-8">
          <span className="pointer-events-none absolute left-[3.5%] top-1/2 -translate-y-1/2">
            <CtaStar />
          </span>
          <span className="pointer-events-none absolute right-[3.5%] top-1/2 -translate-y-1/2">
            <CtaStar delay="-9s" />
          </span>

          <span className="relative flex w-full flex-col items-center gap-4">
            <span data-typeon-trigger="true" className="block w-full">
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
                outlineWidth={1.5}
                outlinePosition="outside"
                animation="typeOn"
                animationSpeed={2.4}
                typeOnStart="top 76%"
                typeOnDelay={0.04}
                className="[&_h2]:leading-[.78] [&_h2]:tracking-[-.055em]"
              >
                {title}
              </TitleText>
            </span>
            <ContactFormTrigger
              data-project-cta-reveal
              onPointerEnter={() => setProjectHover(true)}
              onPointerLeave={() => setProjectHover(false)}
              onPointerMove={moveProjectCannons}
              onFocus={() => setProjectHover(true)}
              onBlur={() => setProjectHover(false)}
              className="relative z-40 inline-flex h-10 items-center justify-center border border-current bg-background px-6 font-sans text-sm font-semibold uppercase leading-none text-foreground transition-transform duration-200 hover:scale-110 focus-visible:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {buttonLabel}
            </ContactFormTrigger>
          </span>
        </div>
      </div>
    </section>
  );
}
