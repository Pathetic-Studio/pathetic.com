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

const DEFAULT_IMAGE_SIZE = 300;
const FORCE_SCALE = 0.002;
const TURBULENCE_FORCE = 0.01;

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
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
    });
}

async function createBodyFromPng(
    url: string,
    centerX: number,
    centerY: number,
    imageSize: number
): Promise<Body> {
    try {
        const img = await loadImage(url);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx || !img.width || !img.height) {
            // fallback: simple circle
            return Bodies.circle(centerX, centerY, imageSize / 2, {
                restitution: 0.95,
                frictionAir: 0.1,
                friction: 0.0005,
                density: 0.001,
            });
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        let imageData: ImageData;
        try {
            imageData = ctx.getImageData(0, 0, img.width, img.height);
        } catch (e) {
            // CORS / tainted canvas etc – fallback to circle
            console.error("[ImageExplode] getImageData failed for", url, e);
            return Bodies.circle(centerX, centerY, imageSize / 2, {
                restitution: 0.95,
                frictionAir: 0.1,
                friction: 0.0005,
                density: 0.001,
            });
        }

        const data = imageData.data;
        const points: Point[] = [];
        const STEP = Math.max(
            1,
            Math.floor(Math.max(img.width, img.height) / 60)
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
            return Bodies.circle(centerX, centerY, imageSize / 2, {
                restitution: 0.95,
                frictionAir: 0.1,
                friction: 0.0005,
                density: 0.001,
            });
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
            restitution: 0.95,
            frictionAir: 0.1,
            friction: 0.0005,
            density: 0.001,
        }) as Body;

        (body as any).spriteUrl = url;
        return body;
    } catch (e) {
        console.error("[ImageExplode] Failed to create body from", url, e);
        return Bodies.circle(centerX, centerY, imageSize / 2, {
            restitution: 0.95,
            frictionAir: 0.1,
            friction: 0.0005,
            density: 0.001,
        });
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
    const frameRef = useRef<number | null>(null);
    const mouseRef = useRef<Vector | null>(null);

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

            // 1st measurement
            let rect = container.getBoundingClientRect();
            let width = rect.width;
            let height = rect.height;

            // If height is 0, wait one frame and re-measure
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
                    { width, height, containerId }
                );
                return;
            }

            // Simple breakpoints
            const isMobile = width < 640;
            const isTablet = width >= 640 && width < 1024;

            const imageSize = isMobile
                ? mobileSize
                : isTablet
                    ? tabletSize
                    : desktopSize;

            // Stronger gravity on mobile/tablet so they fall to the bottom
            let gravityY = 0.15;
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
                // top
                Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, {
                    isStatic: true,
                }),
                // bottom
                Bodies.rectangle(
                    width / 2,
                    height + wallThickness / 2,
                    width,
                    wallThickness,
                    { isStatic: true }
                ),
                // left
                Bodies.rectangle(
                    -wallThickness / 2,
                    height / 2,
                    wallThickness,
                    height,
                    {
                        isStatic: true,
                    }
                ),
                // right
                Bodies.rectangle(
                    width + wallThickness / 2,
                    height / 2,
                    wallThickness,
                    height,
                    { isStatic: true }
                ),
            ];

            World.add(world, walls);

            const centerX = width / 2;
            // Start a bit higher on small screens so they visibly "fall down"
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

                // Give them an initial "explosion" velocity
                const angle = Math.random() * Math.PI * 2;
                const speed = 12 + Math.random() * 10;

                Body.setVelocity(body, {
                    x: Math.cos(angle) * speed,
                    // bias slightly downward on small screens
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
    }, [
        images,
        containerId,
        desktopSize,
        tabletSize,
        mobileSize,
    ]);

    if (!images || images.length === 0) return null;

    return (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
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
