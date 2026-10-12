// The navigation's wide five-point star. Its clouded edge is prepainted at a
// small resolution; cycling it needs no live blur filter or WebGL context.
const POINTS = [
  [107.099, 0], [132.382, 42.0475], [214.198, 42.0475], [148.007, 68.0342],
  [173.29, 110.082], [107.099, 84.095], [40.9082, 110.082], [66.1908, 68.0342],
  [0, 42.0475], [81.8164, 42.0475],
];
const W = 384, H = 224, FRAME_COUNT = 12;

function hash(x: number, y: number) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967295;
}

function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const tx = x - ix, ty = y - iy;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const a = hash(ix, iy), b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function distanceToStar(x: number, y: number) {
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

export function createProjectFuzzyStar(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = W; canvas.height = H;
  const frames: HTMLCanvasElement[] = [];
  let disposed = false, painted = -1, row = 0;
  const distances = new Float32Array(W * H);
  let pixels = ctx.createImageData(W, H);
  const build = () => {
    if (disposed) return;
    // Prepare in short batches so entering the section doesn't block scrolling.
    const deadline = performance.now() + 5;
    const phase = frames.length / FRAME_COUNT * Math.PI * 2;
    const offsetX = Math.cos(phase) * .8, offsetY = Math.sin(phase) * .8;
    do {
      const y = row++;
      for (let x = 0; x < W; x++) {
        const index = y * W + x;
        if (!frames.length) distances[index] = distanceToStar(x / W * 254 - 20, y / H * 148 - 19);
        // Moving value noise gives the blurred silhouette a soft clouded edge,
        // without the visible grid produced by intersecting sine waves.
        const cloud = noise(x * .042 + offsetX, y * .042 + offsetY) - .5;
        const detail = noise(x * .15 - offsetY, y * .15 + offsetX) - .5;
        const edge = distances[index] + cloud * 7 + detail * 1.3;
        const alpha = 1 / (1 + Math.exp((edge - 1.5) / 4.6));
        const grain = (hash(x + frames.length * 13, y) - .5) * .06 * alpha * (1 - alpha);
        pixels.data[index * 4] = 216; pixels.data[index * 4 + 1] = 255; pixels.data[index * 4 + 2] = 0;
        pixels.data[index * 4 + 3] = Math.round((alpha + grain) * 246);
      }
    } while (row < H && performance.now() < deadline);
    if (row === H) {
      const frame = document.createElement("canvas"); frame.width = W; frame.height = H;
      frame.getContext("2d")!.putImageData(pixels, 0, 0);
      frames.push(frame); row = 0;
      pixels = ctx.createImageData(W, H);
    }
    if (frames.length < FRAME_COUNT) schedule();
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => { timer = setTimeout(build, 16); };
  schedule();
  return {
    draw(time: number, reduced: boolean) {
      if (!frames.length) return;
      const index = reduced || frames.length < FRAME_COUNT ? 0 : Math.floor(time / 130) % frames.length;
      if (index === painted) return;
      painted = index; ctx.clearRect(0, 0, W, H); ctx.drawImage(frames[index], 0, 0);
    },
    dispose() { disposed = true; clearTimeout(timer); frames.length = 0; },
  };
}
