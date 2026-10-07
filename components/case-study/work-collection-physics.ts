import { Bodies, Body, Composite, Engine, Query, Sleeping } from "matter-js";
import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import ScrollTrigger from "gsap/ScrollTrigger";
import {
  createWorkBody,
  getWorkShape,
  type WorkShape,
} from "./work-object-shape";

export type WorkFilter = "all" | "clients" | "projects";
type Pose = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
};
type Toy = {
  element: HTMLElement;
  body: Body;
  width: number;
  height: number;
  offset: { x: number; y: number };
  shape: WorkShape;
};
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
const angle = (radians: number) =>
  (((((radians * 180) / Math.PI + 180) % 360) + 360) % 360) - 180;

/** Keep the DOM in normal flow: only this top viewport becomes a Matter world.
 * The footer stays a sibling and moves with the animated height of this window. */
export function createWorkCollectionPhysics(
  root: HTMLElement,
  onMode: (active: boolean) => void,
  onBusy: (busy: boolean) => void,
  onFilter: (filter: WorkFilter) => void,
) {
  gsap.registerPlugin(ScrollTrigger);
  const field = root.querySelector<HTMLElement>("[data-work-field]")!;
  const elements = [...root.querySelectorAll<HTMLElement>("[data-work-toy]")];
  const authoredStyles = elements.map((el) => el.style.cssText);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const engine = Engine.create({
    enableSleeping: true,
    gravity: { x: 0, y: 0.6, scale: 0.001 },
  });
  let toys: Toy[] = [],
    walls: Body[] = [],
    frame = 0,
    previous = 0;
  let active = false,
    busy = false,
    visible = true,
    disposed = false;
  let filter: WorkFilter = "all";
  let animation: gsap.core.Timeline | null = null;
  let drag: {
    toy: Toy;
    capture: HTMLElement;
    pointerId: number;
    grabX: number;
    grabY: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    vx: number;
    vy: number;
    moved: boolean;
  } | null = null;
  const selected = (next: WorkFilter) =>
    elements.filter(
      (el) =>
        next === "all" ||
        el.dataset.workKind === "shared" ||
        el.dataset.workKind === next,
    );
  const setBusy = (value: boolean) => {
    busy = value;
    onBusy(value);
  };
  const visualPose = (toy: Toy): Pose => {
    const c = Math.cos(toy.body.angle),
      s = Math.sin(toy.body.angle);
    return {
      x:
        toy.body.position.x -
        toy.offset.x * c +
        toy.offset.y * s -
        toy.width / 2,
      y:
        toy.body.position.y -
        toy.offset.x * s -
        toy.offset.y * c -
        toy.height / 2,
      width: toy.width,
      height: toy.height,
      angle: angle(toy.body.angle),
    };
  };
  const paint = (toy: Toy) => {
    const p = visualPose(toy);
    toy.element.style.transform = `translate3d(${p.x}px,${p.y}px,0) rotate(${p.angle}deg)`;
  };
  const contain = (
    toy: Toy,
    width = field.clientWidth,
    height = field.clientHeight,
  ) => {
    const { body } = toy;
    const xs = body.vertices.map((v) => v.x),
      ys = body.vertices.map((v) => v.y);
    const dx =
      Math.max(0, 1 - Math.min(...xs)) +
      Math.min(0, width - 1 - Math.max(...xs));
    const dy =
      Math.max(0, 1 - Math.min(...ys)) +
      Math.min(0, height - 1 - Math.max(...ys));
    if (dx || dy) {
      Body.translate(body, { x: dx, y: dy });
      Body.setVelocity(body, {
        x: dx ? -body.velocity.x * 0.4 : body.velocity.x,
        y: dy ? -body.velocity.y * 0.4 : body.velocity.y,
      });
    }
  };
  const positionBody = (toy: Toy, p: Pose) => {
    const a = (p.angle * Math.PI) / 180,
      c = Math.cos(a),
      s = Math.sin(a);
    Body.setAngle(toy.body, a);
    Body.setPosition(toy.body, {
      x: p.x + p.width / 2 + toy.offset.x * c - toy.offset.y * s,
      y: p.y + p.height / 2 + toy.offset.x * s + toy.offset.y * c,
    });
  };
  const boundaries = () => {
    walls.forEach((wall) => Composite.remove(engine.world, wall));
    const w = field.clientWidth,
      h = field.clientHeight;
    const opts = { isStatic: true, friction: 0.2 };
    walls = [
      Bodies.rectangle(w / 2, h + 40, w + 160, 80, opts),
      Bodies.rectangle(w / 2, -40, w + 160, 80, opts),
      Bodies.rectangle(-40, h / 2, 80, h + 160, opts),
      Bodies.rectangle(w + 40, h / 2, 80, h + 160, opts),
    ];
    Composite.add(engine.world, walls);
  };
  const tick = (now: number) => {
    frame = 0;
    if (!active || busy || !visible || document.hidden || disposed) {
      previous = 0;
      return;
    }
    const dt = Math.min(previous ? now - previous : 16.67, 32);
    previous = now;
    if (!document.documentElement.hasAttribute("data-case-transition")) {
      Engine.update(engine, dt / 2);
      Engine.update(engine, dt / 2);
      toys.forEach((toy) => {
        contain(toy);
        paint(toy);
      });
    }
    frame = requestAnimationFrame(tick);
  };
  const resume = () => {
    if (!frame && active && !busy && visible && !document.hidden && !disposed)
      frame = requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    root.dataset.paused = String(!visible);
    resume();
  });
  observer.observe(field);
  document.addEventListener("visibilitychange", resume);
  const resize = new ResizeObserver(() => {
    if (!active || busy) return;
    boundaries();
    const limit = Math.min(field.clientWidth, field.clientHeight) * 0.48;
    toys.forEach((toy) => {
      const ratio = Math.min(1, limit / Math.max(toy.width, toy.height));
      if (ratio < 1) {
        Body.scale(toy.body, ratio, ratio);
        toy.width *= ratio;
        toy.height *= ratio;
        toy.offset.x *= ratio;
        toy.offset.y *= ratio;
        toy.element.style.width = `${toy.width}px`;
        toy.element.style.height = `${toy.height}px`;
      }
      contain(toy);
      paint(toy);
    });
  });
  resize.observe(field);
  const pointer = (event: PointerEvent) => {
    const r = field.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  };
  const down = (event: PointerEvent) => {
    if (!active || busy || event.button !== 0 || drag) return;
    const el = (event.target as Element).closest<HTMLElement>(
      "[data-work-toy]",
    );
    const toy = toys.find((t) => t.element === el);
    if (!toy) return;
    const p = pointer(event);
    if (!Query.point([toy.body], p).length) {
      // The transparent rectangle must not open a client when the actual object
      // is elsewhere. The route handler also uses this flag after a drag.
      toy.element.dataset.workDragged = "true";
      return;
    }
    delete toy.element.dataset.workDragged;
    event.preventDefault();
    const capture =
      (event.target as Element).closest<HTMLElement>("a,button") || toy.element;
    drag = {
      toy,
      capture,
      pointerId: event.pointerId,
      grabX: p.x - toy.body.position.x,
      grabY: p.y - toy.body.position.y,
      startX: p.x,
      startY: p.y,
      lastX: p.x,
      lastY: p.y,
      lastTime: performance.now(),
      vx: 0,
      vy: 0,
      moved: false,
    };
    Body.setStatic(toy.body, true);
    capture.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const p = pointer(event),
      now = performance.now(),
      dt = Math.max(8, now - drag.lastTime);
    drag.moved ||= Math.hypot(p.x - drag.startX, p.y - drag.startY) > 6;
    if (drag.moved) drag.toy.element.dataset.workDragged = "true";
    drag.vx = clamp(((p.x - drag.lastX) * 16.67) / dt, -22, 22);
    drag.vy = clamp(((p.y - drag.lastY) * 16.67) / dt, -22, 22);
    drag.lastX = p.x;
    drag.lastY = p.y;
    drag.lastTime = now;
    Body.setPosition(drag.toy.body, {
      x: p.x - drag.grabX,
      y: p.y - drag.grabY,
    });
    contain(drag.toy);
    paint(drag.toy);
  };
  const up = (event?: PointerEvent) => {
    if (!drag || (event && drag.pointerId !== event.pointerId)) return;
    const held = drag;
    drag = null;
    Body.setStatic(held.toy.body, false);
    Body.setVelocity(
      held.toy.body,
      performance.now() - held.lastTime < 100
        ? { x: held.vx, y: held.vy }
        : { x: 0, y: 0 },
    );
    Sleeping.set(held.toy.body, false);
    if (held.capture.hasPointerCapture(held.pointerId))
      held.capture.releasePointerCapture(held.pointerId);
    // A title card may have become a video while it was being held.
    void refreshShape(held.toy);
  };
  root.addEventListener("pointerdown", down);
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerup", up);
  root.addEventListener("pointercancel", up);
  root.addEventListener("lostpointercapture", up);
  const clearLayout = () =>
    elements.forEach((el, index) => {
      gsap.set(el, { clearProps: "all" });
      el.style.cssText = authoredStyles[index];
      delete el.dataset.casePhysicsObject;
      delete el.dataset.workDragged;
    });
  const measure = (list: HTMLElement[]) => {
    const origin = root.getBoundingClientRect();
    return new Map(
      list.map((el) => {
        const toy = active && toys.find((t) => t.element === el);
        if (toy) {
          const r = field.getBoundingClientRect(),
            pose = visualPose(toy);
          return [
            el,
            {
              ...pose,
              x: pose.x + r.left - origin.left,
              y: pose.y + r.top - origin.top,
            },
          ];
        }
        const r = el
          .querySelector<HTMLElement>("[data-work-art]")!
          .getBoundingClientRect();
        return [
          el,
          {
            x: r.left - origin.left,
            y: r.top - origin.top,
            width: r.width,
            height: r.height,
            angle: 0,
          },
        ];
      }),
    );
  };
  const refreshShape = async (toy: Toy) => {
    const shape = await getWorkShape(toy.element);
    if (
      !active ||
      busy ||
      disposed ||
      !toys.includes(toy) ||
      drag?.toy === toy ||
      shape === toy.shape
    )
      return;
    const p = visualPose(toy),
      velocity = { ...toy.body.velocity },
      spin = toy.body.angularVelocity;
    Composite.remove(engine.world, toy.body);
    Object.assign(toy, createWorkBody(shape, toy.width, toy.height), { shape });
    positionBody(toy, p);
    Composite.add(engine.world, toy.body);
    Body.setVelocity(toy.body, velocity);
    Body.setAngularVelocity(toy.body, spin);
    contain(toy);
    paint(toy);
  };
  const mediaObserver = new MutationObserver((records) => {
    if (!active || busy) return;
    for (const record of records) {
      const el = (record.target as HTMLElement).closest<HTMLElement>(
        "[data-work-toy]",
      );
      const toy = toys.find((t) => t.element === el);
      if (toy) void refreshShape(toy);
    }
  });
  mediaObserver.observe(field, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-preview-phase"],
  });
  elements.forEach((el) => {
    void getWorkShape(el);
  });

  const arrange = async (nextActive: boolean, nextFilter: WorkFilter) => {
    if (busy || disposed) return;
    setBusy(true);
    const nextElements = selected(nextFilter);
    const shapes = nextActive
      ? await Promise.all(nextElements.map(getWorkShape))
      : [];
    if (disposed) return;
    up();
    animation?.kill();
    cancelAnimationFrame(frame);
    frame = 0;
    root.dataset.workTransition = "true";
    const from = measure(selected(filter));
    const oldHeight = root.getBoundingClientRect().height,
      oldPadding = parseFloat(getComputedStyle(root).paddingBottom);
    // Remove all layout overrides, measure the real responsive destination,
    // then invert that change before the browser can paint it.
    active = false;
    toys = [];
    walls = [];
    Composite.clear(engine.world, false);
    clearLayout();
    delete root.dataset.workLayout;
    root.style.height = "";
    root.style.paddingBottom = "";
    filter = nextFilter;
    root.dataset.filter = filter;
    onFilter(filter);
    const home = measure(nextElements),
      naturalHeight = root.getBoundingClientRect().height;
    const naturalPadding = parseFloat(getComputedStyle(root).paddingBottom);
    const rootBox = root.getBoundingClientRect(),
      fieldBox = field.getBoundingClientRect();
    const fieldX = fieldBox.left - rootBox.left,
      fieldY = fieldBox.top - rootBox.top;
    const targetHeight = nextActive ? innerHeight : naturalHeight;
    const targetPadding = nextActive
      ? innerHeight < 600
        ? 12
        : 24
      : naturalPadding;
    const w = field.clientWidth,
      h = Math.max(100, targetHeight - fieldY - targetPadding);
    root.dataset.workLayout = "free";
    root.style.height = `${oldHeight}px`;
    root.style.paddingBottom = `${oldPadding}px`;
    root.dataset.gravity = String(nextActive);
    onMode(nextActive);
    const duration = motion.matches ? 0 : 0.78;
    animation = gsap.timeline();
    const columns = Math.min(nextElements.length, innerWidth < 768 ? 3 : 4),
      rows = Math.ceil(nextElements.length / columns);
    nextElements.forEach((el, index) => {
      const rest = home.get(el)!;
      let target = { ...rest, x: rest.x - fieldX, y: rest.y - fieldY };
      if (nextActive) {
        const ratio = Math.min(
          innerWidth < 768 ? 0.66 : 0.86,
          ((w / columns) * 0.85) / rest.width,
          ((h / rows) * 0.8) / rest.height,
        );
        const width = rest.width * ratio,
          height = rest.height * ratio;
        const toy: Toy = {
          element: el,
          width,
          height,
          shape: shapes[index],
          ...createWorkBody(shapes[index], width, height),
        };
        const row = Math.floor(index / columns);
        const rowCount = Math.min(columns, nextElements.length - row * columns);
        const p = {
          x:
            w / 2 +
            (((index % columns) - (rowCount - 1) / 2) * w) / columns -
            width / 2,
          y:
            ((Math.floor(index / columns) + 0.5) * h * 0.8) / rows - height / 2,
          width,
          height,
          angle: 0,
        };
        positionBody(toy, p);
        contain(toy, w, h);
        target = visualPose(toy);
        Composite.add(engine.world, toy.body);
        toys.push(toy);
        Body.setVelocity(toy.body, { x: ((index % 3) - 1) * 0.6, y: 0 });
        Body.setAngularVelocity(
          toy.body,
          motion.matches ? 0 : (index % 2 ? 1 : -1) * 0.006,
        );
        el.dataset.casePhysicsObject = "";
      }
      const start = from.get(el);
      gsap.set(el, {
        position: "absolute",
        left: 0,
        top: 0,
        margin: 0,
        xPercent: 0,
        yPercent: 0,
        x: start ? start.x - fieldX : target.x,
        y: start ? start.y - fieldY : target.y,
        width: start?.width ?? target.width,
        height: start?.height ?? target.height,
        rotation: start?.angle ?? 0,
        opacity: start ? 1 : 0,
        scale: start ? 1 : 0.82,
      });
      animation!.to(
        el,
        {
          x: target.x,
          y: target.y,
          width: target.width,
          height: target.height,
          rotation: target.angle,
          scale: 1,
          opacity: 1,
          duration,
          ease: "power3.inOut",
        },
        0,
      );
    });
    animation.to(
      root,
      {
        height: targetHeight,
        paddingBottom: targetPadding,
        duration,
        ease: "power3.inOut",
      },
      0,
    );
    const smoother = ScrollSmoother.get();
    const scroll = { y: smoother ? smoother.scrollTop() : window.scrollY };
    if (scroll.y > 1)
      animation.to(
        scroll,
        {
          y: 0,
          duration,
          ease: "power3.inOut",
          onUpdate: () => {
            if (smoother) smoother.scrollTop(scroll.y);
            else window.scrollTo(0, scroll.y);
          },
        },
        0,
      );
    animation.call(() => {
      root.style.height = "";
      root.style.paddingBottom = "";
      active = nextActive;
      if (active) {
        delete root.dataset.workTransition;
        setBusy(false);
        boundaries();
        toys.forEach((toy) => {
          contain(toy);
          paint(toy);
          void refreshShape(toy);
        });
        ScrollTrigger.refresh();
        resume();
      } else {
        const finalPoses = measure(nextElements);
        clearLayout();
        delete root.dataset.workLayout;
        ScrollTrigger.refresh();
        ScrollTrigger.update();
        const destinations = measure(nextElements);
        const settle = gsap.timeline({
          onComplete: () => {
            delete root.dataset.workTransition;
            setBusy(false);
          },
        });
        animation = settle;
        nextElements.forEach((el) => {
          const a = finalPoses.get(el)!,
            b = destinations.get(el)!;
          const pop = el.querySelector<HTMLElement>("[data-work-pop]")!;
          gsap.set(pop, {
            x: a.x - b.x,
            y: a.y - b.y,
            scaleX: a.width / b.width,
            scaleY: a.height / b.height,
            transformOrigin: "0 0",
          });
          settle.to(
            pop,
            {
              x: 0,
              y: 0,
              scale: 1,
              duration: motion.matches ? 0 : 0.2,
              ease: "power2.out",
              clearProps: "transform,transformOrigin",
            },
            0,
          );
        });
        settle.fromTo(
          nextElements.map((el) => el.querySelector("[data-work-label]")),
          { opacity: 0 },
          {
            opacity: 1,
            duration: motion.matches ? 0 : 0.2,
            clearProps: "opacity",
          },
          0,
        );
      }
    });
  };
  return {
    toggle: () => arrange(!active, filter),
    setFilter: (next: WorkFilter) =>
      next === filter ? Promise.resolve() : arrange(active, next),
    dispose() {
      disposed = true;
      up();
      animation?.kill();
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      mediaObserver.disconnect();
      document.removeEventListener("visibilitychange", resume);
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointercancel", up);
      root.removeEventListener("lostpointercapture", up);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      clearLayout();
      root.style.height = "";
      root.style.paddingBottom = "";
      delete root.dataset.workLayout;
      delete root.dataset.workTransition;
    },
  };
}
