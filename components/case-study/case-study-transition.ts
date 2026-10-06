import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import ScrollTrigger from "gsap/ScrollTrigger";

type Flight = {
  slug: string;
  overlay: HTMLDivElement;
  panel: HTMLDivElement;
  objects: HTMLElement[];
  timeout: ReturnType<typeof setTimeout>;
};
let flight: Flight | undefined;
let hiddenTargets: HTMLElement[] = [];

export const hasCaseStudyTransition = () => !!flight;

function finish() {
  const wasActive = !!flight || hiddenTargets.length > 0;
  if (flight) {
    clearTimeout(flight.timeout);
    gsap.killTweensOf([flight.panel, ...flight.objects, flight.overlay]);
    flight.overlay.remove();
    flight = undefined;
  }
  hiddenTargets.forEach((target) => {
    target.style.visibility = "";
  });
  hiddenTargets = [];
  document.documentElement.removeAttribute("data-case-transition");
  if (wasActive)
    window.dispatchEvent(new Event("app:case-transition-complete"));
}

function rectStyle(rect: DOMRect) {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

/** Capture before the old route disappears; the overlay lives outside ScrollSmoother. */
export function prepareCaseStudyTransition(link: HTMLAnchorElement) {
  const slug = link.dataset.caseStudyLink || link.dataset.caseNext;
  const nextPanel = link.closest<HTMLElement>("[data-case-next-panel]");
  const sources = Array.from(
    (nextPanel || link).querySelectorAll<HTMLElement>("[data-case-object]"),
  );
  const source = sources[0];
  if (
    !slug ||
    !source ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  finish();
  const overlay = document.createElement("div");
  overlay.dataset.caseTransitionOverlay = slug;
  overlay.setAttribute("aria-hidden", "true");
  overlay.inert = true;
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9000",
    pointerEvents: "none",
    overflow: "hidden",
  });
  const panel = document.createElement("div");
  const isNext = !!link.dataset.caseNext;
  const bounds = (isNext ? nextPanel || link : source).getBoundingClientRect();
  Object.assign(panel.style, {
    position: "absolute",
    background: link.dataset.caseAccent || "#e9e5df",
    overflow: "hidden",
    border: "1px solid #111",
    boxSizing: "border-box",
  });
  gsap.set(panel, { ...rectStyle(bounds), opacity: isNext ? 1 : 0 });
  if (isNext) {
    const copy = (nextPanel || link).cloneNode(true) as HTMLElement;
    copy.removeAttribute("href");
    copy
      .querySelectorAll("[data-case-object]")
      .forEach((object) => object.remove());
    Object.assign(copy.style, {
      margin: "0",
      position: "absolute",
      inset: "0 auto auto 0",
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      minHeight: "0",
      maxWidth: "none",
      border: "0",
      padding: getComputedStyle(nextPanel || link).padding,
    });
    panel.append(copy);
  }
  const objects = sources.map((source) => {
    const object = source.cloneNode(true) as HTMLElement;
    object.removeAttribute("data-case-object");
    // Freeze responsive sources at the already decoded image; no fetch in flight.
    source.querySelectorAll("img").forEach((img, i) => {
      const clone = object.querySelectorAll("img")[i];
      clone.removeAttribute("srcset");
      clone.removeAttribute("sizes");
      clone.src = img.currentSrc || img.src;
      clone.style.padding = getComputedStyle(img).padding;
    });
    Object.assign(object.style, {
      position: "absolute",
      margin: "0",
      padding: "0",
      transform: "none",
      transition: "none",
      aspectRatio: "auto",
      background: "transparent",
      overflow: "visible",
      boxShadow: "none",
      scale: "none",
    });
    const sourceRect = source.getBoundingClientRect();
    if (source.hasAttribute("data-case-physics-object")) {
      // getBoundingClientRect includes rotation. Preserve the moving body's
      // actual dimensions and angle instead of stretching that bounding box.
      const matrix = new DOMMatrixReadOnly(getComputedStyle(source).transform);
      gsap.set(object, {
        left: sourceRect.left + (sourceRect.width - source.offsetWidth) / 2,
        top: sourceRect.top + (sourceRect.height - source.offsetHeight) / 2,
        width: source.offsetWidth,
        height: source.offsetHeight,
        rotation: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
      });
    } else gsap.set(object, rectStyle(sourceRect));
    return object;
  });
  overlay.append(panel, ...objects);
  document.body.append(overlay);
  document.documentElement.setAttribute("data-case-transition", slug);
  flight = {
    slug,
    overlay,
    panel,
    objects,
    timeout: setTimeout(() => {
      finish();
      gsap.set("#page-transition-root", { opacity: 1 });
    }, 8000),
  };
}

export function leaveCaseStudy(page: HTMLElement, next: () => void) {
  if (!flight) return null;
  const current = flight;
  const inset = Math.max(12, Math.min(32, innerWidth * 0.0155));
  const width = Math.min(1440, innerWidth - inset * 2);
  const top =
    document.getElementById("site-header-root")?.getBoundingClientRect().bottom ??
    (innerWidth < 1280 ? 72 : 96);
  if (current.panel.firstElementChild) {
    const lift = top - current.panel.getBoundingClientRect().top;
    // Keep the departing page visible until the rising sheet covers it. Its
    // title and object travel with it, so a slow route never exposes a blank.
    const timeline = gsap.timeline({ onComplete: next });
    timeline.to(
      current.panel,
      {
        left: (innerWidth - width) / 2,
        top,
        width,
        height: innerHeight - top,
        duration: 0.42,
        ease: "power3.inOut",
        overwrite: "auto",
      },
      0,
    );
    timeline.to(
      current.objects,
      {
        y: lift,
        duration: 0.42,
        ease: "power3.inOut",
      },
      0,
    );
    timeline.to(page, { opacity: 0, duration: 0.06 }, 0.36);
    return () => timeline.kill();
  }
  // Begin lifting the next coloured panel, then route early. The real hero
  // determines the object's only flight path; there is no guessed midpoint.
  gsap.to(current.panel, {
    left: (innerWidth - width) / 2,
    top,
    width,
    height: innerHeight - top,
    opacity: 1,
    duration: 0.5,
    ease: "power3.inOut",
    overwrite: "auto",
  });
  const fade = gsap.to(page, { opacity: 0, duration: 0.2, ease: "power1.out" });
  const route = gsap.delayedCall(0.1, next);
  // The panel keeps moving while Next resolves and mounts the destination.
  return () => {
    fade.kill();
    route.kill();
  };
}

