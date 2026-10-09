import * as THREE from "three";
import {
  UNIVERSE_BRANDS,
  TAU,
  clamp,
  seededRandom,
  UNIVERSE_LABEL_STYLE,
  UNIVERSE_OBJECT_STYLE,
  type UniverseLabelStyle,
  type UniverseObjectStyle,
} from "./credibility-universe-data";
import {
  createUniversePhysics,
  type UniversePointer,
} from "./credibility-universe-physics";
import { createCredibilityGalaxy } from "./credibility-galaxy";
import { createSpacecraft } from "./credibility-spacecraft";
import { createCometTail } from "./credibility-comet";
import { createCometEffects } from "./credibility-comet-effects";
import { universeObjectImage } from "./credibility-universe-assets";
import { createUniverseLabel } from "./credibility-universe-label";

export type UniverseScene = Awaited<ReturnType<typeof createUniverseScene>>;

function surfaceTexture(index: number, moon: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const random = seededRandom(117 + index);
  ctx.fillStyle = moon ? "#b0b0b0" : "#c5c5c5";
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < (moon ? 150 : 65); i++) {
    const x = random() * 512,
      y = random() * 256;
    if (moon) {
      const radius = 2 + random() * 13;
      const gradient = ctx.createRadialGradient(x + 1, y + 2, 0, x, y, radius);
      gradient.addColorStop(0, "#555");
      gradient.addColorStop(0.65, "#8b8b8b");
      gradient.addColorStop(0.86, "#eee");
      gradient.addColorStop(1, "#b0b0b0");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 0.7, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = `rgba(${i % 2 ? "255,255,255" : "60,60,60"},${0.04 + random() * 0.1})`;
      ctx.lineWidth = 1 + random() * 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(120, y + random() * 28, 320, y - random() * 28, 512, y);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function starGeometry() {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 + Math.PI / 2;
    const radius = i % 2 ? 0.44 : 1;
    const x = Math.cos(angle) * radius,
      y = Math.sin(angle) * radius;
    if (!i) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.085,
    bevelThickness: 0.085,
  });
}

