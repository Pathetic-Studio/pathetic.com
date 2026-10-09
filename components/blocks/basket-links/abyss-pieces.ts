import { Bodies, Body, Composite, Engine } from "matter-js";
import gsap from "gsap";
import {
  getLeftNavController,
  getRightNavController,
  getSocialNavController,
  getMobileNavController,
  getMobileSocialNavController,
  type NavSlotController,
} from "@/components/header/nav-anim-registry";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
type Pose = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
};

// Freeze only presentation/layout properties. Copying every computed browser
// property (including hundreds of unused longhands) causes a noticeable stall.
const PRESENTATION_PROPERTIES = `
  display position box-sizing top right bottom left z-index
  width height min-width min-height max-width max-height
  margin-top margin-right margin-bottom margin-left
  padding-top padding-right padding-bottom padding-left
  border-top border-right border-bottom border-left border-radius
  overflow-x overflow-y visibility opacity
  background-color background-image background-position background-size
  background-repeat background-clip background-origin box-shadow
  filter backdrop-filter clip-path mask-image mask-size mask-position mask-repeat
  -webkit-mask-image -webkit-mask-size -webkit-mask-position -webkit-mask-repeat
  transform transform-origin translate rotate scale perspective perspective-origin
  transform-style backface-visibility object-fit object-position
  font-family font-size font-weight font-style font-stretch line-height
  letter-spacing word-spacing white-space text-align text-transform
  text-decoration text-indent text-shadow vertical-align color
  -webkit-text-stroke-width -webkit-text-stroke-color -webkit-text-fill-color
  fill stroke stroke-width stroke-linejoin stroke-linecap stroke-dasharray
  stroke-dashoffset fill-opacity stroke-opacity fill-rule vector-effect paint-order
  flex-direction flex-wrap flex-grow flex-shrink flex-basis
  align-items align-content align-self justify-content justify-items justify-self
  gap grid-template-columns grid-template-rows grid-column grid-row order
  isolation mix-blend-mode
`
  .trim()
  .split(/\s+/);

export function piecePose(element: HTMLElement): Pose {
  const r = element.getBoundingClientRect();
  if (element.hasAttribute("data-basket-body")) {
    const width = element.offsetWidth,
      height = element.offsetHeight;
    return {
      left: r.left + (r.width - width) / 2,
      top: r.top + (r.height - height) / 2,
      width,
      height,
      rotation: (Number(element.dataset.basketRotation || 0) * 180) / Math.PI,
    };
  }
  let rotation = 0;
  for (
    let e: HTMLElement | null = element;
    e && e !== document.body;
    e = e.parentElement
  ) {
    const css = getComputedStyle(e);
    const transform = css.transform;
    if (transform !== "none") {
      const matrix = new DOMMatrixReadOnly(transform);
      rotation += Math.atan2(matrix.b, matrix.a);
    }
    // Tailwind uses the individual rotate property for the mobile basket.
    // It is not included in getComputedStyle(...).transform's matrix.
    const individual = css.rotate.match(/(-?[\d.]+)(deg|rad|turn)$/);
    if (individual) {
      const value = Number(individual[1]);
      rotation +=
        individual[2] === "rad"
          ? value
          : individual[2] === "turn"
            ? value * Math.PI * 2
            : (value * Math.PI) / 180;
    }
  }
  const w = element.offsetWidth || r.width,
    h = element.offsetHeight || r.height;
  const c = Math.abs(Math.cos(rotation)),
    s = Math.abs(Math.sin(rotation));
  const scale =
    (r.width / Math.max(1, w * c + h * s) +
      r.height / Math.max(1, w * s + h * c)) /
    2;
  const width = w * scale,
    height = h * scale;
  return {
    left: r.left + (r.width - width) / 2,
    top: r.top + (r.height - height) / 2,
    width,
    height,
    rotation: (rotation * 180) / Math.PI,
  };
}

