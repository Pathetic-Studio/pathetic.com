// components/blocks/split/split-row-animated.tsx
"use client";

import type React from "react";
import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";
import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult, type ColorVariant } from "@/sanity.types";
import SplitContent from "./split-content";
import SplitCardsListAnimated from "./split-cards-list-animated";
import SplitImage from "./split-image";
import SplitImageAnimate from "./split-image-animate";
import SplitInfoList from "./split-info-list";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSectionId } from "@/lib/section-id";
import TitleText from "@/components/ui/title-text";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRowAnimated = Extract<Block, { _type: "split-row-animated" }>;
type SplitColumnAnimated = NonNullable<
  NonNullable<SplitRowAnimated["splitColumns"]>[number]
>;

const componentMap: {
  [K in Exclude<
    SplitColumnAnimated["_type"],
    "split-cards-list-animated" | "split-image-animate"
  >]: React.ComponentType<Extract<SplitColumnAnimated, { _type: K }>>;
} = {
  "split-content": SplitContent,
  "split-image": SplitImage,
  "split-info-list": SplitInfoList,
};

const introPaddingClasses: Record<
  NonNullable<SplitRowAnimated["introPadding"]>,
  string
> = {
  none: "pt-0",
  sm: "pt-8",
  md: "pt-12",
  lg: "pt-20",
};

const PIN_DISTANCE_VH = 300;
const NAV_HEIGHT = 80;

declare global {
  interface Window {
    __splitRowAnimatedCleanup__?: Record<string, () => void>;
  }
}

function unwrapPinSpacers(el: HTMLElement | null) {
  if (!el) return;
  while (el.parentElement?.classList.contains("pin-spacer")) {
    const spacer = el.parentElement;
    const parent = spacer.parentElement;
    if (!parent) break;
    parent.insertBefore(el, spacer);
    parent.removeChild(spacer);
  }
}

function getActiveScroller(): Window | HTMLElement {
  try {
    const s = ScrollSmoother.get();
    const w = s?.wrapper?.();
    if (w) return w as HTMLElement;
  } catch { }
  return window;
}

function getPinType(scroller: Window | HTMLElement) {
  return scroller === window ? undefined : ("transform" as const);
}

