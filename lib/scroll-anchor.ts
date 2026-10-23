import ScrollTrigger from "gsap/ScrollTrigger";

/** Resolve anchors inside pinned sequences to the point where they are revealed. */
export function getAnchorScrollY(
  target: HTMLElement,
  currentScroll: number,
  offsetPx?: number,
) {
  if (offsetPx === undefined && target.matches("[data-sequence-talent]")) {
    const sequence = ScrollTrigger.getById("what-we-do-matrix-reveal");
    if (sequence) {
      return sequence.start + (sequence.end - sequence.start) * 0.88;
    }
  }

  const margin = offsetPx ?? (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
  return currentScroll + target.getBoundingClientRect().top - margin;
}