export async function createUniverseScene(
  canvas: HTMLCanvasElement,
  hitAreas: HTMLButtonElement[],
  signal: AbortSignal,
  onAssetReady?: () => void,
  {
    labelStyle = UNIVERSE_LABEL_STYLE,
    objectStyle = UNIVERSE_OBJECT_STYLE,
  }: {
    labelStyle?: UniverseLabelStyle;
    objectStyle?: UniverseObjectStyle;
  } = {},
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  let galaxy: Awaited<ReturnType<typeof createCredibilityGalaxy>>;
  try {
    galaxy = await createCredibilityGalaxy(
      renderer,
      signal,
      canvas.clientWidth < 700,
    );
  } catch (error) {
    renderer.dispose();
    throw error;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.info.autoReset = false;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 5.5, -5.5, 0.1, 50);
  camera.position.z = 20;
  const world = new THREE.Group();
  scene.add(world);
  scene.add(new THREE.AmbientLight(0x96acdd, 1.7));
  const sun = new THREE.DirectionalLight(0xfff5dc, 3.6);
  sun.position.set(-5, 7, 9);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x8888ff, 2.8);
  rim.position.set(6, -3, -2);
  scene.add(rim);
  const physics = createUniversePhysics();
  // Paint the additive starfield before the cutouts so it cannot wash through
  // their opaque faces. The strike comet and its effects keep their own depth.
  if (objectStyle === "images") galaxy.group.renderOrder = -1;
  world.add(galaxy.group);
  // Transparent map precompiles the same sprite shader used by loaded marks.
  const blank = new THREE.CanvasTexture(document.createElement("canvas"));
  const textures: THREE.Texture[] = [blank];
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  geometries.add(sphere);
  const imagePlane = new THREE.PlaneGeometry(1, 1);
  geometries.add(imagePlane);
  const sceneTime = { value: 0 },
    sceneDpr = { value: 1 };
  const cometTail = createCometTail(sceneTime, sceneDpr);
  const cometEffects = createCometEffects(sceneDpr);
  world.add(cometEffects.group);
  geometries.add(cometTail.geometry);
  materials.add(cometTail.material);
  const brands = UNIVERSE_BRANDS.map((brand, i) => {
    const group = new THREE.Group();
    let mesh: THREE.Object3D;
    let flame: THREE.Mesh | null = null;
    let tail: THREE.Points | null = null;
    let logoY = 0,
      logoZ = brand.kind === "star" ? 0.44 : 1.04;
    const makeModel = () => {
      if (brand.kind === "rocket" || brand.kind === "ufo") {
        const craft = createSpacecraft(brand.kind, brand.color);
        mesh = craft.model;
        flame = craft.flame;
        logoY = craft.logoY;
        logoZ = craft.logoZ;
        craft.geometries.forEach((g) => geometries.add(g));
        craft.materials.forEach((m) => materials.add(m));
      } else {
        const map = surfaceTexture(
          i,
          brand.kind === "moon" || brand.kind === "comet",
        );
        textures.push(map);
        const material = new THREE.MeshPhongMaterial({
          color: brand.color,
          map,
          shininess: brand.kind === "moon" || brand.kind === "comet" ? 10 : 65,
          specular: "#8295bc",
          emissive: brand.kind === "comet" ? "#932f0a" : "#000000",
        });
        materials.add(material);
        const geometry =
          brand.kind === "star"
            ? starGeometry()
            : brand.kind === "comet"
              ? new THREE.IcosahedronGeometry(1, 1)
              : sphere;
        geometries.add(geometry);
        mesh = new THREE.Mesh(geometry, material);
        if (brand.kind === "comet") mesh.scale.set(1, 0.8, 0.9);
      }
      group.add(mesh);
      if (brand.kind === "ring") {
        const ringGeometry = new THREE.RingGeometry(1.2, 1.65, 48, 1);
        const ringMaterial = new THREE.MeshPhongMaterial({
          color: brand.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.64,
          shininess: 45,
        });
        materials.add(ringMaterial);
        geometries.add(ringGeometry);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.set(0.93, 0.3, i % 2 ? -0.35 : 0.4);
        group.add(ring);
        const outerGeometry = new THREE.TorusGeometry(1.7, 0.015, 4, 48);
        const outer = new THREE.Mesh(outerGeometry, ringMaterial);
        outer.rotation.copy(ring.rotation);
        geometries.add(outerGeometry);
        group.add(outer);
      }
      return { mesh, flame };
    };
    if (objectStyle === "images") {
      const material = new THREE.MeshBasicMaterial({
        map: blank,
        transparent: true,
        depthWrite: false,
        alphaTest: 0.01,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
      materials.add(material);
      mesh = new THREE.Mesh(imagePlane, material);
      group.add(mesh);
    } else {
      ({ mesh, flame } = makeModel());
    }
    if (brand.kind === "comet") {
      tail = new THREE.Points(cometTail.geometry, cometTail.material);
      tail.frustumCulled = false;
      // Transparent cutouts do not write depth. Explicitly paint the brand's
      // fire first so its additive particles never wash over the asteroid.
      if (objectStyle === "images") tail.renderOrder = -0.5;
      group.add(tail);
    }
    const logoMaterial = new THREE.SpriteMaterial({
      map: blank,
      color: "#ffffff",
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    materials.add(logoMaterial);
    const logo = new THREE.Sprite(logoMaterial);
    logo.visible = labelStyle === "on-object";
    logo.renderOrder = 100;
    logo.position.set(0, logoY, logoZ);
    group.add(logo);
    world.add(group);
    group.visible = false;
    hitAreas[i].style.visibility = "hidden";
    return {
      group,
      mesh,
      flame,
      tail,
      logo,
      labelElement: null as HTMLSpanElement | null,
      makeModel,
      image: objectStyle === "images",
      objectReady: objectStyle === "models",
      logoReady: false,
      heading: 0,
      ready: false,
      appearedAt: -1,
      reveal: 0,
    };
  });

  const cometHead = new THREE.IcosahedronGeometry(1, 1);
  const cometSurface = surfaceTexture(13, true);
  textures.push(cometSurface);
  const cometGlow = new THREE.MeshPhongMaterial({
    color: "#ff973d",
    map: cometSurface,
    emissive: "#f55316",
    emissiveIntensity: 0.6,
    specular: "#ffecd4",
    shininess: 30,
  });
  geometries.add(cometHead);
  materials.add(cometGlow);
  const incoming = physics.comets.map(() => {
    const group = new THREE.Group();
    const head = new THREE.Mesh(cometHead, cometGlow);
    head.scale.set(0.9, 0.65, 0.65);
    const tail = new THREE.Points(cometTail.geometry, cometTail.material);
    tail.scale.set(4, 2.2, 1);
    tail.frustumCulled = false;
    group.add(head, tail);
    group.visible = false;
    world.add(group);
    return group;
  });

  let width = 1,
    height = 1,
    spanX = 20,
    spanY = 11,
    bodyScale = 1;
  let disposed = false,
    elapsed = 0,
    dragged = -1,
    initial = true;
  let renderedFrames = 0;
  let presented = false,
    appearanceTime = 0;
  let grabOffsetX = 0,
    grabOffsetY = 0;
  let compact = false,
    reduced = false;
  const pointer: UniversePointer = {
    x: 30,
    y: 30,
    vx: 0,
    vy: 0,
    active: false,
    down: false,
  };
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const inverse = new THREE.Matrix4();
  const point = new THREE.Vector3(),
    projected = new THREE.Vector3();
  // One buffer holds passing shooting stars and the DoorDash comet's actual path.
  const trailPositions = new Float32Array(5 * 20 * 6),
    trailColors = new Float32Array(trailPositions.length);
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(trailPositions, 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  trailGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(trailColors, 3).setUsage(THREE.DynamicDrawUsage),
  );
  const trailMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  geometries.add(trailGeometry);
  materials.add(trailMaterial);
  const trails = new THREE.LineSegments(trailGeometry, trailMaterial);
  trails.frustumCulled = false;
  if (objectStyle === "images") trails.renderOrder = -0.5;
  world.add(trails);
  const wake = Array.from({ length: 21 }, () => new THREE.Vector2());
  let lastMoveTime = 0,
    moveVX = 0,
    moveVY = 0;

  function resize(w: number, h: number) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    compact = width < 700;
    spanY = compact ? 16.5 : 10.8;
    spanX = (spanY * width) / height;
    bodyScale = compact ? 0.82 : 1;
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      1.25,
      Math.sqrt(1500000 / (width * height)),
    );
    sceneDpr.value = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    galaxy.resize(spanX, spanY, compact, dpr);
    camera.left = -spanX / 2;
    camera.right = spanX / 2;
    camera.top = spanY / 2;
    camera.bottom = -spanY / 2;
    camera.updateProjectionMatrix();
    physics.resize(spanX, spanY, bodyScale);
    brands.forEach((_, i) => sizeLogo(i));
    if (initial) {
      physics.reset();
      initial = false;
    }
    wake.forEach((p) => p.set(physics.bodies[1].x, physics.bodies[1].y));
  }
  function setPointer(x: number, y: number, active: boolean) {
    const previousX = pointer.x,
      previousY = pointer.y;
    const wasActive = pointer.active;
    ndc.set(x, y);
    pointer.active = active;
    updatePointer();
    const now = performance.now();
    const dt = Math.max(0.008, (now - lastMoveTime) / 1000);
    if (active && wasActive && dt < 0.15) {
      moveVX = clamp((pointer.x - previousX) / dt, -18, 18);
      moveVY = clamp((pointer.y - previousY) / dt, -18, 18);
    } else {
      moveVX = 0;
      moveVY = 0;
    }
    lastMoveTime = now;
  }
  function updatePointer() {
    camera.updateMatrixWorld();
    world.updateMatrixWorld(true);
    inverse.copy(world.matrixWorld).invert();
    ray.setFromCamera(ndc, camera);
    ray.ray.applyMatrix4(inverse);
    if (ray.ray.intersectPlane(plane, point)) {
      const x = clamp(point.x, -spanX / 2, spanX / 2),
        y = clamp(point.y, -spanY / 2, spanY / 2);
      pointer.x = x;
      pointer.y = y;
    }
  }
  let lastLaunchTime = -1;
  function launchComet() {
    if (reduced || elapsed - lastLaunchTime < 0.18) return;
    updatePointer();
    physics.launchComet(pointer.x, pointer.y);
    lastLaunchTime = elapsed;
  }
  function grab(index: number) {
    updatePointer();
    moveVX = 0;
    moveVY = 0;
    dragged = index;
    grabOffsetX = index >= 0 ? physics.bodies[index].x - pointer.x : 0;
    grabOffsetY = index >= 0 ? physics.bodies[index].y - pointer.y : 0;
    pointer.down = true;
  }
  function release(throwing = false) {
    if (dragged >= 0) {
      updatePointer();
      physics.step(0, pointer, dragged, grabOffsetX, grabOffsetY);
      const body = physics.bodies[dragged];
      const fresh =
        throwing && !reduced && performance.now() - lastMoveTime < 100;
      // Capture the final pointer sample even when release falls between frames.
      body.vx = fresh ? clamp(moveVX, -12, 12) : 0;
      body.vy = fresh ? clamp(moveVY, -12, 12) : 0;
    }
    dragged = -1;
    pointer.down = false;
  }

  function render(dt: number, quiet = false) {
    if (disposed) return;
    renderer.info.reset();
    dt = clamp(dt, 0, 1 / 30);
    reduced = quiet;
    if (!quiet) elapsed += dt;
    sceneTime.value = elapsed;
    if (presented && !quiet) appearanceTime += dt;
    galaxy.setReveal(
      presented ? (quiet ? 1 : clamp(appearanceTime / 0.65, 0, 1)) : 0,
    );
    // The field stays in place while individual stars respond to the pointer.
    world.rotation.set(-0.12, 0, -0.035);
    updatePointer();
    const pointerDamping = Math.exp(
      -Math.max(0, performance.now() - lastMoveTime - 20) / 45,
    );
    pointer.vx = moveVX * pointerDamping;
    pointer.vy = moveVY * pointerDamping;
    if (!quiet && dt) {
      physics.step(dt / 2, pointer, dragged, grabOffsetX, grabOffsetY);
      physics.step(dt / 2, pointer, dragged, grabOffsetX, grabOffsetY);
    }
    if (quiet && dragged >= 0)
      physics.step(0, pointer, dragged, grabOffsetX, grabOffsetY);
    galaxy.render(elapsed, pointer, quiet, physics.bodies, physics.comets);
    cometEffects.render(physics.fragments, physics.impacts, quiet);
    incoming.forEach((group, i) => {
      const comet = physics.comets[i];
      group.visible = comet.active && !quiet;
      if (!group.visible) return;
      group.position.set(comet.x, comet.y, 0.1);
      group.scale.setScalar(comet.radius);
      group.rotation.z = Math.atan2(comet.vy, comet.vx);
    });
    brands.forEach((brand, i) => {
      const { group, mesh, flame, tail, logo } = brand;
      const b = physics.bodies[i];
      // Include dragging: its rendered displacement is more reliable than the
      // decaying pointer velocity when the pointer holds still between events.
      const vx = i === dragged && dt ? (b.x - group.position.x) / dt : b.vx;
      const vy = i === dragged && dt ? (b.y - group.position.y) / dt : b.vy;
      if (vx * vx + vy * vy > 0.001) brand.heading = Math.atan2(vy, vx);
      group.position.set(b.x, b.y, 0);
      if (presented && brand.ready && brand.appearedAt < 0)
        brand.appearedAt = Math.max(appearanceTime, i * 0.055);
      const progress =
        presented && brand.ready
          ? quiet
            ? 1
            : clamp((appearanceTime - brand.appearedAt) / 0.48, 0, 1)
          : 0;
      brand.reveal = progress;
      const pop =
        1 + 2.6 * Math.pow(progress - 1, 3) + 1.6 * Math.pow(progress - 1, 2);
      group.visible = progress > 0;
      group.scale.setScalar(
        b.radius * Math.max(0.0001, pop) * (i === dragged ? 1.08 : 1),
      );
      hitAreas[i].style.visibility = progress > 0 ? "visible" : "hidden";
      hitAreas[i].style.pointerEvents = progress > 0.75 ? "auto" : "none";
      const kind = UNIVERSE_BRANDS[i].kind;
      if (kind === "rocket") {
        mesh.rotation.set(0, 0, brand.heading - Math.PI / 2);
        // The mark stays camera-facing and follows the middle of the hull.
        if (labelStyle === "on-object") {
          logo.position.set(
            Math.cos(brand.heading) * -0.12,
            Math.sin(brand.heading) * -0.12,
            0.8,
          );
        }
        if (flame) flame.scale.y = 0.9 + Math.sin(elapsed * 19) * 0.1;
      } else if (brand.image) {
        // Image planes remain readable while tilting and responding to the
        // same bodies as the models. Never turn a cutout edge-on or backwards.
        mesh.rotation.set(
          0.08 * Math.sin(b.angle),
          0.14 * Math.cos(b.angle),
          b.angle * 0.12,
        );
      } else if (kind === "ufo") {
        mesh.rotation.set(0.2 + Math.sin(b.angle) * 0.07, b.angle * 0.4, -0.12);
      } else {
        mesh.rotation.set(0.15, b.angle * 0.8, kind === "star" ? b.angle : 0.1);
      }
      if (tail) tail.rotation.z = brand.heading;
      projected
        .set(b.x, b.y, 0.15)
        .applyMatrix4(world.matrixWorld)
        .project(camera);
      const hit = hitAreas[i];
      const unit = (b.radius * height) / spanY;
      let hitWidth =
        unit *
        (kind === "ufo"
          ? 3.2
          : kind === "rocket"
            ? 1.9 * Math.abs(Math.sin(brand.heading)) +
              3.2 * Math.abs(Math.cos(brand.heading))
            : 2.4);
      let hitHeight =
        unit *
        (kind === "rocket"
          ? 3.2 * Math.abs(Math.sin(brand.heading)) +
            1.9 * Math.abs(Math.cos(brand.heading))
          : kind === "ufo"
            ? 2
            : 2.4);
      let labelOffset = 0;
      if (brand.image) {
        const c = Math.abs(Math.cos(mesh.rotation.z));
        const s = Math.abs(Math.sin(mesh.rotation.z));
        hitWidth = unit * (mesh.scale.x * c + mesh.scale.y * s);
        hitHeight = unit * (mesh.scale.x * s + mesh.scale.y * c);
      }
      if (labelStyle === "button") {
        const labelHeight = logo.scale.y * unit;
        const gap = compact ? 3 : 5;
        logo.position.set(
          0,
          -(hitHeight / 2 + gap + labelHeight / 2) / unit,
          1.8,
        );
        hitWidth = Math.max(hitWidth, logo.scale.x * unit);
        labelOffset = (gap + labelHeight) / 2;
        hitHeight += gap + labelHeight;
      }
      if (hit.style.width !== `${hitWidth}px`) {
        hit.style.width = `${hitWidth}px`;
      }
      if (hit.style.height !== `${hitHeight}px`) {
        hit.style.height = `${hitHeight}px`;
      }
      const hitScale = Math.max(0.0001, pop) * (i === dragged ? 1.08 : 1);
      hit.style.transform = `translate(${(((projected.x + 1) * width) / 2).toFixed(2)}px,${(((1 - projected.y) * height) / 2 + labelOffset * hitScale).toFixed(2)}px) translate(-50%,-50%) scale(${hitScale})`;
      hit.dataset.grabbed = String(i === dragged);
    });
    if (dt && !quiet) {
      for (let i = wake.length - 1; i > 0; i--)
        wake[i].lerp(wake[i - 1], Math.min(1, dt * 25));
      wake[0].set(physics.bodies[1].x, physics.bodies[1].y);
    }
    for (let streak = 0; streak < 5; streak++) {
      const age = (elapsed + streak * 4.1) % 17;
      const visible = !quiet && age < 1.2 && streak > 0;
      for (let s = 0; s < 20; s++)
        for (let end = 0; end < 2; end++) {
          const part = s + end,
            p = part / 20,
            j = (streak * 40 + s * 2 + end) * 3;
          if (streak === 0 && !quiet) {
            const b = physics.bodies[1];
            trailPositions[j] = wake[part].x;
            trailPositions[j + 1] = wake[part].y;
            trailPositions[j + 2] = -0.1;
            const glow = Math.pow(1 - p, 2) * 0.8;
            trailColors.set([glow, glow * 0.43, glow * 0.2], j);
            // A tiny offset gives this comet a broad, luminous wake at its head.
            if (part === 0) {
              trailPositions[j] = b.x;
              trailPositions[j + 1] = b.y;
            }
          } else {
            const t = age - p * 0.12;
            trailPositions[j] = -spanX * 0.6 + t * spanX * 1.1;
            trailPositions[j + 1] =
              spanY * (0.42 - streak * 0.1) - t * spanY * 0.35;
            trailPositions[j + 2] = -0.4;
            const glow = visible
              ? (1 - p) * Math.sin((age / 1.2) * Math.PI)
              : 0;
            trailColors.set([glow * 0.7, glow * 0.8, glow], j);
          }
        }
    }
    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.color.needsUpdate = true;
    renderer.render(scene, camera);
    renderedFrames++;
  }
  function reset() {
    release();
    physics.reset();
    lastLaunchTime = -1;
    galaxy.reset();
    wake.forEach((p) => p.set(physics.bodies[1].x, physics.bodies[1].y));
    render(0, reduced);
  }
  function nudge(index: number, x: number, y: number) {
    const b = physics.bodies[index];
    if (reduced) {
      b.x = clamp(
        b.x + x * 0.15,
        -spanX / 2 + b.radius * 1.8,
        spanX / 2 - b.radius * 1.8,
      );
      b.y = clamp(
        b.y + y * 0.15,
        -spanY / 2 + b.radius * 1.8,
        spanY / 2 - b.radius * 1.8,
      );
    } else {
      b.vx += x;
      b.vy += y;
      b.spin += 0.8;
    }
  }
  function sizeLogo(i: number) {
    const logo = brands[i].logo;
    const texture = logo.material.map;
    if (!texture || texture === blank) return;
    const brand = UNIVERSE_BRANDS[i];
    if (labelStyle === "button") {
      const element = brands[i].labelElement;
      if (element)
        element.style.transform = `translateX(-50%) scale(${compact ? 0.88 : 1})`;
      const pixelsToWorld = (spanY / height) * (compact ? 0.88 : 1);
      const labelWidth = texture.userData.labelWidth * pixelsToWorld;
      const labelHeight = texture.userData.labelHeight * pixelsToWorld;
      const radius = physics.bodies[i].radius;
      logo.scale.set(labelWidth / radius, labelHeight / radius, 1);
      physics.bodies[i].labelHalfWidth = labelWidth / bodyScale / 2;
      physics.bodies[i].labelBottom =
        brand.radius * 1.8 + (labelHeight + (5 * spanY) / height) / bodyScale;
    } else {
      const rawHeight = texture.userData.wordmarkAspectHeight as number;
      const image = texture.image as HTMLCanvasElement;
      const wordmarkWidth = Math.min(
        3.6,
        (0.3 * 512) / (rawHeight * brand.wordmarkHeight),
      );
      const logoWidth = ((wordmarkWidth / brand.radius) * image.width) / 512;
      logo.scale.set(logoWidth, (logoWidth * image.height) / image.width, 1);
      physics.bodies[i].labelHalfWidth =
        (wordmarkWidth * image.width) / 512 / 2;
    }
  }
  // These resolve independently. Start rendering the real galaxy immediately;
  // each labelled model joins it with its own scale pop as soon as it is ready.
  UNIVERSE_BRANDS.forEach((brand, i) => {
    if (objectStyle === "images") {
      void universeObjectImage(brand.image).then((image) => {
        if (disposed || signal.aborted) return;
        const entry = brands[i];
        if (image) {
          const texture = new THREE.Texture(image);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;
          textures.push(texture);
          const mesh = entry.mesh as THREE.Mesh<
            THREE.PlaneGeometry,
            THREE.MeshBasicMaterial
          >;
          mesh.material.map = texture;
          const aspect = image.naturalWidth / image.naturalHeight;
          mesh.scale.set(
            brand.imageSize * Math.min(1, aspect),
            brand.imageSize * Math.min(1, 1 / aspect),
            1,
          );
        } else {
          // A missing local image may fall back to the preserved model, but
          // loading never displays a temporary object or placeholder surface.
          entry.group.remove(entry.mesh);
          Object.assign(entry, entry.makeModel(), { image: false });
        }
        entry.objectReady = true;
        entry.ready = entry.logoReady;
        onAssetReady?.();
      });
    }
    void createUniverseLabel(
      brand.file,
      brand.name,
      labelStyle,
      brand.wordmarkHeight,
    ).then(({ texture, element }) => {
      if (disposed || signal.aborted) {
        texture.dispose();
        return;
      }
      textures.push(texture);
      const logo = brands[i].logo;
      logo.material.map = texture;
      if (element) {
        brands[i].labelElement = element;
        hitAreas[i].append(element);
      }
      sizeLogo(i);
      brands[i].logoReady = true;
      brands[i].ready = brands[i].objectReady;
      onAssetReady?.();
    });
  });
  // Compile while the section approaches, rather than on its first visible frame.
  void renderer.compileAsync(scene, camera).catch(() => {});
  return {
    resize,
    render,
    setPresented: (value: boolean) => {
      presented = value;
    },
    setPointer,
    grab,
    release,
    launchComet,
    isActive: () =>
      (presented &&
        (appearanceTime < 0.7 ||
          brands.some((brand) => brand.ready && brand.reveal < 1))) ||
      physics.comets.some((comet) => comet.active) ||
      physics.fragments.some((fragment) => fragment.active),
    reset,
    nudge,
    stats: () => ({
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      particles: galaxy.count(),
      readyBrands: brands.filter((brand) => brand.ready).length,
      labelStyle,
      objectStyle,
      revealedBrands: brands.filter((brand) => brand.reveal >= 1).length,
      frames: renderedFrames,
      comets: physics.comets.filter((comet) => comet.active).length,
      fragments: physics.fragments.filter((fragment) => fragment.active).length,
      impacts: physics.impacts.filter((impact) => impact.active).length,
    }),
    // Read only by the local interaction harness; no allocations in the frame loop.
    inspect: () =>
      process.env.NODE_ENV === "development"
        ? {
            bodies: physics.bodies.map((body, i) => ({
              ...body,
              heading: brands[i].heading,
              ready: brands[i].ready,
              image: brands[i].image,
              reveal: brands[i].reveal,
              nose: brands[i].mesh.rotation.z + Math.PI / 2,
              tail: brands[i].tail?.rotation.z,
              fireBehindImage:
                !brands[i].image ||
                !brands[i].tail ||
                brands[i].tail.renderOrder < brands[i].mesh.renderOrder,
              logoVisible:
                Boolean(brands[i].labelElement) ||
                (brands[i].logo.visible && !brands[i].logo.material.depthTest),
            })),
            comets: physics.comets.map((comet) => ({ ...comet })),
            fragments: physics.fragments.map((fragment) => ({ ...fragment })),
            impacts: physics.impacts.map((impact) => ({ ...impact })),
          }
        : null,
    dispose() {
      if (disposed) return;
      disposed = true;
      release();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      brands.forEach((brand) => brand.labelElement?.remove());
      galaxy.dispose();
      cometEffects.dispose();
      renderer.dispose();
      // Fast Refresh reuses the mounted canvas. Losing its context here can
      // invalidate the replacement scene while its particle buffers initialize.
      if (!canvas.isConnected) renderer.forceContextLoss();
    },
  };
}
