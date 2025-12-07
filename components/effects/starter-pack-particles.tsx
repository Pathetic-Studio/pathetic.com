// components/effects/starter-pack-particles.tsx
"use client";

import React, { useEffect, useRef } from "react";
import Matter, {
    Engine,
    Render,
    Runner,
    World,
    Bodies,
    Body,
    Composite,
    Vector,
} from "matter-js";

type Point = { x: number; y: number };

const DEFAULT_PARTICLES_PER_IMAGE = 3;
const DEFAULT_MIN_SCALE = 0.2;
const DEFAULT_MAX_SCALE = 0.8;

type StarterPackParticlesProps = {
    images: string[];
    particlesPerImage?: number;
    minScale?: number;
    maxScale?: number;
};

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

async function buildHullFromSprite(
    src: string,
    sampleStep = 2,
    alphaThreshold = 1
): Promise<{ hull: Point[]; width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            const w = img.width;
            const h = img.height;
            if (!w || !h) return reject(new Error("Sprite dimensions invalid"));

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("No 2d context"));

            ctx.drawImage(img, 0, 0, w, h);
            const { data } = ctx.getImageData(0, 0, w, h);

            const solidPoints: Point[] = [];

            for (let y = 0; y < h; y += sampleStep) {
                for (let x = 0; x < w; x += sampleStep) {
                    const idx = (y * w + x) * 4;
                    const alpha = data[idx + 3];

                    // keep only opaque-ish pixels
                    if (alpha >= alphaThreshold) {
                        solidPoints.push({ x, y });
                    }
                }
            }

            if (!solidPoints.length) {
                // fallback: full rect
                return resolve({
                    hull: [
                        { x: 0, y: 0 },
                        { x: w, y: 0 },
                        { x: w, y: h },
                        { x: 0, y: h },
                    ],
                    width: w,
                    height: h,
                });
            }

            const hull = convexHull(solidPoints);
            resolve({ hull, width: w, height: h });
        };

        img.onerror = (e) => reject(e);
        img.src = src;
    });
}

function randomInRange(min: number, max: number) {
    return min + Math.random() * (max - min);
}

