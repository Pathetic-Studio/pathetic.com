import gsap from "gsap";

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

/** One timeline owns both the travelling artwork and the expanding darkness. */
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
  const copy = panel.querySelectorAll<HTMLElement>("[data-abyss-copy]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timeline: gsap.core.Timeline;
  let clone: HTMLElement | null = null;
  let closing = false;
  let arrived = false;

  const revealSource = () => {
    if (!source) return;
    source.style.opacity = "";
    source.style.visibility = "";
  };
  const removeClone = () => {
    clone?.remove();
    clone = null;
  };
  const makeClone = (pose: Pose) => {
    const element = (source || target).cloneNode(true) as HTMLElement;
    element.removeAttribute("id");
    element
      .querySelectorAll("[id]")
      .forEach((node) => node.removeAttribute("id"));
    element.inert = true;
    element.setAttribute("aria-hidden", "true");
    element.dataset.abyssTraveller = "";
    Object.assign(element.style, {
      position: "fixed",
      margin: "0",
      pointerEvents: "none",
      opacity: "1",
      visibility: "visible",
      zIndex: "10060",
    });
    element.querySelector<HTMLElement>("[data-basket-label]")?.remove();
    document.body.appendChild(element);
    gsap.set(element, {
      ...pose,
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
      transformOrigin: "50% 50%",
    });
    return element;
  };
  const positionInk = () => {
    const r = target.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    // Put every viewport corner inside the fully opaque core. The wide, hazy
    // edge remains visible during growth but clears the screen at full size.
    const radius =
      Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) /
        0.38 +
      24;
    gsap.set(ink, {
      left: x - radius,
      top: y - radius,
      width: radius * 2,
      height: radius * 2,
    });
    return {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      rotation: 0,
    };
  };

  paintDarkness(ink);
  gsap.set(copy, { autoAlpha: 0 });
  gsap.set(target, { autoAlpha: 0 });
  gsap.set(panel, { opacity: 1 });
  gsap.set(ink, { scale: 0, transformOrigin: "50% 50%" });
  const destination = positionInk();
  const from = source?.isConnected ? getSourcePose(source) : destination;
  clone = makeClone(from);
  if (source) {
    source.style.opacity = "0";
    source.style.visibility = "hidden";
  }
  root.dataset.abyssPhase = "moving";
  timeline = gsap.timeline();
  timeline
    .to(clone, {
      ...destination,
      duration: reduced ? 0 : 0.6,
      ease: "power3.inOut",
    })
    .call(() => {
      arrived = true;
      root.dataset.abyssPhase = "expanding";
      gsap.set(target, { autoAlpha: 1 });
      removeClone();
    })
    .to(ink, {
      scale: 1,
      duration: reduced ? 0.12 : 1.05,
      ease: "power2.inOut",
    })
    .to(
      copy,
      { autoAlpha: 1, duration: reduced ? 0 : 0.18, ease: "power1.out" },
      reduced ? ">" : "-=0.18",
    )
    .call(() => {
      root.dataset.abyssPhase = "open";
    });

  window.addEventListener("resize", positionInk);
  return {
    close() {
      if (closing) return;
      closing = true;
      timeline.kill();
      const center = positionInk();
      // During an early close the traveller can still be mid-flight. Keep its
      // current pose instead of flashing a second image in the centre.
      if (!clone) clone = makeClone(center);
      gsap.set(target, { autoAlpha: 0 });
      root.dataset.abyssPhase = "collapsing";
      timeline = gsap.timeline({
        onComplete: () => {
          revealSource();
          removeClone();
          onClose();
        },
      });
      const collapseDuration = arrived && !reduced ? 0.26 : 0.08;
      timeline
        .to(copy, { autoAlpha: 0, duration: reduced ? 0 : 0.1 }, 0)
        .to(ink, { scale: 0, duration: collapseDuration, ease: "power3.in" }, 0)
        .call(() => {
          root.dataset.abyssPhase = "returning";
        })
        .to(clone, {
          ...(source?.isConnected ? getSourcePose(source) : center),
          duration: reduced ? 0 : 0.55,
          ease: "power3.inOut",
        });
    },
    dispose() {
      timeline.kill();
      window.removeEventListener("resize", positionInk);
      removeClone();
      revealSource();
      delete root.dataset.abyssPhase;
    },
  };
}
