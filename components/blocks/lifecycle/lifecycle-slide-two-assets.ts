export type LifecycleSlideTwoAsset = {
  key: string;
  src: string;
  alt: string;
};

const ASSET_ROOT = "/images/lifecycle/slide-2";

export const BUNDLED_SLIDE_TWO_CENTER: LifecycleSlideTwoAsset = {
  key: "center-outfit",
  src: `${ASSET_ROOT}/center-outfit.webp`,
  alt: "Person wearing an oversized black leather outfit",
};

// Clockwise from the right-hand side to mirror the supplied layout reference.
export const BUNDLED_SLIDE_TWO_ORBIT: LifecycleSlideTwoAsset[] = [
  {
    key: "leather-jacket",
    src: `${ASSET_ROOT}/leather-jacket.webp`,
    alt: "Black leather jacket with an orange stripe",
  },
  {
    key: "charm-necklace",
    src: `${ASSET_ROOT}/charm-necklace.webp`,
    alt: "Gold and pink charm necklace",
  },
  {
    key: "graphic-tshirt",
    src: `${ASSET_ROOT}/graphic-tshirt.webp`,
    alt: "White graphic T-shirt",
  },
  {
    key: "awoke-vintage-bag",
    src: `${ASSET_ROOT}/awoke-vintage-bag.webp`,
    alt: "Pink Awoke Vintage tote bag",
  },
  {
    key: "orange-boots",
    src: `${ASSET_ROOT}/orange-boots.webp`,
    alt: "Pair of tall orange boots",
  },
  {
    key: "coffee-cup",
    src: `${ASSET_ROOT}/coffee-cup.webp`,
    alt: "Decorated coffee cup and saucer",
  },
  {
    key: "lamb-shirt",
    src: `${ASSET_ROOT}/lamb-shirt.webp`,
    alt: "Green T-shirt printed with a lamb",
  },
  {
    key: "food-bowl",
    src: `${ASSET_ROOT}/food-bowl.webp`,
    alt: "Bowl of food",
  },
  {
    key: "ceramic-mug",
    src: `${ASSET_ROOT}/ceramic-mug.webp`,
    alt: "Blue patterned ceramic mug",
  },
  {
    key: "black-dog",
    src: `${ASSET_ROOT}/black-dog.webp`,
    alt: "Small black dog wearing bows",
  },
];
