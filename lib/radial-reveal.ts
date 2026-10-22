export type RadialReveal = {
  x: number;
  y: number;
  radius: number;
  stretchX: number;
  feather: number;
  bottom: number;
};

// A soft oval with an eased falloff, shared by the backdrop and the nav masks.
// Sampling the same gradient avoids a separate, visibly delayed nav fade.
export function radialRevealGradient(reveal: RadialReveal, channels: string) {
  const outer = Math.max(.01, reveal.radius + reveal.feather);
  const inner = Math.max(0, reveal.radius - reveal.feather);
  const stops = [1, .97, .84, .5, .16, .03, 0].map((alpha, index) => {
    const distance = inner + (outer - inner) * index / 6;
    return `rgb(${channels} / ${alpha}) ${distance / outer * 100}%`;
  });
  return `radial-gradient(ellipse ${outer * reveal.stretchX}px ${outer}px at ${reveal.x}px ${reveal.y}px, ${stops.join(", ")})`;
}
