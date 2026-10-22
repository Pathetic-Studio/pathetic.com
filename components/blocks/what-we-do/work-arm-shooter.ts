import gsap from "gsap";
import { FORTUNE_OBJECTS } from "../project-cta/project-cta-object-weather";
import { createViewportParticleLayer } from "@/components/effects/viewport-particles";

export function createWorkArmShooter(root: HTMLElement, hand: HTMLElement, enabled: () => boolean) {
  const pose = hand.querySelector<HTMLElement>("[data-work-hand-pose]");
  const tip = hand.querySelector<HTMLElement>("[data-what-we-do-fingertip]");
  const wrist = hand.querySelector<HTMLElement>("[data-what-we-do-wrist]");
  if (!pose || !tip || !wrist) return () => {};
  const layer = createViewportParticleLayer("work-arm");
  const particles = new Set<HTMLImageElement>();
  const images: HTMLImageElement[] = [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let motion: gsap.core.Timeline | null = null;
  let down: { x: number; y: number } | null = null;
  let lastShot = -Infinity;
  let disposed = false;
  const preload = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    preload.disconnect();
    FORTUNE_OBJECTS.forEach(src => {
      const image = new Image();
      image.onload = () => { if (!disposed) images.push(image); };
      image.src = src;
    });
  }, { rootMargin: "200px" });
  preload.observe(root);

  const shoot = () => {
    if (!images.length || !enabled() || disposed || reduceMotion.matches) return;
    const start = tip.getBoundingClientRect();
    const base = wrist.getBoundingClientRect();
    const length = Math.hypot(start.x - base.x, start.y - base.y);
    if (length < 1) return;
    const dx = (start.x - base.x) / length;
    const dy = (start.y - base.y) / length;
    const size = gsap.utils.random(28, 38);
    // Travel just beyond the first viewport edge, independent of section bounds.
    const tx = dx > 0 ? (innerWidth + size - start.x) / dx : dx < 0 ? (-size - start.x) / dx : Infinity;
    const ty = dy > 0 ? (innerHeight + size - start.y) / dy : dy < 0 ? (-size - start.y) / dy : Infinity;
    const distance = Math.max(size, Math.min(tx, ty));
    const image = images[Math.floor(Math.random() * images.length)].cloneNode() as HTMLImageElement;
    image.alt = "";
    image.dataset.workArmShot = "true";
    Object.assign(image.style, { position: "absolute", left: `${start.x}px`, top: `${start.y}px`, width: `${size}px`, height: `${size}px`, objectFit: "contain" });
    layer.appendChild(image);
    particles.add(image);
    gsap.set(image, { xPercent: -50, yPercent: -50 });
    gsap.to(image, {
      x: dx * distance, y: dy * distance, rotation: gsap.utils.random(-180, 180),
      duration: distance / 1100, ease: "none",
      onComplete: () => { particles.delete(image); image.remove(); },
    });
  };
  const onDown = (event: PointerEvent) => {
    down = event.isPrimary && event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
  };
  const onClick = (event: MouseEvent) => {
    if (!down || !enabled() || event.detail === 0 || document.hidden || performance.now() - lastShot < 160) return;
    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (moved > 6 || (event.target as Element)?.closest("a, button, input, textarea, select, [role='button']")) return;
    lastShot = performance.now();
    motion?.kill();
    // Three discrete poses around the wrist leave the sleeve connection intact.
    motion = gsap.timeline();
    if (!reduceMotion.matches) {
      motion.set(pose, { rotation: -8 })
        .set(pose, { rotation: 3 }, .055)
        .call(shoot, [], .055)
        .set(pose, { rotation: 0, clearProps: "transform" }, .14);
    }
  };
  const cancel = () => { down = null; };
  root.addEventListener("pointerdown", onDown);
  root.addEventListener("pointercancel", cancel);
  root.addEventListener("pointerleave", cancel);
  root.addEventListener("click", onClick);
  return () => {
    disposed = true;
    preload.disconnect();
    motion?.kill();
    gsap.set(pose, { clearProps: "transform" });
    particles.forEach(image => { gsap.killTweensOf(image); image.remove(); });
    layer.remove();
    root.removeEventListener("pointerdown", onDown);
    root.removeEventListener("pointercancel", cancel);
    root.removeEventListener("pointerleave", cancel);
    root.removeEventListener("click", onClick);
  };
}
