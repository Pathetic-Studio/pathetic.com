import {
  UNIVERSE_BRANDS,
  clamp,
  seededRandom,
  TAU,
} from "./credibility-universe-data";

export type UniverseBody = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  labelHalfWidth?: number;
  labelBottom?: number;
  angle: number;
  spin: number;
};
export type UniversePointer = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  down: boolean;
};

export const MAX_COMETS = 3;
export const MAX_IMPACTS = 4;
export const MAX_FRAGMENTS = 24;
export type UniverseImpact = {
  x: number;
  y: number;
  age: number;
  radius: number;
  active: boolean;
};
export type UniverseFragment = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  size: number;
  angle: number;
  spin: number;
  active: boolean;
};
export type UniverseComet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
  age: number;
  hits: number;
};

/** Bodies share one XY plane; only their meshes and lighting have depth. */
export function createUniversePhysics() {
  let width = 20,
    height = 11,
    scale = 1;
  const bodies: UniverseBody[] = UNIVERSE_BRANDS.map((b) => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: b.radius,
    angle: 0,
    spin: 0,
  }));
  // Reuse a small pool, including during rapid repeated clicks.
  const comets: UniverseComet[] = Array.from({ length: MAX_COMETS }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 0.32,
    active: false,
    age: 0,
    hits: 0,
  }));
  const impacts: UniverseImpact[] = Array.from({ length: MAX_IMPACTS }, () => ({
    x: 0,
    y: 0,
    age: 0,
    radius: 1,
    active: false,
  }));
  const fragments: UniverseFragment[] = Array.from(
    { length: MAX_FRAGMENTS },
    () => ({
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      age: 0,
      size: 0,
      angle: 0,
      spin: 0,
      active: false,
    }),
  );
  const random = seededRandom(8215);
  let fragmentCursor = 0,
    impactCursor = 0;
  const clearEffects = () => {
    comets.forEach((comet) => {
      comet.active = false;
    });
    impacts.forEach((impact) => {
      impact.active = false;
    });
    fragments.forEach((fragment) => {
      fragment.active = false;
    });
  };
  const shatter = (comet: UniverseComet) => {
    comet.active = false;
    const impact = impacts[impactCursor++ % MAX_IMPACTS];
    Object.assign(impact, {
      x: comet.x,
      y: comet.y,
      age: 0,
      radius: scale,
      active: true,
    });
    for (let i = 0; i < 6; i++) {
      const fragment = fragments[fragmentCursor++ % MAX_FRAGMENTS];
      const angle = ((i + random() * 0.7) / 6) * TAU;
      const speed = 3.5 + random() * 4.5;
      Object.assign(fragment, {
        x: comet.x + Math.cos(angle) * comet.radius * 0.3,
        y: comet.y + Math.sin(angle) * comet.radius * 0.3,
        z: 0.15,
        vx: comet.vx * 0.22 + Math.cos(angle) * speed,
        vy: comet.vy * 0.22 + Math.sin(angle) * speed,
        vz: (random() - 0.5) * 0.5,
        age: 0,
        size: (0.07 + random() * 0.1) * scale,
        angle,
        spin: (random() - 0.5) * 14,
        active: true,
      });
    }
  };
  let launches = 0;
  const reset = () => {
    clearEffects();
    bodies.forEach((body, i) => {
      const angle = UNIVERSE_BRANDS[i].angle;
      body.radius = UNIVERSE_BRANDS[i].radius * scale;
      body.x = Math.cos(angle) * width * 0.35;
      body.y = Math.sin(angle) * height * 0.34;
      body.vx = -Math.sin(angle) * 0.22;
      body.vy = Math.cos(angle) * 0.22;
      body.angle = 0;
      body.spin = 0;
      contain(body);
    });
  };
  const contain = (body: UniverseBody) => {
    const x =
      width / 2 -
      Math.max(body.radius * 1.78, (body.labelHalfWidth || 0) * scale) -
      0.12;
    const y =
      height / 2 -
      Math.max(body.radius * 1.78, (body.labelBottom || 0) * scale) -
      0.3;
    if (Math.abs(body.x) > x) {
      body.x = clamp(body.x, -x, x);
      body.vx *= -0.7;
    }
    if (Math.abs(body.y) > y) {
      body.y = clamp(body.y, -y, y);
      body.vy *= -0.7;
    }
  };
  const resize = (w: number, h: number, s: number) => {
    const oldW = width,
      oldH = height;
    width = w;
    height = h;
    scale = s;
    clearEffects();
    bodies.forEach((body, i) => {
      body.x *= width / oldW;
      body.y *= height / oldH;
      body.radius = UNIVERSE_BRANDS[i].radius * scale;
      contain(body);
    });
  };
  const launchComet = (targetX: number, targetY: number) => {
    const comet =
      comets.find((c) => !c.active) ||
      comets.reduce((oldest, c) => (c.age > oldest.age ? c : oldest));
    const side = launches++ % 2 ? 1 : -1;
    comet.x = side * (width / 2 + 1.5);
    comet.y = clamp(
      targetY + Math.sin(launches * 2.4) * height * 0.2,
      -height * 0.42,
      height * 0.42,
    );
    const dx = targetX - comet.x,
      dy = targetY - comet.y;
    const distance = Math.max(0.1, Math.hypot(dx, dy));
    const speed = Math.max(13, width * 0.95);
    comet.vx = (dx / distance) * speed;
    comet.vy = (dy / distance) * speed;
    comet.radius = 0.32 * scale;
    comet.age = 0;
    comet.hits = 0;
    comet.active = true;
    return comet;
  };
  const step = (
    dt: number,
    pointer: UniversePointer,
    dragged: number,
    offsetX = 0,
    offsetY = 0,
  ) => {
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (i === dragged) {
        b.x = pointer.x + offsetX;
        b.y = pointer.y + offsetY;
        b.vx = clamp(pointer.vx, -12, 12);
        b.vy = clamp(pointer.vy, -12, 12);
      } else {
        const nx = b.x / (width * 0.35),
          ny = b.y / (height * 0.34);
        const r = Math.max(0.1, Math.hypot(nx, ny));
        // A gentle circulating current, not a prescribed animation path.
        b.vx += (-ny * 0.24 - nx * (r - 1) * 0.7) * dt;
        b.vy += (nx * 0.24 - ny * (r - 1) * 0.7) * dt;
        if (pointer.active) {
          const dx = b.x - pointer.x,
            dy = b.y - pointer.y;
          const d = Math.max(0.4, Math.hypot(dx, dy));
          const force = Math.max(0, 1 - d / (3.6 * scale));
          const swirl = pointer.down ? 4 : 1.3;
          b.vx +=
            ((-dy / d) * swirl + pointer.vx * 0.24 + (dx / d) * 0.4) *
            force *
            dt;
          b.vy +=
            ((dx / d) * swirl + pointer.vy * 0.24 + (dy / d) * 0.4) *
            force *
            dt;
          b.spin += pointer.vx * force * dt * 0.08;
        }
        const damping = Math.exp(-0.42 * dt);
        b.vx = clamp(b.vx * damping, -12, 12);
        b.vy = clamp(b.vy * damping, -12, 12);
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
      b.angle += (0.045 + b.spin) * dt;
      b.spin *= Math.exp(-1.6 * dt);
      contain(b);
    }
    // Kinematic dragged bodies still push their neighbours. Two passes remove
    // overlap after a fast throw without destabilising the small simulation.
    for (let pass = 0; pass < 2; pass++)
      for (let i = 0; i < bodies.length; i++)
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i],
            b = bodies[j];
          let dx = b.x - a.x,
            dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          const separation = (a.radius + b.radius) * 1.13;
          if (distance >= separation) continue;
          if (distance < 0.001) {
            dx = 1;
            dy = 0;
          } else {
            dx /= distance;
            dy /= distance;
          }
          const aWeight = i === dragged ? 0 : j === dragged ? 1 : 0.5;
          const bWeight = 1 - aWeight;
          const overlap = separation - distance;
          a.x -= dx * overlap * aWeight;
          a.y -= dy * overlap * aWeight;
          b.x += dx * overlap * bWeight;
          b.y += dy * overlap * bWeight;
          const speed = (b.vx - a.vx) * dx + (b.vy - a.vy) * dy;
          if (speed < 0) {
            const impulse = -speed * 1.72;
            a.vx -= dx * impulse * aWeight;
            a.vy -= dy * impulse * aWeight;
            b.vx += dx * impulse * bWeight;
            b.vy += dy * impulse * bWeight;
            a.spin -= impulse * 0.12;
            b.spin += impulse * 0.12;
          }
          contain(a);
          contain(b);
        }
    if (!dt) return;
    for (const impact of impacts) {
      if (impact.active && (impact.age += dt) > 0.85) impact.active = false;
    }
    for (const fragment of fragments) {
      if (!fragment.active) continue;
      fragment.age += dt;
      fragment.x += fragment.vx * dt;
      fragment.y += fragment.vy * dt;
      fragment.z += fragment.vz * dt;
      fragment.angle += fragment.spin * dt;
      // Debris has no walls: it leaves the panel instead of bouncing back.
      if (
        fragment.age > 4 ||
        Math.abs(fragment.x) > width / 2 + 2 ||
        Math.abs(fragment.y) > height / 2 + 2
      )
        fragment.active = false;
    }
    for (const comet of comets) {
      if (!comet.active) continue;
      const fromX = comet.x,
        fromY = comet.y;
      comet.x += comet.vx * dt;
      comet.y += comet.vy * dt;
      comet.age += dt;
      const dx = comet.x - fromX,
        dy = comet.y - fromY;
      const lengthSquared = dx * dx + dy * dy;
      const speed = Math.hypot(comet.vx, comet.vy);
      const forwardX = comet.vx / speed,
        forwardY = comet.vy / speed;
      let hitIndex = -1,
        firstContact = Infinity;
      bodies.forEach((body, i) => {
        if (i === dragged || comet.hits & (1 << i)) return;
        // Exact swept circle entry: shatter at the first surface along the
        // flight path, not at a body's centre or whichever body is listed first.
        const fx = fromX - body.x,
          fy = fromY - body.y;
        const radius = body.radius * 1.13 + comet.radius;
        const c = fx * fx + fy * fy - radius * radius;
        const b = 2 * (fx * dx + fy * dy);
        const discriminant = b * b - 4 * lengthSquared * c;
        if (discriminant < 0) return;
        const t =
          c <= 0
            ? 0
            : (-b - Math.sqrt(discriminant)) /
              (2 * Math.max(lengthSquared, 0.000001));
        if (t >= 0 && t <= 1 && t < firstContact) {
          hitIndex = i;
          firstContact = t;
        }
      });
      if (hitIndex >= 0) {
        const body = bodies[hitIndex];
        comet.x = fromX + dx * firstContact;
        comet.y = fromY + dy * firstContact;
        const awayX = body.x - comet.x,
          awayY = body.y - comet.y;
        comet.hits |= 1 << hitIndex;
        const side = awayX * -forwardY + awayY * forwardX < 0 ? -1 : 1;
        body.vx = clamp(
          body.vx + forwardX * 7 - forwardY * side * 3.5,
          -12,
          12,
        );
        body.vy = clamp(
          body.vy + forwardY * 7 + forwardX * side * 3.5,
          -12,
          12,
        );
        body.spin += side * 2.4;
        shatter(comet);
      }
      // Let the complete tail leave the panel before recycling the object.
      if (
        comet.age > 4 ||
        Math.abs(comet.x) > width / 2 + 7 ||
        Math.abs(comet.y) > height / 2 + 7
      )
        comet.active = false;
    }
  };
  reset();
  return {
    bodies,
    comets,
    fragments,
    impacts,
    resize,
    reset,
    step,
    launchComet,
  };
}
