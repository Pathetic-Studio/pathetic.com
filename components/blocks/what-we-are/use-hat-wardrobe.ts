"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type PointerEvent,
} from "react";
import gsap from "gsap";
import { ROLES, type RoleId } from "./wardrobe-data";
import { createHatPhysics, type HatPhysics, type HatPose } from "./hat-physics";

type Drag = {
  role: RoleId;
  pointerId: number;
  fromHead: boolean;
  startX: number;
  startY: number;
  grabX: number;
  grabY: number;
  moved: boolean;
  time: number;
  velocity: { x: number; y: number };
};
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export function useHatWardrobe(
  sectionRef: RefObject<HTMLElement | null>,
  settleFigure: () => void,
  mobileRole: RoleId | null = null,
) {
  const [preview, setPreview] = useState<RoleId | null>(null);
  const [focused, setFocused] = useState<RoleId | null>(null);
  const [locked, setLocked] = useState<RoleId | null>(null);
  const [dragging, setDragging] = useState<RoleId | null>(null);
  const [worn, setWornState] = useState<RoleId | null>(null);
  const mobile = mobileRole !== null;
  const active =
    mobileRole ?? (dragging ? null : (locked ?? preview ?? focused));
  const activeRef = useRef(active);
  activeRef.current = active;
  const wornRef = useRef<RoleId | null>(null);
  const focusWornRef = useRef<RoleId | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const physics = useRef<HatPhysics | null>(null);
  const moves = useRef(new Map<RoleId, gsap.core.Tween>());
  const destination = useRef(new Map<RoleId, "head" | "free">());
  const returnPose = useRef(new Map<RoleId, HatPose>());
  const reduced = useRef(false);
  const settleRef = useRef(settleFigure);
  settleRef.current = settleFigure;
  const setWorn = useCallback((role: RoleId | null) => {
    wornRef.current = role;
    setWornState(role);
  }, []);
  const proxy = useCallback(
    (role: RoleId) =>
      sectionRef.current?.querySelector<HTMLButtonElement>(
        `[data-hat-flight="${role}"]`,
      ),
    [sectionRef],
  );
  const headPoint = useCallback(
    (role: RoleId): HatPose | null => {
      const section = sectionRef.current;
      const dock = section?.querySelector<HTMLElement>(
        `[data-hat-dock="${role}"]`,
      );
      const slot = section?.querySelector<HTMLElement>(
        `[data-hat-head="${role}"]`,
      );
      if (!section || !dock || !slot) return null;
      const base = section.getBoundingClientRect(),
        d = dock.getBoundingClientRect(),
        r = slot.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - base.left,
        y: r.top + r.height / 2 - base.top,
        scale: r.width / Math.max(1, d.width),
        angle: 0,
      };
    },
    [sectionRef],
  );

  const reconcile = useCallback(
    (instant = false) => {
      const api = physics.current,
        section = sectionRef.current;
      if (!api || !section) return;
      for (const role of ROLES) {
        if (dragRef.current?.role === role.id) continue;
        const el = proxy(role.id);
        if (!el) continue;
        const target = activeRef.current === role.id ? "head" : "free";
        const previous = destination.current.get(role.id);
        if (previous === target && (!instant || target === "free")) continue;
        destination.current.set(role.id, target);
        // Untouched hats remain in the Matter world, wherever they have landed.
        if (target === "free" && previous === undefined) continue;
        const wasMoving = moves.current.has(role.id);
        moves.current.get(role.id)?.kill();
        moves.current.delete(role.id);
        if (instant && target === "head" && wornRef.current === role.id) {
          const p = headPoint(role.id);
          if (p) api.place(role.id, p);
          continue;
        }
        if (target === "head" && !wasMoving && el.dataset.hatPhysics === "free")
          returnPose.current.set(role.id, api.get(role.id));
        api.hold(role.id);
        if (wornRef.current === role.id) {
          const p = headPoint(role.id);
          if (p) api.place(role.id, p);
          el.style.opacity = "1";
          el.style.visibility = "visible";
          if (
            document.activeElement ===
            section.querySelector(`[data-hat-worn="${role.id}"]`)
          )
            el.focus({ preventScroll: true });
          setWorn(null);
        }
        const end =
          target === "head"
            ? headPoint(role.id)
            : returnPose.current.get(role.id);
        if (!end) {
          api.release(role.id);
          continue;
        }
        const pose = { ...api.get(role.id), angle: 0 };
        api.place(role.id, pose);
        el.style.opacity = "1";
        el.style.visibility = "visible";
        const complete = () => {
          moves.current.delete(role.id);
          api.place(role.id, { ...end, angle: 0 }, target === "free");
          if (
            target === "head" &&
            activeRef.current === role.id &&
            !dragRef.current
          ) {
            if (document.activeElement === el) focusWornRef.current = role.id;
            setWorn(role.id);
            el.style.opacity = "0";
            el.style.visibility = "hidden";
          } else if (target === "free") api.release(role.id);
        };
        if (instant || reduced.current) complete();
        else
          moves.current.set(
            role.id,
            gsap.to(pose, {
              x: end.x,
              y: end.y,
              scale: end.scale,
              duration: 0.38,
              ease: "power2.inOut",
              onUpdate: () => api.place(role.id, pose),
              onComplete: complete,
            }),
          );
      }
    },
    [headPoint, proxy, sectionRef, setWorn],
  );
  const reconcileRef = useRef(reconcile);
  reconcileRef.current = reconcile;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = motion.matches;
    setWorn(null);
    // The touch carousel owns selection; only desktop needs a physics world.
    if (!mobile)
      physics.current = createHatPhysics(section, () =>
        reconcileRef.current(true),
      );
    reconcileRef.current(true);
    const change = () => {
      reduced.current = motion.matches;
      reconcileRef.current(true);
    };
    motion.addEventListener("change", change);
    return () => {
      motion.removeEventListener("change", change);
      moves.current.forEach((t) => t.kill());
      moves.current.clear();
      destination.current.clear();
      physics.current?.dispose();
      physics.current = null;
    };
  }, [sectionRef, mobile, setWorn]);

  useLayoutEffect(() => {
    if (!worn || focusWornRef.current !== worn) return;
    sectionRef.current
      ?.querySelector<HTMLButtonElement>(`[data-hat-worn="${worn}"]`)
      ?.focus({ preventScroll: true });
    focusWornRef.current = null;
  }, [worn, sectionRef]);
  useLayoutEffect(() => {
    reconcile();
    const groups =
      sectionRef.current?.querySelectorAll<HTMLElement>("[data-outfit]");
    groups?.forEach((group) => {
      const show = group.dataset.outfit === active;
      gsap.to(group.querySelectorAll("[data-outfit-piece]"), {
        autoAlpha: show ? 1 : 0,
        scale: show ? 1 : 0.55,
        duration: reduced.current ? 0 : show ? 0.34 : 0.16,
        stagger: show && !reduced.current ? 0.055 : 0,
        ease: show ? "back.out(1.8)" : "power2.in",
        overwrite: true,
        delay: show && !reduced.current ? 0.1 : 0,
      });
    });
    return () =>
      groups?.forEach((group) =>
        gsap.killTweensOf(group.querySelectorAll("[data-outfit-piece]")),
      );
  }, [active, dragging, reconcile, sectionRef]);

  const clear = () => {
    setLocked(null);
    setPreview(null);
    setFocused(null);
  };
  const begin = (
    event: PointerEvent<HTMLButtonElement>,
    role: RoleId,
    fromHead: boolean,
  ) => {
    const api = physics.current,
      el = proxy(role);
    if (event.button !== 0 || !api || !el || dragRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    settleRef.current();
    moves.current.get(role)?.kill();
    moves.current.delete(role);
    api.hold(role);
    const pose = fromHead ? headPoint(role) : api.get(role);
    if (pose) api.place(role, { ...pose, angle: 0 });
    if (fromHead) setWorn(null);
    el.style.opacity = "1";
    el.style.visibility = "visible";
    el.style.zIndex = "10";
    const r = el.getBoundingClientRect();
    dragRef.current = {
      role,
      fromHead,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      grabX: event.clientX - (r.left + r.width / 2),
      grabY: event.clientY - (r.top + r.height / 2),
      moved: false,
      time: performance.now(),
      velocity: { x: 0, y: 0 },
    };
    destination.current.set(role, "free");
    event.currentTarget.setPointerCapture(event.pointerId);
    clear();
    setDragging(role);
  };
  const nearHead = (x: number, y: number) => {
    const r = sectionRef.current
      ?.querySelector<HTMLElement>("[data-hat-dropzone]")
      ?.getBoundingClientRect();
    return (
      !!r &&
      x > r.left - 12 &&
      x < r.right + 12 &&
      y > r.top - 12 &&
      y < r.bottom + 12
    );
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current,
      section = sectionRef.current,
      api = physics.current;
    if (!drag || drag.pointerId !== event.pointerId || !section || !api) return;
    event.preventDefault();
    event.stopPropagation();
    drag.moved ||=
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6;
    const r = section.getBoundingClientRect(),
      before = api.get(drag.role),
      now = performance.now();
    api.place(
      drag.role,
      {
        ...before,
        x: event.clientX - r.left - drag.grabX,
        y: event.clientY - r.top - drag.grabY,
        angle: 0,
      },
      true,
    );
    const after = api.get(drag.role),
      dt = Math.max(8, now - drag.time);
    drag.velocity = {
      x: clamp(((after.x - before.x) * 16.67) / dt, -18, 18),
      y: clamp(((after.y - before.y) * 16.67) / dt, -18, 18),
    };
    drag.time = now;
    section.dataset.hatNearHead = String(
      nearHead(event.clientX, event.clientY),
    );
  };
  const finish = (
    event: PointerEvent<HTMLButtonElement>,
    cancelled = false,
  ) => {
    const drag = dragRef.current,
      section = sectionRef.current,
      api = physics.current;
    if (!drag || drag.pointerId !== event.pointerId || !section || !api) return;
    event.stopPropagation();
    const snap =
      !cancelled &&
      (drag.moved ? nearHead(event.clientX, event.clientY) : !drag.fromHead);
    dragRef.current = null;
    delete section.dataset.hatNearHead;
    const el = proxy(drag.role);
    if (el) el.style.zIndex = "1";
    if (!snap)
      api.release(
        drag.role,
        !cancelled && performance.now() - drag.time < 100
          ? drag.velocity
          : undefined,
      );
    setLocked(snap ? drag.role : null);
    setDragging(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const bindings = (role: RoleId, fromHead: boolean) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) =>
      begin(event, role, fromHead),
    onPointerMove: move,
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => finish(event),
    onPointerCancel: (event: PointerEvent<HTMLButtonElement>) =>
      finish(event, true),
    onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) =>
      finish(event, true),
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const direction: Record<string, { x: number; y: number }> = {
        ArrowLeft: { x: -8, y: -3 },
        ArrowRight: { x: 8, y: -3 },
        ArrowUp: { x: 0, y: -9 },
        ArrowDown: { x: 0, y: 8 },
      };
      if (
        fromHead ||
        !direction[event.key] ||
        !physics.current ||
        activeRef.current === role
      )
        return;
      event.preventDefault();
      physics.current.release(role, direction[event.key]);
    },
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (event.detail === 0) {
        setPreview(null);
        setFocused(null);
        setLocked((current) => (current === role ? null : role));
      }
    },
  });
  return {
    active,
    locked,
    worn: mobileRole ?? worn,
    dragging,
    setPreview,
    setFocused,
    clear,
    bindings,
    toggle: (role: RoleId) =>
      setLocked((current) => (current === role ? null : role)),
  };
}
