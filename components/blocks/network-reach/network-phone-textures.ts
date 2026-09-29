import {
  INSTAGRAM_SNAPSHOT,
  type InstagramProfile,
} from "@/lib/instagram/profile";

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
  const ctx = canvas.getContext("2d")!;
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
  canvas.dataset.profileSource = profile.source;
  onProfile?.(profile);
  const load = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      const timeout = window.setTimeout(() => {
        image.src = "";
        resolve(null);
      }, 1600);
      image.onload = () => {
        clearTimeout(timeout);
        resolve(image);
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
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const text = (
    copy: string,
    x: number,
    y: number,
    size = 22,
    bold = false,
    color = "#17191b",
  ) => {
    ctx.fillStyle = color;
    ctx.font = `${bold ? 700 : 400} ${size}px Arial, sans-serif`;
    ctx.fillText(copy, x, y);
  };
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  const panel = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill = "#eff0f3",
    radius = 10,
  ) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  };
  const icon = (name: string, x: number, y: number, size = 32) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 24, size / 24);
    ctx.strokeStyle = "#17191b";
    ctx.fillStyle = "#17191b";
    ctx.lineWidth = 1.65;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (name === "plus") {
      ctx.roundRect(2, 2, 20, 20, 5);
      ctx.stroke();
      line(7, 12, 17, 12);
      line(12, 7, 12, 17);
    }
    if (name === "menu") {
      for (const y of [5, 12, 19]) line(2, y, 22, y);
    }
    if (name === "heart") {
      ctx.moveTo(12, 21);
      ctx.bezierCurveTo(-8, 8, 4, -3, 12, 6);
      ctx.bezierCurveTo(20, -3, 32, 8, 12, 21);
      ctx.stroke();
    }
    if (name === "grid") {
      for (let a = 0; a < 3; a++)
        for (let b = 0; b < 3; b++) ctx.rect(2 + a * 7, 2 + b * 7, 5, 5);
      ctx.stroke();
    }
    if (name === "reel") {
      ctx.roundRect(2, 2, 20, 20, 5);
      ctx.stroke();
      line(2, 8, 22, 8);
      line(8, 2, 12, 8);
      line(15, 2, 19, 8);
      ctx.beginPath();
      ctx.moveTo(9, 11);
      ctx.lineTo(16, 15);
      ctx.lineTo(9, 19);
      ctx.closePath();
      ctx.stroke();
    }
    if (name === "tag") {
      ctx.moveTo(2, 5);
      ctx.lineTo(8, 5);
      ctx.lineTo(12, 1);
      ctx.lineTo(16, 5);
      ctx.lineTo(22, 5);
      ctx.lineTo(22, 23);
      ctx.lineTo(2, 23);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 11, 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 21, 5, Math.PI, 0);
      ctx.stroke();
    }
    if (name === "repeat") {
      ctx.moveTo(4, 10);
      ctx.lineTo(4, 5);
      ctx.lineTo(20, 5);
      ctx.lineTo(17, 2);
      ctx.moveTo(20, 5);
      ctx.lineTo(17, 8);
      ctx.moveTo(20, 14);
      ctx.lineTo(20, 19);
      ctx.lineTo(4, 19);
      ctx.lineTo(7, 22);
      ctx.moveTo(4, 19);
      ctx.lineTo(7, 16);
      ctx.stroke();
    }
    if (name === "home") {
      ctx.moveTo(2, 10);
      ctx.lineTo(12, 2);
      ctx.lineTo(22, 10);
      ctx.lineTo(22, 22);
      ctx.lineTo(15, 22);
      ctx.lineTo(15, 14);
      ctx.lineTo(9, 14);
      ctx.lineTo(9, 22);
      ctx.lineTo(2, 22);
      ctx.closePath();
      ctx.stroke();
    }
    if (name === "search") {
      ctx.arc(10, 10, 8, 0, Math.PI * 2);
      ctx.stroke();
      line(16, 16, 23, 23);
    }
    ctx.restore();
  };
  text("12:28", 40, 46, 22, true);
  // Native-looking status symbols, leaving the centre clear for Dynamic Island.
  ctx.fillStyle = "#111";
  for (let i = 0; i < 4; i++)
    ctx.fillRect(464 + i * 7, 43 - i * 4, 5, 5 + i * 4);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  for (const radius of [5, 10, 15]) {
    ctx.beginPath();
    ctx.arc(517, 47, radius, Math.PI * 1.23, Math.PI * 1.77);
    ctx.stroke();
  }
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(542, 28, 32, 16, 4);
  ctx.stroke();
  panel(545, 31, 24, 10, "#111", 2);
  panel(575, 33, 3, 6, "#8a8d90", 1);
  icon("plus", 31, 91, 31);
  text(profile.username, 218, 117, 33, true);
  text("⌄", 354, 116, 24);
  icon("heart", 465, 91, 30);
  icon("menu", 535, 92, 28);
  panel(485, 83, 23, 23, "#ff3040", 12);
  text("9+", 488, 99, 13, true, "#fff");
  const drawAvatar = (x: number, y: number, r: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#fff";
    ctx.fill();
    const pic = avatar || logo;
    if (pic) {
      if (pic === logo || profile.avatar.endsWith(".svg"))
        ctx.drawImage(pic, x - r * 0.83, y - r * 0.36, r * 1.66, r * 0.72);
      else ctx.drawImage(pic, x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
    ctx.strokeStyle = "#dedfe3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r + 5, 0, Math.PI * 2);
    ctx.stroke();
  };
  drawAvatar(89, 233, 59);
  panel(119, 265, 29, 29, "#17191b", 15);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  line(126, 280, 142, 280);
  line(134, 272, 134, 288);
  text(profile.name.slice(0, 22), 181, 195, 21, true);
  // The supplied account is verified; use the familiar blue rosette and check.
  ctx.fillStyle = "#3897f0";
  ctx.beginPath();
  for (let i = 0; i < 20; i++) {
    const a = (i * Math.PI) / 10;
    const r = i % 2 ? 10 : 12;
    const x = 310 + Math.cos(a) * r,
      y = 189 + Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(304, 189);
  ctx.lineTo(308, 193);
  ctx.lineTo(317, 184);
  ctx.stroke();
  const count = (n: number) =>
    n >= 10000
      ? new Intl.NumberFormat("en-US", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(n)
      : n.toLocaleString("en-US");
  [
    [count(profile.posts), "posts", 182],
    [count(profile.followers), "followers", 306],
    [count(profile.following), "following", 450],
  ].forEach(([n, label, x]) => {
    text(String(n), Number(x), 246, 28, true);
    text(String(label), Number(x), 274, 19);
  });
  text("Art", 25, 332, 20, false, "#8b8e95");
  const bioLines: string[] = [];
  for (const paragraph of profile.biography.split("\n")) {
    let current = "";
    for (const word of paragraph.split(" ")) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > 45) {
        bioLines.push(current);
        current = word;
      } else current = next;
    }
    if (current) bioLines.push(current);
  }
  bioLines.slice(0, 3).forEach((copy, i) => text(copy, 25, 362 + i * 29, 22));
  text("@catty", 25, 451, 21, false, "#405de6");
  text("www.pathetic.com", 25, 480, 22, true, "#405de6");
  panel(23, 502, 153, 31);
  panel(187, 502, 190, 31);
  text("@ pathetic", 36, 523, 17, true);
  text("Unpaid interns", 203, 523, 17, true);
  panel(22, 551, 556, 81);
  text("Professional dashboard", 40, 583, 22, true);
  text("Tools and resources for creators", 40, 611, 19, false, "#777c85");
  ["Edit profile", "Share profile", "Email"].forEach((label, i) => {
    panel(22 + i * 188, 649, 178, 45);
    text(label, 40 + i * 188, 678, 20, true);
  });
  ["grid", "reel", "repeat", "tag"].forEach((name, i) =>
    icon(name, 58 + i * 150, 727, 29),
  );
  ctx.strokeStyle = "#e8e9ed";
  ctx.lineWidth = 1;
  line(0, 777, 600, 777);
  panel(0, 775, 150, 3, "#17191b", 0);
  for (let i = 0; i < 6; i++) {
    const img = posts[i];
    if (!img) continue;
    const x = (i % 3) * 200,
      y = 782 + Math.floor(i / 3) * 244;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, 198, 242);
    ctx.clip();
    const scale = Math.max(198 / img.width, 242 / img.height);
    ctx.drawImage(
      img,
      x + (198 - img.width * scale) / 2,
      y + (242 - img.height * scale) / 2,
      img.width * scale,
      img.height * scale,
    );
    ctx.restore();
  }
  panel(0, 1196, 600, 104, "rgba(255,255,255,.97)", 0);
  ctx.strokeStyle = "#dadde0";
  line(0, 1196, 600, 1196);
  ["home", "search", "plus", "reel"].forEach((name, i) =>
    icon(name, 40 + i * 118, 1216, 32),
  );
  drawAvatar(528, 1233, 17);
  panel(196, 1280, 208, 7, "#111", 4);
  return canvas;
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
