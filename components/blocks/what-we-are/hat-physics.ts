import { Bodies, Body, Composite, Engine, Sleeping } from "matter-js";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { ROLES, type RoleId } from "./wardrobe-data";

export type HatPose = { x: number; y: number; scale: number; angle: number };
type Bounds = { left: number; top: number; right: number; bottom: number };
type HatState = {
  element: HTMLButtonElement;
  dock: HTMLElement;
  body: Body;
  width: number;
  height: number;
  scale: number;
  free: boolean;
};
const clamp = (n: number, low: number, high: number) =>
  Math.max(low, Math.min(high, n));

/** Four DOM hats, using the same gravity/drag response as the basket. */
export function createHatPhysics(section: HTMLElement, onLayout: () => void) {
  gsap.registerPlugin(ScrollTrigger);
  const engine = Engine.create({
    enableSleeping: true,
    gravity: { x: 0, y: 0.12, scale: 0.001 },
  });
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const title = section.querySelector<HTMLElement>("[data-hat-title]")!;
  const figure = section.querySelector<HTMLElement>("[data-hat-figure]")!;
  // BackgroundPanel is the first child; use its real inset/border dimensions.
  const panel = section.firstElementChild as HTMLElement;
  const box = (element: HTMLElement): Bounds => {
    const root = section.getBoundingClientRect(),
      r = element.getBoundingClientRect();
    return {
      left: r.left - root.left,
      top: r.top - root.top,
      right: r.right - root.left,
      bottom: r.bottom - root.top,
    };
  };
  let bounds = box(panel);
  let obstacles: Body[] = [];
  let figureParts: Body[] = [];
  let figureBounds: Bounds | null = null;
  let frame = 0,
    previous = 0,
    visible = false,
    disposed = false,
    enteredAt = 0;
  const states = new Map<RoleId, HatState>(
    ROLES.map((role) => {
      const element = section.querySelector<HTMLButtonElement>(
        `[data-hat-flight="${role.id}"]`,
      )!;
      const dock = section.querySelector<HTMLElement>(
        `[data-hat-dock="${role.id}"]`,
      )!;
      const width = dock.getBoundingClientRect().width;
      const height = (width * role.hatHeight) / role.hatWidth;
      const d = box(dock),
        heading = box(title);
      const body = Bodies.rectangle(
        (d.left + d.right) / 2,
        heading.top - height / 2 - 2,
        width * 0.94,
        height * 0.9,
        {
          label: `wardrobe-hat-${role.id}`,
          restitution: 0.58,
          friction: 0.18,
          frictionAir: 0.025,
          density: 0.0014,
          collisionFilter: { category: 0x0002 },
          chamfer: { radius: Math.min(width, height) * 0.13 },
        },
      );
      Composite.add(engine.world, body);
      return [
        role.id,
        { element, dock, body, width, height, scale: 1, free: true },
      ];
    }),
  );
  type State = HatState;
  const paint = (state: State) => {
    const { element, body, width, height, scale } = state;
    element.style.width = `${width}px`;
    element.style.transform = `translate3d(${body.position.x - width / 2}px,${body.position.y - height / 2}px,0) rotate(${body.angle}rad) scale(${scale})`;
    element.dataset.hatPhysics = state.free ? "free" : "held";
  };
  const contain = (state: State) => {
    const { body, scale, width, height } = state;
    const c = Math.abs(Math.cos(body.angle)),
      s = Math.abs(Math.sin(body.angle));
    const halfW = ((width * c + height * s) * scale) / 2;
    const halfH = ((width * s + height * c) * scale) / 2;
    const x = clamp(
      body.position.x,
      bounds.left + halfW + 1,
      bounds.right - halfW - 1,
    );
    const y = clamp(
      body.position.y,
      bounds.top + halfH + 1,
      bounds.bottom - halfH - 1,
    );
    if (x !== body.position.x || y !== body.position.y) {
      const vx = body.velocity.x,
        vy = body.velocity.y;
      const hitX = x !== body.position.x,
        hitY = y !== body.position.y;
      Body.setPosition(body, { x, y });
      if (state.free)
        Body.setVelocity(body, {
          x: hitX ? -vx * 0.58 : vx,
          y: hitY ? -vy * 0.58 : vy,
        });
    }
  };
  const staticRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
  ) =>
    Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      friction: 0.22,
      label,
    });
  const updateFigure = () => {
    if (section.dataset.figureSpinning === "true") return;
    const r = box(figure),
      old = figureBounds;
    if (
      old &&
      Math.max(
        Math.abs(r.left - old.left),
        Math.abs(r.top - old.top),
        Math.abs(r.right - old.right),
        Math.abs(r.bottom - old.bottom),
      ) < 0.75
    )
      return;
    if (old && figureParts.length) {
      const sx = Math.max(0.02, (r.right - r.left) / (old.right - old.left));
      const sy = Math.max(0.02, (r.bottom - r.top) / (old.bottom - old.top));
      figureParts.forEach((part) => {
        const x = r.left + (part.position.x - old.left) * sx;
        const y = r.top + (part.position.y - old.top) * sy;
        Body.scale(part, sx, sy);
        Body.setPosition(part, { x, y });
      });
    } else {
      const w = r.right - r.left,
        h = r.bottom - r.top;
      const limb = (
        ax: number,
        ay: number,
        bx: number,
        by: number,
        thickness: number,
      ) => {
        const dx = (bx - ax) * w,
          dy = (by - ay) * h;
        const part = staticRect(
          r.left + ((ax + bx) * w) / 2,
          r.top + ((ay + by) * h) / 2,
          Math.hypot(dx, dy),
          w * thickness,
          "wardrobe-figure",
        );
        Body.setAngle(part, Math.atan2(dy, dx));
        return part;
      };
      // Anatomical colliders leave the empty areas around the drawing open.
      figureParts = [
        Bodies.circle(r.left + w * 0.5, r.top + h * 0.265, w * 0.065, {
          isStatic: true,
          label: "wardrobe-head",
        }),
        staticRect(
          r.left + w * 0.5,
          r.top + h * 0.445,
          w * 0.15,
          h * 0.24,
          "wardrobe-torso",
        ),
        limb(0.43, 0.345, 0.17, 0.34, 0.048),
        limb(0.57, 0.345, 0.84, 0.34, 0.048),
        limb(0.43, 0.325, 0.18, 0.215, 0.045),
        limb(0.57, 0.325, 0.82, 0.215, 0.045),
        limb(0.47, 0.56, 0.285, 0.885, 0.066),
        limb(0.53, 0.56, 0.715, 0.885, 0.066),
        limb(0.47, 0.56, 0.475, 0.925, 0.052),
        limb(0.53, 0.56, 0.545, 0.925, 0.052),
      ];
      Composite.add(engine.world, figureParts);
    }
    figureBounds = r;
  };
  const rebuild = () => {
    const oldBounds = bounds;
    bounds = box(panel);
    Composite.remove(engine.world, [...obstacles, ...figureParts]);
    figureParts = [];
    figureBounds = null;
    const w = bounds.right - bounds.left,
      h = bounds.bottom - bounds.top;
    const cx = (bounds.left + bounds.right) / 2,
      cy = (bounds.top + bounds.bottom) / 2;
    obstacles = [
      staticRect(cx, bounds.top - 50, w + 200, 100, "wardrobe-wall-top"),
      staticRect(cx, bounds.bottom + 50, w + 200, 100, "wardrobe-wall-bottom"),
      staticRect(bounds.left - 50, cy, 100, h + 200, "wardrobe-wall-left"),
      staticRect(bounds.right + 50, cy, 100, h + 200, "wardrobe-wall-right"),
      ...[
        title,
        ...section.querySelectorAll<HTMLElement>("[data-hat-obstacle]"),
      ]
        .filter(
          (el) =>
            el.getClientRects().length && el.clientWidth && el.clientHeight,
        )
        .map((el) => {
          const r = box(el);
          return staticRect(
            (r.left + r.right) / 2,
            (r.top + r.bottom) / 2,
            r.right - r.left,
            r.bottom - r.top,
            el === title ? "wardrobe-title" : "wardrobe-label",
          );
        }),
    ];
    Composite.add(engine.world, obstacles);
    updateFigure();
    states.forEach((state) => {
      const width = state.dock.getBoundingClientRect().width;
      const ratio = width / state.width;
      Body.scale(state.body, ratio, ratio);
      state.width = width;
      state.height *= ratio;
      if (state.free) {
        Body.setPosition(state.body, {
          x:
            bounds.left +
            ((state.body.position.x - oldBounds.left) /
              Math.max(1, oldBounds.right - oldBounds.left)) *
              w,
          y:
            bounds.top +
            ((state.body.position.y - oldBounds.top) /
              Math.max(1, oldBounds.bottom - oldBounds.top)) *
              h,
        });
        contain(state);
        Sleeping.set(state.body, false);
      }
      paint(state);
    });
    onLayout();
  };
  const tick = (time: number) => {
    frame = 0;
    if (!visible || document.hidden || disposed || motion.matches) {
      previous = 0;
      return;
    }
    const delta = Math.min(previous ? time - previous : 16.67, 32);
    previous = time;
    updateFigure();
    // Released hats regain their free-object size where they actually are.
    // Keep this in the physics loop so their position remains collision-driven.
    states.forEach((state) => {
      if (!state.free || Math.abs(state.scale - 1) < 0.0001) return;
      const scale =
        Math.abs(state.scale - 1) < 0.002
          ? 1
          : state.scale + (1 - state.scale) * (1 - Math.exp(-delta / 140));
      Body.scale(state.body, scale / state.scale, scale / state.scale);
      state.scale = scale;
      Sleeping.set(state.body, false);
    });
    // Two short steps keep quick throws from tunnelling through label boxes.
    Engine.update(engine, delta / 2);
    Engine.update(engine, delta / 2);
    states.forEach((state) => {
      if (!state.free) return;
      contain(state);
      paint(state);
    });
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    section.dataset.hatPhysicsRunning = String(
      visible && !document.hidden && !motion.matches,
    );
    if (visible && !document.hidden && !motion.matches)
      frame = requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(([entry]) => {
    if (!visible && entry.isIntersecting) enteredAt = performance.now();
    visible = entry.isIntersecting;
    sync();
  });
  let resizeFrame = 0;
  const resized = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(rebuild);
  });
  let impulseAt = 0;
  const turbulence = ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      const now = performance.now();
      if (
        !visible ||
        motion.matches ||
        now - enteredAt < 350 ||
        now - impulseAt < 70
      )
        return;
      const force = clamp(-self.getVelocity() / 2600, -1, 1);
      if (Math.abs(force) < 0.035) return;
      impulseAt = now;
      states.forEach((state, id) => {
        if (!state.free) return;
        const i = ROLES.findIndex((role) => role.id === id),
          body = state.body;
        Sleeping.set(body, false);
        Body.setVelocity(body, {
          x: clamp(body.velocity.x + force * ((i % 3) - 1) * 1.6, -13, 13),
          y: clamp(body.velocity.y + force * 5.5, -15, 15),
        });
      });
    },
  });
  rebuild();
  states.forEach((state) => {
    state.element.style.opacity = "1";
    state.element.style.visibility = "visible";
  });
  observer.observe(section);
  resized.observe(section);
  document.fonts.ready.then(() => {
    if (!disposed) rebuild();
  });
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  return {
    get(role: RoleId): HatPose {
      const s = states.get(role)!;
      return { ...s.body.position, angle: s.body.angle, scale: s.scale };
    },
    hold(role: RoleId) {
      const s = states.get(role)!;
      s.free = false;
      Body.setStatic(s.body, true);
      // A controlled hat passes over the drawing/text but still pushes hats.
      s.body.collisionFilter.mask = 0x0002;
      paint(s);
    },
    place(role: RoleId, pose: HatPose, constrain = false, moving = false) {
      const s = states.get(role)!;
      if (Math.abs(s.scale - pose.scale) > 0.0001)
        Body.scale(s.body, pose.scale / s.scale, pose.scale / s.scale);
      s.scale = pose.scale;
      const travel = {
        x: pose.x - s.body.position.x,
        y: pose.y - s.body.position.y,
      };
      Body.setPosition(s.body, pose);
      if (!s.free) Body.setVelocity(s.body, moving ? travel : { x: 0, y: 0 });
      Body.setAngle(s.body, pose.angle);
      if (constrain) contain(s);
      paint(s);
    },
    release(role: RoleId, velocity = { x: 0, y: 0 }, angularVelocity = 0) {
      const s = states.get(role)!;
      s.free = true;
      Body.setStatic(s.body, false);
      s.body.collisionFilter.mask = 0xffffffff;
      if (motion.matches && s.scale !== 1) {
        Body.scale(s.body, 1 / s.scale, 1 / s.scale);
        s.scale = 1;
      }
      Body.setVelocity(s.body, motion.matches ? { x: 0, y: 0 } : velocity);
      // Rotation comes from collisions, never from a pickup/placement flourish.
      Body.setAngularVelocity(s.body, motion.matches ? 0 : angularVelocity);
      Sleeping.set(s.body, false);
      contain(s);
      paint(s);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      resized.disconnect();
      turbulence.kill();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      delete section.dataset.hatPhysicsRunning;
    },
  };
}
export type HatPhysics = ReturnType<typeof createHatPhysics>;
