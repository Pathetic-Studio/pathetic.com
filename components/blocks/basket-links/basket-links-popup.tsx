"use client";

import Link from "next/link";
import PigeonNewsletter from "@/components/newsletter/pigeon-newsletter";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollSmoother);

export type BasketPopupType = "shop" | "newsletter" | "jobs" | "abyss";

type BasketLinksPopupProps = {
  active: BasketPopupType | null;
  onClose: () => void;
  origin?: { x: number; y: number } | null;
  sourceElement?: HTMLElement | null;
  shopHref?: string;
};

function burstPoints(points: number, innerRadius: number) {
  return Array.from({ length: points * 2 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    const radius = index % 2 === 0 ? 48 : innerRadius;
    return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
  }).join(" ");
}

const LARGE_BURST_POINTS = burstPoints(18, 34);
const SMALL_BURST_POINTS = burstPoints(14, 32);

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-2 top-2 z-40 grid size-8 place-items-center border border-black bg-white text-2xl font-black leading-none text-black hover:bg-[#d7ff43]"
      aria-label="Close popup"
    >
      ×
    </button>
  );
}

function ShopPopup({ href, onClose }: { href?: string; onClose: () => void }) {
  const largeStarRef = useRef<SVGSVGElement | null>(null);
  const smallStarRef = useRef<SVGSVGElement | null>(null);

  useLayoutEffect(() => {
    if (!largeStarRef.current || !smallStarRef.current) return;
    const large = gsap.to(largeStarRef.current, {
      rotation: 360,
      duration: 18,
      repeat: -1,
      ease: "none",
      transformOrigin: "50% 50%",
    });
    const small = gsap.to(smallStarRef.current, {
      rotation: -360,
      duration: 9,
      repeat: -1,
      ease: "none",
      transformOrigin: "50% 50%",
    });
    return () => {
      large.kill();
      small.kill();
    };
  }, []);

  return (
    <div data-basket-popup-surface className="relative mx-auto aspect-square w-[min(82vw,31rem)]">
      <CloseButton onClose={onClose} />
      <svg ref={largeStarRef} viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <polygon points={LARGE_BURST_POINTS} fill="#fff522" stroke="#000" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      <h3 className="absolute left-1/2 top-[10%] z-20 -translate-x-1/2 text-[clamp(2.8rem,9vw,5.2rem)] font-black uppercase leading-none tracking-[-.07em] text-white [paint-order:stroke_fill] [-webkit-text-stroke:clamp(2px,.3vw,4px)_#000]">Shop</h3>
      <div data-basket-popup-hero className="absolute left-1/2 top-1/2 z-10 h-[62%] w-[62%] -translate-x-1/2 -translate-y-[44%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/lifecycle/slide-2/pathetic/rhinestone-tee.webp" alt="Black PATHETIC rhinestone T-shirt" className="h-full w-full object-contain" style={{ transform: "rotate(-12deg) scale(.92)" }} />
      </div>
      <Link href={href || "/#shop"} className="absolute bottom-[5%] right-[1%] z-30 grid aspect-square w-[31%] place-items-center text-center" aria-label="Visit the Pathetic shop">
        <svg ref={smallStarRef} viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <polygon points={SMALL_BURST_POINTS} fill="#55cfff" stroke="#000" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="relative z-10 max-w-[70%] text-[clamp(.58rem,1.7vw,.9rem)] font-black uppercase leading-[.88] text-black">Go shopping today</span>
      </Link>
    </div>
  );
}

