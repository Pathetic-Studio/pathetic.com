"use client";

import {
  type FormEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";

type NewsletterWingFrameId = "up" | "mid1" | "mid2" | "down";
type NewsletterWingSide = "front" | "rear";

type NewsletterWingTransform = {
  x: number;
  y: number;
  rotation: number;
  shearX: number;
  shearY: number;
  scaleX: number;
  scaleY: number;
  originX: number;
  originY: number;
};

type NewsletterWingFrame = {
  id: NewsletterWingFrameId;
  frontSrc: string;
  rearSrc: string;
  front: NewsletterWingTransform;
  rear: NewsletterWingTransform;
};

const NEWSLETTER_WING_FRAME_DURATION = 0.06;

const NEWSLETTER_WING_FRAMES: NewsletterWingFrame[] = [
  {
    id: "up",
    frontSrc: "/images/basket-links/pigeon-wing-front.png",
    rearSrc: "/images/basket-links/pigeon-wing-back.png",
    front: {
      x: -17.5,
      y: -9.5,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 1,
      scaleY: 1,
      originX: 61,
      originY: 69.5,
    },
    rear: {
      x: 2.5,
      y: -5.5,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 1,
      scaleY: 1,
      originX: 70,
      originY: 56,
    },
  },
  {
    id: "mid1",
    frontSrc: "/images/basket-links/pigeon-wing-front-cycle-2.png",
    rearSrc: "/images/basket-links/pigeon-wing-back-cycle-2.png",
    front: {
      x: -43,
      y: -4,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 0.65,
      scaleY: 0.65,
      originX: 79,
      originY: 64,
    },
    rear: {
      x: -4,
      y: 24,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 0.65,
      scaleY: 0.65,
      originX: 77,
      originY: 26,
    },
  },
  {
    id: "mid2",
    frontSrc: "/images/basket-links/pigeon-wing-front-cycle-3.png",
    rearSrc: "/images/basket-links/pigeon-wing-back-cycle-3.png",
    front: {
      x: -6.5,
      y: 33.5,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 0.65,
      scaleY: 0.65,
      originX: 77,
      originY: 38,
    },
    rear: {
      x: 9,
      y: 36.5,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 0.65,
      scaleY: 0.65,
      originX: 74,
      originY: 28,
    },
  },
  {
    id: "down",
    frontSrc: "/images/basket-links/pigeon-wing-front-cycle-4.png",
    rearSrc: "/images/basket-links/pigeon-wing-back-cycle-4.png",
    front: {
      x: -39.5,
      y: 2.5,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 0.79,
      scaleY: 0.79,
      originX: 61,
      originY: 69.5,
    },
    rear: {
      x: 26,
      y: 11,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 0.82,
      scaleY: 0.82,
      originX: 70,
      originY: 56,
    },
  },
];

function newsletterWingTransformVars(transform: NewsletterWingTransform) {
  return {
    xPercent: transform.x,
    yPercent: transform.y,
    rotation: transform.rotation,
    skewX: transform.shearX,
    skewY: transform.shearY,
    scaleX: transform.scaleX,
    scaleY: transform.scaleY,
    transformOrigin: `${transform.originX}% ${transform.originY}%`,
  };
}

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

export default function PigeonNewsletter({
  onClose,
  flapping,
  heroVisible,
  onFlapSettled,
}: {
  onClose: () => void;
  flapping: boolean;
  heroVisible: boolean;
  onFlapSettled: () => void;
}) {
  const emailId = useId();
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const pigeonRigRef = useRef<HTMLDivElement | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);
  const flapTimerRef = useRef<gsap.core.Tween | null>(null);
  const settleTimerRef = useRef<gsap.core.Tween | null>(null);
  const flapFrameIndexRef = useRef(0);
  const flapReadyRef = useRef(false);
  const flapRequestedRef = useRef(flapping);
  const motionEnabledRef = useRef(flapping);
  const startFlapRef = useRef<() => void>(() => undefined);
  const resetMotionRef = useRef<() => void>(() => undefined);
  const onFlapSettledRef = useRef(onFlapSettled);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  onFlapSettledRef.current = onFlapSettled;

  useLayoutEffect(() => {
    const rig = pigeonRigRef.current;
    if (!rig) return;

    const wingLayers = Array.from(
      rig.querySelectorAll<HTMLImageElement>("[data-newsletter-wing-frame]"),
    );
    if (!wingLayers.length) return;

    for (const frame of NEWSLETTER_WING_FRAMES) {
      for (const side of ["front", "rear"] as NewsletterWingSide[]) {
        const layer = rig.querySelector<HTMLImageElement>(
          `[data-newsletter-wing-frame="${frame.id}"][data-newsletter-wing-side="${side}"]`,
        );
        if (!layer) continue;
        gsap.set(layer, {
          ...newsletterWingTransformVars(frame[side]),
          opacity: frame.id === "up" ? 1 : 0,
        });
      }
    }

    let cancelled = false;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const showFrame = (frameIndex: number) => {
      const frame = NEWSLETTER_WING_FRAMES[frameIndex];
      gsap.set(wingLayers, { opacity: 0 });
      gsap.set(
        wingLayers.filter(
          (layer) => layer.dataset.newsletterWingFrame === frame.id,
        ),
        { opacity: 1 },
      );
      flapFrameIndexRef.current = frameIndex;
    };

    const scheduleNextFrame = () => {
      if (cancelled || reduceMotion || flapTimerRef.current) return;
      flapTimerRef.current = gsap.delayedCall(
        NEWSLETTER_WING_FRAME_DURATION,
        () => {
          flapTimerRef.current = null;
          const nextFrame =
            (flapFrameIndexRef.current + 1) % NEWSLETTER_WING_FRAMES.length;
          showFrame(nextFrame);
          if (flapRequestedRef.current || nextFrame !== 0) {
            scheduleNextFrame();
          } else {
            settleTimerRef.current?.kill();
            settleTimerRef.current = gsap.delayedCall(0.26, () => {
              settleTimerRef.current = null;
              onFlapSettledRef.current();
            });
          }
        },
      );
    };

    startFlapRef.current = scheduleNextFrame;

    // Hold on the complete up pose while the other sprites decode. That keeps
    // a first visit on a slower connection from flashing empty wing frames.
    void Promise.all(
      wingLayers.map((layer) => layer.decode().catch(() => undefined)),
    ).then(() => {
      if (cancelled) return;
      flapReadyRef.current = true;
      showFrame(0);
      if (flapRequestedRef.current && !reduceMotion) scheduleNextFrame();
    });

    return () => {
      cancelled = true;
      flapReadyRef.current = false;
      flapTimerRef.current?.kill();
      flapTimerRef.current = null;
      settleTimerRef.current?.kill();
      settleTimerRef.current = null;
      startFlapRef.current = () => undefined;
    };
  }, []);

  useEffect(() => {
    flapRequestedRef.current = flapping;
    motionEnabledRef.current = flapping;
    if (!flapReadyRef.current) return;

    if (flapping) {
      settleTimerRef.current?.kill();
      settleTimerRef.current = null;
      startFlapRef.current();
      return;
    }

    resetMotionRef.current();
    if (flapFrameIndexRef.current === 0) {
      flapTimerRef.current?.kill();
      flapTimerRef.current = null;
      settleTimerRef.current?.kill();
      settleTimerRef.current = gsap.delayedCall(0.26, () => {
        settleTimerRef.current = null;
        onFlapSettledRef.current();
      });
    }
  }, [flapping]);

  useLayoutEffect(() => {
    const scene = sceneRef.current;
    const pigeon = pigeonRigRef.current;
    const paper = paperRef.current;
    const pigeonMotionLayers = pigeon
      ? Array.from(
          pigeon.querySelectorAll<HTMLElement>(
            "[data-newsletter-pigeon-motion]",
          ),
        )
      : [];
    if (
      !scene ||
      !pigeon ||
      !pigeonMotionLayers.length ||
      !paper ||
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // The top of the paper is a fixed grip, not a second chasing object.
    // Rotate the sheet around that grip; derive its translation from the
    // bird's current transform on every frame (including reset/exit).
    gsap.set(paper, { transformOrigin: "50% 0%" });
    // Ease the whole bird toward the pointer. The paper still reads the
    // rendered bird transform each frame, so this adds no lag at the grip.
    const pigeonX = gsap.quickTo(pigeonMotionLayers, "x", {
      duration: 0.8,
      ease: "power2.out",
    });
    const pigeonY = gsap.quickTo(pigeonMotionLayers, "y", {
      duration: 0.9,
      ease: "power2.out",
    });
    const pigeonRotation = gsap.quickTo(pigeonMotionLayers, "rotation", {
      duration: 0.95,
      ease: "power2.out",
    });
    const layer = pigeonMotionLayers[0];
    const grip = { x: 0, y: 0 };
    const measureGrip = () => {
      // Layout offsets are unaffected by the modal's arrival/exit transform.
      grip.x =
        paper.offsetLeft +
        paper.offsetWidth / 2 -
        (pigeon.offsetLeft + pigeon.offsetWidth / 2);
      grip.y = paper.offsetTop - (pigeon.offsetTop + pigeon.offsetHeight / 2);
    };
    const resize = new ResizeObserver(measureGrip);
    resize.observe(scene);
    measureGrip();
    const paperState = { rotation: 0, velocity: 0 };
    let lastPaperUpdate = performance.now();
    let lastBirdX = 0;
    let paperHovered = false;
    let paperFocused = false;
    let interactionHoldRequested = false;
    let interactionLocked = false;
    const lastTravelTarget = { x: 0, y: 0 };
    const updatePaper = () => {
      const now = performance.now();
      const dt = Math.min(
        0.05,
        Math.max(0.001, (now - lastPaperUpdate) / 1000),
      );
      lastPaperUpdate = now;
      const x = Number(gsap.getProperty(layer, "x"));
      const y = Number(gsap.getProperty(layer, "y"));
      const angle =
        (Number(gsap.getProperty(layer, "rotation")) * Math.PI) / 180;
      const speed = (x - lastBirdX) / dt;
      lastBirdX = x;
      const target =
        interactionHoldRequested || !motionEnabledRef.current
          ? 0
          : Math.max(-7, Math.min(7, speed * 0.018));
      // Damped angular spring only: the grip itself never trails the bird.
      paperState.velocity += (target - paperState.rotation) * 85 * dt;
      paperState.velocity *= Math.exp(-11 * dt);
      paperState.rotation += paperState.velocity * dt;
      gsap.set(paper, {
        x: x + grip.x * (Math.cos(angle) - 1) - grip.y * Math.sin(angle),
        y: y + grip.x * Math.sin(angle) + grip.y * (Math.cos(angle) - 1),
        rotation: paperState.rotation,
      });
      if (
        interactionHoldRequested &&
        Math.hypot(lastTravelTarget.x - x, lastTravelTarget.y - y) < 0.75 &&
        Math.abs(paperState.rotation) < 0.12
      ) {
        interactionLocked = true;
        if (!paperHovered && !paperFocused) {
          interactionHoldRequested = false;
          interactionLocked = false;
        }
      }
    };
    gsap.ticker.add(updatePaper);
    const moveTo = (travelX: number, travelY: number) => {
      lastTravelTarget.x = travelX;
      lastTravelTarget.y = travelY;
      pigeonX(travelX);
      pigeonY(travelY);
      pigeonRotation(
        Math.max(
          -4,
          Math.min(4, travelX / Math.max(90, window.innerWidth * 0.12)),
        ),
      );
    };
    const holdForInteraction = () => {
      interactionHoldRequested = true;
      interactionLocked = false;
    };
    const releaseInteraction = () => {
      interactionHoldRequested = false;
      interactionLocked = false;
    };
    resetMotionRef.current = () => {
      gsap.to(pigeonMotionLayers, {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.55,
        ease: "sine.out",
        overwrite: true,
      });
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!motionEnabledRef.current || interactionHoldRequested) return;
      // Use the whole viewport as the control surface. At the viewport edges
      // the rig can travel roughly a third of the viewport in either
      // direction, rather than being confined to the newsletter itself.
      moveTo(
        (event.clientX - window.innerWidth / 2) * 0.68,
        (event.clientY - window.innerHeight / 2) * 0.55,
      );
    };
    const onPaperPointerEnter = () => {
      paperHovered = true;
      holdForInteraction();
    };
    const onPaperPointerLeave = () => {
      paperHovered = false;
      if (!paperFocused && interactionLocked) releaseInteraction();
    };
    const onPaperFocusIn = () => {
      paperFocused = true;
      holdForInteraction();
    };
    const onPaperFocusOut = () => {
      paperFocused = false;
      if (!paperHovered && interactionLocked) releaseInteraction();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    paper.addEventListener("pointerenter", onPaperPointerEnter);
    paper.addEventListener("pointerleave", onPaperPointerLeave);
    paper.addEventListener("focusin", onPaperFocusIn);
    paper.addEventListener("focusout", onPaperFocusOut);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      paper.removeEventListener("pointerenter", onPaperPointerEnter);
      paper.removeEventListener("pointerleave", onPaperPointerLeave);
      paper.removeEventListener("focusin", onPaperFocusIn);
      paper.removeEventListener("focusout", onPaperFocusOut);
      resize.disconnect();
      gsap.ticker.remove(updatePaper);
      gsap.killTweensOf([...pigeonMotionLayers, paper]);
      resetMotionRef.current = () => undefined;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website,
          source: "website_newsletter_modal",
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to subscribe");
      }
      setStatus("success");
      setEmail("");
    } catch (reason) {
      setStatus("error");
      setError(
        reason instanceof Error ? reason.message : "Something went wrong",
      );
    }
  };

  return (
    <div
      ref={sceneRef}
      data-basket-popup-surface
      className="relative mx-auto w-[min(88vw,35rem)] pt-[clamp(5rem,17vw,8rem)]"
    >
      <div
        ref={pigeonRigRef}
        data-basket-popup-hero
        data-newsletter-pigeon-rig
        className="pointer-events-none absolute top-[-2.4rem] size-[clamp(10rem,31vw,15rem)]"
        style={{
          left: "calc(50% - clamp(5rem, 15.5vw, 7.5rem))",
          opacity: heroVisible ? 1 : 0,
          visibility: heroVisible ? "visible" : "hidden",
        }}
      >
        <div
          data-newsletter-pigeon-motion
          className="absolute inset-0 z-10 scale-[.94] will-change-transform"
        >
          {NEWSLETTER_WING_FRAMES.map((frame) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${frame.id}-rear`}
              data-newsletter-wing-frame={frame.id}
              data-newsletter-wing-side="rear"
              src={frame.rearSrc}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-contain will-change-[opacity,transform] ${frame.id === "up" ? "" : "opacity-0"}`}
            />
          ))}
        </div>

        <div
          data-newsletter-pigeon-motion
          className="absolute inset-0 z-20 scale-[.94] will-change-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/basket-links/pigeon-body-side.png"
            alt="Pigeon holding the newsletter"
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>

        <div
          data-newsletter-pigeon-motion
          className="absolute inset-0 z-40 scale-[.94] will-change-transform"
        >
          {NEWSLETTER_WING_FRAMES.map((frame) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${frame.id}-front`}
              data-newsletter-wing-frame={frame.id}
              data-newsletter-wing-side="front"
              src={frame.frontSrc}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-contain will-change-[opacity,transform] ${frame.id === "up" ? "" : "opacity-0"}`}
            />
          ))}
        </div>

        <div
          data-newsletter-pigeon-motion
          className="absolute inset-0 z-50 scale-[.94] will-change-transform"
        >
          <div
            data-newsletter-feet
            className="absolute inset-0 origin-top-left translate-x-[30%] translate-y-[45%] scale-[.46]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/basket-links/pigeon-feet-v2.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain"
            />
          </div>
        </div>
      </div>

      <div
        ref={paperRef}
        data-newsletter-paper
        className="relative z-30 border-2 border-black bg-[#f1f0e8] bg-cover bg-center px-[clamp(1.25rem,5vw,3rem)] pb-[clamp(1.4rem,5vw,2.6rem)] pt-[clamp(2.4rem,8vw,4.5rem)] text-center shadow-[9px_10px_0_rgba(0,0,0,.28)] will-change-transform"
        style={{
          backgroundImage: "url('/images/basket-links/newsletter-paper.png')",
        }}
      >
        <CloseButton onClose={onClose} />
        <h3 className="text-[clamp(2.5rem,9vw,5rem)] font-black italic uppercase leading-[.83] tracking-[-.065em] text-white [paint-order:stroke_fill] [-webkit-text-stroke:clamp(1.5px,.25vw,3px)_#000]">
          Join our
          <br />
          mailing
          <br />
          list
        </h3>
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-7 flex max-w-md flex-wrap justify-center gap-2 text-black"
        >
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            name="website"
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
          />
          <label htmlFor={emailId} className="sr-only">
            Email address
          </label>
          <input
            id={emailId}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="PIGEON INTERCEPT POINT HERE"
            className="min-w-0 flex-1 border border-black bg-white px-3 py-2 text-sm font-bold uppercase outline-none focus:bg-[#d7ff43]"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="border border-black bg-white px-4 py-2 text-sm font-black uppercase hover:bg-[#d7ff43] disabled:opacity-60"
          >
            {status === "submitting" ? "Sending…" : "Submit"}
          </button>
        </form>
        {status === "success" && (
          <p className="mt-3 text-sm font-black uppercase">
            The pigeon has your address.
          </p>
        )}
        {status === "error" && (
          <p className="mt-3 text-sm font-bold">{error}</p>
        )}
      </div>
    </div>
  );
}
