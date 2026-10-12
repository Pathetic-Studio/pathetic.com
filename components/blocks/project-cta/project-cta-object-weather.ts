export type FortuneWeatherMode = "rain" | "cannons";

// Transparent cutouts from the existing meme compositions. Add new objects here.
export const FORTUNE_OBJECTS = [
  "coffee-cup", "performative-cap", "cafe-cap", "performative-guinness",
  "reformative-matcha", "grooming-perfume", "cafe-prada-boot", "cafe-ipod",
  "cafe-brazil-shirt", "coffee-brick", "cafe-phone-case", "cafe-baggu",
  "cafe-yellow-sunglasses", "coffee-moka", "grooming-shoes", "performative-martini",
  "cafe-orange-bag", "coffee-pourover", "cafe-pastry", "reformative-shoe",
].map(name => `/images/lifecycle/memes/${name}.webp`);

type Drop = {
  image: HTMLImageElement;
  x: number; y: number; vx: number; vy: number;
  size: number; angle: number; spin: number; depth: number; phase: number;
};

/** A bounded, recycled image field. No extra WebGL context or physics worker. */
export function createProjectObjectWeather(canvas: HTMLCanvasElement, mode: FortuneWeatherMode) {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return null;
  const images: HTMLImageElement[] = [];
  const drops: Drop[] = [];
  let width = 1, height = 1, active = false, visible = false, disposed = false;
  let raf = 0, lastTime = 0, elapsed = 0, spawnTime = 0, nextImage = 0, volley = 0;
  let pointerX = -10000, pointerY = -10000, pointerTime = 0;
  let currentMode = mode;
  const random = (min: number, max: number) => min + Math.random() * (max - min);

  for (const src of FORTUNE_OBJECTS) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    void image.decode().then(() => {
      if (!disposed) { images.push(image); wake(); }
    }).catch(() => {});
  }

  function resize() {
    const oldWidth = width, oldHeight = height;
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio, width < 700 ? 1.5 : 1.25);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (const drop of drops) { drop.x *= width / oldWidth; drop.y *= height / oldHeight; }
  }

  function spawn(initial = false) {
    if (!images.length) return;
    const depth = random(.55, 1);
    const size = (width < 700 ? random(60, 100) : random(96, 174)) * depth;
    const drop: Drop = {
      image: images[nextImage++ % images.length],
      x: random(0, width), y: initial ? random(-size, height) : -size,
      vx: random(-22, 22), vy: random(92, 164) * depth,
      size, angle: random(-.45, .45), spin: random(-.48, .48), depth, phase: random(0, 6.28),
    };
    if (currentMode === "cannons") {
      const left = volley++ % 2 === 0;
      drop.x = left ? -size : width + size;
      drop.y = height * random(.64, .98);
      const flight = random(1.45, 2.2);
      const landingX = width * random(.24, .76);
      drop.vx = (landingX - drop.x) / flight;
      drop.vy = -random(330, 510);
      drop.spin = random(-1.1, 1.1);
    }
    drops.push(drop);
  }

  function render(time: number) {
    raf = 0;
    if (disposed || !visible || document.hidden) { lastTime = 0; return; }
    const dt = Math.min(.035, lastTime ? (time - lastTime) / 1000 : 1 / 60);
    lastTime = time; elapsed += dt;
    const capacity = width < 700 ? 15 : 30;
    if (active && images.length) {
      // Give the first reveal an existing shower, rather than several blank seconds.
      if (!drops.length && currentMode === "rain") {
        for (let i = 0; i < (width < 700 ? 7 : 14); i++) spawn(true);
      }
      spawnTime -= dt;
      if (spawnTime <= 0 && drops.length < capacity) {
        spawn();
        spawnTime = currentMode === "rain" ? (width < 700 ? .66 : .31) : .2;
      }
    }
    context!.clearRect(0, 0, width, height);
    const pointerFresh = time - pointerTime < 650;
    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i];
      if (pointerFresh) {
        const dx = drop.x - pointerX, dy = drop.y - pointerY;
        const distance = Math.hypot(dx, dy);
        if (distance < 180 && distance > 1) {
          const force = (1 - distance / 180) * 430 * dt;
          drop.vx += (dx - dy * .6) / distance * force;
          drop.vy += (dy + dx * .6) / distance * force;
        }
      }
      if (currentMode === "cannons" || !active) drop.vy += (active ? 300 : 650) * dt;
      else {
        drop.vy += (140 * drop.depth - drop.vy) * dt * .4;
        drop.vx += (Math.sin(elapsed * .65 + drop.phase) * 24 - drop.vx) * dt * .5;
      }
      drop.x += drop.vx * dt; drop.y += drop.vy * dt; drop.angle += drop.spin * dt;
      if (drop.y > height + drop.size * 2 || drop.x < -width * .5 || drop.x > width * 1.5) {
        drops.splice(i, 1); continue;
      }
      const aspect = drop.image.naturalWidth / drop.image.naturalHeight;
      const w = aspect > 1 ? drop.size : drop.size * aspect;
      const h = aspect > 1 ? drop.size / aspect : drop.size;
      context!.save();
      context!.translate(drop.x, drop.y);
      context!.rotate(drop.angle);
      // Gentle depth turns keep the cutouts dimensional and legible.
      context!.scale(.88 + .12 * Math.cos(elapsed * .65 + drop.phase), 1);
      context!.drawImage(drop.image, -w / 2, -h / 2, w, h);
      context!.restore();
    }
    canvas.dataset.objectCount = String(drops.length);
    canvas.dataset.weatherMode = currentMode;
    if (active || drops.length) raf = requestAnimationFrame(render);
  }

  function wake() { if (!raf && visible && !disposed && !document.hidden) raf = requestAnimationFrame(render); }
  const visibilityChange = () => { lastTime = 0; wake(); };
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visibilityChange);
  resize();
  return {
    setActive(value: boolean) { active = value; wake(); },
    setVisible(value: boolean) {
      visible = value;
      if (!value) {
        cancelAnimationFrame(raf); raf = 0; lastTime = 0; drops.length = 0;
        canvas.dataset.objectCount = "0";
        context.clearRect(0, 0, width, height);
      }
      else wake();
    },
    setMode(value: FortuneWeatherMode) { currentMode = value; drops.length = 0; spawnTime = 0; wake(); },
    movePointer(x: number, y: number) { pointerX = x; pointerY = y; pointerTime = performance.now(); },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); drops.length = images.length = 0;
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibilityChange);
      context.clearRect(0, 0, width, height);
    },
  };
}