function JobsPopup({ onClose }: { onClose: () => void }) {
  return (
    <div data-basket-popup-surface className="relative mx-auto w-[min(84vw,25rem)] border-2 border-b-[#202020] border-l-white border-r-[#202020] border-t-white bg-[#c0c0c0] p-[2px] text-black shadow-[10px_12px_0_rgba(0,0,0,.45),inset_1px_1px_0_#dfdfdf,inset_-1px_-1px_0_#808080] [font-family:'MS_Sans_Serif',Tahoma,Arial,sans-serif]">
      <div className="flex h-7 items-center justify-between bg-[#000080] px-1.5 text-xs font-bold text-white">
        <span>System Message</span>
        <button type="button" onClick={onClose} className="grid size-5 place-items-center border-2 border-b-[#222] border-l-white border-r-[#222] border-t-white bg-[#c0c0c0] text-[13px] font-black leading-none text-black shadow-[inset_1px_1px_0_#dfdfdf,inset_-1px_-1px_0_#808080] active:translate-x-px active:translate-y-px active:border-b-white active:border-l-[#222] active:border-r-white active:border-t-[#222]" aria-label="Close jobs popup">×</button>
      </div>
      <div className="flex flex-col items-center px-6 py-7">
        <div data-basket-popup-hero className="h-56 w-56 sm:h-64 sm:w-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/basket-links/sticker-macbook.webp" alt="Sticker-covered MacBook" className="h-full w-full object-contain" style={{ transform: "rotate(-8deg) scale(.94)" }} />
        </div>
        <h3 className="-mt-2 text-2xl">Jobs</h3>
        <Link href="/jobs" className="mt-4 border-2 border-b-[#202020] border-l-white border-r-[#202020] border-t-white bg-[#c0c0c0] px-4 py-2 text-sm shadow-[inset_1px_1px_0_#dfdfdf,inset_-1px_-1px_0_#808080] active:translate-x-px active:translate-y-px active:border-b-white active:border-l-[#202020] active:border-r-white active:border-t-[#202020]">
          Learn more
        </Link>
      </div>
    </div>
  );
}

function AbyssPopup({ onClose }: { onClose: () => void }) {
  return (
    <div data-basket-popup-surface className="relative mx-auto w-[min(84vw,29rem)] overflow-hidden rounded-[1.3rem] border border-white/10 bg-black px-7 py-6 text-center text-white shadow-[0_0_75px_35px_rgba(0,0,0,.92)]">
      <CloseButton onClose={onClose} />
      <h3 className="relative z-10 text-[clamp(2.1rem,8vw,4rem)] font-black uppercase leading-none tracking-[-.06em]">The Abyss</h3>
      <div data-basket-popup-hero className="relative mx-auto my-2 aspect-[1.8] w-[86%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/basket-links/portal.png" alt="The Abyss" className="h-full w-full object-contain" style={{ transform: "rotate(-20deg) scale(.86)" }} />
        <span className="absolute left-1/2 top-1/2 h-[8%] w-[103%] -translate-x-1/2 -translate-y-1/2 rotate-[38deg] bg-[#ff2424]" />
        <span className="absolute left-1/2 top-1/2 h-[8%] w-[103%] -translate-x-1/2 -translate-y-1/2 -rotate-[42deg] bg-[#ff2424]" />
      </div>
      <p className="text-xl font-black italic uppercase leading-none">Currently unavailable</p>
      <p className="mt-1 text-xs font-bold italic uppercase">(Try next winter)</p>
    </div>
  );
}

type BasketTransitionPose = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
};

function getBasketTransitionPose(element: HTMLElement): BasketTransitionPose {
  const rect = element.getBoundingClientRect();
  const width = element.offsetWidth || rect.width;
  const height = element.offsetHeight || rect.height;
  const dataAngle = Number(element.dataset.basketRotation);
  let rotation = Number.isFinite(dataAngle)
    ? THREE_RAD_TO_DEG * dataAngle
    : 0;

  if (!Number.isFinite(dataAngle)) {
    const transform = window.getComputedStyle(element).transform;
    if (transform && transform !== "none") {
      try {
        const matrix = new DOMMatrixReadOnly(transform);
        rotation = Math.atan2(matrix.b, matrix.a) * THREE_RAD_TO_DEG;
      } catch {
        rotation = 0;
      }
    }
  }

  return {
    left: rect.left + rect.width / 2 - width / 2,
    top: rect.top + rect.height / 2 - height / 2,
    width,
    height,
    rotation,
  };
}

const THREE_RAD_TO_DEG = 180 / Math.PI;

