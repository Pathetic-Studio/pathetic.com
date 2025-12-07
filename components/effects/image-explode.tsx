"use client";

import { useEffect, useRef, useState } from "react";
import Matter, { Engine, World, Bodies, Body, Vector } from "matter-js";

type ImageExplodeImage = {
    _key?: string;
    url?: string | null;
};

type ImageExplodeProps = {
    images?: ImageExplodeImage[];
    containerId: string;
};

type RenderItem = {
    id: string;
    url: string;
    x: number;
    y: number;
    angle: number;
};

const IMAGE_SIZE = 300; // visual size of the sprite
const FORCE_SCALE = 0.002;
const TURBULENCE_FORCE = 0.01;

// ---------- helpers for shape-from-alpha ----------

type Point = { x: number; y: number };

// simple convex hull (monotone chain)
function convexHull(points: Point[]): Point[] {
    if (points.length <= 3) return points.slice();

    const pts = points
        .slice()
        .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

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
        img.crossOrigin = "anonymous"; // needed if images come from a CDN with CORS
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Sample alpha, build convex hull of opaque pixels, scale to IMAGE_SIZE,
 * and center around (0, 0) so we can place at (centerX, centerY).
 */
async function createBodyFromPng(
    url: string,
    centerX: number,
    centerY: number
): Promise<Body> {
    const img = await loadImage(url);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        // fallback: circle
        return Bodies.circle(centerX, centerY, IMAGE_SIZE / 2, {
            restitution: 0.95,
            frictionAir: 0.1,
            friction: 0.0005,
            density: 0.001,
        });
    }

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    const points: Point[] = [];
    // sampling step to keep it cheap – adjust if you want more detail
    const STEP = Math.max(1, Math.floor(Math.max(img.width, img.height) / 60));

    for (let y = 0; y < img.height; y += STEP) {
        for (let x = 0; x < img.width; x += STEP) {
            const idx = (y * img.width + x) * 4;
            const alpha = data[idx + 3];
            if (alpha > 10) {
                points.push({ x, y });
            }
        }
    }

    if (points.length < 3) {
        // nothing useful – fallback to circle
        return Bodies.circle(centerX, centerY, IMAGE_SIZE / 2, {
            restitution: 0.95,
            frictionAir: 0.1,
            friction: 0.0005,
            density: 0.001,
        });
    }

    const hull = convexHull(points);

    // scale hull so its max dimension ~ IMAGE_SIZE
    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
    hull.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const scale = IMAGE_SIZE / Math.max(width, height);

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const scaledVerts = hull.map((p) => ({
        x: (p.x - cx) * scale,
        y: (p.y - cy) * scale,
    }));

    // Matter expects vertices in world coords; we pass local verts via fromVertices
    const body = Bodies.fromVertices(centerX, centerY, [scaledVerts], {
        restitution: 0.95,
        frictionAir: 0.1,
        friction: 0.0005,
        density: 0.001,
    }) as Body;

    // if fromVertices fails, it can return a compound – just keep it
    return body;
}

// ------------------------------------------------

export default function ImageExplode({
    images,
    containerId,
}: ImageExplodeProps) {
    const [renderItems, setRenderItems] = useState<RenderItem[]>([]);

    const engineRef = useRef<Engine | null>(null);
    const bodiesRef = useRef<Body[]>([]);
    const frameRef = useRef<number | null>(null);
    const mouseRef = useRef<Vector | null>(null);

    useEffect(() => {
        if (!images || images.length === 0) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (!width || !height) return;

        let cancelled = false;

        const setup = async () => {
            const engine = Engine.create();
            if (cancelled) return;

            engineRef.current = engine;
            engine.world.gravity.y = 0.15;
            engine.world.gravity.x = 0;

            const world = engine.world;

            const wallThickness = 300;
            const walls = [
                Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, {
                    isStatic: true,
                }),
                Bodies.rectangle(
                    width / 2,
                    height + wallThickness / 2,
                    width,
                    wallThickness,
                    { isStatic: true },
                ),
                Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
                    isStatic: true,
                }),
                Bodies.rectangle(
                    width + wallThickness / 2,
                    height / 2,
                    wallThickness,
                    height,
                    { isStatic: true },
                ),
            ];

            World.add(world, walls);

            const centerX = width / 2;
            const centerY = height / 2;

            const urls = images
                .filter((img) => !!img?.url)
                .map((img) => img!.url as string);

            const bodies: Body[] = [];

            for (const url of urls) {
                if (cancelled) return;

                const body = await createBodyFromPng(url, centerX, centerY);

                // initial explosion impulse
                const angle = Math.random() * Math.PI * 2;
                const speed = 12 + Math.random() * 10;
                Body.setVelocity(body, {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed,
                });

                (body as any).spriteUrl = url;
                bodies.push(body);
            }

            if (cancelled) return;

            bodiesRef.current = bodies;
            World.add(world, bodies);

            const loop = () => {
                if (cancelled) return;
                const engine = engineRef.current;
                if (!engine) return;

                const mouse = mouseRef.current;

                bodiesRef.current.forEach((body) => {
                    if (mouse) {
                        const dir = Vector.sub(mouse, body.position);
                        const distance = Math.max(Vector.magnitude(dir), 30);
                        const norm = Vector.mult(dir, 1 / distance);
                        const strength = FORCE_SCALE * body.mass;
                        const force = Vector.mult(norm, strength);
                        Body.applyForce(body, body.position, force);
                    }

                    const randomAngle = Math.random() * Math.PI * 2;
                    const jitter = {
                        x: Math.cos(randomAngle) * TURBULENCE_FORCE,
                        y: Math.sin(randomAngle) * TURBULENCE_FORCE,
                    };
                    Body.applyForce(body, body.position, jitter);
                });

                Engine.update(engine, 1000 / 60);

                const next: RenderItem[] = bodiesRef.current.map((body, index) => ({
                    id: `img-${index}`,
                    url: (body as any).spriteUrl as string,
                    x: body.position.x,
                    y: body.position.y,
                    angle: body.angle,
                }));

                setRenderItems(next);
                frameRef.current = requestAnimationFrame(loop);
            };

            loop();
        };

        setup();

        const handlePointerMove = (event: PointerEvent) => {
            const rect = container.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
                mouseRef.current = null;
                return;
            }

            mouseRef.current = { x, y } as Vector;
        };

        const handlePointerLeave = () => {
            mouseRef.current = null;
        };

        container.addEventListener("pointermove", handlePointerMove);
        container.addEventListener("pointerleave", handlePointerLeave);

        return () => {
            cancelled = true;
            container.removeEventListener("pointermove", handlePointerMove);
            container.removeEventListener("pointerleave", handlePointerLeave);

            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
            }

            if (engineRef.current) {
                Matter.World.clear(engineRef.current.world, false);
                Matter.Engine.clear(engineRef.current);
            }

            engineRef.current = null;
            bodiesRef.current = [];
        };
    }, [images, containerId]);

    if (!images || images.length === 0) return null;

    return (
        <div
            className="pointer-events-none absolute inset-0 z-0"
            aria-hidden="true"
        >
            {renderItems.map((item) => (
                <img
                    key={item.id}
                    src={item.url}
                    alt=""
                    style={{
                        position: "absolute",
                        left: item.x,
                        top: item.y,
                        width: IMAGE_SIZE,
                        height: IMAGE_SIZE,
                        objectFit: "contain",
                        transform: `translate(-50%, -50%) rotate(${item.angle}rad)`,
                    }}
                />
            ))}
        </div>
    );
}
