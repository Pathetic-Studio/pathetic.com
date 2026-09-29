export type LifecycleSlideTwoAsset = {
  key: string;
  src: string;
  alt: string;
};

const ASSET_ROOT = "/images/lifecycle/slide-2";

export const BUNDLED_SLIDE_TWO_CENTER: LifecycleSlideTwoAsset = {
  key: "center-pathetic-model",
  src: `${ASSET_ROOT}/center-pathetic-model.webp`,
  alt: "Model wearing a black Pathetic T-shirt and tall black boots",
};

// Apparel from Downloads/pathetic assets/to use, plus the supplied
// PATHETIC STUDIO WIREFRAMES photos. All assets are local WebPs.
export const BUNDLED_SLIDE_TWO_ORBIT: LifecycleSlideTwoAsset[] = [
  {
    key: "pathetic-rhinestone-tee",
    src: `${ASSET_ROOT}/pathetic/rhinestone-tee.webp`,
    alt: "Black PATHETIC rhinestone T-shirt",
  },
  {
    key: "pathetic-rhinestone-street-style",
    src: `${ASSET_ROOT}/pathetic/rhinestone-street-style.webp`,
    alt: "PATHETIC rhinestone T-shirt styled with sunglasses and a pink belt",
  },
  {
    key: "pathetic-party-friends",
    src: `${ASSET_ROOT}/pathetic/party-friends.webp`,
    alt: "Friends at a PATHETIC party in a red-lit bar",
  },
  {
    key: "pathetic-glasses-tee",
    src: `${ASSET_ROOT}/pathetic/glasses-tee.webp`,
    alt: "White PATHETIC chrome glasses T-shirt",
  },
  {
    key: "pathetic-basketball-editorial",
    src: `${ASSET_ROOT}/pathetic/basketball-editorial.webp`,
    alt: "PATHETIC graphic T-shirt and wide-leg jeans on a basketball court",
  },
  {
    key: "pathetic-party-merch-rail",
    src: `${ASSET_ROOT}/pathetic/party-merch-rail.webp`,
    alt: "Guests and a rail of PATHETIC T-shirts at a party",
  },
  {
    key: "pathetic-camo-hoodie",
    src: `${ASSET_ROOT}/pathetic/camo-hoodie.webp`,
    alt: "PATHETIC camouflage hoodie",
  },
  {
    key: "pathetic-party-crowd",
    src: `${ASSET_ROOT}/pathetic/party-crowd.webp`,
    alt: "PATHETIC party crowd beneath hanging stars and bunting",
  },
];