export default function BasketLinksPopup({ active, onClose, origin, sourceElement, shopHref }: BasketLinksPopupProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLButtonElement | null>(null);
  const takeoverRef = useRef<HTMLDivElement | null>(null);
  const transitionCloneRef = useRef<HTMLElement | null>(null);
  const transitionTargetRef = useRef<HTMLElement | null>(null);
  const transitionBusyRef = useRef(false);
  const [newsletterFlapping, setNewsletterFlapping] = useState(false);
  const [newsletterHeroVisible, setNewsletterHeroVisible] = useState(false);

  const removeTransitionClone = useCallback(() => {
    transitionCloneRef.current?.remove();
    transitionCloneRef.current = null;
  }, []);

  const revealSource = useCallback(() => {
    if (sourceElement) {
      sourceElement.style.opacity = "";
      sourceElement.style.visibility = "";
    }
  }, [sourceElement]);

  const runCloseTransition = useCallback(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    const target = transitionTargetRef.current;
    if (!panel || !target || !sourceElement || !sourceElement.isConnected) {
      revealSource();
      onClose();
      return;
    }

    const from = target.getBoundingClientRect();
    const to = getBasketTransitionPose(sourceElement);
    if (!from.width || !from.height || !to.width || !to.height) {
      revealSource();
      onClose();
      return;
    }

    const isNewsletter = active === "newsletter";
    // Keep the newsletter in its registered flying pose for the return trip.
    // Swapping to a large clone of the Matter artwork at the start of close
    // produced the visible doubled bird / dissolve the user was seeing.
    const cloneTemplate = isNewsletter ? target : sourceElement;
    const clone = cloneTemplate.cloneNode(true) as HTMLElement;
    transitionCloneRef.current = clone;
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    if (isNewsletter) {
      const originalWings = Array.from(
        target.querySelectorAll<HTMLElement>("[data-newsletter-wing-frame]"),
      );
      const clonedWings = Array.from(
        clone.querySelectorAll<HTMLElement>("[data-newsletter-wing-frame]"),
      );
      clonedWings.forEach((wing, index) => {
        const original = originalWings[index];
        if (!original || Number(getComputedStyle(original).opacity) < 0.5) {
          wing.remove();
        }
      });
    }
    Object.assign(clone.style, {
      position: "fixed",
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      margin: "0",
      transform: "none",
      transformOrigin: "50% 50%",
      pointerEvents: "none",
      opacity: "1",
      visibility: "visible",
      zIndex: "10060",
    });
    document.body.appendChild(clone);
    // The popup hero is centred with Tailwind's -translate-x-1/2. GSAP can
    // preserve that percentage translate when it starts animating rotation,
    // which made the clone land half its width left of the real Matter item
    // before snapping across at the handoff. The fixed clone already uses the
    // hero's resolved viewport rect, so all inherited translation must be zero.
    gsap.set(clone, {
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
      rotation: 0,
      transformOrigin: "50% 50%",
    });
    target.style.opacity = "0";
    target.style.visibility = "hidden";
    if (isNewsletter) setNewsletterHeroVisible(false);
    const cloneLabel = clone.querySelector<HTMLElement>("[data-basket-label]");
    if (cloneLabel) gsap.set(cloneLabel, { visibility: "hidden", opacity: 0 });

    const timeline = gsap.timeline({
      onComplete: () => {
        // One-frame handoff: the travelling bird disappears in the same
        // callback that the frozen Matter item becomes visible again.
        clone.style.opacity = "0";
        clone.style.visibility = "hidden";
        revealSource();
        removeTransitionClone();
        transitionBusyRef.current = false;
        onClose();
      },
    });
    const closeLayers = takeoverRef.current ? [panel, backdrop, takeoverRef.current] : [panel, backdrop];
    timeline
      .to(closeLayers, { opacity: 0, duration: 0.38, ease: "power2.in" }, 0)
      .to(
        clone,
        {
          left: to.left,
          top: to.top,
          width: to.width,
          height: to.height,
          rotation: to.rotation,
          duration: 0.62,
          ease: "expo.inOut",
        },
        0,
      );
  }, [active, onClose, removeTransitionClone, revealSource, sourceElement]);

  const closeWithTransition = useCallback(() => {
    if (transitionBusyRef.current) return;
    transitionBusyRef.current = true;

    if (active === "newsletter" && newsletterFlapping) {
      // Finish the current sprite cycle at its registered up pose. The popup
      // calls runCloseTransition from onFlapSettled, so no wing frame snaps.
      setNewsletterFlapping(false);
      return;
    }

    runCloseTransition();
  }, [active, newsletterFlapping, runCloseTransition]);

  useEffect(() => {
    if (active !== "newsletter") {
      setNewsletterFlapping(false);
      setNewsletterHeroVisible(false);
    }
  }, [active]);

  const handleNewsletterFlapSettled = useCallback(() => {
    if (
      active === "newsletter" &&
      transitionBusyRef.current &&
      !newsletterFlapping
    ) {
      runCloseTransition();
    }
  }, [active, newsletterFlapping, runCloseTransition]);

  useEffect(() => {
    if (!active) return;
    const smoother = ScrollSmoother.get();
    const wasPaused = smoother ? Boolean(smoother.paused()) : false;
    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const previous = {
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
    };

    if (smoother) {
      smoother.paused(true);
    } else {
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      html.style.overflow = "hidden";
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWithTransition();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      if (smoother) {
        smoother.paused(wasPaused);
      } else {
        body.style.position = previous.bodyPosition;
        body.style.top = previous.bodyTop;
        body.style.left = previous.bodyLeft;
        body.style.right = previous.bodyRight;
        body.style.width = previous.bodyWidth;
        body.style.overflow = previous.bodyOverflow;
        html.style.overflow = previous.htmlOverflow;
        window.scrollTo(0, scrollY);
      }
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, closeWithTransition]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!active || !panel || !backdrop) return;

    transitionBusyRef.current = false;
    const target = panel.querySelector<HTMLElement>("[data-basket-popup-hero]");
    transitionTargetRef.current = target;
    const surface = panel.querySelector<HTMLElement>("[data-basket-popup-surface]");
    const isNewsletter = active === "newsletter";
    if (isNewsletter) {
      target?.style.setProperty("opacity", "0");
      target?.style.setProperty("visibility", "hidden");
      setNewsletterHeroVisible(false);
    }
    const context = gsap.context(() => {
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(panel, { opacity: 1 });
      if (surface) gsap.set(surface, { opacity: isNewsletter ? 1 : 0 });

      if (!target || !sourceElement || !sourceElement.isConnected) {
        gsap.fromTo(panel, { scale: 0.86 }, { scale: 1, duration: 0.4, ease: "back.out(1.45)" });
        gsap.to(backdrop, { opacity: 1, duration: 0.22, ease: "power1.out" });
        if (surface && !isNewsletter) {
          gsap.to(surface, {
            opacity: 1,
            duration: 0.2,
            ease: "power1.out",
          });
        } else if (isNewsletter) {
          gsap.delayedCall(0.4, () => {
            setNewsletterHeroVisible(true);
            setNewsletterFlapping(true);
          });
        }
        return;
      }

      const from = getBasketTransitionPose(sourceElement);
      const to = target.getBoundingClientRect();
      if (!from.width || !from.height || !to.width || !to.height) {
        gsap.set([backdrop, surface], { opacity: 1 });
        if (isNewsletter) {
          setNewsletterHeroVisible(true);
          setNewsletterFlapping(true);
        }
        return;
      }

      sourceElement.style.opacity = "0";
      sourceElement.style.visibility = "hidden";
      if (isNewsletter) {
        target.style.opacity = "0";
        target.style.visibility = "hidden";
      }
      const clone = sourceElement.cloneNode(true) as HTMLElement;
      transitionCloneRef.current = clone;
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      Object.assign(clone.style, {
        position: "fixed",
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
        margin: "0",
        transform: `rotate(${from.rotation}deg)`,
        transformOrigin: "50% 50%",
        pointerEvents: "none",
        opacity: "1",
        visibility: "visible",
        zIndex: "10060",
      });
      const cloneLabel = clone.querySelector<HTMLElement>("[data-basket-label]");
      if (isNewsletter && cloneLabel) {
        // The label belongs to the resting Matter object, not the flying
        // pigeon. Remove it immediately instead of fading it during flight.
        gsap.set(cloneLabel, { visibility: "hidden", opacity: 0 });
      }
      document.body.appendChild(clone);

      const timeline = gsap.timeline({
        onComplete: () => {
          removeTransitionClone();
          if (isNewsletter) setNewsletterFlapping(true);
        },
      });
      timeline
        .to(backdrop, { opacity: 1, duration: 0.22, ease: "power1.out" }, 0)
        .to(
          clone,
          {
            left: to.left,
            top: to.top,
            width: to.width,
            height: to.height,
            rotation: 0,
            duration: 0.72,
            ease: "expo.inOut",
          },
          0,
        );
      if (isNewsletter) {
        // The clone and registered up-pose occupy the same box. Swap their
        // visibility on one frame instead of dissolving between two birds.
        timeline
          .call(
            () => {
              target.style.opacity = "1";
              target.style.visibility = "visible";
              setNewsletterHeroVisible(true);
              clone.style.opacity = "0";
              clone.style.visibility = "hidden";
            },
            undefined,
            0.72,
          );
      } else {
        if (cloneLabel) {
          timeline.to(
            cloneLabel,
            { opacity: 0, scale: 0.82, duration: 0.16, ease: "power2.in" },
            0,
          );
        }
        timeline
          .to(surface, { opacity: 1, duration: 0.18, ease: "power1.out" }, 0.55)
          .to(clone, { opacity: 0, duration: 0.12, ease: "power1.out" }, 0.64);
      }
    }, rootRef);

    return () => {
      context.revert();
      removeTransitionClone();
      transitionTargetRef.current = null;
      revealSource();
    };
  }, [active, removeTransitionClone, revealSource, sourceElement]);

  useLayoutEffect(() => {
    const takeover = takeoverRef.current;
    if (active !== "abyss" || !takeover) return;
    const blobs = takeover.querySelectorAll<HTMLElement>("[data-abyss-blob]");
    const veil = takeover.querySelector<HTMLElement>("[data-abyss-veil]");
    const context = gsap.context(() => {
      gsap.fromTo(
        blobs,
        { scale: 0.025, opacity: 0.35, rotation: -18 },
        { scale: 2.35, opacity: 1, rotation: 42, duration: 4.2, stagger: 0.2, ease: "power1.inOut" },
      );
      gsap.to(veil, { opacity: 0.96, duration: 3.7, delay: 0.45, ease: "power1.inOut" });
    }, takeover);
    return () => context.revert();
  }, [active]);

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[10020] grid place-items-center overflow-hidden p-4" role="dialog" aria-modal="true" aria-label={`${active} popup`}>
      {active === "abyss" && (
        <div ref={takeoverRef} className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div
            data-abyss-blob
            className="absolute size-[82vmax] rounded-[42%_58%_55%_45%/53%_38%_62%_47%] bg-black blur-[clamp(34px,5vw,78px)]"
            style={{ left: origin?.x ?? window.innerWidth / 2, top: origin?.y ?? window.innerHeight / 2, marginLeft: "-41vmax", marginTop: "-41vmax" }}
          />
          <div
            data-abyss-blob
            className="absolute size-[68vmax] rounded-[59%_41%_38%_62%/44%_61%_39%_56%] bg-black blur-[clamp(45px,7vw,105px)]"
            style={{ left: origin?.x ?? window.innerWidth / 2, top: origin?.y ?? window.innerHeight / 2, marginLeft: "-34vmax", marginTop: "-34vmax" }}
          />
          <div data-abyss-veil className="absolute inset-0 bg-black opacity-0" />
        </div>
      )}
      <button ref={backdropRef} type="button" onClick={closeWithTransition} className={`absolute inset-0 z-10 ${active === "abyss" ? "bg-transparent" : "bg-[#181818]/88 backdrop-blur-[2px]"}`} aria-label="Close popup backdrop" />
      <div ref={panelRef} className="relative z-20 max-h-[92svh] max-w-[94vw]" onClick={(event) => event.stopPropagation()}>
        {active === "shop" && <ShopPopup href={shopHref} onClose={closeWithTransition} />}
        {active === "newsletter" && (
          <PigeonNewsletter
            onClose={closeWithTransition}
            flapping={newsletterFlapping}
            heroVisible={newsletterHeroVisible}
            onFlapSettled={handleNewsletterFlapSettled}
          />
        )}
        {active === "jobs" && <JobsPopup onClose={closeWithTransition} />}
        {active === "abyss" && <AbyssPopup onClose={closeWithTransition} />}
      </div>
    </div>,
    document.body,
  );
}