export default function StarterPackParticles({
    images,
    particlesPerImage = DEFAULT_PARTICLES_PER_IMAGE,
    minScale = DEFAULT_MIN_SCALE,
    maxScale = DEFAULT_MAX_SCALE,
}: StarterPackParticlesProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mousePosRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || images.length === 0) return;

        const bounds = container.getBoundingClientRect();
        const width = bounds.width || window.innerWidth;
        const height = bounds.height || window.innerHeight;

        // Normalise scale bounds
        const scaleMin = Math.min(minScale, maxScale);
        const scaleMax = Math.max(minScale, maxScale);
        const countPerImage = Math.max(1, Math.floor(particlesPerImage));

        // Track mouse globally, convert to container coords
        const handlePointerMove = (e: PointerEvent) => {
            const rect = container.getBoundingClientRect();
            mousePosRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        window.addEventListener("pointermove", handlePointerMove);

        const engine = Engine.create();
        const world = engine.world;

        const render = Render.create({
            element: container,
            engine,
            options: {
                width,
                height,
                wireframes: false,
                background: "transparent",
                pixelRatio: window.devicePixelRatio || 1,
            },
        });

        // Make the canvas fill the container and remove inline artefacts
        render.canvas.style.width = "100%";
        render.canvas.style.height = "100%";
        render.canvas.style.display = "block";

        const runner = Runner.create();
        Runner.run(runner, engine);
        Render.run(render);

        // WORLD BOUNDS (all invisible; ceiling fully off-screen)
        const wallThickness = 200;
        const staticWallOpts = {
            isStatic: true,
            render: { visible: false },
        } as const;

        const ground = Bodies.rectangle(
            width / 2,
            height + wallThickness / 2,
            width * 2,
            wallThickness,
            staticWallOpts
        );

        // move ceiling far above the viewport so it never clips at y = 0
        const ceiling = Bodies.rectangle(
            width / 2,
            -wallThickness * 2, // fully off-screen
            width * 2,
            wallThickness,
            staticWallOpts
        );

        const leftWall = Bodies.rectangle(
            -wallThickness / 2,
            height / 2,
            wallThickness,
            height * 2,
            staticWallOpts
        );
        const rightWall = Bodies.rectangle(
            width + wallThickness / 2,
            height / 2,
            wallThickness,
            height * 2,
            staticWallOpts
        );

        World.add(world, [ground, ceiling, leftWall, rightWall]);

        engine.world.gravity.y = 0.4;

        // Mouse attractor
        const attractor = () => {
            const mp = mousePosRef.current;
            if (!mp) return;

            const bodies = Composite.allBodies(world);
            for (const body of bodies) {
                if (body.isStatic) continue;

                const dir = Vector.sub(mp, body.position);
                const distSq = dir.x * dir.x + dir.y * dir.y;
                if (!distSq || !isFinite(distSq)) continue;

                const norm = Vector.normalise(dir);

                const falloff = Math.min(1, 80000 / distSq);
                const strength = 0.005 * body.mass * falloff;

                const force = Vector.mult(norm, strength);
                Body.applyForce(body, body.position, force);
            }
        };

        const beforeUpdate = Matter.Events.on(engine, "beforeUpdate", attractor);

        let cancelled = false;

        const makeBodies = async () => {
            const centerX = width / 2;
            const centerY = height / 2;
            const bodies: Body[] = [];

            for (let i = 0; i < images.length; i++) {
                const src = images[i];

                try {
                    const {
                        hull,
                        width: iw,
                        height: ih,
                    } = await buildHullFromSprite(src, 4, 20);
                    if (cancelled) return;

                    const cx = iw / 2;
                    const cy = ih / 2;
                    const baseVerts = hull.map((p) => ({
                        x: p.x - cx,
                        y: p.y - cy,
                    }));

                    const baseX = centerX + (i - (images.length - 1) / 2) * 60;
                    const baseY = centerY + (i - (images.length - 1) / 2) * 60;

                    for (let j = 0; j < countPerImage; j++) {
                        const scale = randomInRange(scaleMin, scaleMax);

                        const spawnX = baseX + (Math.random() - 0.5) * 80;
                        const spawnY = baseY + (Math.random() - 0.5) * 80;

                        const body = Bodies.fromVertices(
                            spawnX,
                            spawnY,
                            [baseVerts],
                            {
                                restitution: 0.6,
                                friction: 0.2,
                                frictionAir: 0.02,
                                render: {
                                    sprite: {
                                        texture: src,
                                        xScale: scale,
                                        yScale: scale,
                                    },
                                    visible: true,
                                },
                            },
                            true
                        ) as Body;

                        if (scale !== 1) {
                            Body.scale(body, scale, scale);
                        }

                        Body.setVelocity(body, {
                            x: (Math.random() - 0.5) * 8,
                            y: (Math.random() - 0.5) * 8,
                        });
                        Body.setAngularVelocity(
                            body,
                            (Math.random() - 0.5) * 0.25
                        );

                        bodies.push(body);
                    }
                } catch (err) {
                    console.error("Failed to build hull for sprite", err);
                }
            }

            if (bodies.length) World.add(world, bodies);
        };

        void makeBodies();

        return () => {
            cancelled = true;
            window.removeEventListener("pointermove", handlePointerMove);
            Matter.Events.off(engine, "beforeUpdate", attractor);
            Render.stop(render);
            Runner.stop(runner);
            World.clear(world, false);
            Engine.clear(engine);
            render.canvas.remove();
            (render as any).textures = {};
        };
    }, [images, particlesPerImage, minScale, maxScale]);

    return (
        <div
            ref={containerRef}
            className="pointer-events-none absolute inset-0"
        />
    );
}
