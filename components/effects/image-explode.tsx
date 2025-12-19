// components/effects/image-explode.tsx
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
    desktopSize?: number;
    tabletSize?: number;
    mobileSize?: number;
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

// convex hull (monotone chain)
function convexHull(points: Point[]): Point[] {
    if (points.length <= 3) return points.slice();

    const pts = points
        .slice()
        .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

    const cross = (o: Point, a: Point, b: Point) =>
        (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower: Point[] = [];
    for (const p of pts) {
        while (
            lower.length >= 2 &&
            cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
        ) {
            lower.pop();
        }
        lower.push(p);
    }

    const upper: Point[] = [];
    for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        while (
            upper.length >= 2 &&
            cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
        ) {
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
        img.crossOrigin = "anonymous"; // MUST be before src
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
    });
}

async function createBodyFromPng(
    url: string,
    centerX: number,
    centerY: number,
    imageSize: number,
): Promise<Body> {
    try {
        const img = await loadImage(url);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx || !img.width || !img.height) {
            console.warn("[ImageExplode] No ctx/size, using fallback circle", { url });
            const body = Bodies.circle(centerX, centerY, imageSize / 2, {
                restitution: 0.95,
                frictionAir: 0.1,
                friction: 0.0005,
                density: 0.001,
            });
            (body as any).shapeType = "fallback-circle";
            (body as any).spriteUrl = url;
            return body;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        let imageData: ImageData;
        try {
            imageData = ctx.getImageData(0, 0, img.width, img.height);
        } catch (e) {
            console.error(
                "[ImageExplode] getImageData failed, using fallback circle",
                url,
                e,
            );
            const body = Bodies.circle(centerX, centerY, imageSize / 2, {
                restitution: 0.95,
                frictionAir: 0.1,
                friction: 0.0005,
                density: 0.001,
            });
            (body as any).shapeType = "fallback-circle";
            (body as any).spriteUrl = url;
            return body;
        }

        const data = imageData.data;
        const points: Point[] = [];
        const STEP = Math.max(
            1,
            Math.floor(Math.max(img.width, img.height) / 60),
        );

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
            console.warn(
                "[ImageExplode] Not enough points, using fallback circle",
                { url },
            );
            const body = Bodies.circle(centerX, centerY, imageSize / 2, {
                restitution: 0.1,    // much less bounce
                frictionAir: 0.15,   // more air drag
                friction: 0.8,       // more ground friction
                density: 0.002,
            });
            (body as any).shapeType = "fallback-circle";
            (body as any).spriteUrl = url;
            return body;
        }

        const hull = convexHull(points);

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
        const scale = imageSize / Math.max(width, height);

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;

        const scaledVerts = hull.map((p) => ({
            x: (p.x - cx) * scale,
            y: (p.y - cy) * scale,
        }));

        const body = Bodies.fromVertices(centerX, centerY, [scaledVerts], {
            restitution: 0.1,    // much less bounce
            frictionAir: 0.15,   // more air drag
            friction: 0.8,       // more ground friction
            density: 0.002,
        }) as Body;

        (body as any).shapeType = "hull";
        (body as any).spriteUrl = url;
        console.log("[ImageExplode] Using hull shape", { url, imageSize });

        return body;
    } catch (e) {
        console.error(
            "[ImageExplode] Failed to create body, using fallback circle",
            url,
            e,
        );
        const body = Bodies.circle(centerX, centerY, imageSize / 2, {
            restitution: 0.1,    // much less bounce
            frictionAir: 0.15,   // more air drag
            friction: 0.8,       // more ground friction
            density: 0.002,
        });
        (body as any).shapeType = "fallback-circle";
        (body as any).spriteUrl = url;
        return body;
    }
}

