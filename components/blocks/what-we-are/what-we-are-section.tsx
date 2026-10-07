"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { BackgroundPanel } from "@/components/ui/background-panel";
import styles from "./what-we-are.module.css";
import TitleText from "@/components/ui/title-text";
import { ROLES, wardrobeAsset, type OutfitPiece } from "./wardrobe-data";
import { useHatWardrobe } from "./use-hat-wardrobe";
import CarouselDots from "@/components/ui/carousel-dots";

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
  const wardrobe = useHatWardrobe(sectionRef);
  const { active, worn, locked } = wardrobe;
  const selectedRef = useRef(0);
  const railTarget = useRef<number | null>(null);

  useEffect(() => {
    const query = matchMedia("(max-width: 900px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const scrollToSlide = (index: number, smooth = true) => {
    const rail = carouselRef.current;
    const card = rail?.children[index] as HTMLElement | undefined;
    if (!rail || !card) return;
    railTarget.current = index;
    rail.scrollTo({
      left: card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2,
      behavior:
        !smooth || matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
    });
  };

  const selectSlide = (index: number) => {
    selectedRef.current = index;
    setSelected(index);
    wardrobe.select(ROLES[index].id);
    scrollToSlide(index);
  };

  // Dragging a hat on also selects its copy card. That programmatic scroll
  // must not select intermediate outfits while travelling across the rail.
  useEffect(() => {
    if (!mobile || !active) return;
    const index = ROLES.findIndex((role) => role.id === active);
    if (selectedRef.current === index) return;
    selectedRef.current = index;
    setSelected(index);
    scrollToSlide(index, false);
  }, [active, mobile]);

  useEffect(() => {
    if (mobile && !active) wardrobe.select(ROLES[selectedRef.current].id);
  }, [mobile]);

  useEffect(() => {
    const section = sectionRef.current;
    const figure = figureRef.current;
    if (!section || !figure) return;

    const observer = new IntersectionObserver(([entry]) => {
      section.dataset.inView = String(entry.isIntersecting);
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

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
                      tabIndex={worn === role.id ? 0 : -1}
                      aria-hidden={worn !== role.id}
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
              id={`${id}-outfit-rail`}
              className={styles.outfitRail}
              data-outfit-rail
              data-hat-obstacle
              tabIndex={0}
              aria-label="Swipe to change outfit"
              onPointerDown={() => {
                railTarget.current = null;
              }}
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
                if (wardrobe.dragging) return;
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
                if (railTarget.current !== null) {
                  if (nearest !== railTarget.current) return;
                  railTarget.current = null;
                }
                if (selectedRef.current !== nearest) {
                  selectedRef.current = nearest;
                  setSelected(nearest);
                  wardrobe.select(ROLES[nearest].id);
                }
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
                  <h3>
                    <button
                      type="button"
                      className={styles.label}
                      onClick={() => selectSlide(index)}
                    >
                      {role.label}
                    </button>
                  </h3>
                  <p>{role.copy}</p>
                </div>
              ))}
            </div>
            <CarouselDots
              label="What we are slides"
              labels={ROLES.map((role) => role.label)}
              activeIndex={selected}
              onSelect={selectSlide}
              controls={`${id}-outfit-rail`}
              className="mt-2"
            />
          </div>
          <span id={`${id}-instructions`} className="sr-only">
            {mobile ? (
              "Swipe the cards or use the dots to change clothes. Drag any hat onto the head to wear or replace it; drag it off to remove it. Throw the loose hats around the panel."
            ) : (
              <>
                Hover a label to preview its outfit. Drag a hat onto the head to
                keep the outfit on; drag it off to remove it. You can also click
                a hat or press Enter to put it on or take it off. Throw a loose
                hat around the panel, or use the arrow keys to push it.
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