export function enterCaseStudy(page: HTMLElement, next: () => void) {
  if (!flight) return null;
  const current = flight;
  const panel = page.querySelector<HTMLElement>("[data-case-study-panel]");
  const targets = Array.from(
    panel?.querySelectorAll<HTMLElement>("[data-case-study-hero-object]") || [],
  );
  if (
    !targets.length ||
    !panel ||
    panel.dataset.caseStudyPanel !== current.slug
  ) {
    finish();
    return null;
  }
  const pairs = current.objects
    .map((object, index) => ({
      object,
      target:
        targets.find(
          (target) =>
            target.dataset.caseObjectKey === object.dataset.caseObjectKey,
        ) || targets[index],
    }))
    .filter((pair) => !!pair.target);
  hiddenTargets = pairs.map((pair) => pair.target);
  hiddenTargets.forEach((target) => {
    target.style.visibility = "hidden";
  });
  let timeline: gsap.core.Timeline | undefined;
  let frame = 0;
  let stableFrames = 0;
  let lastBounds: DOMRect | undefined;
  const started = performance.now();
  const alignScroll = () => {
    if (flight !== current) return;
    const smoother = ScrollSmoother.get();
    if (smoother) {
      if (Math.abs(smoother.scrollTop()) > 0.5) smoother.scrollTop(0);
    } else if (window.scrollY > 0.5) window.scrollTo(0, 0);
  };
  // A route rebuilds ScrollSmoother after React mounts the new page. A single
  // RAF can still measure it through the departing page's scroll transform.
  const settle = () => {
    if (flight !== current) return;
    alignScroll();
    const bounds = panel.getBoundingClientRect();
    const unchanged =
      lastBounds &&
      Math.abs(bounds.top - lastBounds.top) < 0.5 &&
      Math.abs(bounds.height - lastBounds.height) < 0.5;
    stableFrames = unchanged ? stableFrames + 1 : 0;
    lastBounds = bounds;
    if (stableFrames < 3 && performance.now() - started < 400) {
      frame = requestAnimationFrame(settle);
      return;
    }
    // Preserve each body's real size and rotation while the sheet moves.
    pairs.forEach(({ object }) => {
      const origin = object.getBoundingClientRect();
      gsap.set(object, {
        left: origin.left + (origin.width - object.offsetWidth) / 2,
        top: origin.top + (origin.height - object.offsetHeight) / 2,
        x: 0,
        y: 0,
      });
    });
    timeline = gsap.timeline({
      onComplete: () => {
        ScrollTrigger.removeEventListener("refresh", alignScroll);
        finish();
        next();
      },
    });
    timeline.to(
      current.panel,
      {
        ...rectStyle(bounds),
        duration: 0.42,
        ease: "power3.out",
        overwrite: "auto",
      },
      0,
    );
    pairs.forEach(({ object, target }) => {
      const origin = {
        left: Number(gsap.getProperty(object, "left")),
        top: Number(gsap.getProperty(object, "top")),
        width: Number(gsap.getProperty(object, "width")),
        height: Number(gsap.getProperty(object, "height")),
      };
      const rotation = Number(gsap.getProperty(object, "rotation")) || 0;
      // Keep the destination live through the flight: late font, physics or
      // scroller measurements must not leave a clone aimed at a stale rect.
      const progress = { value: 0 };
      timeline!.to(
        progress,
        {
          value: 1,
          duration: 0.52,
          ease: "power3.inOut",
          onUpdate: () => {
            alignScroll();
            const destination = rectStyle(target.getBoundingClientRect());
            const mix = (from: number, to: number) =>
              from + (to - from) * progress.value;
            gsap.set(object, {
              left: mix(origin.left, destination.left),
              top: mix(origin.top, destination.top),
              width: mix(origin.width, destination.width),
              height: mix(origin.height, destination.height),
              rotation: rotation * (1 - progress.value),
              autoRound: false,
            });
          },
        },
        0,
      );
    });
    if (current.panel.firstElementChild)
      timeline.to(
        current.panel.firstElementChild,
        { opacity: 0, duration: 0.18 },
        0,
      );
    timeline.to(page, { opacity: 1, duration: 0.25, ease: "power1.out" }, 0.18);
    timeline.to(current.panel, { opacity: 0, duration: 0.23 }, 0.22);
    // Hand off on one frame; never show a doubled object or scale it twice.
    timeline.call(
      () => {
        pairs.forEach(({ target, object }) => {
          target.style.visibility = "";
          object.style.visibility = "hidden";
        });
      },
      [],
      0.52,
    );
  };
  ScrollTrigger.addEventListener("refresh", alignScroll);
  frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(settle);
  });
  return () => {
    cancelAnimationFrame(frame);
    ScrollTrigger.removeEventListener("refresh", alignScroll);
    timeline?.kill();
    if (flight === current) finish();
  };
}

export const cancelCaseStudyTransition = finish;