export default function ImageExplode({
    images,
    containerId,
    desktopSize = DEFAULT_IMAGE_SIZE,
    tabletSize = DEFAULT_IMAGE_SIZE * 0.75,
    mobileSize = DEFAULT_IMAGE_SIZE * 0.5,
}: ImageExplodeProps) {
    const [renderItems, setRenderItems] = useState<RenderItem[]>([]);

    const engineRef = useRef<Engine | null>(null);
    const bodiesRef = useRef<Body[]>([]);
    const mouseRef = useRef<Vector | null>(null);

    // IMPORTANT:
    // This effect is deliberately mount-only so the physics sim
    // does NOT re-init every time the parent re-renders (e.g. when
    // you flip titleActive for the type-on text in the loader).
    useEffect(() => {
        if (!images || images.length === 0) return;

        const container = document.getElementById(containerId);
        if (!container) {
            console.warn("[ImageExplode] No container found for", containerId);
            return;
        }

        let cancelled = false;
        let loopId: number | null = null;

        const setup = async () => {
            if (cancelled) return;

            let rect = container.getBoundingClientRect();
            let width = rect.width;
            let height = rect.height;

            if (!width || !height) {
                await new Promise<void>((resolve) => {
                    requestAnimationFrame(() => resolve());
                });

                if (cancelled) return;

                rect = container.getBoundingClientRect();
                width = rect.width;
                height = rect.height;
            }

            if (!width || !height) {
                console.warn(
                    "[ImageExplode] Container has no size after re-measurement; giving up.",
                    { width, height, containerId },
                );
                return;
            }

            const isMobile = width < 640;
            const isTablet = width >= 640 && width < 1024;

            const imageSize = isMobile
                ? mobileSize
                : isTablet
                    ? tabletSize
                    : desktopSize;

            let gravityY = 3;
            if (isTablet) gravityY = 0.35;
            if (isMobile) gravityY = 0.75;

            const engine = Engine.create();
            if (cancelled) return;

            engineRef.current = engine;
            engine.world.gravity.y = gravityY;
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
                Bodies.rectangle(
                    -wallThickness / 2,
                    height / 2,
                    wallThickness,
                    height,
                    { isStatic: true },
                ),
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
            const centerY = isMobile || isTablet ? height * 0.25 : height / 2;

            const urls = images
                .filter((img) => !!img?.url)
                .map((img) => img!.url as string);

            if (!urls.length) {
                console.warn("[ImageExplode] No valid image URLs provided.");
                return;
            }

            const bodies: Body[] = [];

            for (const url of urls) {
                if (cancelled) return;

                const body = await createBodyFromPng(url, centerX, centerY, imageSize);

                const angle = Math.random() * Math.PI * 2;
                const speed = 12 + Math.random() * 10;

                Body.setVelocity(body, {
                    x: Math.cos(angle) * speed,
                    y:
                        Math.sin(angle) * speed +
                        (isMobile || isTablet ? Math.abs(Math.random() * 6) : 0),
                });

                if (!(body as any).spriteUrl) {
                    (body as any).spriteUrl = url;
                }

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
                });

                Engine.update(engine, 1000 / 60);

                const next: RenderItem[] = bodiesRef.current.map((body, index) => ({
                    id: `img-${index}`,
                    url: (body as any).spriteUrl as string,
                    x: body.position.x,
                    y: body.position.y,
                    angle: body.angle,
                    size: imageSize,
                }));

                setRenderItems(next);
                loopId = requestAnimationFrame(loop);
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

            if (loopId !== null) {
                cancelAnimationFrame(loopId);
            }

            if (engineRef.current) {
                Matter.World.clear(engineRef.current.world, false);
                Matter.Engine.clear(engineRef.current);
            }

            engineRef.current = null;
            bodiesRef.current = [];
        };
        // MOUNT-ONLY: do not depend on parent props so we don't re-init on re-renders
        // that are unrelated to this effect (like titleActive).
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                        width: item.size,
                        height: item.size,
                        objectFit: "contain",
                        transform: `translate(-50%, -50%) rotate(${item.angle}rad)`,
                    }}
                />
            ))}
        </div>
    );
}
