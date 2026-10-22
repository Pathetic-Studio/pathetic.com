import { clamp } from "./credibility-universe-data";

// Reuse the DOM nodes and numeric state; no layout reads in the animation loop.
export function createSpaceCallout(hit: HTMLButtonElement, index: number) {
  const callout = hit.querySelector<HTMLElement>("[data-space-callout]")!;
  const line = hit.querySelector<SVGPolylineElement>("[data-space-line]")!;
  const square = hit.querySelector<SVGRectElement>("[data-space-endpoint]")!;
  const coordinates = hit.querySelector<HTMLElement>(
    "[data-space-coordinates]",
  )!;
  const message = hit.querySelector<HTMLElement>("[data-space-message]");
  let x = 0,
    y = 0,
    initialized = false,
    wasInspected = false;
  let typedAt = 0,
    lastCoordinates = -1;
  const phrase = "Cooking up your next meme";

  return (options: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    viewportWidth: number;
    viewportHeight: number;
    labelWidth: number;
    labelHeight: number;
    inspected: boolean;
    compact: boolean;
    time: number;
    dt: number;
    quiet: boolean;
    pointerX: number;
    pointerY: number;
    pointerActive: boolean;
  }) => {
    const o = options;
    const labelWidth = message ? (o.compact ? 142 : 172) : o.labelWidth;
    const labelHeight = message ? (o.compact ? 29 : 34) : o.labelHeight;
    const left = o.centerX - o.width / 2,
      top = o.centerY - o.height / 2;
    const driftX = o.quiet ? 0 : Math.sin(o.time * 0.75 + index) * 4;
    const driftY = o.quiet ? 0 : Math.sin(o.time * 0.6 + index * 2) * 3;
    const mouseX = o.pointerActive
      ? clamp((o.pointerX - o.centerX) * 0.06, -7, 7)
      : 0;
    const mouseY = o.pointerActive
      ? clamp((o.pointerY - o.centerY) * 0.04, -4, 4)
      : 0;
    const targetX = o.inspected
      ? clamp(
          (o.compact ? 24 : 40) + driftX + mouseX,
          12 - left,
          o.viewportWidth - left - labelWidth - 22,
        )
      : (o.width - labelWidth) / 2;
    const targetY = o.inspected
      ? clamp(
          o.height + (o.compact ? 24 : 32) + driftY + mouseY,
          12 - top,
          o.viewportHeight - top - labelHeight - 36,
        )
      : o.height + 8;
    const ease = !initialized || o.quiet ? 1 : 1 - Math.exp(-12 * o.dt);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    initialized = true;
    callout.style.width = `${labelWidth}px`;
    callout.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`;
    const endX = x - 10,
      endY = y + Math.min(labelHeight / 2, 12);
    // The origin is the exact bottom-left corner of the object's outline.
    line.setAttribute(
      "points",
      `0,${o.height} ${endX - 12},${endY} ${endX},${endY}`,
    );
    square.setAttribute("x", String(endX - 2));
    square.setAttribute("y", String(endY - 2));
    if (o.inspected && !wasInspected) typedAt = o.time;
    if (message) {
      const letters = o.quiet
        ? phrase.length
        : Math.floor((o.time - typedAt) * 32);
      const text = o.inspected ? phrase.slice(0, Math.max(0, letters)) : "";
      if (message.textContent !== text) message.textContent = text;
    }
    if (
      o.inspected &&
      (o.time - lastCoordinates > 0.1 || !wasInspected || o.quiet)
    ) {
      const ra = Math.round(clamp(o.centerX / o.viewportWidth, 0, 1) * 86399);
      const dec = (0.5 - o.centerY / o.viewportHeight) * 180;
      const arc = Math.round(Math.abs(dec) * 3600);
      const pad = (n: number) => String(n).padStart(2, "0");
      coordinates.textContent = `RA ${pad(Math.floor(ra / 3600))}h ${pad(Math.floor(ra / 60) % 60)}m ${pad(ra % 60)}s\nDEC ${dec < 0 ? "−" : "+"}${pad(Math.floor(arc / 3600))}° ${pad(Math.floor(arc / 60) % 60)}′ ${pad(arc % 60)}″`;
      lastCoordinates = o.time;
    }
    wasInspected = o.inspected;
  };
}
