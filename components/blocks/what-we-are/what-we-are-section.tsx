"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import gsap from "gsap";
import { BackgroundPanel } from "@/components/ui/background-panel";
import styles from "./what-we-are.module.css";
import TitleText from "@/components/ui/title-text";
import { ROLES, wardrobeAsset, type OutfitPiece } from "./wardrobe-data";
import { useHatWardrobe } from "./use-hat-wardrobe";

export type WhatWeAreSectionBlock = {
  _type: "what-we-are-section";
  _key: string;
};

const ASSETS = "/images/belief/what-we-are";

export default function WhatWeAre() {
  const id = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [selected, setSelected] = useState(0);
  const figureRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<() => void>(() => {});
  const motionRef = useRef<{
    turn: (x: number, y: number) => void;
    settle: () => void;
    stop: () => void;
  } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    rotation: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const wardrobe = useHatWardrobe(
    sectionRef,
    () => {
      motionRef.current?.stop();
      if (figureRef.current)
        gsap.set(figureRef.current, { rotationX: 0, rotationY: 0 });
    },
    mobile ? ROLES[selected].id : null,
  );
  const { active, worn, locked } = wardrobe;

  useEffect(() => {
    const query = matchMedia("(max-width: 900px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const selectSlide = (index: number) => {
    const rail = carouselRef.current;
    const card = rail?.children[index] as HTMLElement | undefined;
    if (!rail || !card) return;
    rail.scrollTo({
      left: card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  useEffect(() => {
    const section = sectionRef.current;
    const figure = figureRef.current;
    if (!section || !figure) return;

    let turnTween: gsap.core.Tween | null = null;
    const media = gsap.matchMedia();
    const observer = new IntersectionObserver(
      ([entry]) => {
        section.dataset.inView = String(entry.isIntersecting);
        if (!entry.isIntersecting) {
          motionRef.current?.stop();
          gsap.set(figure, { rotationX: 0, rotationY: 0 });
        }
      },
      { threshold: 0 },
    );
    observer.observe(section);

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const turnX = gsap.quickTo(figure, "rotationX", {
        duration: 0.65,
        ease: "power3.out",
      });
      const turnY = gsap.quickTo(figure, "rotationY", {
        duration: 0.65,
        ease: "power3.out",
      });
      let spinning = false;

      motionRef.current = {
        turn: (x, y) => {
          if (spinning) return;
          const currentY = Number(gsap.getProperty(figure, "rotationY"));
          // After a full drag turn, hover should take the short path to its
          // small tilt instead of unwinding an entire revolution.
          const nextY = dragRef.current
            ? y
            : y + Math.round((currentY - y) / 360) * 360;
          turnX(x, Number(gsap.getProperty(figure, "rotationX")));
          turnY(nextY, currentY);
        },
        settle: () => {
          if (spinning) return;
          const currentY = Number(gsap.getProperty(figure, "rotationY"));
          turnX(0, Number(gsap.getProperty(figure, "rotationX")));
          turnY(Math.round(currentY / 360) * 360, currentY);
        },
        stop: () => {
          turnTween?.kill();
          turnX.tween.pause();
          turnY.tween.pause();
          spinning = false;
        },
      };

      spinRef.current = () => {
        motionRef.current?.stop();
        spinning = true;
        const current = Number(gsap.getProperty(figure, "rotationY"));
        turnTween = gsap.to(figure, {
          rotationX: 0,
          rotationY: Math.floor(current / 360) * 360 + 360,
          duration: 1.6,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.set(figure, { rotationY: 0 });
            spinning = false;
          },
        });
      };

      return () => {
        motionRef.current?.stop();
        motionRef.current = null;
        spinRef.current = () => {};
        gsap.set(figure, { rotationX: 0, rotationY: 0 });
      };
    });

    return () => {
      observer.disconnect();
      turnTween?.kill();
      media.revert();
    };
  }, []);

  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !motionRef.current) return;
    motionRef.current.stop();
    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rotation: Number(gsap.getProperty(figureRef.current, "rotationY")),
      moved: false,
    };
  };

  const moveFigure = (event: PointerEvent<HTMLButtonElement>) => {
    const motion = motionRef.current;
    if (!motion) return;
    const drag = dragRef.current;
    if (drag && drag.pointerId === event.pointerId) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        drag.moved = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (drag.moved) {
        motion.turn(
          Math.max(-12, Math.min(12, -dy * 0.06)),
          drag.rotation + dx * 0.6,
        );
      }
      return;
    }
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    motion.turn(
      (0.5 - (event.clientY - bounds.top) / bounds.height) * 14,
      ((event.clientX - bounds.left) / bounds.width - 0.5) * 24,
    );
  };

  const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    suppressClickRef.current = drag.moved;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    motionRef.current?.settle();
  };

  return (
    <section
      ref={sectionRef}
      id="what-we-are"
      className={styles.section}
      aria-labelledby={`${id}-title`}
      data-in-view="false"
      data-wardrobe-active={active || undefined}
      data-wardrobe-locked={locked || undefined}
      data-hat-dragging={wardrobe.dragging || undefined}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        wardrobe.clear();
        motionRef.current?.stop();
        motionRef.current?.settle();
      }}
    >
      <BackgroundPanel
        background={{
          enabled: true,
          layout: "inset",
          border: true,
          style: "solid",
          color: "#f7e7cb",
        }}
        className={`${styles.paperPanel} !inset-2.5 sm:!inset-4 lg:!inset-6`}
      />
      <div className={styles.layout}>
        <div className={styles.title}>
          <div id={`${id}-title`} data-hat-title>
            <TitleText
              as="h2"
              variant="stretched"
              size="belief"
              maxChars={0}
              singleLine
              className="!w-full [&_h2]:whitespace-nowrap [&_h2]:leading-[1.02] [&_h2]:tracking-[-.01em] sm:[&_h2]:leading-[.76]"
            >
              WHAT WE ARE
            </TitleText>
          </div>
          {ROLES.map((role) => (
            <span
              key={role.id}
              className={styles.hatDock}
              data-hat-dock={role.id}
              style={{ aspectRatio: `${role.hatWidth} / ${role.hatHeight}` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className={styles.stage}>
          {ROLES.map((role) => (
            <div
              key={role.id}
              className={styles.corner}
              data-role={role.id}
              data-active={active === role.id}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") wardrobe.setPreview(role.id);
              }}
              onPointerLeave={() => wardrobe.setPreview(null)}
            >
              <button
                type="button"
                id={`${id}-${role.id}-label`}
                className={styles.label}
                data-hat-obstacle
                aria-expanded={active === role.id}
                aria-controls={`${id}-${role.id}-copy`}
                onFocus={(event) => {
                  if (event.currentTarget.matches(":focus-visible"))
                    wardrobe.setFocused(role.id);
                }}
                onBlur={() => wardrobe.setFocused(null)}
                onClick={() => wardrobe.toggle(role.id)}
              >
                {role.label}
              </button>
              <p
                className={styles.copy}
                id={`${id}-${role.id}-copy`}
                aria-hidden={active !== role.id}
              >
                {role.copy}
              </p>
            </div>
          ))}
          <div className={styles.figureButton}>
            <div className={styles.float}>
              <div ref={figureRef} className={styles.figure} data-hat-figure>
                <button
                  type="button"
                  className={styles.spinSurface}
                  aria-label="Spin the Vitruvian figure"
                  aria-describedby={`${id}-instructions`}
                  onPointerDown={startDrag}
                  onPointerMove={moveFigure}
                  onPointerUp={finishDrag}
                  onPointerCancel={finishDrag}
                  onLostPointerCapture={finishDrag}
                  onPointerLeave={() => {
                    if (!dragRef.current?.moved) {
                      dragRef.current = null;
                      motionRef.current?.settle();
                    }
                  }}
                  onClick={(event) => {
                    if (suppressClickRef.current && event.detail !== 0) {
                      suppressClickRef.current = false;
                      return;
                    }
                    spinRef.current();
                  }}
                />
                <Image
                  src={`${ASSETS}/vitruvian-man.png`}
                  loading="eager"
                  alt=""
                  width={1000}
                  height={1000}
                  sizes="(max-width: 575px) 94vw, (max-width: 900px) 540px, (max-width: 1440px) 45vw, 646px"
                  className={styles.drawing}
                  draggable={false}
                />
                <span
                  data-hat-dropzone
                  className={styles.headDropzone}
                  aria-hidden="true"
                />
                {ROLES.map((role) => (
                  <div
                    key={role.id}
                    data-outfit={role.id}
                    className={styles.outfit}
                    aria-hidden="true"
                  >
                    {(role.outfit as readonly OutfitPiece[]).map((piece) => (
                      <span
                        key={piece.asset}
                        className={styles.clothingSlot}
                        style={{
                          left: `${piece.left}%`,
                          top: `${piece.top}%`,
                          width: `${piece.width}%`,
                          transform: `rotate(${piece.angle || 0}deg)`,
                        }}
                      >
                        <span
                          className={styles.clothingPiece}
                          data-outfit-piece
                        >
                          {/* Each garment keeps its original photographed proportions. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={wardrobeAsset(piece.asset)}
                            alt=""
                            loading="eager"
                            decoding="async"
                            draggable={false}
                          />
                        </span>
                      </span>
                    ))}
                  </div>
                ))}
                {ROLES.map((role) => (
                  <div
                    key={role.id}
                    data-hat-head={role.id}
                    className={styles.headHatSlot}
                    style={{
                      left: `${role.head.left}%`,
                      top: `${role.head.top}%`,
                      width: `${role.head.width}%`,
                      aspectRatio: `${role.hatWidth} / ${role.hatHeight}`,
                    }}
                  >
                    <button
                      type="button"
                      className={styles.wornHat}
                      data-hat-worn={role.id}
                      data-visible={worn === role.id}
                      aria-label={`Remove ${role.hatName.toLowerCase()} and outfit`}
                      aria-pressed={locked === role.id}
                      tabIndex={!mobile && worn === role.id ? 0 : -1}
                      aria-hidden={mobile || worn !== role.id}
                      {...wardrobe.bindings(role.id, true)}
                    >
                      <Image
                        src={wardrobeAsset(role.hat)}
                        alt=""
                        width={role.hatWidth}
                        height={role.hatHeight}
                        loading="eager"
                        draggable={false}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div
            className={styles.mobileWardrobe}
            role="region"
            aria-label="What we are outfits"
            aria-roledescription="carousel"
          >
            <div
              ref={carouselRef}
              className={styles.outfitRail}
              data-outfit-rail
              tabIndex={0}
              aria-label="Swipe to change outfit"
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                  return;
                event.preventDefault();
                selectSlide(
                  Math.max(
                    0,
                    Math.min(
                      ROLES.length - 1,
                      selected + (event.key === "ArrowRight" ? 1 : -1),
                    ),
                  ),
                );
              }}
              onScroll={(event) => {
                const rail = event.currentTarget;
                const center = rail.scrollLeft + rail.clientWidth / 2;
                let nearest = 0;
                let distance = Infinity;
                Array.from(rail.children).forEach((child, index) => {
                  const card = child as HTMLElement;
                  const delta = Math.abs(
                    card.offsetLeft + card.offsetWidth / 2 - center,
                  );
                  if (delta < distance) {
                    nearest = index;
                    distance = delta;
                  }
                });
                setSelected(nearest);
              }}
            >
              {ROLES.map((role, index) => (
                <div
                  key={role.id}
                  className={styles.outfitCard}
                  data-outfit-slide={role.id}
                  data-selected={selected === index}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${ROLES.length}: ${role.label}`}
                >
                  <h3 className={styles.label}>{role.label}</h3>
                  <p>{role.copy}</p>
                </div>
              ))}
            </div>
            <div className={styles.outfitPagination}>
              {ROLES.map((role, index) => (
                <button
                  key={role.id}
                  type="button"
                  aria-label={`Show outfit: ${role.label}`}
                  aria-pressed={selected === index}
                  onClick={() => selectSlide(index)}
                >
                  <span />
                </button>
              ))}
            </div>
          </div>
          <span id={`${id}-instructions`} className="sr-only">
            {mobile ? (
              "Swipe the cards or use the outfit buttons to change clothes. Drag the figure sideways or click it to spin."
            ) : (
              <>
                Hover a label to preview its outfit. Drag a hat onto the head to
                keep the outfit on; drag it off to remove it. You can also click
                a hat or press Enter to put it on or take it off. Drag the
                figure sideways or click it to spin. Throw a loose hat around
                the panel, or use the arrow keys to push it.
              </>
            )}
          </span>
        </div>
      </div>
      <div className={styles.hatFlights}>
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            data-hat-flight={role.id}
            className={styles.flyingHat}
            tabIndex={worn === role.id ? -1 : 0}
            aria-hidden={worn === role.id}
            aria-label={`Wear ${role.hatName.toLowerCase()}: ${role.label}`}
            aria-pressed={locked === role.id}
            aria-describedby={`${id}-instructions`}
            {...wardrobe.bindings(role.id, false)}
          >
            <Image
              src={wardrobeAsset(role.hat)}
              alt=""
              width={role.hatWidth}
              height={role.hatHeight}
              loading="eager"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
