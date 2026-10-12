// Same twelve procedural star frames, prepainted by
// scripts/generate-project-cta-star.mjs. Scrolling never computes their noise.
const W = 384, H = 224, FRAME_COUNT = 12, COLUMNS = 4;
let atlasPromise: Promise<HTMLImageElement | null> | null = null;

function loadFrames() {
  if (!atlasPromise) {
    const image = new Image();
    image.decoding = "async";
    image.src = "/images/project-cta/fuzzy-star-frames.webp";
    atlasPromise = image.decode().then(() => image).catch(() => {
      atlasPromise = null;
      return null;
    });
  }
  return atlasPromise;
}

export function createProjectFuzzyStar(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = W; canvas.height = H;
  let disposed = false, painted = -1;
  let atlas: HTMLImageElement | null = null;
  void loadFrames().then(image => { if (!disposed) atlas = image; });
  return {
    draw(time: number, reduced: boolean) {
      if (!atlas) return;
      const index = reduced ? 0 : Math.floor(time / 130) % FRAME_COUNT;
      if (index === painted) return;
      painted = index;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(atlas, index % COLUMNS * W, Math.floor(index / COLUMNS) * H, W, H, 0, 0, W, H);
    },
    dispose() { disposed = true; atlas = null; },
  };
}
