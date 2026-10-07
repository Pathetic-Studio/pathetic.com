import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import ScrollTrigger from "gsap/ScrollTrigger";

let snapshot: HTMLDivElement | null = null;
let deadline: ReturnType<typeof setTimeout> | undefined;

export function clearCaseIndexTransition() {
  if (deadline) clearTimeout(deadline);
  deadline = undefined;
  if (snapshot) {
    gsap.killTweensOf(snapshot);
    snapshot.remove();
    snapshot = null;
  }
}

/** Keep the departing content visible while the next route is being fetched. */
export function leaveForCaseIndex(page: HTMLElement, next: () => void) {
  clearCaseIndexTransition();
  const rect = page.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.dataset.caseIndexSnapshot = "";
  layer.inert = true;
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, {
    position: "fixed",
    inset: "0",
    zIndex: "8000",
    overflow: "hidden",
    pointerEvents: "none",
    background: "white",
  });
  const copy = page.cloneNode(true) as HTMLElement;
  copy.removeAttribute("id");
  const identifiedSources = page.querySelectorAll<HTMLElement>("[id]");
  copy.querySelectorAll<HTMLElement>("[id]").forEach((node, index) => {
    const source = identifiedSources[index];
    // Some CMS blocks size themselves with ID-scoped CSS (the home spacer,
    // for example). Removing those IDs used to collapse the cloned layout.
    if (source instanceof HTMLElement) {
      const computed = getComputedStyle(source);
      for (const property of [
        "height",
        "min-height",
        "max-height",
        "width",
        "min-width",
        "max-width",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "margin-top",
        "margin-right",
        "margin-bottom",
        "margin-left",
        "box-sizing",
      ])
        node.style.setProperty(property, computed.getPropertyValue(property));
    }
    node.removeAttribute("id");
  });
  const mediaSources = page.querySelectorAll<HTMLElement>(
    "iframe, video, audio",
  );
  copy
    .querySelectorAll<HTMLElement>("iframe, video, audio")
    .forEach((node, index) => {
      const source = mediaSources[index];
      const placeholder = document.createElement(
        source instanceof HTMLVideoElement && source.readyState >= 2
          ? "canvas"
          : "div",
      );
      placeholder.className = node.className;
      placeholder.style.cssText = node.style.cssText;
      const computed = getComputedStyle(source);
      placeholder.style.width = computed.width;
      placeholder.style.height = computed.height;
      if (
        source instanceof HTMLVideoElement &&
        placeholder instanceof HTMLCanvasElement
      ) {
        placeholder.width = Math.min(source.videoWidth, 960);
        placeholder.height = Math.round(
          (placeholder.width * source.videoHeight) / source.videoWidth,
        );
        placeholder.style.objectFit = computed.objectFit;
        placeholder.style.objectPosition = computed.objectPosition;
        try {
          placeholder
            .getContext("2d")
            ?.drawImage(source, 0, 0, placeholder.width, placeholder.height);
        } catch {
          // A video can lose its decoded frame during route teardown. Keep
          // its dimensions even when there is no frame left to capture.
        }
      } else if (source instanceof HTMLVideoElement && source.poster) {
        placeholder.style.backgroundImage = `url(${JSON.stringify(source.poster)})`;
        placeholder.style.backgroundSize = computed.objectFit;
        placeholder.style.backgroundPosition = computed.objectPosition;
        placeholder.style.backgroundRepeat = "no-repeat";
      }
      node.replaceWith(placeholder);
    });
  copy.querySelectorAll("script").forEach((node) => node.remove());
  // The clone is a static visual only; no hidden videos or duplicate IDs.
  Object.assign(copy.style, {
    position: "absolute",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    margin: "0",
    opacity: "1",
    transform: "none",
  });
  layer.append(copy);
  document.body.append(layer);
  snapshot = layer;
  gsap.set(page, { opacity: 0 });
  deadline = setTimeout(() => {
    clearCaseIndexTransition();
    gsap.set(page, { opacity: 1 });
  }, 8000);
  next();
  // Persist until the incoming page is ready, not merely until its URL changes.
  return () => {};
}

export function enterCaseIndex(page: HTMLElement, next: () => void) {
  if (!page.querySelector("[data-case-study-index]")) {
    clearCaseIndexTransition();
    return null;
  }
  const oldPage = snapshot;
  let frame = 0;
  let timeline: gsap.core.Timeline | undefined;
  let previousHeight = -1,
    stableFrames = 0;
  const started = performance.now();
  const align = () => {
    const wrapper = document.getElementById("smooth-wrapper");
    if (wrapper) wrapper.scrollTop = 0;
    const smoother = ScrollSmoother.get();
    if (smoother) {
      if (Math.abs(smoother.scrollTop()) > 0.5) smoother.scrollTop(0);
    } else if (Math.abs(window.scrollY) > 0.5) window.scrollTo(0, 0);
  };
  ScrollTrigger.addEventListener("refresh", align);
  const settle = () => {
    align();
    const height = page.scrollHeight;
    stableFrames = height === previousHeight ? stableFrames + 1 : 0;
    previousHeight = height;
    if (stableFrames < 3 && performance.now() - started < 450) {
      frame = requestAnimationFrame(settle);
      return;
    }
    timeline = gsap.timeline({
      onUpdate: align,
      onComplete: () => {
        align();
        ScrollTrigger.removeEventListener("refresh", align);
        clearCaseIndexTransition();
        next();
      },
    });
    if (oldPage)
      timeline.to(
        oldPage,
        { opacity: 0, duration: 0.18, ease: "power1.out" },
        0,
      );
    timeline.to(
      page,
      { opacity: 1, duration: 0.24, ease: "power1.out" },
      oldPage ? 0.1 : 0,
    );
  };
  frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(settle);
  });
  return () => {
    cancelAnimationFrame(frame);
    timeline?.kill();
    ScrollTrigger.removeEventListener("refresh", align);
    clearCaseIndexTransition();
  };
}
