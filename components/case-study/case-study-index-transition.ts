import gsap from "gsap";

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
  copy.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  copy
    .querySelectorAll("script, iframe, video, audio")
    .forEach((node) => node.remove());
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
  const timeline = gsap.timeline({
    onComplete: () => {
      clearCaseIndexTransition();
      next();
    },
  });
  if (oldPage)
    timeline.to(oldPage, { opacity: 0, duration: 0.18, ease: "power1.out" }, 0);
  timeline.to(
    page,
    { opacity: 1, duration: 0.24, ease: "power1.out" },
    oldPage ? 0.1 : 0,
  );
  return () => {
    timeline.kill();
    clearCaseIndexTransition();
  };
}
