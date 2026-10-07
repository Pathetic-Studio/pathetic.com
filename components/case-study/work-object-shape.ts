import { Bodies, Body, type Vector } from "matter-js";

export type WorkShape = { parts: Vector[][]; hull: Vector[] };
const cache = new Map<string, Promise<WorkShape>>();
const rectangle = (left = 0, right = 1): WorkShape => {
  const hull = [
    { x: left, y: 0 },
    { x: right, y: 0 },
    { x: right, y: 1 },
    { x: left, y: 1 },
  ];
  return { parts: [hull], hull };
};
const cross = (o: Vector, a: Vector, b: Vector) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
function hull(points: Vector[]) {
  const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const half = (list: Vector[]) => {
    const result: Vector[] = [];
    for (const p of list) {
      while (result.length > 1 && cross(result.at(-2)!, result.at(-1)!, p) <= 0)
        result.pop();
      result.push(p);
    }
    result.pop();
    return result;
  };
  return [...half(sorted), ...half(sorted.reverse())];
}
function area(points: Vector[]) {
  return (
    Math.abs(
      points.reduce((sum, p, i) => {
        const q = points[(i + 1) % points.length];
        return sum + p.x * q.y - q.x * p.y;
      }, 0),
    ) / 2
  );
}
function centre(points: Vector[]): Vector {
  let x = 0,
    y = 0,
    sum = 0;
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length],
      a = p.x * q.y - q.x * p.y;
    sum += a;
    x += (p.x + q.x) * a;
    y += (p.y + q.y) * a;
  });
  return { x: x / (3 * sum), y: y / (3 * sum) };
}

/** Decode and trace once. Concave artwork uses small convex bands, including
 * separate sides of the ring, so its hole and the pan handle remain physical. */
export function getWorkShape(element: HTMLElement): Promise<WorkShape> {
  const art = element.querySelector<HTMLElement>("[data-work-art]")!;
  const preview = art.querySelector<HTMLElement>("[data-work-preview]");
  const video = art.querySelector<HTMLVideoElement>("video");
  if (preview?.dataset.previewPhase === "video" && video) {
    const width = parseFloat(video.style.width || "100") / 100;
    return Promise.resolve(rectangle((1 - width) / 2, (1 + width) / 2));
  }
  const image = art.querySelector<HTMLImageElement>("img");
  if (!image) return Promise.resolve(rectangle());
  const ratio = parseFloat(art.style.getPropertyValue("--ratio")) || 1;
  const style = getComputedStyle(image);
  const key = [
    image.currentSrc || image.src,
    ratio,
    style.objectFit,
    style.objectPosition,
    style.transform,
  ].join("|");
  const existing = cache.get(key);
  if (existing) return existing;
  const task = (async () => {
    // Offscreen lazy images must be available before their first physics frame.
    image.loading = "eager";
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(160 * Math.min(1, ratio));
    canvas.height = Math.round(160 / Math.max(1, ratio));
    const { width, height } = canvas;
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    const fit = style.objectFit === "cover" ? Math.max : Math.min;
    const scale = fit(width / image.naturalWidth, height / image.naturalHeight);
    const w = image.naturalWidth * scale,
      h = image.naturalHeight * scale;
    const position = style.objectPosition
      .split(" ")
      .map((v) => parseFloat(v) / 100);
    const matrix = new DOMMatrixReadOnly(
      style.transform === "none" ? undefined : style.transform,
    );
    context.translate(width / 2, height / 2);
    context.transform(matrix.a, matrix.b, matrix.c, matrix.d, 0, 0);
    context.drawImage(
      image,
      (width - w) * (position[0] ?? 0.5) - width / 2,
      (height - h) * (position[1] ?? 0.5) - height / 2,
      w,
      h,
    );
    const pixels = context.getImageData(0, 0, width, height).data;
    const points: Vector[] = [],
      bands: Vector[][] = [];
    let opaque = 0;
    for (let top = 0; top < height; top += 10) {
      const groups: { left: number; right: number; points: Vector[] }[] = [];
      for (let y = top; y < Math.min(height, top + 10); y++) {
        for (let x = 0; x < width; ) {
          if (pixels[(y * width + x) * 4 + 3] < 48) {
            x++;
            continue;
          }
          const left = x;
          while (x < width && pixels[(y * width + x) * 4 + 3] >= 48) {
            x++;
            opaque++;
          }
          const right = x;
          if (right - left < 2) continue;
          const run = [
            { x: left, y },
            { x: right, y },
            { x: right, y: y + 1 },
            { x: left, y: y + 1 },
          ];
          points.push(...run);
          const group = groups.find(
            (g) => left <= g.right + 1 && right >= g.left - 1,
          );
          if (group) {
            group.left = Math.min(group.left, left);
            group.right = Math.max(group.right, right);
            group.points.push(...run);
          } else groups.push({ left, right, points: run });
        }
      }
      for (const group of groups) {
        const polygon = hull(group.points);
        if (polygon.length > 2 && area(polygon) > 6) bands.push(polygon);
      }
    }
    if (points.length < 3) return rectangle();
    const outline = hull(points);
    const normalize = (p: Vector) => ({ x: p.x / width, y: p.y / height });
    // Nearly convex objects need only one part. Avoid hundreds of tiny text
    // fragments for title cards; the card silhouette is the useful boundary.
    const parts =
      area(outline) <= opaque * 1.12 || bands.length > 40 ? [outline] : bands;
    return {
      parts: parts.map((p) => p.map(normalize)),
      hull: outline.map(normalize),
    };
  })().catch(() => {
    cache.delete(key);
    return rectangle();
  });
  cache.set(key, task);
  return task;
}

export function createWorkBody(
  shape: WorkShape,
  width: number,
  height: number,
) {
  const options = {
    restitution: 0.5,
    friction: 0.2,
    frictionAir: 0.016,
    slop: 0.15,
  };
  const parts = shape.parts.map((polygon) => {
    const vertices = polygon.map((p) => ({ x: p.x * width, y: p.y * height }));
    const c = centre(vertices);
    return Bodies.fromVertices(
      c.x,
      c.y,
      [vertices],
      options,
      true,
      0.05,
      0,
      0.05,
    );
  });
  const body =
    parts.length === 1 ? parts[0] : Body.create({ ...options, parts });
  return {
    body,
    offset: { x: body.position.x - width / 2, y: body.position.y - height / 2 },
  };
}
