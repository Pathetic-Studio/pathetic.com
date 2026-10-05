const WARDROBE = "/images/what-we-are/wardrobe";
export type OutfitPiece = {
  asset: string;
  left: number;
  top: number;
  width: number;
  angle?: number;
};
export const ROLES = [
  {
    id: "media",
    label: "Idea first, medium agnostic.",
    copy: "We start with big ideas. Our talent matrix executes them in any format.",
    hat: "hat-camo",
    hatName: "Camouflage cap",
    hatWidth: 376,
    hatHeight: 332,
    head: { left: 43.75, top: 15.6, width: 12.5 },
    outfit: [
      { asset: "posed/media-shorts", left: 34.25, top: 50.5, width: 31.5 },
      { asset: "posed/media-jacket", left: 19, top: 28, width: 62 },
      { asset: "posed/media-boot-left", left: 22, top: 71, width: 17.5 },
      { asset: "posed/media-boot-right", left: 60.5, top: 71, width: 17.5 },
      { asset: "blue-bottle", left: 82, top: 32, width: 7, angle: -12 },
    ],
  },
  {
    id: "studio",
    label: "Built for idea flow",
    copy: "We build internal tools to automate processes and spend more time ideating.",
    hat: "hat-yellow",
    hatName: "Yellow knit hat",
    hatWidth: 550,
    hatHeight: 427,
    head: { left: 42.5, top: 11.8, width: 15 },
    outfit: [
      { asset: "posed/studio-shorts", left: 35.5, top: 52, width: 29 },
      { asset: "posed/studio-jersey", left: 31.5, top: 28, width: 37 },
      { asset: "posed/studio-shoe-left", left: 22, top: 86.5, width: 11 },
      { asset: "posed/studio-shoe-right", left: 66, top: 86.5, width: 11 },
      { asset: "beer-glass", left: 81, top: 34, width: 7, angle: 8 },
    ],
  },
  {
    id: "apparel",
    label: "At the intersection of tech, creativity and culture.",
    copy: "We bring ideas from fashion and entertainment to Silicon Valley’s biggest brands.",
    hat: "hat-orange",
    hatName: "Orange beanie",
    hatWidth: 550,
    hatHeight: 433,
    head: { left: 42.5, top: 11.8, width: 15 },
    outfit: [
      { asset: "posed/apparel-dress", left: 32.5, top: 29.5, width: 35 },
      { asset: "posed/apparel-shoe-left", left: 23.5, top: 87, width: 10 },
      { asset: "posed/apparel-shoe-right", left: 68, top: 87, width: 10 },
      { asset: "handbag", left: 79, top: 32, width: 15, angle: 9 },
    ],
  },
  {
    id: "distribution",
    label: "Students of the internet",
    copy: "Our founders spent 20+ collective years lurking, creating and building brands online.",
    hat: "hat-beret",
    hatName: "Black beret",
    hatWidth: 550,
    hatHeight: 249,
    head: { left: 41.5, top: 15.5, width: 17 },
    outfit: [
      { asset: "posed/distribution-outfit", left: 17.5, top: 28, width: 65 },
      { asset: "whisky", left: 81, top: 31, width: 8, angle: -7 },
    ],
  },
] as const;
export type RoleId = (typeof ROLES)[number]["id"];
export const wardrobeAsset = (name: string) => `${WARDROBE}/${name}.webp`;
