import { Body, Box, ConvexPolyhedron, GSSolver, Material, SAPBroadphase, Vec3, World } from "cannon-es";
import { STAR_BEVEL, STAR_CAPACITY, STAR_OUTLINE, STAR_STRIDE, STAR_THICKNESS, type StarPileCommand, type StarPileFrame } from "./project-cta-stars-shared";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<StarPileCommand>) => void) | null;
  postMessage: (frame: StarPileFrame, transfer: Transferable[]) => void;
};
const STEP = 1 / 60;
const FRAME_MS = 1000 / 60;
const LAUNCH_INTERVAL_MS = 50;
const GRAVITY = -30;
// Leave room for the rendered bevel and interpolation at the window edge.
const CEILING_INSET = .08;
const BOUNDARY = 1, SIDE = 2, STAR = 4, LAUNCH = 8;
const world = new World({ gravity: new Vec3(0, GRAVITY, 0), allowSleep: true });
const broadphase = new SAPBroadphase(world);
broadphase.axisIndex = 0;
world.broadphase = broadphase;
const solver = world.solver as GSSolver;
solver.iterations = 5;
solver.tolerance = .01;
world.defaultContactMaterial.friction = .09;
world.defaultContactMaterial.restitution = .13;
world.defaultContactMaterial.contactEquationStiffness = 1e6;
world.defaultContactMaterial.contactEquationRelaxation = 4;
const plastic = new Material("cta-stars");
let width = 1, height = 1, depth = 1.7, cameraDistance = 10, target = 0, generation = 0;
let active = false, visible = false, last = 0, nextLaunchAt = 0, launchIndex = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let walls: Body[] = [];
type Piece = { body: Body; size: number; id: number; entering: boolean; launchedAt: number; releaseX: number; landingX: number };
let pieces: Piece[] = [];
const buffers: ArrayBuffer[] = [];
const pointer = { x: 0, y: 0, vx: 0, vy: 0, pending: false, direction: 1 };
const unitFactor = new Vec3(1, 1, 1);

