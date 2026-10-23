import {
  INSTAGRAM_SNAPSHOT,
  type InstagramProfile,
} from "@/lib/instagram/profile";
import { renderSceneArtwork } from "@/lib/scene-artwork";
import { drawProfileArtwork } from "./network-profile-artwork";

export const SCREEN_WIDTH = 600;
export const SCREEN_HEIGHT = 1300;

/** Render the connected profile, with a local snapshot when it is unavailable. */
export async function createProfileScreen(
  onProfile?: (profile: InstagramProfile) => void,
  live = false,
) {
  const canvas = document.createElement("canvas");
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;
  let profile = INSTAGRAM_SNAPSHOT;
  if (live) {
    try {
      const response = await fetch("/api/instagram/profile", {
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) profile = (await response.json()) as InstagramProfile;
    } catch {
      /* The phone remains usable offline or without an account connection. */
    }
  }
  onProfile?.(profile);
  const load = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      const timeout = window.setTimeout(() => {
        image.src = "";
        resolve(null);
      }, 1600);
      image.decoding = "async";
      image.onload = async () => {
        clearTimeout(timeout);
        try {
          await image.decode();
          resolve(image);
        } catch {
          resolve(null);
        }
      };
      image.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };
      image.src = src;
    });
  const [avatar, logo, ...posts] = await Promise.all([
    load(profile.avatar),
    load(INSTAGRAM_SNAPSHOT.avatar),
    ...Array.from({ length: 6 }, (_, i) =>
      load(profile.media[i]?.image || INSTAGRAM_SNAPSHOT.media[i].image),
    ),
  ]);
  const images = [avatar, logo, ...posts];
  const bitmap = await renderSceneArtwork({ kind: "profile", profile }, images);
  if (bitmap?.[0]) return { image: bitmap[0], source: profile.source };
  await drawProfileArtwork(canvas, profile, images);
  return { image: canvas, source: profile.source };
}

/** Seeded fractures stay anchored to the impact, in the screen's UV space. */
export function drawGlassImpact(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  seed: number,
  strength = 1,
) {
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const paths: Array<Array<[number, number]>> = [];
  const rays = 9 + Math.floor(random() * 5);
  for (let ray = 0; ray < rays; ray++) {
    const angle = (ray / rays) * Math.PI * 2 + (random() - 0.5) * 0.38;
    const length = (75 + random() * 390) * strength;
    const points: Array<[number, number]> = [[x, y]];
    const steps = 5 + Math.floor(random() * 7);
    for (let step = 1; step <= steps; step++) {
      const distance = (length * step) / steps;
      const bend = ((random() - 0.5) * 22 * step) / steps;
      const px = x + Math.cos(angle) * distance - Math.sin(angle) * bend;
      const py = y + Math.sin(angle) * distance + Math.cos(angle) * bend;
      points.push([px, py]);
      if (step > 1 && random() > 0.45) {
        const branchAngle =
          angle + (random() > 0.5 ? 1 : -1) * (0.25 + random() * 0.8);
        const branchLength = length * (0.08 + random() * 0.19);
        paths.push([
          [px, py],
          [
            px + Math.cos(branchAngle) * branchLength * 0.5,
            py + Math.sin(branchAngle) * branchLength * 0.5,
          ],
          [
            px + Math.cos(branchAngle + 0.12) * branchLength,
            py + Math.sin(branchAngle + 0.12) * branchLength,
          ],
        ]);
      }
    }
    paths.push(points);
  }
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "miter";
  // A dark fracture and an offset specular edge read on both white and dark UI.
  for (const [color, width, offset] of [
    ["rgba(6,13,22,.64)", 2.3, 0],
    ["rgba(245,252,255,.92)", 1, 1.4],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    paths.forEach((points) => {
      ctx.moveTo(points[0][0] + offset, points[0][1]);
      points.slice(1).forEach(([px, py]) => ctx.lineTo(px + offset, py));
    });
    ctx.stroke();
  }
  for (let shard = 0; shard < 10; shard++) {
    const sx = x + (random() - 0.5) * 26;
    const sy = y + (random() - 0.5) * 26;
    ctx.fillStyle = shard % 2 ? "rgba(255,255,255,.65)" : "rgba(20,29,35,.28)";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + random() * 10, sy + 3);
    ctx.lineTo(sx - 3, sy + random() * 13);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
