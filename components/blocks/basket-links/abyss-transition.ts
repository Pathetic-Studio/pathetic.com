import gsap from "gsap";

type Pose = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
};

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
  ink: HTMLElement;
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
    // The soft edge stays beyond every viewport corner at full expansion.
    const radius =
      Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) /
        0.82 +
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
    .to(ink, { scale: 1, duration: reduced ? 0.12 : 0.9, ease: "power2.inOut" })
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
