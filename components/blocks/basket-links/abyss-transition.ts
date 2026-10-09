import gsap from "gsap";
import { createAbyssPieces } from "./abyss-pieces";
import { createAbyssWarp } from "./abyss-warp";

type Pose = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
};

/** Paint a small, fixed-resolution cloud once, then let the compositor grow it.
 * Broad overlapping falloffs make the edge uneven without animated blur/noise
 * filters or a viewport-sized canvas allocation on mobile. */
function paintDarkness(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  const haze = (
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    strength: number,
  ) => {
    ctx.save();
    ctx.translate(x * size, y * size);
    ctx.scale(radiusX * size, radiusY * size);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    for (const [stop, opacity] of [
      [0, 1],
      [0.4, 1],
      [0.5, 0.94],
      [0.62, 0.7],
      [0.76, 0.32],
      [0.9, 0.06],
      [1, 0],
    ]) {
      gradient.addColorStop(stop, `rgba(0,0,0,${opacity * strength})`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  };
  haze(0.5, 0.5, 0.48, 0.48, 1);
  haze(0.38, 0.53, 0.35, 0.4, 0.88);
  haze(0.62, 0.42, 0.34, 0.31, 0.94);
  haze(0.54, 0.63, 0.35, 0.33, 0.82);
}

/** Keep the portal behind flying pieces; restore into the real page hierarchy. */
export function createAbyssTransition({
  root,
  panel,
  ink,
  source,
  getSourcePose,
  onClose,
}: {
  root: HTMLElement;
  panel: HTMLElement;
  ink: HTMLCanvasElement;
  source: HTMLElement | null | undefined;
  getSourcePose: (element: HTMLElement) => Pose;
  onClose: () => void;
}) {
  const target = panel.querySelector<HTMLElement>("[data-basket-popup-hero]")!;
  const closeButton =
    panel.querySelector<HTMLButtonElement>("[data-abyss-close]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const previousFocus = document.activeElement as HTMLElement | null;
  const sourceOpacity = source?.style.opacity || "";
  const sourceVisibility = source?.style.visibility || "";
  const preparation = new AbortController();
  let pieces: Awaited<ReturnType<typeof createAbyssPieces>> = null;
  let closing = false,
    disposed = false,
    arrived = false;
  let consumed = false,
    darknessComplete = false;
  let frame = 0,
    lastFrame = 0,
    simulationTime = 0,
    warpTime = 0,
    lastWarp = 0;
  let width = innerWidth,
    height = innerHeight;
  let timeline = gsap.timeline();
  const warpState = { amount: 0 };

  const traveller = document.createElement("div");
  traveller.dataset.abyssTraveller = "";
  traveller.inert = true;
  traveller.setAttribute("aria-hidden", "true");
  Object.assign(traveller.style, {
    position: "absolute",
    zIndex: "30",
    pointerEvents: "none",
    transformOrigin: "50% 50%",
    willChange: "transform",
  });
  const originalImage = (source || target).querySelector<HTMLImageElement>(
    "img",
  )!;
  const image = originalImage.cloneNode(false) as HTMLImageElement;
  image.removeAttribute("id");
  image.removeAttribute("srcset");
  image.src = originalImage.currentSrc || originalImage.src;
  image.alt = "";
  Object.assign(image.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    transform: getComputedStyle(originalImage).transform,
    transformOrigin: "50% 50%",
  });
  traveller.appendChild(image);
  root.appendChild(traveller);
  const warp = reduced ? null : createAbyssWarp(image);
  const restoreSource = () => {
    if (!source) return;
    source.style.opacity = sourceOpacity;
    source.style.visibility = sourceVisibility;
  };
  const destination = () => {
    const size = Math.min(innerWidth * 0.72, innerHeight * 0.57, 470);
    return {
      left: (innerWidth - size) / 2,
      top: (innerHeight - size) / 2,
      width: size,
      height: size,
      rotation: 0,
    };
  };
  const positionInk = () => {
    const radius = Math.hypot(innerWidth, innerHeight) / 0.68;
    gsap.set(ink, {
      left: innerWidth / 2 - radius,
      top: innerHeight / 2 - radius,
      width: radius * 2,
      height: radius * 2,
    });
  };
  const finishOpen = () => {
    if (!closing && consumed && darknessComplete)
      root.dataset.abyssPhase = "open";
  };
  const tick = (time: number) => {
    frame = 0;
    if (disposed || closing || document.hidden) {
      lastFrame = 0;
      return;
    }
    const dt = lastFrame ? Math.min((time - lastFrame) / 1000, 1 / 30) : 1 / 60;
    lastFrame = time;
    warpTime += dt;
    if (time - lastWarp >= 32) {
      warp?.render(warpTime, warpState.amount);
      lastWarp = time;
    }
    if (arrived && !consumed) {
      simulationTime += dt;
      if (!pieces?.step(dt, simulationTime, innerWidth / 2, innerHeight / 2)) {
        consumed = true;
        root.dataset.abyssPhase = "expanding";
        finishOpen();
      }
    }
    frame = requestAnimationFrame(tick);
  };
  const startConsumption = () => {
    if (closing || disposed) return;
    arrived = true;
    // Behind every Matter piece, above the dark cloud. Never spin the cutout.
    traveller.style.zIndex = "5";
    root.dataset.abyssPhase = "consuming";
    gsap.to(warpState, { amount: 1, duration: reduced ? 0 : 0.65 });
    gsap.to(ink, {
      scale: 1,
      duration: reduced ? 0.15 : 8.5,
      ease: "sine.inOut",
      onComplete: () => {
        darknessComplete = true;
        finishOpen();
      },
    });
    if (reduced) {
      pieces?.step(1 / 60, 9, innerWidth / 2, innerHeight / 2);
      consumed = true;
      finishOpen();
    } else {
      pieces?.release();
      if (!frame) frame = requestAnimationFrame(tick);
    }
  };
  const close = () => {
    if (closing || disposed) return;
    closing = true;
    preparation.abort();
    cancelAnimationFrame(frame);
    timeline.kill();
    gsap.killTweensOf([ink, warpState]);
    root.dataset.abyssPhase = "collapsing";
    const restoreAt = reduced ? 0.1 : pieces ? 0.5 : 0.05;
    timeline = gsap.timeline({
      onComplete: () => {
        pieces?.dispose();
        restoreSource();
        warp?.dispose();
        traveller.remove();
        previousFocus?.focus({ preventScroll: true });
        onClose();
      },
    });
    pieces?.fade(timeline, reduced);
    timeline.to(
      ink,
      { scale: 0, duration: reduced ? 0.1 : 0.5, ease: "power3.inOut" },
      0,
    );
    timeline.to(
      warpState,
      {
        amount: 0,
        duration: reduced ? 0 : 0.4,
        onUpdate: () => warp?.render(warpTime, warpState.amount),
      },
      0,
    );
    timeline.to(
      traveller,
      {
        scale: arrived ? 0.38 : 1,
        duration: reduced ? 0 : 0.4,
        ease: "power2.in",
      },
      0,
    );
    timeline.call(
      () => {
        root.dataset.abyssPhase = "returning";
      },
      [],
      restoreAt,
    );
    pieces?.restore(timeline, restoreAt, reduced);
    timeline.to(
      traveller,
      {
        ...(source?.isConnected ? getSourcePose(source) : destination()),
        scale: 1,
        duration: reduced ? 0.1 : 0.62,
        ease: "power3.inOut",
        onComplete: () => {
          restoreSource();
          traveller.style.opacity = "0";
        },
      },
      restoreAt,
    );
    timeline.to({}, { duration: reduced ? 0 : 0.15 });
  };
  const onResize = () => {
    positionInk();
    if (
      Math.abs(width - innerWidth) > 24 ||
      Math.abs(height - innerHeight) > 120
    )
      close();
    width = innerWidth;
    height = innerHeight;
  };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = lastFrame = 0;
    } else if (!closing && arrived && !frame && !reduced)
      frame = requestAnimationFrame(tick);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
      closeButton.focus({ preventScroll: true });
    }
  };
  paintDarkness(ink);
  positionInk();
  gsap.set(target, { autoAlpha: 0 });
  gsap.set(panel, { opacity: 1 });
  gsap.set(ink, { scale: 0, transformOrigin: "50% 50%" });
  gsap.set(traveller, {
    ...(source?.isConnected ? getSourcePose(source) : destination()),
  });
  if (source) {
    source.style.opacity = "0";
    source.style.visibility = "hidden";
  }
  root.dataset.abyssPhase = "preparing";
  closeButton.focus({ preventScroll: true });
  void createAbyssPieces(root, source, preparation.signal).then((prepared) => {
    if (closing || disposed || !prepared) {
      prepared?.dispose();
      return;
    }
    pieces = prepared;
    root.dataset.abyssCount = String(pieces.count);
    // Keep the basket in place while the portal travels. It joins the same
    // physics handoff as every other piece once the portal reaches the centre.
    timeline.to(
      traveller,
      {
        ...destination(),
        duration: reduced ? 0.1 : 0.65,
        ease: "power3.inOut",
        onStart: () => {
          root.dataset.abyssPhase = "moving";
        },
      },
      0,
    );
    timeline.call(startConsumption);
  });
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibility);
  root.addEventListener("keydown", onKey);
  return {
    close,
    dispose() {
      if (disposed) return;
      disposed = true;
      preparation.abort();
      timeline.kill();
      gsap.killTweensOf([ink, warpState]);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("keydown", onKey);
      pieces?.dispose();
      warp?.dispose();
      traveller.remove();
      restoreSource();
      delete root.dataset.abyssPhase;
    },
  };
}
