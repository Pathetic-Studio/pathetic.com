export type IntroSprite = { _key?: string; url?: string | null };

export const PATHETIC_INTRO_SPRITES: IntroSprite[] = [
  { _key: "intro-red-boot", url: "/images/page-loader/red-boot.webp" },
  { _key: "intro-silver-ring", url: "/images/page-loader/silver-ring.webp" },
  { _key: "intro-silver-ipod", url: "/images/page-loader/silver-ipod.webp" },
  { _key: "intro-city-bike", url: "/images/page-loader/city-bike.webp" },
  { _key: "intro-coffee-brick", url: "/images/page-loader/coffee-brick.webp" },
  { _key: "intro-flowers", url: "/images/page-loader/flowers.webp" },
  { _key: "intro-yellow-sunglasses", url: "/images/page-loader/yellow-sunglasses.webp" },
  { _key: "intro-silver-prada-shoes", url: "/images/page-loader/silver-prada-shoes.webp" },
  { _key: "intro-baggu-bag", url: "/images/page-loader/baggu-bag.webp" },
  { _key: "intro-espresso-cup", url: "/images/page-loader/espresso-cup.webp" },
  { _key: "intro-oyster-platter", url: "/images/page-loader/oyster-platter.webp" },
];

export function getIntroSprites(data: {
  usePatheticIntroPreset?: boolean | null;
  feature?: { images?: IntroSprite[] | null } | null;
}): IntroSprite[] {
  return data.usePatheticIntroPreset !== false
    ? PATHETIC_INTRO_SPRITES
    : (data.feature?.images ?? []).filter((image) => image.url);
}
