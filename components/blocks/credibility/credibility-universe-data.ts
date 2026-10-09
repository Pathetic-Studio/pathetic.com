export type UniverseLabelStyle = "button" | "on-object";
// Local presentation switch; the previous white marks remain available.
export const UNIVERSE_LABEL_STYLE: UniverseLabelStyle = "button";
export type UniverseObjectStyle = "images" | "models";
// Keep the procedural 3D objects available beside the image-based version.
export const UNIVERSE_OBJECT_STYLE: UniverseObjectStyle = "images";

export const UNIVERSE_BRANDS = [
  {
    name: "Adidas",
    file: "adidas.svg",
    color: "#536bea",
    kind: "rocket",
    image: "rocket.webp",
    imageSize: 3.2,
    radius: 0.7,
    angle: 2.64,
    wordmarkHeight: 0.33,
  },
  {
    name: "DoorDash",
    file: "doordash.svg",
    color: "#ff643e",
    kind: "comet",
    image: "asteroid.webp",
    imageSize: 2,
    radius: 0.57,
    angle: 0.45,
    wordmarkHeight: 0.72,
  },
  {
    name: "Square",
    file: "square.webp",
    color: "#759cad",
    kind: "ufo",
    image: "ufo.webp",
    imageSize: 3.2,
    radius: 0.65,
    angle: -0.2,
    wordmarkHeight: 0.76,
  },
  {
    name: "Synthesia",
    file: "synthesia.svg",
    color: "#aa88e9",
    kind: "star",
    image: "mars.webp",
    imageSize: 2.3,
    radius: 0.65,
    angle: -0.9,
    wordmarkHeight: 0.83,
  },
  {
    name: "Deel",
    file: "deel.svg",
    color: "#857cf9",
    kind: "ring",
    image: "neptune.webp",
    imageSize: 2.25,
    radius: 0.8,
    angle: 1.53,
    wordmarkHeight: 1,
  },
  {
    name: "MUBI",
    file: "mubi.webp",
    color: "#aaafc2",
    kind: "moon",
    image: "moon.webp",
    imageSize: 2,
    radius: 0.6,
    angle: -2.04,
    wordmarkHeight: 0.64,
  },
  {
    name: "Cash App",
    file: "cash-app.svg",
    color: "#46cc79",
    kind: "ring",
    image: "saturn.webp",
    imageSize: 3.4,
    radius: 0.76,
    angle: -2.95,
    wordmarkHeight: 0.6,
  },
] as const;

export const TAU = Math.PI * 2;
export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
export function seededRandom(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
