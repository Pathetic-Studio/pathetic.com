import { UNIVERSE_BRANDS } from "./credibility-universe-data";

// Shared by the lightweight section and the deferred WebGL scene. Fetch marks
// early; a slow mark must never hold up the galaxy or the other six objects.
const images = new Map<string, Promise<HTMLImageElement | null>>();

function loadImage(path: string) {
  const existing = images.get(path);
  if (existing) return existing;
  const pending = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    const finish = () => {
      clearTimeout(timer);
      image.onload = image.onerror = null;
      if (!image.naturalWidth) images.delete(path);
      resolve(image.naturalWidth ? image : null);
    };
    const timer = window.setTimeout(finish, 5000);
    image.onload = image.onerror = finish;
    image.src = path;
  });
  images.set(path, pending);
  return pending;
}

export function universeLogo(file: string) {
  return loadImage(`/images/credibility/${file}`);
}

export function universeObjectImage(file: string) {
  return loadImage(`/images/credibility/objects/${file}`);
}

export function preloadUniverseLogos() {
  UNIVERSE_BRANDS.forEach((brand) => void universeLogo(brand.file));
}

export function preloadUniverseObjects() {
  UNIVERSE_BRANDS.forEach((brand) => void universeObjectImage(brand.image));
}
