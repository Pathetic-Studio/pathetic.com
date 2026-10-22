import { Body, Query, World, type Engine } from "matter-js";
import gsap from "gsap";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { createViewportParticleLayer } from "./viewport-particles";

const HOLD_MS = 950;
const RETURN_MS = 3400;
const STAR_IMAGES = [1, 2, 3].map(
  (number) => `/images/project-cta/memebooth-star-${number}.png`,
);

/** Hold is deliberate and stationary; scrolling and moving always cancel it. */
export function createIntroObjectInteraction({
  engine,
  bodies,
  container,
  nodes,
  isVisible,
  clearAttractor,
}: {
  engine: Engine;
  bodies: Body[];
  container: HTMLElement;
  nodes: Map<string, HTMLDivElement>;
  isVisible: () => boolean;
  clearAttractor: () => void;
}) {
  gsap.registerPlugin(Physics2DPlugin);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const absent = new Set<Body>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const particles = new Set<HTMLImageElement>();
  const returning = new Set<HTMLImageElement>();
  const effects = createViewportParticleLayer("intro-burst");
  let gesture: { pointerId: number; x: number; y: number } | null = null;
  let suppressClickUntil = 0;
  let lastGesture = { x: 0, y: 0 };
  let selectionStyles: { name: string; value: string; priority: string }[] = [];
  const releaseSelection = () => {
    selectionStyles.forEach(({ name, value, priority }) => {
      if (value) document.documentElement.style.setProperty(name, value, priority);
      else document.documentElement.style.removeProperty(name);
    });
    selectionStyles = [];
    gesture = null;
  };
  let held: {
    body: Body;
    node: HTMLDivElement;
    image: HTMLImageElement;
    pointerId: number;
    x: number;
    y: number;
    started: number;
  } | null = null;

  const cancelHold = () => {
    releaseSelection();
    if (!held) return;
    Body.setStatic(held.body, false);
    held.image.style.transform = "";
    delete held.node.dataset.introState;
    held = null;
    clearAttractor();
  };

  const onDown = (event: PointerEvent) => {
    if (
      held ||
      !event.isPrimary ||
      event.button !== 0 ||
      !isVisible() ||
      document.hidden ||
      document.documentElement.hasAttribute("data-loader-playing") ||
      (event.target as Element | null)?.closest(
        "a, button, input, textarea, [role='button'], #site-header-root",
      )
    )
      return;

    const rect = container.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (
      point.x < 0 ||
      point.y < 0 ||
      point.x > rect.width ||
      point.y > rect.height
    )
      return;
    // Hit the actual object hull, not the transparent square around its image.
    const body = Query.point(bodies, point)
      .reverse()
      .find((item) => !absent.has(item));
    if (!body) return;
    const node = nodes.get(`img-${bodies.indexOf(body)}`);
    const image = node?.querySelector<HTMLImageElement>("[data-explode-inner]");
    if (!node || !image || gsap.isTweening(image)) return;

    event.preventDefault();
    gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    selectionStyles = ["user-select", "-webkit-user-select", "-webkit-touch-callout"].map(name => ({
      name,
      value: document.documentElement.style.getPropertyValue(name),
      priority: document.documentElement.style.getPropertyPriority(name),
    }));
    selectionStyles.forEach(({ name }) => document.documentElement.style.setProperty(name, "none", "important"));
    window.getSelection()?.removeAllRanges();
    clearAttractor();
    Body.setStatic(body, true);
    node.dataset.introState = "holding";
    held = {
      body,
      node,
      image,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      started: performance.now(),
    };
  };

  const onMove = (event: PointerEvent) => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 12)
      cancelHold();
  };
  const onUp = (event: PointerEvent) => {
    if (gesture?.pointerId !== event.pointerId) return;
    if (event.type === "pointerup") {
      event.preventDefault();
      lastGesture = { x: event.clientX, y: event.clientY };
      suppressClickUntil = performance.now() + 400;
    }
    cancelHold();
  };
  const onSelect = (event: Event) => {
    if (gesture) event.preventDefault();
  };
  const onClick = (event: MouseEvent) => {
    if (performance.now() < suppressClickUntil && Math.hypot(event.clientX - lastGesture.x, event.clientY - lastGesture.y) < 24) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  const onVisibility = () => {
    if (document.hidden) cancelHold();
  };
  const onOut = (event: PointerEvent) => {
    if (!event.relatedTarget) cancelHold();
  };

  function explode() {
    if (!held) return;
    const { body, node, image } = held;
    held = null;
    const bounds = container.getBoundingClientRect();
    const origin = { x: bounds.left + body.position.x, y: bounds.top + body.position.y };
    window.getSelection()?.removeAllRanges();
    clearAttractor();
    absent.add(body);
    World.remove(engine.world, body);
    Body.setStatic(body, false);
    node.dataset.introState = "absent";
    node.style.visibility = "hidden";
    image.style.transform = "";

    const count = reducedMotion.matches
      ? 0
      : container.clientWidth < 640
        ? 12
        : 18;
    for (let i = 0; i < count; i++) {
      const star = document.createElement("img");
      star.src = STAR_IMAGES[i % STAR_IMAGES.length];
      star.alt = "";
      star.dataset.introBurstStar = "true";
      const size = gsap.utils.random(22, 42);
      Object.assign(star.style, {
        position: "absolute",
        left: `${origin.x}px`,
        top: `${origin.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        pointerEvents: "none",
      });
      effects.appendChild(star);
      particles.add(star);
      gsap.set(star, { xPercent: -50, yPercent: -50, scale: 0 });
      gsap.to(star, { scale: 1, duration: 0.12, ease: "back.out(1.4)" });
      // The viewport layer lets fragments pass the intro's bottom edge.
      gsap.to(star, {
        physics2D: {
          velocity: gsap.utils.random(220, 440),
          angle: (360 * i) / count + gsap.utils.random(-10, 10),
          gravity: 1000,
        },
        rotation: gsap.utils.random(-300, 300),
        duration: 1.8,
        ease: "none",
        onComplete: () => {
          particles.delete(star);
          star.remove();
        },
      });
    }

    const timer = setTimeout(() => {
      timers.delete(timer);
      const rect = container.getBoundingClientRect();
      const inset = Math.min(node.offsetWidth / 2, rect.width / 2);
      Body.setPosition(body, {
        x: Math.max(inset, Math.min(rect.width - inset, body.position.x)),
        y: Math.max(inset, Math.min(rect.height - inset, body.position.y)),
      });
      Body.setVelocity(body, { x: 0, y: -2 });
      Body.setAngularVelocity(body, 0);
      // Write the new location before making the image visible (including if
      // a resize or route scroll happened during the timeout).
      node.style.transform = `translate3d(${body.position.x}px, ${body.position.y}px, 0) translate(-50%, -50%) rotate(${body.angle}rad)`;
      gsap.set(image, { scale: reducedMotion.matches ? 1 : 0 });
      node.style.visibility = "";
      node.dataset.introState = "returning";
      World.add(engine.world, body);
      absent.delete(body);
      returning.add(image);
      gsap.to(image, {
        scale: 1,
        duration: reducedMotion.matches ? 0 : 0.55,
        ease: "back.out(1.8)",
        clearProps: "transform",
        onComplete: () => {
          returning.delete(image);
          delete node.dataset.introState;
        },
      });
    }, RETURN_MS);
    timers.add(timer);
  }

  window.addEventListener("pointerdown", onDown, { passive: false });
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: false });
  window.addEventListener("pointercancel", onUp, { passive: true });
  window.addEventListener("pointerout", onOut);
  window.addEventListener("scroll", cancelHold, { passive: true });
  window.addEventListener("blur", cancelHold);
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("selectstart", onSelect, true);
  document.addEventListener("contextmenu", onSelect, true);
  document.addEventListener("click", onClick, true);

  return {
    isUnavailable: (body: Body) => absent.has(body) || held?.body === body,
    isHolding: () => !!held,
    cancelHold,
    tick(now: number) {
      if (!held) return;
      if (!isVisible()) {
        cancelHold();
        return;
      }
      const progress = Math.min(1, (now - held.started) / HOLD_MS);
      if (progress >= 1) {
        explode();
        return;
      }
      if (!reducedMotion.matches) {
        const amplitude = Math.max(0, progress - 0.12) * 5;
        held.image.style.transform = `translate(${Math.sin(now * 0.13) * amplitude}px, ${Math.cos(now * 0.17) * amplitude * 0.6}px) rotate(${Math.sin(now * 0.1) * amplitude * 0.7}deg)`;
      }
    },
    dispose() {
      cancelHold();
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("scroll", cancelHold);
      window.removeEventListener("blur", cancelHold);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("selectstart", onSelect, true);
      document.removeEventListener("contextmenu", onSelect, true);
      document.removeEventListener("click", onClick, true);
      timers.forEach(clearTimeout);
      particles.forEach((star) => {
        gsap.killTweensOf(star);
        star.remove();
      });
      returning.forEach((image) => gsap.killTweensOf(image));
      effects.remove();
      nodes.forEach((node) => {
        node.style.visibility = "";
        delete node.dataset.introState;
      });
    },
  };
}
