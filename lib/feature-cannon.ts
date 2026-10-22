export const MEME_STAR_COLOURS = ["#f13486", "#0e94fb", "#53eb79"] as const;

export type CannonImage = { url?: string | null; colour?: string };
// 128px cutouts cover the 30–32px particles even at 4× DPR, without decoding
// the full-size scene artwork on the first hover.
const hats: CannonImage[] = ["hat-beret", "hat-camo", "hat-orange", "hat-yellow"].map(name => ({ url: `/images/header/cannon/${name}.webp` }));
const drinks: CannonImage[] = ["coffee-pourover", "coffee-machine", "coffee-brick", "coffee-mug", "coffee-instant", "reformative-matcha", "cafe-matcha", "coffee-moka", "coffee-cup", "coffee-speckled-cup"].map(name => ({ url: `/images/header/cannon/${name}.webp` }));
const blue: CannonImage[] = Array.from({ length: 3 }, () => ({ url: "/images/project-cta/memebooth-star-2.png" }));
const matrix: CannonImage[] = Array.from({ length: 3 }, () => ({ url: "/images/project-cta/memebooth-star-3.png", colour: "#00ff46" }));

/** Read on every volley so holding hover while scrolling changes the cannon too. */
export function getFeatureCannon(root: HTMLElement) {
  const header = root.closest<HTMLElement>("#site-header-root");
  if (header?.dataset.headerVisualMode === "matrix") return { images: matrix, size: 16, count: 12 };
  const section = root.closest<HTMLElement>("[data-header-feature-root]")?.dataset.headerSectionArtwork;
  if (section === "wardrobe") return { images: hats, size: 32, count: 6 };
  if (section === "services") return { images: drinks, size: 30, count: 6 };
  if (section === "belief") return { images: blue, size: 16, count: 12 };
  return null;
}

const decodedImages = new Map<string, HTMLImageElement>();

/** Decode on section entry, before the first volley. Keep only these tiny assets. */
export function warmFeatureCannon(root: HTMLElement) {
  getFeatureCannon(root)?.images.forEach(({ url }) => {
    if (!url || decodedImages.has(url)) return;
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    decodedImages.set(url, image);
    void image.decode().catch(() => decodedImages.delete(url));
  });
}
