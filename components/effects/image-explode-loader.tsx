// components/effects/image-explode-loader.tsx
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Matter, { Engine, World, Bodies, Body, Vector } from "matter-js";
import gsap from "gsap";

type ImageExplodeImage = { _key?: string; url?: string | null };

type Props = {
    images?: ImageExplodeImage[];
    containerId: string;
    desktopSize?: number;
    tabletSize?: number;
    mobileSize?: number;

    /**
     * Called once, when all items have finished their "pop-in" animation.
     * Fires again if images list changes and a new run completes.
     */
    onAllItemsAnimatedIn?: () => void;

    /**
     * Control stagger + feel from parent if needed.
     */
    appearStaggerEach?: number; // seconds
    appearDuration?: number; // seconds
};

type RenderItem = {
    id: string;
    url: string;
    x: number;
    y: number;
    angle: number;
    size: number;
};

const DEFAULT_IMAGE_SIZE = 250;
const FORCE_SCALE = 0.005;

type Point = { x: number; y: number };

function convexHull(points: Point[]): Point[] {
    if (points.length <= 3) return points.slice();
    const pts = points.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
    const cross = (o: Point, a: Point, b: Point) =>
        (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower: Point[] = [];
    for (const p of pts) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop();
        }
        lower.push(p);
    }

    const upper: Point[] = [];
    for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
            upper.pop();
        }
        upper.push(p);
    }

    upper.pop();
    lower.pop();
    return lower.concat(upper);
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

async function createBodyFromPng(url: string, cx: number, cy: number, size: number): Promise<Body> {
    try {
        const img = await loadImage(url);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx || !img.width || !img.height) {
            const b = Bodies.circle(cx, cy, size / 2, {
                restitution: 0.1,
                frictionAir: 0.15,
                friction: 0.8,
                density: 0.002,
            });
            (b as any).spriteUrl = url;
            return b;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        let imageData: ImageData;
        try {
            imageData = ctx.getImageData(0, 0, img.width, img.height);
        } catch {
            const b = Bodies.circle(cx, cy, size / 2, {
                restitution: 0.1,
                frictionAir: 0.15,
                friction: 0.8,
                density: 0.002,
            });
            (b as any).spriteUrl = url;
            return b;
        }

        const data = imageData.data;
        const points: Point[] = [];
        const STEP = Math.max(1, Math.floor(Math.max(img.width, img.height) / 60));

        for (let y = 0; y < img.height; y += STEP) {
            for (let x = 0; x < img.width; x += STEP) {
                const idx = (y * img.width + x) * 4;
                if (data[idx + 3] > 10) points.push({ x, y });
            }
        }

        if (points.length < 3) {
            const b = Bodies.circle(cx, cy, size / 2, {
                restitution: 0.1,
                frictionAir: 0.15,
                friction: 0.8,
                density: 0.002,
            });
            (b as any).spriteUrl = url;
            return b;
        }

        const hull = convexHull(points);

        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;

        for (const p of hull) {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        }

        const w = maxX - minX || 1;
        const h = maxY - minY || 1;
        const scale = size / Math.max(w, h);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const verts = hull.map((p) => ({
            x: (p.x - centerX) * scale,
            y: (p.y - centerY) * scale,
        }));

        const body = Bodies.fromVertices(cx, cy, [verts], {
            restitution: 0.1,
            frictionAir: 0.15,
            friction: 0.8,
            density: 0.002,
        }) as Body;

        (body as any).spriteUrl = url;
        return body;
    } catch {
        const b = Bodies.circle(cx, cy, size / 2, {
            restitution: 0.1,
            frictionAir: 0.15,
            friction: 0.8,
            density: 0.002,
        });
        (b as any).spriteUrl = url;
        return b;
    }
}

