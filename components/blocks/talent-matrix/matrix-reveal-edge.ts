const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

export function matrixRevealFeather(softness: number) {
  return clamp(softness * 1.45, 0.14, 0.3);
}

/**
 * The old scene is alpha-blended away over a broad vertical band. The Matrix
 * columns sit across this band and provide the irregular, per-string edge.
 */
export function matrixRevealSoftMask(progress: number, softness: number) {
  const cleanProgress = clamp(progress, 0, 1);
  const feather = matrixRevealFeather(softness);
  const front = cleanProgress * (1 + feather * 2) - feather;
  const clear = (front - feather) * 100;
  const centre = front * 100;
  const solid = (front + feather) * 100;
  const firstMist = clear + (centre - clear) * 0.34;
  const secondMist = clear + (centre - clear) * 0.74;

  return `linear-gradient(to bottom,
    transparent ${clear.toFixed(3)}%,
    rgba(0, 0, 0, 0.08) ${firstMist.toFixed(3)}%,
    rgba(0, 0, 0, 0.34) ${secondMist.toFixed(3)}%,
    rgba(0, 0, 0, 0.72) ${centre.toFixed(3)}%,
    #000 ${solid.toFixed(3)}%)`;
}