export default function SplitRowAnimated({
  _key,
  anchor,
  padding,
  colorVariant,
  noGap,
  splitColumns,
  tagLine,
  title,
  body,
  links,
  introPadding,
  animateText = true,
  stickyIntro,
}: SplitRowAnimated) {
  const cleanedColor = stegaClean(colorVariant);
  const color = (cleanedColor ?? undefined) as ColorVariant | undefined;

  const sectionId = getSectionId(
    "split-row-animated",
    _key,
    anchor?.anchorId ?? null,
  );

  const safeLinks = links ?? [];
  const introHasContent =
    !!tagLine || !!title || !!body || safeLinks.length > 0;

  const introPaddingClass =
    introPaddingClasses[
    (introPadding || "md") as keyof typeof introPaddingClasses
    ];
  const shouldAnimateText = animateText !== false;

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const pinWrapRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  const [activeCardIndex, setActiveCardIndex] = useState<number>(-1);
  const [imageStage, setImageStage] = useState<number>(0);

  const activeIndexRef = useRef<number>(-1);
  const lastStageRef = useRef<number>(-1);
  const firstCardShownRef = useRef<boolean>(false);

  let containerStyle: CSSProperties | undefined;
  if (typeof anchor?.defaultOffsetPercent === "number") {
    containerStyle = {} as CSSProperties;
    (containerStyle as any)["--section-anchor-offset"] =
      String(anchor.defaultOffsetPercent);
  }

  const desktopPinId = `${sectionId}-pin-desktop`;
  const mobilePinId = `${sectionId}-pin-mobile`;
  const enterId = `${sectionId}-enter`;

  useLayoutEffect(() => {
    const sectionEl = sectionRef.current;
    const pinWrapEl = pinWrapRef.current;
    const gridEl = gridRef.current;
    const imageEl = imageRef.current;
    const cardsContainer = cardsRef.current;

    if (!sectionEl || !pinWrapEl || !gridEl) return;

    ScrollTrigger.config({ ignoreMobileResize: true });

    if (typeof window !== "undefined") {
      window.__splitRowAnimatedCleanup__ ??= {};
      window.__splitRowAnimatedCleanup__[sectionId]?.();
    }

    const cleanupLocal = () => {
      ScrollTrigger.getAll().forEach((t) => {
        const vars = (t.vars || {}) as any;
        const id = (vars.id ?? "") as string;

        const pinsWrap = vars.pin === pinWrapEl || (t as any).pin === pinWrapEl;
        const triggersWrap =
          vars.trigger === pinWrapEl || (t as any).trigger === pinWrapEl;

        const pinsGrid = vars.pin === gridEl || (t as any).pin === gridEl;
        const triggersGrid =
          vars.trigger === gridEl || (t as any).trigger === gridEl;

        if (
          id === desktopPinId ||
          id === mobilePinId ||
          id === enterId ||
          pinsWrap ||
          triggersWrap ||
          pinsGrid ||
          triggersGrid
        ) {
          t.kill(true);
        }
      });

      unwrapPinSpacers(pinWrapRef.current);
      unwrapPinSpacers(gridRef.current);
      unwrapPinSpacers(imageRef.current);
      unwrapPinSpacers(cardsRef.current);
      unwrapPinSpacers(sectionRef.current);
    };

    cleanupLocal();

    activeIndexRef.current = -1;
    lastStageRef.current = -1;
    firstCardShownRef.current = false;

    const mm = gsap.matchMedia();

    const ctx = gsap.context(() => {
      const scroller = getActiveScroller();
      const pinType = getPinType(scroller);

      const isDesktopNow = () =>
        window.matchMedia("(min-width: 1024px)").matches;

      const cardItemEls = cardsContainer
        ? Array.from(
          cardsContainer.querySelectorAll<HTMLElement>("[data-card-item]"),
        )
        : [];

      const hasAnimatedCards =
        splitColumns?.some(
          (column) =>
            column._type === "split-cards-list-animated" &&
            (column as any).animateInRight,
        ) ?? false;

      const ovalEl = imageEl
        ? (imageEl.querySelector("[data-oval-container]") as HTMLElement | null)
        : null;

      const totalStages = cardItemEls.length;

      const clampStageIndex = (stage: number) =>
        Math.max(0, Math.min(stage, totalStages - 1));

      const setStage = (stage: number) => {
        if (stage < 0) {
          activeIndexRef.current = -1;
          setActiveCardIndex(-1);
          setImageStage(0);
          firstCardShownRef.current = false;
          if (ovalEl) gsap.to(ovalEl, { scale: 0.9, duration: 0.35, overwrite: "auto" });
          return;
        }

        const clamped = clampStageIndex(stage);
        activeIndexRef.current = clamped;
        setActiveCardIndex((prev) => (prev === clamped ? prev : clamped));
        setImageStage((prev) => {
          const next = 2 + clamped;
          return prev === next ? prev : next;
        });

        if (ovalEl) {
          const scale = clamped === 0 ? 1 : clamped === 1 ? 1.08 : 1.16;
          gsap.to(ovalEl, { scale, duration: 0.45, overwrite: "auto", ease: "power2.out" });
        }
      };

      // Desktop diagonal offsets (“fan”)
      const getCardOffsets = (index: number) => {
        const isDesktop = isDesktopNow();
        if (!hasAnimatedCards || !isDesktop) return { x: 0, y: 0 };
        return { x: 32 * index, y: -24 * index };
      };

      const enterCardDesktop = (index: number) => {
        const el = cardItemEls[index];
        if (!el) return;

        const o = getCardOffsets(index);
        gsap.fromTo(
          el,
          { autoAlpha: 0, x: o.x + 120, y: o.y },
          {
            autoAlpha: 1,
            x: o.x,
            y: o.y,
            duration: 0.7,
            ease: "power2.out",
            overwrite: "auto",
          },
        );
      };

      const exitCardDesktop = (index: number) => {
        const el = cardItemEls[index];
        if (!el) return;

        const o = getCardOffsets(index);
        gsap.to(el, {
          autoAlpha: 0,
          x: o.x + 120,
          y: o.y,
          duration: 0.55,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      };

      const showOnlyFirstCardDesktop = () => {
        if (!totalStages) return;
        cardItemEls.forEach((el, i) => {
          const o = getCardOffsets(i);
          gsap.set(el, {
            force3D: true,
            autoAlpha: i === 0 ? 1 : 0,
            x: i === 0 ? o.x : o.x + 120,
            y: o.y,
          });
          el.style.zIndex = String(10 + i);
        });
        firstCardShownRef.current = true;
        lastStageRef.current = 0;
        setStage(0);
      };

      const hideAllCardsDesktop = () => {
        if (!totalStages) return;
        cardItemEls.forEach((el, i) => {
          const o = getCardOffsets(i);
          gsap.set(el, { force3D: true, autoAlpha: 0, x: o.x + 120, y: o.y });
          el.style.zIndex = String(10 + i);
        });
        lastStageRef.current = -1;
        setStage(-1);
      };

      const showOnlyFirstCardMobile = () => {
        if (!totalStages) return;
        cardItemEls.forEach((el, i) => {
          gsap.set(el, {
            force3D: true,
            x: 0,
            y: i === 0 ? 0 : 60,
            autoAlpha: i === 0 ? 1 : 0,
          });
          el.style.zIndex = String(10 + i);
        });
        firstCardShownRef.current = true;
        lastStageRef.current = 0;
        setStage(0);
      };

      const hideAllCardsMobile = () => {
        if (!totalStages) return;
        cardItemEls.forEach((el, i) => {
          gsap.set(el, { force3D: true, x: 0, y: 60, autoAlpha: 0 });
          el.style.zIndex = String(10 + i);
        });
        lastStageRef.current = -1;
        setStage(-1);
      };

      const applyStageChangeDesktop = (prev: number, next: number) => {
        if (prev === next) return;

        if (next < 0) {
          if (prev >= 0) {
            for (let i = prev; i >= 0; i--) exitCardDesktop(i);
          }
          lastStageRef.current = -1;
          setStage(-1);
          return;
        }

        if (next > prev) {
          for (let i = Math.max(0, prev + 1); i <= next; i++) {
            if (i === 0 && firstCardShownRef.current) continue;
            enterCardDesktop(i);
            if (i === 0) firstCardShownRef.current = true;
          }
          setStage(next);
          return;
        }

        for (let i = prev; i > next; i--) exitCardDesktop(i);
        setStage(next);
      };

      const stageFromProgress = (progress: number) => {
        if (!totalStages) return -1;
        const clamped = Math.max(0, Math.min(0.999999, progress));
        return Math.min(totalStages - 1, Math.floor(clamped * totalStages));
      };

      // Prevent flash
      cardItemEls.forEach((el, index) => {
        const o = getCardOffsets(index);
        gsap.set(el, {
          force3D: true,
          autoAlpha: 0,
          x: isDesktopNow() ? o.x + 120 : 0,
          y: isDesktopNow() ? o.y : 60,
          zIndex: 10 + index,
        });
      });

      if (ovalEl) {
        gsap.set(ovalEl, {
          scale: 0.9,
          transformOrigin: "50% 50%",
          willChange: "transform",
        });
      }
      if (imageEl) gsap.set(imageEl, { autoAlpha: 1, y: 0 });

      const enter = ScrollTrigger.create({
        id: enterId,
        scroller,
        trigger: pinWrapEl,
        start: "top 85%",
        onEnter: () => {
          if (totalStages <= 0) return;
          if (isDesktopNow()) showOnlyFirstCardDesktop();
          else showOnlyFirstCardMobile();
        },
        onEnterBack: () => {
          if (totalStages <= 0) return;
          if (isDesktopNow()) showOnlyFirstCardDesktop();
          else showOnlyFirstCardMobile();
        },
        onLeaveBack: () => {
          if (isDesktopNow()) hideAllCardsDesktop();
          else hideAllCardsMobile();
        },
      });

      // -------------------------
      // DESKTOP (unchanged behavior)
      // -------------------------
      mm.add("(min-width: 1024px)", () => {
        if (!totalStages) return;

        const pinPx = (PIN_DISTANCE_VH / 100) * window.innerHeight;

        const st = ScrollTrigger.create({
          id: desktopPinId,
          scroller,
          trigger: pinWrapEl,
          start: `center-=${NAV_HEIGHT} center`,
          end: () => `+=${pinPx}`,
          pin: pinWrapEl,
          pinSpacing: true,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          pinType: pinType as any,

          onEnter: () => showOnlyFirstCardDesktop(),
          onEnterBack: () => showOnlyFirstCardDesktop(),

          onUpdate: (self) => {
            const stage = stageFromProgress(self.progress);
            if (stage !== lastStageRef.current) {
              const prev = lastStageRef.current;
              lastStageRef.current = stage;
              applyStageChangeDesktop(prev, stage);
            }
          },
          onRefresh: (self) => {
            const stage = stageFromProgress(self.progress);
            if (stage !== lastStageRef.current) {
              const prev = lastStageRef.current;
              lastStageRef.current = stage;
              applyStageChangeDesktop(prev, stage);
            }
          },

          onLeaveBack: () => hideAllCardsDesktop(),
        });

        requestAnimationFrame(() => ScrollTrigger.refresh());

        return () => {
          st.kill(true);
          unwrapPinSpacers(pinWrapEl);
        };
      });

      // -------------------------
      // MOBILE/TABLET: PIN + SCRUBBED TIMELINE (NO per-scroll setters)
      // Works cleanly because ScrollSmoother is now active on mobile (scroller is wrapper).
      // -------------------------
      mm.add("(max-width: 1023.98px)", () => {
        if (!totalStages) return;

        const pinPx = (PIN_DISTANCE_VH / 100) * window.innerHeight;

        hideAllCardsMobile();
        showOnlyFirstCardMobile();

        const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

        tl.set(cardItemEls[0], { autoAlpha: 1, y: 0, force3D: true }, 0);

        for (let i = 0; i < totalStages - 1; i++) {
          const t0 = i;
          const mid = i + 0.6;

          tl.set(cardItemEls[i], { zIndex: 200 }, t0);
          tl.set(cardItemEls[i + 1], { zIndex: 201 }, t0);

          // hold
          tl.to({}, { duration: 0.6 }, t0);

          // crossfade
          tl.to(
            cardItemEls[i],
            { autoAlpha: 0, y: -60, duration: 0.4, overwrite: "auto" },
            mid,
          );
          tl.fromTo(
            cardItemEls[i + 1],
            { autoAlpha: 0, y: 60 },
            { autoAlpha: 1, y: 0, duration: 0.4, overwrite: "auto" },
            mid,
          );
        }

        tl.to({}, { duration: 0.6 });

        const st = ScrollTrigger.create({
          id: mobilePinId,
          scroller,
          trigger: pinWrapEl,
          start: `top top+=${NAV_HEIGHT}`,
          end: () => `+=${pinPx}`,
          pin: pinWrapEl,
          pinSpacing: true,
          scrub: true,

          // key for smoother scroller
          pinType: "transform" as any,
          pinReparent: true,

          anticipatePin: 1,
          invalidateOnRefresh: true,

          animation: tl,

          onEnter: () => {
            showOnlyFirstCardMobile();
            tl.progress(0);
          },
          onEnterBack: () => {
            showOnlyFirstCardMobile();
            tl.progress(0);
          },
          onUpdate: (self) => {
            const stage = Math.min(
              totalStages - 1,
              Math.floor(self.progress * totalStages),
            );
            if (stage !== activeIndexRef.current) setStage(stage);
          },
          onLeaveBack: () => showOnlyFirstCardMobile(),
        });

        requestAnimationFrame(() => ScrollTrigger.refresh());

        return () => {
          st.kill(true);
          tl.kill();
          unwrapPinSpacers(pinWrapEl);
        };
      });

      return () => {
        enter.kill(true);
        mm.revert();
      };
    }, sectionEl);

    const cleanup = () => {
      ctx.revert();
      cleanupLocal();
    };

    if (typeof window !== "undefined") {
      window.__splitRowAnimatedCleanup__ ??= {};
      window.__splitRowAnimatedCleanup__[sectionId] = cleanup;
    }

    return cleanup;
  }, [animateText, splitColumns, sectionId, desktopPinId, mobilePinId, enterId]);

  return (
    <SectionContainer
      id={sectionId}
      color={color}
      padding={padding}
      data-section-anchor-id={anchor?.anchorId || undefined}
      style={containerStyle}
    >
      <div ref={sectionRef} className="relative bg-background overflow-visible">
        {introHasContent && (
          <div
            className={cn(
              "text-center pt-8 lg:pt-20 pb-10",
              introPaddingClass,
              stickyIntro && "lg:sticky lg:top-20 z-20 bg-background/80 backdrop-blur",
            )}
            data-typeon-trigger="true"
          >
            <div className="max-w-8xl mx-auto">
              {tagLine && (
                <h1 className="leading-[0] uppercase italic font-sans">
                  <span className="text-base font-semibold opacity-50">
                    {tagLine}
                  </span>
                </h1>
              )}

              {title && (
                <TitleText
                  variant="stretched"
                  as="h2"
                  size="xl"
                  align="center"
                  maxChars={28}
                  animation={shouldAnimateText ? "typeOn" : "none"}
                  animationSpeed={1.2}
                  typeOnTrigger="scroll"
                  typeOnStart="top 80%"
                >
                  {title}
                </TitleText>
              )}

              {body && (
                <div className="text-lg mt-6 max-w-2xl mx-auto">
                  <PortableTextRenderer value={body} />
                </div>
              )}

              {safeLinks.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                  {safeLinks.map((link) => (
                    <Button
                      key={link.title}
                      variant={stegaClean(link?.buttonVariant)}
                      asChild
                    >
                      <Link
                        href={link.href || "#"}
                        target={link.target ? "_blank" : undefined}
                        rel={link.target ? "noopener" : undefined}
                      >
                        {link.title}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {splitColumns && splitColumns.length > 0 && (
          <div className="overflow-visible">
            <div ref={pinWrapRef} className="relative pt-4 overflow-visible">
              <div
                ref={gridRef}
                className={cn(
                  "grid grid-cols-1 lg:grid-cols-2 items-start max-w-6xl mx-auto w-full px-4 lg:px-8 overflow-visible",
                  noGap ? "gap-0" : "gap-10 lg:gap-20",
                )}
              >
                {splitColumns.map((column) => {
                  if (column._type === "split-cards-list-animated") {
                    return (
                      <div
                        key={column._key}
                        ref={cardsRef}
                        className={cn(
                          "flex flex-col overflow-visible px-6 lg:px-0",
                          "order-2 lg:order-none",
                        )}
                      >
                        <SplitCardsListAnimated
                          {...(column as any)}
                          color={color}
                          activeIndex={activeCardIndex}
                          onHoverCard={undefined}
                        />
                      </div>
                    );
                  }

                  if (column._type === "split-image-animate") {
                    return (
                      <div
                        key={column._key}
                        ref={imageRef}
                        className={cn(
                          "self-start overflow-visible will-change-transform",
                          "order-1 lg:order-none",
                        )}
                      >
                        <SplitImageAnimate
                          {...(column as any)}
                          imageStage={imageStage}
                        />
                      </div>
                    );
                  }

                  const Component =
                    componentMap[
                    column._type as Exclude<
                      SplitColumnAnimated["_type"],
                      "split-cards-list-animated" | "split-image-animate"
                    >
                    ];

                  if (!Component) {
                    console.warn("No component implemented for:", column._type);
                    return <div data-type={column._type} key={column._key} />;
                  }

                  return (
                    <Component
                      {...(column as any)}
                      color={color}
                      noGap={noGap}
                      key={column._key}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