/** Freeze presentation without moving the actual DOM or changing its layout. */
export function clonePresentation(source: HTMLElement, shell = false) {
  const clone = source.cloneNode(!shell) as HTMLElement;
  const originals = [
    source,
    ...(shell ? [] : source.querySelectorAll<HTMLElement>("*")),
  ];
  const copies = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
  originals.forEach((original, i) => {
    const copy = copies[i];
    const css = getComputedStyle(original);
    copy.style.cssText = PRESENTATION_PROPERTIES.map((property) => {
      const value = css.getPropertyValue(property);
      return value ? `${property}:${value};` : "";
    }).join("");
    copy.removeAttribute("id");
    copy.removeAttribute("data-abyss-hidden");
    copy.style?.setProperty("animation", "none", "important");
    copy.style?.setProperty("transition", "none", "important");
    copy.style?.setProperty("pointer-events", "none", "important");
    if (original instanceof HTMLImageElement) {
      const image = copy as HTMLImageElement;
      image.src = original.currentSrc || original.src;
      image.removeAttribute("srcset");
      image.loading = "eager";
    }
    if (
      original instanceof HTMLCanvasElement &&
      copy instanceof HTMLCanvasElement
    ) {
      try {
        copy.getContext("2d")?.drawImage(original, 0, 0);
      } catch {
        /* Unavailable video frame. */
      }
    }
    if (original instanceof HTMLVideoElement) {
      const frame = document.createElement("canvas");
      frame.width = Math.min(600, original.videoWidth || 300);
      frame.height =
        (frame.width * (original.videoHeight || 150)) /
        (original.videoWidth || 300);
      frame.style.cssText = copy.style.cssText;
      try {
        frame
          .getContext("2d")
          ?.drawImage(original, 0, 0, frame.width, frame.height);
      } catch {
        /* Loading frame. */
      }
      if (copy !== clone) copy.replaceWith(frame);
    }
  });
  clone.inert = true;
  clone.setAttribute("aria-hidden", "true");
  Object.assign(clone.style, {
    position: "absolute",
    left: "0",
    top: "0",
    right: "auto",
    bottom: "auto",
    margin: "0",
    minWidth: "0",
    minHeight: "0",
    maxWidth: "none",
    maxHeight: "none",
    transform: "none",
    translate: "none",
    rotate: "none",
    scale: "none",
    opacity: "1",
    visibility: "visible",
    transformOrigin: "50% 50%",
    willChange: "transform,opacity",
  });
  return clone;
}

function snapshotFrame(signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const done = () => {
      cancelAnimationFrame(frame);
      signal.removeEventListener("abort", done);
      resolve();
    };
    const frame = requestAnimationFrame(done);
    signal.addEventListener("abort", done, { once: true });
    if (signal.aborted) done();
  });
}