export default function ImageExplodeLoader({
    images,
    containerId,
    desktopSize = DEFAULT_IMAGE_SIZE,
    tabletSize = DEFAULT_IMAGE_SIZE * 0.75,
    mobileSize = DEFAULT_IMAGE_SIZE * 0.5,
    onAllItemsAnimatedIn,
    appearStaggerEach = 0.14, // increased stagger
    appearDuration = 1.1,
}: Props) {
    const [renderItems, setRenderItems] = useState<RenderItem[]>([]);

    const engineRef = useRef<Engine | null>(null);
    const bodiesRef = useRef<Body[]>([]);
    const mouseRef = useRef<Vector | null>(null);

    // animate-once tracking
    const animatedIdsRef = useRef<Set<string>>(new Set());
    // tracks “appearance order” for stagger consistency
    const appearOrderRef = useRef<string[]>([]);

    // "all animated" run state
    const expectedCountRef = useRef(0);
    const allFiredForRunRef = useRef(false);
    const lastRunKeyRef = useRef<string>("");

    const hasUrls = (images || []).some((i) => !!i?.url);

    useEffect(() => {
        const urls = (images || []).filter((i) => !!i?.url).map((i) => i!.url as string);

        const runKey = urls.join("|");
        lastRunKeyRef.current = runKey;

        expectedCountRef.current = urls.length;
        allFiredForRunRef.current = false;

        if (!urls.length) {
            setRenderItems([]);
            animatedIdsRef.current = new Set();
            appearOrderRef.current = [];
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.warn("[ImageExplodeLoader] container not found:", containerId);
            setRenderItems([]);
            animatedIdsRef.current = new Set();
            appearOrderRef.current = [];
            return;
        }

        let cancelled = false;
        let loopId: number | null = null;

        const setupWhenSized = async () => {
            for (let i = 0; i < 60; i++) {
                if (cancelled) return;

                const rect = container.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    return start(rect.width, rect.height, urls, runKey);
                }
                await new Promise<void>((r) => requestAnimationFrame(() => r()));
            }

            const rect = container.getBoundingClientRect();
            console.warn("[ImageExplodeLoader] container still has no size:", rect, containerId);
        };

        const start = async (width: number, height: number, spriteUrls: string[], runKeyLocal: string) => {
            const isMobile = width < 640;
            const isTablet = width >= 640 && width < 1024;

            const imageSize = isMobile ? mobileSize : isTablet ? tabletSize : desktopSize;

            let gravityY = 3;
            if (isTablet) gravityY = 0.35;
            if (isMobile) gravityY = 0.75;

            const engine = Engine.create();
            engineRef.current = engine;
            engine.world.gravity.y = gravityY;

            const wallThickness = 300;
            const walls = [
                Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { isStatic: true }),
                Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { isStatic: true }),
                Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }),
                Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }),
            ];
            World.add(engine.world, walls);

            const cx = width / 2;
            const cy = isMobile || isTablet ? height * 0.25 : height / 2;

            const bodies: Body[] = [];
            for (const url of spriteUrls) {
                if (cancelled) return;

                const body = await createBodyFromPng(url, cx, cy, imageSize);

                const ang = Math.random() * Math.PI * 2;
                const speed = 12 + Math.random() * 10;

                Matter.Body.setVelocity(body, {
                    x: Math.cos(ang) * speed,
                    y: Math.sin(ang) * speed + (isMobile || isTablet ? Math.abs(Math.random() * 6) : 0),
                });

                bodies.push(body);
            }

            if (cancelled) return;

            bodiesRef.current = bodies;
            World.add(engine.world, bodies);

            // seed render items once so ids exist immediately (prevents late first paint)
            setRenderItems(
                bodies.map((b, idx) => ({
                    id: `img-${idx}`,
                    url: (b as any).spriteUrl as string,
                    x: b.position.x,
                    y: b.position.y,
                    angle: b.angle,
                    size: imageSize,
                }))
            );

            const loop = () => {
                if (cancelled) return;
                const eng = engineRef.current;
                if (!eng) return;

                const mouse = mouseRef.current;

                bodiesRef.current.forEach((body) => {
                    if (mouse) {
                        const dir = Vector.sub(mouse, body.position);
                        const dist = Math.max(Vector.magnitude(dir), 30);
                        const norm = Vector.mult(dir, 1 / dist);
                        const strength = FORCE_SCALE * body.mass;
                        const force = Vector.mult(norm, strength);
                        Matter.Body.applyForce(body, body.position, force);
                    }
                });

                Engine.update(eng, 1000 / 60);

                setRenderItems(
                    bodiesRef.current.map((b, idx) => ({
                        id: `img-${idx}`,
                        url: (b as any).spriteUrl as string,
                        x: b.position.x,
                        y: b.position.y,
                        angle: b.angle,
                        size: imageSize,
                    }))
                );

                loopId = requestAnimationFrame(loop);
            };

            loop();
        };

        setupWhenSized();

        const handlePointerMove = (e: PointerEvent) => {
            const elAtPoint = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
            if (elAtPoint?.closest("#site-header-root")) {
                mouseRef.current = null;
                return;
            }

            const el = document.getElementById(containerId);
            if (!el) {
                mouseRef.current = null;
                return;
            }

            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
                mouseRef.current = null;
                return;
            }

            mouseRef.current = { x, y } as Vector;
        };

        const handlePointerDown = (e: PointerEvent) => {
            handlePointerMove(e);
        };

        const handleBlur = () => {
            mouseRef.current = null;
        };

        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("pointerdown", handlePointerDown, { passive: true });
        window.addEventListener("blur", handleBlur);

        return () => {
            cancelled = true;

            window.removeEventListener("pointermove", handlePointerMove as any);
            window.removeEventListener("pointerdown", handlePointerDown as any);
            window.removeEventListener("blur", handleBlur as any);

            if (loopId !== null) cancelAnimationFrame(loopId);

            if (engineRef.current) {
                Matter.World.clear(engineRef.current.world, false);
                Matter.Engine.clear(engineRef.current);
            }

            engineRef.current = null;
            bodiesRef.current = [];
            mouseRef.current = null;
            setRenderItems([]);
            animatedIdsRef.current = new Set();
            appearOrderRef.current = [];
        };
    }, [images, containerId, desktopSize, tabletSize, mobileSize]);

    // Pop-in animation + "all done" callback
    useLayoutEffect(() => {
        if (!renderItems.length) return;

        // record appearance order once (so stagger doesn't get weird)
        for (const it of renderItems) {
            if (!appearOrderRef.current.includes(it.id)) appearOrderRef.current.push(it.id);
        }

        const newIds = renderItems.map((it) => it.id).filter((id) => !animatedIdsRef.current.has(id));
        if (!newIds.length) return;

        const orderedNewIds = appearOrderRef.current.filter((id) => newIds.includes(id));

        const els = orderedNewIds
            .map((id) => document.querySelector(`[data-explode-inner="${id}"]`) as HTMLImageElement | null)
            .filter(Boolean) as HTMLImageElement[];

        if (!els.length) return;

        // mark as animated immediately (prevents strict-mode double passes)
        orderedNewIds.forEach((id) => animatedIdsRef.current.add(id));

        gsap.killTweensOf(els);
        gsap.set(els, { scale: 0, transformOrigin: "50% 50%" });

        gsap.to(els, {
            scale: 1,
            duration: appearDuration,
            ease: "elastic.out(1, 1)",
            stagger: appearStaggerEach,
            overwrite: true,
            clearProps: "transform",
            onComplete: () => {
                // fire when we've animated-in all expected items for this run
                const expected = expectedCountRef.current;
                if (!expected) return;

                // animatedIdsRef includes everything we've animated in this run (ids are stable img-0..n)
                const animatedCount = animatedIdsRef.current.size;

                if (!allFiredForRunRef.current && animatedCount >= expected) {
                    allFiredForRunRef.current = true;
                    onAllItemsAnimatedIn?.();
                }
            },
        });
    }, [renderItems, appearDuration, appearStaggerEach, onAllItemsAnimatedIn]);

    if (!hasUrls) return null;

    return (
        <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
            {renderItems.map((item) => (
                <div
                    key={item.id}
                    style={{
                        position: "absolute",
                        left: item.x,
                        top: item.y,
                        width: item.size,
                        height: item.size,
                        transform: `translate(-50%, -50%) rotate(${item.angle}rad)`,
                        willChange: "transform",
                    }}
                >
                    <img
                        data-explode-inner={item.id}
                        src={item.url}
                        alt=""
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            transform: "scale(1)",
                            willChange: "transform",
                        }}
                    />
                </div>
            ))}
        </div>
    );
}
