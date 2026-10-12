// Prepaint the existing procedural noise once, rather than on visitors' phones.
// Run: node scripts/generate-project-cta-star.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next")] }));
// The navigation's wide five-point star. Its clouded edge is prepainted at a
// small resolution; cycling it needs no live blur filter or WebGL context.
const POINTS = [
  [107.099, 0], [132.382, 42.0475], [214.198, 42.0475], [148.007, 68.0342],
  [173.29, 110.082], [107.099, 84.095], [40.9082, 110.082], [66.1908, 68.0342],
  [0, 42.0475], [81.8164, 42.0475],
];
const W = 384, H = 224, FRAME_COUNT = 12;

function hash(x, y) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967295;
}

function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const tx = x - ix, ty = y - iy;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const a = hash(ix, iy), b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function distanceToStar(x, y) {
  let distance = Infinity, inside = false;
  for (let i = 0, j = POINTS.length - 1; i < POINTS.length; j = i++) {
    const ax = POINTS[j][0], ay = POINTS[j][1], bx = POINTS[i][0], by = POINTS[i][1];
    const ex = bx - ax, ey = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey)));
    distance = Math.min(distance, Math.hypot(x - ax - t * ex, y - ay - t * ey));
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside ? -distance : distance;
}

const columns = 4;
const width = W * columns, height = H * Math.ceil(FRAME_COUNT / columns);
const pixels = Buffer.alloc(width * height * 4);
const distances = new Float32Array(W * H);
for (let frame = 0; frame < FRAME_COUNT; frame++) {
  const phase = frame / FRAME_COUNT * Math.PI * 2;
  const offsetX = Math.cos(phase) * .8, offsetY = Math.sin(phase) * .8;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const index = y * W + x;
    if (!frame) distances[index] = distanceToStar(x / W * 254 - 20, y / H * 148 - 19);
    const cloud = noise(x * .042 + offsetX, y * .042 + offsetY) - .5;
    const detail = noise(x * .15 - offsetY, y * .15 + offsetX) - .5;
    const edge = distances[index] + cloud * 7 + detail * 1.3;
    const alpha = 1 / (1 + Math.exp((edge - 1.5) / 4.6));
    const grain = (hash(x + frame * 13, y) - .5) * .06 * alpha * (1 - alpha);
    const destination = ((Math.floor(frame / columns) * H + y) * width + frame % columns * W + x) * 4;
    pixels[destination] = 216; pixels[destination + 1] = 255; pixels[destination + 2] = 0;
    pixels[destination + 3] = Math.round((alpha + grain) * 246);
  }
}
const output = fileURLToPath(new URL('../public/images/project-cta/fuzzy-star-frames.webp', import.meta.url));
await sharp(pixels, { raw: { width, height, channels: 4 } }).webp({ lossless: true, effort: 6 }).toFile(output);
console.log(output);