export async function createAbyssPieces(
  root: HTMLElement,
  source: HTMLElement | null | undefined,
  signal: AbortSignal,
) {
  const layer = document.createElement("div");
  layer.dataset.abyssPieces = "";
  Object.assign(layer.style, {
    position: "absolute",
    inset: "0",
    pointerEvents: "none",
    zIndex: "15",
  });
  root.appendChild(layer);
  const style = document.createElement("style");
  style.textContent =
    "[data-abyss-hidden]{opacity:0!important;pointer-events:none!important}[data-abyss-active] [data-bingo-grid]{border-color:transparent}";
  root.appendChild(style);
  const engine = Engine.create({
    enableSleeping: false,
    positionIterations: 4,
    velocityIterations: 3,
  });
  engine.gravity.scale = 0;
  const selected: HTMLElement[] = [];
  const visibility = new WeakMap<HTMLElement, boolean>();
  const hasVisibleStyle = (element: HTMLElement): boolean => {
    const cached = visibility.get(element);
    if (cached !== undefined) return cached;
    const css = getComputedStyle(element);
    const visible =
      css.display !== "none" &&
      css.visibility !== "hidden" &&
      Number(css.opacity) >= 0.04 &&
      (!element.parentElement ||
        element.parentElement === document.body ||
        hasVisibleStyle(element.parentElement));
    visibility.set(element, visible);
    return visible;
  };
  const select = (element: HTMLElement) => {
    if (
      root.contains(element) ||
      source === element ||
      source?.contains(element) ||
      element.contains(source || root)
    )
      return;
    if (
      selected.some(
        (parent) =>
          parent.contains(element) &&
          !parent.hasAttribute("data-abyss-surface"),
      )
    )
      return;
    const r = element.getBoundingClientRect();
    const footer = Boolean(element.closest("[data-bingo-footer],footer"));
    if (
      r.width < 4 ||
      r.height < 4 ||
      r.right < 0 ||
      r.left > innerWidth ||
      (!footer &&
        (r.bottom < -innerHeight * 0.6 || r.top > innerHeight * 1.5)) ||
      !hasVisibleStyle(element)
    )
      return;
    selected.push(element);
  };
  // Prefer authored units so footer squares, basket cutouts and nav boxes stay
  // intact; then collect nearby headings, text and visual objects independently.
  document
    .querySelectorAll<HTMLElement>(
      "[data-abyss-surface],[data-basket-shell],[data-basket-body],[data-bingo-cell],[data-abyss-piece],#site-header-root [data-header-right-box],#site-header-root [data-header-logo-main],#site-header-root [data-left-nav-item],#site-header-root [data-social-nav-item],#site-header-root [data-mobile-header-item]",
    )
    .forEach(select);
  document
    .querySelectorAll<HTMLElement>(
      "section h1,section h2,section h3,section p,section button,section a,section img,section svg,footer a,footer p,footer svg",
    )
    .forEach(select);
  // Assemble off-DOM, then mount together. Appending each copy between layout
  // reads would force the browser to recalculate the page once per piece.
  const fragment = document.createDocumentFragment();
  const pieces: {
    element: HTMLElement;
    clone: HTMLElement;
    body: Body;
    pose: Pose;
    scale: number;
    consumed: boolean;
    opacity: number;
    background: boolean;
    basket: boolean;
  }[] = [];
  const elements = selected.slice(0, innerWidth < 700 ? 76 : 110);
  let batchStart = performance.now();
  for (const [index, element] of elements.entries()) {
    if (signal.aborted) break;
    const pose = piecePose(element);
    const basket = element.hasAttribute("data-basket-shell");
    const background =
      element.hasAttribute("data-abyss-surface") ||
      (element instanceof HTMLImageElement &&
        Boolean(element.closest("[data-project-cta-panel]")));
    const clone = clonePresentation(
      element,
      element.hasAttribute("data-abyss-surface"),
    );
    clone.dataset.abyssPiece = "";
    clone.dataset.abyssKind = element.closest("#site-header-root")
      ? "nav"
      : element.closest("[data-bingo-footer],footer")
        ? "footer"
        : basket || element.hasAttribute("data-basket-body")
          ? "basket"
          : "content";
    Object.assign(clone.style, {
      width: `${pose.width}px`,
      height: `${pose.height}px`,
    });
    fragment.appendChild(clone);
    const body = Bodies.rectangle(
      pose.left + pose.width / 2,
      pose.top + pose.height / 2,
      Math.max(12, pose.width * 0.8),
      Math.max(12, pose.height * 0.8),
      {
        angle: (pose.rotation * Math.PI) / 180,
        frictionAir: 0.035,
        restitution: 0.35,
        // Background plates and the hollow basket should not shove overlapping
        // foreground objects apart as soon as the physics starts.
        collisionFilter: { category: 1, mask: background || basket ? 0 : 1 },
      },
    );
    Body.setAngularVelocity(body, Math.sin(index * 3.1) * 0.013);
    const piece = {
      element,
      clone,
      body,
      pose,
      scale: 1,
      opacity: Number(getComputedStyle(element).opacity),
      background,
      basket,
      consumed: false,
    };
    clone.style.transform = `translate(${pose.left}px,${pose.top}px) rotate(${pose.rotation}deg)`;
    pieces.push(piece);
    // Keep the portal responsive while snapshots are prepared, including
    // on slower phones. No live content is hidden until every copy is ready.
    if (performance.now() - batchStart > 4 && index < elements.length - 1) {
      await snapshotFrame(signal);
      batchStart = performance.now();
    }
  }
  if (signal.aborted) {
    layer.remove();
    style.remove();
    Engine.clear(engine);
    return null;
  }
  // Floating elements may have moved during preparation. Take their positions
  // together immediately before the handoff, so the copies don't jump.
  pieces.forEach((piece) => {
    const pose = piecePose(piece.element);
    piece.pose = pose;
    Body.setPosition(piece.body, {
      x: pose.left + pose.width / 2,
      y: pose.top + pose.height / 2,
    });
    Body.setAngle(piece.body, (pose.rotation * Math.PI) / 180);
    piece.clone.style.transform = `translate(${pose.left}px,${pose.top}px) rotate(${pose.rotation}deg)`;
  });
  layer.appendChild(fragment);
  Composite.add(
    engine.world,
    pieces.map((p) => p.body),
  );
  pieces.forEach((p) => p.element.setAttribute("data-abyss-hidden", ""));
  document.documentElement.setAttribute("data-abyss-active", "");
  const paused = new Set<gsap.core.Tween>();
  pieces.forEach(({ element }) => {
    if (element.closest("#site-header-root")) return;
    for (
      let e: HTMLElement | null = element;
      e && !e.matches("body,main,#smooth-content");
      e = e.parentElement
    ) {
      gsap.getTweensOf(e).forEach((tween) => {
        if (!tween.paused()) {
          tween.pause();
          paused.add(tween);
        }
      });
      if (e.matches("section,footer")) break;
    }
  });
  const controllers = new Set<NavSlotController>();
  const register = (match: string, controller: NavSlotController | null) => {
    if (controller && pieces.some((p) => p.element.matches(match)))
      controllers.add(controller);
  };
  register("[data-header-right-box]", getRightNavController());
  register("[data-left-nav-item]", getLeftNavController());
  register("[data-social-nav-item]", getSocialNavController());
  register('[data-mobile-header-role="nav"]', getMobileNavController());
  register(
    '[data-mobile-header-role="social"]',
    getMobileSocialNavController(),
  );
  let disposed = false;
  let released = false;
  let restoration: gsap.Context | null = null;

  return {
    count: pieces.length,
    release() {
      if (released) return;
      released = true;
      for (const piece of pieces) {
        if (!piece.basket) continue;
        // Join the other objects at the same instant, with a small tumble that
        // makes the basket readable even when it starts over the portal centre.
        piece.clone.style.zIndex = "30";
        Body.setVelocity(piece.body, { x: 2, y: innerWidth < 700 ? -5 : -7 });
        Body.setAngularVelocity(piece.body, -0.025);
      }
    },
    fade(timeline: gsap.core.Timeline, reduced: boolean) {
      timeline.to(layer, { opacity: 0, duration: reduced ? 0 : 0.2 }, 0);
    },
    step(dt: number, time: number, x: number, y: number) {
      let remaining = 0;
      const ramp = clamp(time / 2.8, 0, 1);
      for (const piece of pieces) {
        if (piece.consumed) continue;
        const body = piece.body;
        const dx = x - body.position.x,
          dy = y - body.position.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const pull =
          0.00016 + ramp * 0.0018 + Math.min(distance / 1000, 1) * 0.00025;
        const swirl = 0.0006 * (1 - ramp * 0.7);
        Body.applyForce(body, body.position, {
          x: ((dx / distance) * pull - (dy / distance) * swirl) * body.mass,
          y: ((dy / distance) * pull + (dx / distance) * swirl) * body.mass,
        });
        const swallowScale =
          clamp(distance / Math.max(150, innerWidth * 0.12), 0.015, 1) *
          clamp(1 - Math.max(0, time - 4.5) * 0.18, 0.08, 1);
        // Let the basket lift and tumble before it contracts into the portal.
        // This is part of the shared simulation, not a preceding side-hop.
        const desiredScale = piece.basket
          ? 1 + (swallowScale - 1) * clamp((time - 0.65) / 0.65, 0, 1)
          : swallowScale;
        const scale =
          piece.scale + (desiredScale - piece.scale) * Math.min(1, dt * 7);
        Body.scale(body, scale / piece.scale, scale / piece.scale);
        piece.scale = scale;
        if (scale < 0.42) body.collisionFilter.mask = 0;
        // A large object's centre can start inside the portal. Reaching it is
        // not enough: the object must have visibly shrunk before we remove it.
        if ((distance < 27 && scale < 0.08) || time > 8) {
          piece.consumed = true;
          Composite.remove(engine.world, body);
          piece.clone.style.opacity = "0";
          continue;
        }
        const speed = Math.hypot(body.velocity.x, body.velocity.y);
        if (speed > 34)
          Body.setVelocity(body, {
            x: (body.velocity.x / speed) * 34,
            y: (body.velocity.y / speed) * 34,
          });
        remaining++;
      }
      Engine.update(engine, Math.min(dt * 1000, 1000 / 30));
      for (const p of pieces) {
        if (p.consumed) continue;
        p.clone.style.transform = `translate3d(${p.body.position.x - p.pose.width / 2}px,${p.body.position.y - p.pose.height / 2}px,0) rotate(${p.body.angle}rad) scale(${p.scale})`;
        p.clone.style.opacity = String(clamp(p.scale * 2, 0, 1) * p.opacity);
      }
      root.dataset.abyssRemaining = String(remaining);
      return remaining;
    },
    restore(timeline: gsap.core.Timeline, at: number, reduced: boolean) {
      // Restore the live DOM, inside its original stacking/clip hierarchy.
      // Flat overlay copies must not pop in above the nav or section backgrounds.
      restoration = gsap.context(() => {
        timeline.call(
          () => {
            layer.style.display = "none";
          },
          [],
          at,
        );
        controllers.forEach((controller) => controller.setOpenImmediate(false));
        let order = 0;
        for (const piece of pieces) {
          const element = piece.element;
          if (!element.isConnected) continue;
          const nav = element.matches(
            '[data-header-right-box],[data-left-nav-item],[data-social-nav-item],[data-mobile-header-role="nav"],[data-mobile-header-role="social"]',
          );
          if (nav) {
            timeline.call(
              () => element.removeAttribute("data-abyss-hidden"),
              [],
              at,
            );
            continue;
          }
          const background = piece.background;
          const start =
            at +
            (reduced || background ? 0 : 0.16 + Math.min(order++ * 0.018, 0.4));
          // Matter owns the basket item's outer transform. Animate its artwork
          // only: GSAP's cached outer position can predate a drag or a throw.
          const artwork = element.hasAttribute("data-basket-body")
            ? element.querySelector<HTMLElement>(
                "[data-basket-artwork-plane]",
              ) || element
            : element;
          const scaleX = Number(gsap.getProperty(artwork, "scaleX")) || 1;
          const scaleY = Number(gsap.getProperty(artwork, "scaleY")) || 1;
          const opacity = piece.opacity;
          timeline.fromTo(
            artwork,
            {
              scaleX: scaleX * (background ? 0.92 : 0),
              scaleY: scaleY * (background ? 0.92 : 0),
              opacity: 0,
            },
            {
              scaleX,
              scaleY,
              opacity: opacity || 1,
              immediateRender: false,
              duration: reduced ? 0 : background ? 0.3 : 0.5,
              ease: background ? "power2.out" : "back.out(1.55)",
              onStart: () => element.removeAttribute("data-abyss-hidden"),
              onComplete: () => element.removeAttribute("data-abyss-hidden"),
            },
            start,
          );
        }
        timeline.call(
          () =>
            controllers.forEach((controller) => {
              if (reduced) controller.setOpenImmediate(true);
              else void controller.open();
            }),
          [],
          at + (reduced ? 0 : 0.16),
        );
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      restoration?.revert();
      pieces.forEach((piece) =>
        piece.element.removeAttribute("data-abyss-hidden"),
      );
      document.documentElement.removeAttribute("data-abyss-active");
      controllers.forEach((controller) => controller.setOpenImmediate(true));
      paused.forEach((tween) => tween.resume());
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      layer.remove();
      style.remove();
    },
  };
}
