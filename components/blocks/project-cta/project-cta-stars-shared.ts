export const STAR_COLOR = "#FF248E";
// Jobs/navigation five-point silhouette, squashed vertically by 20%. Using
// its broader centre keeps the stars fat, rather than long, thin starbursts.
export const STAR_OUTLINE = [
  [0, .4886], [.125, .1364], [.5, .1364], [.1818, -.0795], [.2955, -.4432],
  [0, -.2273], [-.2955, -.4432], [-.1818, -.0795], [-.5, .1364], [-.125, .1364],
].map(([x, y]) => [x, y * .8]);
export const STAR_CAPACITY = 384;
export const STAR_THICKNESS = .12;
export const STAR_BEVEL = .012;
// position xyz, quaternion xyzw, size, entrance scale, palette index, stable id
export const STAR_STRIDE = 11;
export type StarPileCommand =
  | { type: "resize"; width: number; height: number; depth: number; cameraDistance: number; target: number; generation: number }
  | { type: "active" | "visible"; value: boolean }
  | { type: "pointer"; x: number; y: number; vx: number; vy: number }
  | { type: "recycle"; buffer: ArrayBuffer };
export type StarPileFrame = {
  buffer: ArrayBuffer; count: number; generation: number; moving: boolean; depthSpan: number; tilted: number; target: number;
};
