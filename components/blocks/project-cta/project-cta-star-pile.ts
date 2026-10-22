import * as THREE from "three";
import { STAR_BEVEL, STAR_COLOR, STAR_OUTLINE, STAR_CAPACITY, STAR_STRIDE, STAR_THICKNESS, type StarPileCommand, type StarPileFrame } from "./project-cta-stars-shared";

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,.5)");
  gradient.addColorStop(.35, "rgba(255,255,255,.22)");
  gradient.addColorStop(.7, "rgba(255,255,255,.055)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

/** Render at display rate; simulate the deep, freely rotating pile off-thread. */
export function createProjectStarPile(host: HTMLElement, options: { glow?: boolean } = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  let worker: Worker;
  try { worker = new Worker(new URL("./project-cta-star-pile.worker.ts", import.meta.url)); }
  catch (error) { renderer.dispose(); renderer.forceContextLoss(); throw error; }
  const send = (command: StarPileCommand, transfer: Transferable[] = []) => worker.postMessage(command, transfer);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  const shape = new THREE.Shape();
  STAR_OUTLINE.forEach(([x, y], i) => {
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  });
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: STAR_THICKNESS, bevelEnabled: true, bevelSize: STAR_BEVEL, bevelThickness: STAR_BEVEL, bevelSegments: 1, steps: 1, curveSegments: 1,
  });
  geometry.translate(0, 0, -STAR_THICKNESS / 2);
  // Same unlit, un-tonemapped finish as Jobs: bright on every face, at every depth.
  const material = new THREE.MeshBasicMaterial({ color: STAR_COLOR, toneMapped: false });
  const stars = new THREE.InstancedMesh(geometry, material, STAR_CAPACITY);
  stars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  stars.frustumCulled = false; stars.count = 0;
  scene.add(stars);
  // One extra instanced draw for all halos, instead of a full-screen bloom pass
  // or hundreds of individual sprites. The colour remains solid fluorescent pink.
  const glowTexture = createGlowTexture();
  const glowGeometry = new THREE.PlaneGeometry(1, 1);
  const glowMaterial = new THREE.MeshBasicMaterial({
    map: glowTexture, color: STAR_COLOR, transparent: true, opacity: .32,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const glow = new THREE.InstancedMesh(glowGeometry, glowMaterial, STAR_CAPACITY);
  glow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  glow.frustumCulled = false; glow.count = 0; glow.visible = options.glow !== false;
  scene.add(glow);
  const dummy = new THREE.Object3D(), halo = new THREE.Object3D(), nextQuaternion = new THREE.Quaternion();
  let previous: Float32Array<ArrayBuffer> | null = null, current: Float32Array<ArrayBuffer> | null = null;
  let count = 0, received = 0, previousReceived = 0, moving = false;
  const previousById = new Map<number, number>();
  const previousOffsets = new Int16Array(STAR_CAPACITY);
  let depth = 1.7, pixelWidth = 0, pixelHeight = 0, generation = 0;
  let active = false, visible = false, disposed = false, raf = 0;
  let pointerRaf = 0, pointerTime = 0, pointerX = 0, pointerY = 0;
  let clientX = 0, clientY = 0, worldWidth = 1, worldHeight = 1;

  function render(time: number) {
    raf = 0;
    if (!visible || disposed || document.hidden) return;
    const duration = Math.max(16, Math.min(80, received - previousReceived));
    const t = Math.min(1, Math.max(0, (time - received) / duration));
    stars.count = count;
    glow.count = count;
    if (current) for (let index = 0; index < count; index++) {
      const i = index * STAR_STRIDE, next = current;
      // Stable IDs preserve interpolation even when removing a fallen piece
      // shifts every subsequent item in the compact worker buffer.
      const offset = previousOffsets[index];
      const before = previous && offset >= 0 ? previous : next;
      const j = before === previous ? offset : i;
      dummy.position.set(THREE.MathUtils.lerp(before[j], next[i], t), THREE.MathUtils.lerp(before[j + 1], next[i + 1], t), THREE.MathUtils.lerp(before[j + 2], next[i + 2], t));
      dummy.quaternion.set(before[j + 3], before[j + 4], before[j + 5], before[j + 6]);
      nextQuaternion.set(next[i + 3], next[i + 4], next[i + 5], next[i + 6]);
      dummy.quaternion.slerp(nextQuaternion, t);
      dummy.scale.setScalar(next[i + 7] * Math.max(.001, THREE.MathUtils.lerp(before[j + 8], next[i + 8], t)));
      dummy.updateMatrix(); stars.setMatrixAt(index, dummy.matrix);
      if (glow.visible) {
        halo.position.copy(dummy.position); halo.position.z -= .14;
        halo.scale.set(dummy.scale.x * 1.65, dummy.scale.x * 1.5, 1);
        halo.updateMatrix(); glow.setMatrixAt(index, halo.matrix);
      }
    }
    stars.instanceMatrix.needsUpdate = true;
    if (glow.visible) glow.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
    if (moving || t < 1) raf = requestAnimationFrame(render);
  }
  function wake() { if (!raf && visible && !disposed && !document.hidden) raf = requestAnimationFrame(render); }
  worker.onmessage = ({ data }: MessageEvent<StarPileFrame>) => {
    if (disposed) return;
    if (data.generation !== generation) { send({ type: "recycle", buffer: data.buffer }, [data.buffer]); return; }
    if (previous) send({ type: "recycle", buffer: previous.buffer }, [previous.buffer]);
    previousById.clear();
    if (current) for (let i = 0; i < count; i++) previousById.set(current[i * STAR_STRIDE + 10], i * STAR_STRIDE);
    previous = current; current = new Float32Array(data.buffer);
    count = data.count; moving = data.moving;
    for (let i = 0; i < count; i++) previousOffsets[i] = previousById.get(current[i * STAR_STRIDE + 10]) ?? -1;
    previousReceived = received; received = performance.now();
    host.dataset.starCount = String(count);
    host.dataset.starDepth = data.depthSpan.toFixed(2);
    host.dataset.starTilted = String(data.tilted);
    host.dataset.starTarget = String(data.target);
    wake();
  };
  worker.onerror = () => {
    // Keep the contact section usable if worker execution is unavailable.
    host.dataset.webglFallback = "true"; moving = false; worker.terminate();
    count = 0; wake();
  };
  function setActive(next: boolean) {
    if (next === active) return;
    active = next; send({ type: "active", value: active });
    if (!active) { cancelAnimationFrame(pointerRaf); pointerRaf = 0; pointerTime = 0; }
  }
  function movePointer(x: number, y: number) {
    if (!active || !visible || disposed) return;
    clientX = x; clientY = y;
    if (pointerRaf) return;
    pointerRaf = requestAnimationFrame(time => {
      pointerRaf = 0;
      const bounds = host.getBoundingClientRect();
      const perspective = 1 + depth * .5 / camera.position.z;
      const x = (clientX - bounds.left - bounds.width / 2) / bounds.width * worldWidth * perspective;
      const y = worldHeight / 2 + (.5 - (clientY - bounds.top) / bounds.height) * worldHeight * perspective;
      const dt = Math.max(1 / 120, (time - pointerTime) / 1000);
      const following = pointerTime > 0 && dt < .2;
      const vx = following ? THREE.MathUtils.clamp((x - pointerX) / dt, -24, 24) : 0;
      const vy = following ? THREE.MathUtils.clamp((y - pointerY) / dt, -24, 24) : 0;
      pointerTime = time; pointerX = x; pointerY = y;
      send({ type: "pointer", x, y, vx, vy });
    });
  }
  function resize() {
    const bounds = host.getBoundingClientRect();
    if (bounds.width === pixelWidth && bounds.height === pixelHeight) return;
    pixelWidth = Math.max(1, bounds.width); pixelHeight = Math.max(1, bounds.height);
    const pixelsPerUnit = pixelWidth < 768 ? 52 : Math.max(76, Math.min(100, pixelWidth / 15));
    const width = pixelWidth / pixelsPerUnit, height = pixelHeight / pixelsPerUnit;
    worldWidth = width; worldHeight = height;
    // Leave room for a large star to tumble without bridging the front/back
    // walls and forming a rigid column beside either cannon.
    depth = pixelWidth < 768 ? 2.1 : 2.25;
    renderer.setSize(pixelWidth, pixelHeight);
    camera.aspect = pixelWidth / pixelHeight;
    camera.position.set(0, height / 2, height / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.lookAt(0, height / 2, 0); camera.updateProjectionMatrix();
    // Larger, broader stars fill the same volume with fewer collision bodies.
    const target = Math.min(pixelWidth < 768 ? 180 : STAR_CAPACITY, Math.ceil(width * height * depth * 1.8));
    generation++; count = 0; pointerTime = 0;
    send({ type: "resize", width, height, depth, cameraDistance: camera.position.z, target, generation });
    wake();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const visibility = () => {
    send({ type: "visible", value: visible && !document.hidden });
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else wake();
  };
  document.addEventListener("visibilitychange", visibility);
  resize();
  return {
    setActive,
    movePointer,
    setVisible(next: boolean) {
      visible = next; send({ type: "visible", value: visible && !document.hidden });
      if (next) wake(); else { cancelAnimationFrame(raf); raf = 0; cancelAnimationFrame(pointerRaf); pointerRaf = 0; pointerTime = 0; }
    },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); cancelAnimationFrame(pointerRaf); observer.disconnect(); worker.terminate();
      document.removeEventListener("visibilitychange", visibility);
      geometry.dispose(); material.dispose(); glowTexture.dispose(); glowGeometry.dispose(); glowMaterial.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