// The five outer tips form a light collision prism instead of five compound
// bodies per star. The visible mesh retains the original concave silhouette.
function starCollider(size: number) {
  const profile = STAR_OUTLINE.filter((_, i) => i % 2 === 0).reverse();
  const vertices = [-1, 1].flatMap(side => profile.map(([x, y]) =>
    new Vec3(x * size, y * size, side * (STAR_THICKNESS / 2 + STAR_BEVEL) * size),
  ));
  const faces = [[4, 3, 2, 1, 0], [5, 6, 7, 8, 9]];
  for (let i = 0; i < 5; i++) { const j = (i + 1) % 5; faces.push([i, j, j + 5, i + 5]); }
  return new ConvexPolyhedron({ vertices, faces });
}
function chooseLandingX(size: number) {
  // Fill the emptier parts of the box, including both ends. Count stars still
  // in flight at their destination so a whole volley won't pick the same gap.
  const reach = Math.max(0, width / 2 - size * .65);
  const laneWidth = Math.max(size, width / 9);
  let bestX = 0, bestLoad = Infinity;
  for (let lane = 0; lane < 9; lane++) {
    const x = (lane / 8 * 2 - 1) * reach;
    let load = Math.random() * .3;
    for (const piece of pieces) {
      const px = piece.entering ? piece.landingX : piece.body.position.x;
      const distance = Math.abs(px - x) / laneWidth;
      const elevation = piece.entering ? .5 : Math.max(0, piece.body.position.y / height);
      if (distance < 1.5) load += (1 - distance / 1.5) * piece.size ** 2 * (.6 + elevation * 1.5);
    }
    if (load < bestLoad) { bestLoad = load; bestX = x; }
  }
  return Math.max(-reach, Math.min(reach, bestX + (Math.random() - .5) * laneWidth * .35));
}
function spawn() {
  const size = 1.33 + Math.random() * .34;
  const landingX = chooseLandingX(size);
  const alternatingSide = launchIndex++ % 2 === 0;
  // Feed the outer lanes from their nearest cannon. Cross-container throws
  // otherwise strike the growing middle pile before reaching those gaps.
  const left = Math.abs(landingX) > width * .22 ? landingX < 0 : alternatingSide;
  const z = -depth / 2 + (Math.random() - .5) * (depth - size * .85);
  // The back of a perspective volume has a wider visible frustum. Start past
  // that edge, at full scale, so launches cross the side instead of popping in.
  const edge = width / 2 * (1 - z / cameraDistance);
  const startX = (left ? -1 : 1) * (edge + size * .75);
  const startY = height * (.38 + Math.random() * .12);
  // Launches bypass wall collisions until they clear the side entrance. Keep
  // the entire tumbling star below the ceiling even during that powered arc.
  const apexY = Math.min(height * (.76 + Math.random() * .14), height - CEILING_INSET - size * .56);
  const riseSpeed = Math.sqrt(2 * -GRAVITY * (apexY - startY));
  const landingY = Math.max(size * .45, height * .14);
  const flightTime = (riseSpeed + Math.sqrt(riseSpeed ** 2 + 2 * -GRAVITY * (startY - landingY))) / -GRAVITY;
  const body = new Body({
    mass: size ** 3, type: Body.KINEMATIC, material: plastic, shape: starCollider(size),
    position: new Vec3(startX, startY, z),
    // Carry each arc clear of the entrance pile, then let collisions take
    // over before the centre. The handoff keeps the same flight momentum.
    collisionFilterGroup: LAUNCH, collisionFilterMask: STAR,
    linearDamping: .22, angularDamping: .46, sleepSpeedLimit: .4, sleepTimeLimit: .5,
  });
  body.quaternion.setFromEuler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
  body.velocity.set((landingX - startX) / flightTime, riseSpeed, 0);
  body.angularVelocity.set((Math.random() - .5) * 7, (Math.random() - .5) * 7, (Math.random() - .5) * 6);
  world.addBody(body);
  pieces.push({
    body, size, id: launchIndex, entering: true, launchedAt: performance.now(), landingX,
    // Shorter throws must also regain floor collisions before landing.
    releaseX: Math.min(width / 2 - size * .6, Math.max(
      width * (.24 + Math.random() * .12),
      landingX * (left ? -1 : 1) + size * .7,
    )),
  });
}
// Kinematic bodies don't receive gravity from Cannon. Apply it on each fixed
// physics step, including under load, then hand off without a velocity jump.
world.addEventListener("preStep", () => {
  for (const piece of pieces) {
    if (!piece.entering) continue;
    const { body } = piece;
    body.velocity.y += GRAVITY * STEP;
    if (Math.abs(body.position.x) > piece.releaseX) continue;
    piece.entering = false;
    body.type = Body.DYNAMIC;
    body.updateMassProperties();
    body.collisionFilterGroup = STAR;
    body.collisionFilterMask = BOUNDARY | SIDE | STAR | LAUNCH;
  }
});
world.addEventListener("postStep", () => {
  const ceiling = height - CEILING_INSET;
  for (const { body, size } of pieces) {
    // Fast pointer throws can cross a thin boundary in one fixed step. Check
    // the rotated hull, not just its centre, before publishing that frame.
    if (body.position.y + size * .56 < ceiling) continue;
    body.updateAABB();
    const overshoot = body.aabb.upperBound.y - ceiling;
    if (overshoot <= 0) continue;
    body.position.y -= overshoot;
    if (body.velocity.y > 0) body.velocity.y *= -.13;
    body.aabbNeedsUpdate = true;
    body.wakeUp();
  }
});
function stir(dt: number) {
  if (!pointer.pending) return;
  pointer.pending = false;
  const now = performance.now();
  const radius = Math.min(3.2, width * .48);
  const strength = Math.min(1, Math.hypot(pointer.vx, pointer.vy) / 8);
  for (const { body, entering, launchedAt } of pieces) {
    // A mouse pass should not catch a star at its cannon muzzle.
    if (entering || now - launchedAt < 220) continue;
    const dx = body.position.x - pointer.x, dy = body.position.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= radius) continue;
    const falloff = (1 - distance / radius) ** .8 * strength;
    const inv = 1 / Math.max(.35, distance);
    body.wakeUp();
    // Transfer momentum immediately; there is no sustained lift after the
    // mouse stops. Strong gravity brings the tossed stars straight back down.
    const mix = Math.min(.85, dt * 48) * falloff;
    const vx = pointer.vx * .8 - dy * inv * pointer.direction * 12;
    const vy = pointer.vy * .7 + dx * inv * pointer.direction * 10 + 11;
    body.velocity.x += (Math.max(-22, Math.min(22, vx)) - body.velocity.x) * mix;
    body.velocity.y += (Math.max(-18, Math.min(20, vy)) - body.velocity.y) * mix;
    body.velocity.z += (Math.sin(body.position.x * 2) * 2 - body.velocity.z) * mix;
    body.angularVelocity.x += (pointer.vy * .3 - body.angularVelocity.x) * mix;
    body.angularVelocity.y += (pointer.vx * .3 - body.angularVelocity.y) * mix;
    body.angularVelocity.z += (pointer.direction * 8 - body.angularVelocity.z) * mix;
  }
}
function fall(dt: number) {
  // Once the window opens, each piece is in free flight. Integrating that
  // directly avoids waking hundreds of unnecessary contact equations on exit.
  for (const { body } of pieces) {
    body.position.x += body.velocity.x * dt;
    body.position.y += body.velocity.y * dt + GRAVITY * dt * dt / 2;
    body.position.z += body.velocity.z * dt;
    body.velocity.y += GRAVITY * dt;
    body.quaternion.integrate(body.angularVelocity, dt, unitFactor, body.quaternion);
    body.quaternion.normalize();
    body.aabbNeedsUpdate = true;
  }
}
function publish(moving: boolean) {
  const buffer = buffers.pop() || new ArrayBuffer(STAR_CAPACITY * STAR_STRIDE * 4);
  const values = new Float32Array(buffer);
  let minZ = 0, maxZ = -depth, tilted = 0;
  pieces.forEach(({ body, size, id }, index) => {
    const i = index * STAR_STRIDE, p = body.position, q = body.quaternion;
    values[i] = p.x; values[i + 1] = p.y; values[i + 2] = p.z;
    values[i + 3] = q.x; values[i + 4] = q.y; values[i + 5] = q.z; values[i + 6] = q.w;
    values[i + 7] = size; values[i + 8] = 1;
    values[i + 9] = 0; values[i + 10] = id;
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    if (Math.abs(1 - 2 * (q.x * q.x + q.y * q.y)) < .8) tilted++;
  });
  scope.postMessage({ buffer, count: pieces.length, generation, moving, depthSpan: pieces.length ? maxZ - minZ : 0, tilted, target }, [buffer]);
}
function tick() {
  timer = null;
  if (!visible) return;
  const now = performance.now();
  const dt = Math.min(1 / 30, last ? (now - last) / 1000 : STEP);
  last = now;
  if (active && pieces.length < target) {
    // Wall-clock emission is independent of input and the physics timestep.
    // Catch up missed volleys instead of slowing the cannons under load.
    while (now >= nextLaunchAt && pieces.length < target) {
      for (let i = 0; i < 4 && pieces.length < target; i++) spawn();
      nextLaunchAt += LAUNCH_INTERVAL_MS;
    }
  } else nextLaunchAt = now + LAUNCH_INTERVAL_MS;
  if (active) {
    stir(dt);
    world.step(STEP, dt, 2);
  } else fall(dt);
  pieces = pieces.filter(piece => {
    if (piece.body.position.y > -piece.size * 2) return true;
    world.removeBody(piece.body); return false;
  });
  const moving = (active && pieces.length < target) || pieces.some(piece => piece.body.sleepState !== Body.SLEEPING);
  publish(moving);
  if (moving) timer = setTimeout(tick, Math.max(0, FRAME_MS - (performance.now() - now)));
}
function wake() { if (timer === null && visible) { last = 0; timer = setTimeout(tick, 0); } }
function resize(command: Extract<StarPileCommand, { type: "resize" }>) {
  ({ width, height, depth, cameraDistance, target, generation } = command);
  world.bodies.slice().forEach(body => world.removeBody(body));
  pieces = []; nextLaunchAt = performance.now(); pointer.pending = false;
  const wall = (x: number, y: number, z: number, sx: number, sy: number, sz: number, group = BOUNDARY) => {
    const body = new Body({ mass: 0, shape: new Box(new Vec3(sx / 2, sy / 2, sz / 2)), position: new Vec3(x, y, z), collisionFilterGroup: group, collisionFilterMask: active ? STAR : 0 });
    world.addBody(body); return body;
  };
  walls = [
    wall(-width / 2 - .5, height / 2, -depth / 2, 1, height * 3, depth + 2, SIDE),
    wall(width / 2 + .5, height / 2, -depth / 2, 1, height * 3, depth + 2, SIDE),
    // Extend through both launch tunnels: incoming stars must not collide
    // with the exposed ends of the front/back walls before entering.
    wall(0, -.5, -depth / 2, width + 12, 1, depth + 2),
    wall(0, height - CEILING_INSET + .5, -depth / 2, width + 12, 1, depth + 2),
    wall(0, height / 2, -depth - .5, width + 12, height * 3, 1),
    wall(0, height / 2, .5, width + 12, height * 3, 1),
  ];
  publish(false); wake();
}
scope.onmessage = ({ data }) => {
  switch (data.type) {
    case "resize": resize(data); break;
    case "active":
      active = data.value; nextLaunchAt = performance.now();
      // Open all six sides on exit, so resting stars cannot wedge against walls.
      walls.forEach(wall => { wall.collisionFilterMask = active ? STAR : 0; });
      if (!active) {
        pointer.pending = false;
        pieces.forEach(({ body }) => { body.wakeUp(); body.velocity.y = Math.min(body.velocity.y, -.8); });
      } else {
        // Re-entering during the fall should not catch bodies in the floor.
        pieces = pieces.filter(({ body, size }) => {
          if (body.position.y > size * .4) return true;
          world.removeBody(body); return false;
        });
        pieces.forEach(({ body }) => { body.wakeUp(); });
        world.broadphase.dirty = true;
      }
      wake(); break;
    case "pointer":
      if (!active) break;
      pointer.x = data.x; pointer.y = data.y; pointer.vx = data.vx; pointer.vy = data.vy;
      pointer.pending = Math.hypot(data.vx, data.vy) > .5;
      if (Math.abs(data.vx) > 1) pointer.direction = data.vx > 0 ? 1 : -1;
      wake(); break;
    case "visible":
      visible = data.value;
      nextLaunchAt = performance.now();
      if (!visible && timer !== null) { clearTimeout(timer); timer = null; }
      else wake();
      break;
    case "recycle": if (buffers.length < 3) buffers.push(data.buffer); break;
  }
};
