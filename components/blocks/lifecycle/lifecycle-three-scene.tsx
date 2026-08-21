"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type LifecycleThreeSceneProps = {
  modelUrl?: string | null;
  modelScale?: number | null;
  rotationSpeed?: number | null;
  boosted: boolean;
};

export default function LifecycleThreeScene({
  modelUrl,
  modelScale = 1,
  rotationSpeed = 0.35,
  boosted,
}: LifecycleThreeSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boostedRef = useRef(boosted);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    boostedRef.current = boosted;
  }, [boosted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const targetCanvas = canvas;

    let cancelled = false;
    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let cleanUpScene = () => {};

    async function setup() {
      const context =
        targetCanvas.getContext("webgl2", {
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }) ||
        targetCanvas.getContext("webgl", {
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });

      if (!context) {
        if (!cancelled) setWebglUnavailable(true);
        return;
      }

      const THREE = await import("three");
      const { GLTFLoader } = await import(
        "three/examples/jsm/loaders/GLTFLoader.js"
      );

      if (cancelled) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0.15, 7);

      const renderer = new THREE.WebGLRenderer({
        canvas: targetCanvas,
        context,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const root = new THREE.Group();
      root.rotation.x = -0.08;
      scene.add(root);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x6f6f8f, 2.4));
      const keyLight = new THREE.DirectionalLight(0xffffff, 5);
      keyLight.position.set(3, 4, 5);
      scene.add(keyLight);
      const redLight = new THREE.PointLight(0xff2d20, 18, 12);
      redLight.position.set(-3, -1.5, 3);
      scene.add(redLight);

      function disposeObject(object: InstanceType<typeof THREE.Object3D>) {
        object.traverse((child) => {
          const mesh = child as InstanceType<typeof THREE.Mesh>;
          mesh.geometry?.dispose?.();
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : mesh.material
              ? [mesh.material]
              : [];
          materials.forEach((material) => material.dispose?.());
        });
      }

      function addFallback() {
        const geometry = new THREE.TorusKnotGeometry(1.15, 0.34, 180, 24);
        const material = new THREE.MeshPhysicalMaterial({
          color: 0xd8d8d8,
          metalness: 0.92,
          roughness: 0.17,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.setScalar(Math.max(0.1, modelScale || 1));
        root.add(mesh);
        return mesh;
      }

      let visibleObject: InstanceType<typeof THREE.Object3D> = addFallback();

      if (modelUrl) {
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            if (cancelled) {
              disposeObject(gltf.scene);
              return;
            }

            root.remove(visibleObject);
            disposeObject(visibleObject);

            const model = gltf.scene;
            const initialBox = new THREE.Box3().setFromObject(model);
            const size = initialBox.getSize(new THREE.Vector3());
            const largestAxis = Math.max(size.x, size.y, size.z) || 1;
            model.scale.setScalar(
              (2.75 / largestAxis) * Math.max(0.1, modelScale || 1),
            );

            const centeredBox = new THREE.Box3().setFromObject(model);
            const center = centeredBox.getCenter(new THREE.Vector3());
            model.position.sub(center);

            visibleObject = model;
            root.add(model);
          },
          undefined,
          () => {
            // The chrome fallback intentionally remains visible on load failure.
          },
        );
      }

      const entryTween = gsap.fromTo(
        root.position,
        { y: -3.4 },
        { y: 0, duration: 1.4, ease: "power4.out", delay: 0.1 },
      );

      const resize = () => {
        const bounds = targetCanvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(bounds.width));
        const height = Math.max(1, Math.round(bounds.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(targetCanvas);
      resize();

      const clock = new THREE.Clock();
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const render = () => {
        const delta = Math.min(clock.getDelta(), 0.05);
        if (!prefersReducedMotion) {
          const multiplier = boostedRef.current ? 7 : 1;
          root.rotation.y += delta * (rotationSpeed || 0.35) * multiplier;
          root.rotation.z += delta * (rotationSpeed || 0.35) * 0.12;
        }
        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(render);
      };
      render();

      cleanUpScene = () => {
        entryTween.kill();
        window.cancelAnimationFrame(animationFrame);
        resizeObserver?.disconnect();
        disposeObject(root);
        renderer.dispose();
        renderer.forceContextLoss();
      };
    }

    setWebglUnavailable(false);
    void setup().catch(() => {
      if (!cancelled) setWebglUnavailable(true);
    });

    return () => {
      cancelled = true;
      cleanUpScene();
    };
  }, [modelScale, modelUrl, rotationSpeed]);

  if (webglUnavailable) {
    return (
      <div
        role="img"
        aria-label="Rotating three-dimensional lifecycle object"
        className="flex h-full w-full items-center justify-center [perspective:900px]"
      >
        <div className="relative aspect-square w-[min(54vw,430px)] animate-[spin_8s_linear_infinite] rounded-full bg-[conic-gradient(from_35deg,#282828,#f8f8f8_18%,#777_33%,#fff_48%,#343434_68%,#dedede_83%,#282828)] p-[clamp(1.1rem,4vw,2.8rem)] shadow-[0_35px_70px_rgba(0,0,0,0.22)] [transform:rotateX(64deg)_rotateZ(-14deg)]">
          <div className="h-full w-full rounded-full bg-background shadow-[inset_0_18px_35px_rgba(0,0,0,0.3)]" />
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full"
      aria-label="Rotating three-dimensional lifecycle object"
    />
  );
}
