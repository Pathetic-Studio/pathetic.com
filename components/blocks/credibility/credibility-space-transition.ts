export type SpaceTransition = {
  progress: number;
  // The original chrome renderer follows a body in the shared space simulation.
  glasses?: {
    x: number;
    y: number;
    angle: number;
    version: number;
    width?: number;
    height?: number;
    offsetX?: number;
    offsetY?: number;
  };
};

export function spaceRange(value: number, start: number, end: number) {
  return Math.max(0, Math.min(1, (value - start) / (end - start)));
}

export function spaceRadial(
  progress: number,
  width: number,
  height: number,
  top = 0,
) {
  const stretchX = 2.8;
  const feather = Math.max(90, height * 0.22) * spaceRange(progress, 0, 0.12);
  const x = width * 0.5,
    y = height * 1.1;
  const radius =
    Math.pow(spaceRange(progress, 0, 0.66), 0.92) *
    (Math.hypot((width * 0.5) / stretchX, y) + feather);
  return { x, y: y + top, radius, stretchX, feather, bottom: top + height };
}

// Leave the top-centre berth free for the real glasses from the previous scene.
export const SPACE_POSITIONS = [
  [0.22, 0.25],
  [0.68, 0.23],
  [0.87, 0.32],
  [0.88, 0.66],
  [0.12, 0.52],
  [0.53, 0.84],
  [0.32, 0.84],
  [0.13, 0.79],
  [0.75, 0.84],
] as const;
