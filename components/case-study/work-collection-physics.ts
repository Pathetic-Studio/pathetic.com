import { Bodies, Body, Composite, Engine, Sleeping } from "matter-js";
import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";

type Pose = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
};
type Toy = { element: HTMLElement; body: Body; width: number; height: number };
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/** Matter owns only the temporary play mode; the authored layout owns rest. */
export function createWorkCollectionPhysics(
  root: HTMLElement,
  onMode: (active: boolean) => void,
) {
  const field = root.querySelector<HTMLElement>("[data-work-field]")!;
  const elements = [...root.querySelectorAll<HTMLElement>("[data-work-toy]")];
  const authoredStyles = elements.map((element) => element.style.cssText);
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
  let home: Pose[] = [],
    homeHeight = 0,
    animation: gsap.core.Timeline | null = null;
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
  const box = () => field.getBoundingClientRect();
  const paint = (toy: Toy) => {
    const { body, element, width, height } = toy;
    element.style.transform = `translate3d(${body.position.x - width / 2}px,${body.position.y - height / 2}px,0) rotate(${body.angle}rad)`;
  };
  const contain = (toy: Toy) => {
    const { body, width, height } = toy;
    const c = Math.abs(Math.cos(body.angle)),
      s = Math.abs(Math.sin(body.angle));
    const hw = (width * c + height * s) / 2,
      hh = (height * c + width * s) / 2;
    const x = clamp(body.position.x, hw + 1, field.clientWidth - hw - 1);
    const y = clamp(body.position.y, hh + 1, field.clientHeight - hh - 1);
    if (x !== body.position.x || y !== body.position.y) {
      const vx = body.velocity.x,
        vy = body.velocity.y;
      Body.setVelocity(body, {
        x: x !== body.position.x ? -vx * 0.45 : vx,
        y: y !== body.position.y ? -vy * 0.45 : vy,
      });
      Body.setPosition(body, { x, y });
    }
  };
  const boundaries = () => {
    walls.forEach((wall) => Composite.remove(engine.world, wall));
    const w = field.clientWidth,
      h = field.clientHeight;
    walls = [
      Bodies.rectangle(w / 2, h + 40, w + 160, 80, { isStatic: true }),
      Bodies.rectangle(w / 2, -40, w + 160, 80, { isStatic: true }),
      Bodies.rectangle(-40, h / 2, 80, h + 160, { isStatic: true }),
      Bodies.rectangle(w + 40, h / 2, 80, h + 160, { isStatic: true }),
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
    const limit = Math.min(field.clientWidth, field.clientHeight) * 0.42;
    toys.forEach((toy) => {
      const ratio = Math.min(1, limit / Math.max(toy.width, toy.height));
      if (ratio < 1) {
        Body.scale(toy.body, ratio, ratio);
        toy.width *= ratio;
        toy.height *= ratio;
        toy.element.style.width = `${toy.width}px`;
        toy.element.style.height = `${toy.height}px`;
      }
      contain(toy);
      paint(toy);
    });
  });
  resize.observe(field);
  const pointer = (event: PointerEvent) => {
    const r = box();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  };
  const down = (event: PointerEvent) => {
    if (!active || busy || event.button !== 0 || drag) return;
    const el = (event.target as Element).closest<HTMLElement>(
      "[data-work-toy]",
    );
    const toy = toys.find((toy) => toy.element === el);
    if (!toy) return;
    delete toy.element.dataset.workDragged;
    event.preventDefault();
    const p = pointer(event);
    // Keep a tap targeted at its link/button; capturing on the wrapper would
    // retarget the subsequent click to a div and swallow project navigation.
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
  const measureHome = () => {
    const r = box();
    homeHeight = field.offsetHeight;
    return elements.map((element) => {
      const art = element
        .querySelector<HTMLElement>("[data-work-art]")!
        .getBoundingClientRect();
      return {
        x: art.left - r.left,
        y: art.top - r.top,
        width: art.width,
        height: art.height,
        angle: 0,
      };
    });
  };
  return {
    toggle() {
      if (busy || disposed) return;
      busy = true;
      up();
      animation?.kill();
      cancelAnimationFrame(frame);
      frame = 0;
      const smoother = ScrollSmoother.get();
      if (smoother) smoother.scrollTo(0, false);
      else window.scrollTo(0, 0);
      animation = gsap.timeline();
      if (!active) {
        home = measureHome();
        active = true;
        root.dataset.gravity = "true";
        onMode(true);
        const w = field.clientWidth,
          h = field.clientHeight,
          compact = innerWidth < 768;
        boundaries();
        toys = elements.map((element, index) => {
          const pose = home[index];
          const width = pose.width * (compact ? 0.66 : 0.86),
            height = pose.height * (compact ? 0.66 : 0.86);
          const x = clamp(
            pose.x + pose.width / 2,
            width / 2 + 2,
            w - width / 2 - 2,
          );
          const y = clamp(
            (pose.y / homeHeight) * h * 0.7 + height / 2,
            height / 2 + 2,
            h - height / 2 - 2,
          );
          const body = Bodies.rectangle(x, y, width, height, {
            restitution: 0.58,
            friction: 0.15,
            frictionAir: 0.013,
            chamfer: { radius: Math.min(width, height) * 0.1 },
          });
          Composite.add(engine.world, body);
          const toy = { element, body, width, height };
          element.dataset.casePhysicsObject = "";
          gsap.set(element, {
            position: "absolute",
            left: 0,
            top: 0,
            margin: 0,
            x: pose.x,
            y: pose.y,
            xPercent: 0,
            yPercent: 0,
            width: pose.width,
            height: pose.height,
            rotation: 0,
          });
          animation!.to(
            element,
            {
              x: x - width / 2,
              y: y - height / 2,
              width,
              height,
              duration: motion.matches ? 0 : 0.48,
              ease: "power3.inOut",
            },
            0,
          );
          Body.setVelocity(body, { x: ((index % 3) - 1) * 1.2, y: 0 });
          Body.setAngularVelocity(body, (index % 2 ? 1 : -1) * 0.012);
          return toy;
        });
        animation.call(() => {
          busy = false;
          resume();
        });
      } else {
        const current = toys.map((toy) => ({
          x: toy.body.position.x - toy.width / 2,
          y: toy.body.position.y - toy.height / 2,
          width: toy.width,
          height: toy.height,
          angle: (toy.body.angle * 180) / Math.PI,
        }));
        const oldHeight = field.offsetHeight;
        active = false;
        root.dataset.gravity = "false";
        clearLayout();
        // Measure the real responsive layout again (including orientation changes).
        home = measureHome();
        root.dataset.returning = "true";
        field.style.height = `${oldHeight}px`;
        elements.forEach((el, index) => {
          const from = current[index],
            to = home[index];
          gsap.set(el, {
            position: "absolute",
            left: 0,
            top: 0,
            margin: 0,
            x: from.x,
            y: from.y,
            xPercent: 0,
            yPercent: 0,
            width: from.width,
            height: from.height,
            rotation: from.angle,
          });
          animation!.to(
            el,
            {
              x: to.x,
              y: to.y,
              width: to.width,
              height: to.height,
              rotation: 0,
              duration: motion.matches ? 0 : 0.65,
              ease: "power3.inOut",
            },
            0,
          );
        });
        animation
          .to(
            field,
            {
              height: homeHeight,
              duration: motion.matches ? 0 : 0.65,
              ease: "power3.inOut",
            },
            0,
          )
          .call(() => {
            clearLayout();
            field.style.height = "";
            Composite.clear(engine.world, false);
            toys = [];
            walls = [];
            busy = false;
            delete root.dataset.returning;
            onMode(false);
          });
      }
    },
    dispose() {
      disposed = true;
      up();
      animation?.kill();
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", resume);
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointercancel", up);
      root.removeEventListener("lostpointercapture", up);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      clearLayout();
      field.style.height = "";
      delete root.dataset.gravity;
    },
  };
}
