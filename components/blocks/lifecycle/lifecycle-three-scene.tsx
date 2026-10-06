"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { createLifecycleEnvironment } from "./lifecycle-environment";

type LifecycleThreeSceneProps = {
  modelUrl?: string | null;
  modelScale?: number | null;
  rotationSpeed?: number | null;
  boosted: boolean;
  entryKey: number;
  environmentRoot: RefObject<HTMLElement | null>;
};

export default function LifecycleThreeScene({
  modelUrl,
  modelScale = 1,
  rotationSpeed = 0.35,
  boosted,
  entryKey,
  environmentRoot,
}: LifecycleThreeSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visibleRef = useRef(false);
  const boostedRef = useRef(boosted);
  const sceneReadyRef = useRef(false);
  const pendingEntryRef = useRef(false);
  const entryKeyRef = useRef(entryKey);
  const entrySpinRef = useRef({ value: 0 });
  const entryTweenRef = useRef<gsap.core.Tween | null>(null);
  const startEntryRef = useRef<() => void>(() => {
    pendingEntryRef.current = true;
  });
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const slide = canvas.closest('[data-lifecycle-slide="object"]') || canvas;
    let inViewport = false;
    const syncVisibility = () => {
      const style = getComputedStyle(slide);
      visibleRef.current =
        inViewport &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        Number(style.opacity) > 0;
    };
    // The pin can end while the glasses still occupy the viewport. Follow the
    // rendered canvas, including its entrance transform, instead of the pin.
    const viewportObserver = new IntersectionObserver(([entry]) => {
      inViewport =
        entry.isIntersecting &&
        entry.intersectionRect.width > 0 &&
        entry.intersectionRect.height > 0;
      syncVisibility();
    });
    viewportObserver.observe(canvas);
    // Desktop slides overlap: intersection alone also sees the hidden slides.
    // GSAP changes their visibility as the slideshow advances or reverses.
    const slideObserver = new MutationObserver(syncVisibility);
    slideObserver.observe(slide, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    return () => {
      visibleRef.current = false;
      viewportObserver.disconnect();
      slideObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    boostedRef.current = boosted;
  }, [boosted]);

  useEffect(() => {
    entryKeyRef.current = entryKey;
    if (entryKey <= 0) return;
    startEntryRef.current();
  }, [entryKey]);

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
      const [
        { GLTFLoader },
        { LightningStrike },
        { EffectComposer },
        { RenderPass },
        { UnrealBloomPass },
      ] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("@/lib/three/geometries/LightningStrike.js"),
        import("three/examples/jsm/postprocessing/EffectComposer.js"),
        import("three/examples/jsm/postprocessing/RenderPass.js"),
        import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
      ]);

      if (cancelled) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0.15, 8.2);

      const renderer = new THREE.WebGLRenderer({
        canvas: targetCanvas,
        context,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0xffffff, 1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // Chrome needs bright, neutral bands against dark reflections to read
      // as polished metal. Use only light strips: no reflected room or props.
      // Bake them once so the finish adds no per-frame reflection rendering.
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const reflectionLighting = new THREE.Scene();
      reflectionLighting.background = new THREE.Color(0x292929);
      const addReflectionStrip = (
        width: number,
        height: number,
        position: [number, number, number],
        intensity: number,
      ) => {
        const strip = new THREE.Mesh(
          new THREE.PlaneGeometry(width, height),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color().setRGB(intensity, intensity, intensity),
            side: THREE.DoubleSide,
            toneMapped: false,
          }),
        );
        strip.position.set(...position);
        strip.lookAt(0, 0, 0);
        reflectionLighting.add(strip);
      };
      addReflectionStrip(8, 4, [0, 3, 4], 1.4);
      addReflectionStrip(5, 8, [-4, 1, 2.5], 0.9);
      addReflectionStrip(4, 9, [4, 0, 2], 1.8);
      addReflectionStrip(8, 5, [0, 3, -4], 1.2);
      addReflectionStrip(7, 3, [0, -3, 4], 0.7);
      const disposeReflectionLighting = () => {
        reflectionLighting.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            object.material.dispose();
          }
        });
      };
      const studioRenderTarget = pmremGenerator.fromScene(reflectionLighting);
      const studioEnvironment = studioRenderTarget.texture;
      scene.environment = studioEnvironment;
      scene.environmentIntensity = 0.72;

      let brandedLensEnvironment: InstanceType<typeof THREE.Texture> | null =
        null;
      let brandedLensRenderTarget: InstanceType<
        typeof THREE.WebGLCubeRenderTarget
      > | null = null;
      let brandedChromeRenderTarget: ReturnType<
        typeof pmremGenerator.fromCubemap
      > | null = null;
      try {
        const reflectionLogo = await new THREE.TextureLoader().loadAsync(
          "/models/pathetic-com-goggles-reflection.webp",
        );
        reflectionLogo.colorSpace = THREE.SRGBColorSpace;
        reflectionLogo.anisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy(),
        );

        if (cancelled) {
          reflectionLogo.dispose();
          disposeReflectionLighting();
          studioRenderTarget.dispose();
          pmremGenerator.dispose();
          renderer.dispose();
          return;
        }

        const reflectionScene = new THREE.Scene();
        reflectionScene.background = new THREE.Color(0x020204);
        // Keep the blackletter word large in the reflection so the lens
        // curvature can bend it without reducing it to a faint highlight.
        const reflectionCardGeometry = new THREE.PlaneGeometry(8.7, 2.9);
        const reflectionCardMaterial = new THREE.MeshBasicMaterial({
          map: reflectionLogo,
          transparent: true,
          side: THREE.DoubleSide,
          toneMapped: false,
        });
        const reflectionCard = new THREE.Mesh(
          reflectionCardGeometry,
          reflectionCardMaterial,
        );
        reflectionCard.position.set(0, -0.38, 2.65);
        reflectionScene.add(reflectionCard);

        const reflectionTarget = new THREE.WebGLCubeRenderTarget(512, {
          generateMipmaps: true,
          minFilter: THREE.LinearMipmapLinearFilter,
        });
        const reflectionCamera = new THREE.CubeCamera(
          0.1,
          10,
          reflectionTarget,
        );
        reflectionCamera.update(renderer, reflectionScene);
        // Keep the sharp cube reflection. PMREM filtering made the lettering
        // behave correctly, but softened it until it was barely legible.
        brandedLensEnvironment = reflectionTarget.texture;
        brandedLensEnvironment.mapping = THREE.CubeReflectionMapping;
        brandedLensRenderTarget = reflectionTarget;

        // Keep the lens word-only. Chrome gets the same word plus neutral
        // highlight strips that reveal the curved silver frame and charms.
        // Neither environment contains a floor, room or reflected objects.
        reflectionCardMaterial.color.setRGB(1.8, 1.8, 1.8);
        reflectionLighting.add(reflectionCard);
        brandedChromeRenderTarget = pmremGenerator.fromScene(
          reflectionLighting,
          0.12,
          0.1,
          10,
        );
        reflectionLighting.remove(reflectionCard);
        reflectionCardGeometry.dispose();
        reflectionCardMaterial.dispose();
        reflectionLogo.dispose();
      } catch {
        // The neutral studio environment remains a clean fallback.
      }
      disposeReflectionLighting();
      pmremGenerator.dispose();

      const idleSceneBackground = new THREE.Color(0xffffff);
      const poweredSceneBackground = new THREE.Color(0x000000);
      const currentSceneBackground = new THREE.Color(0xffffff);
      const displaySceneBackground = new THREE.Color(0xffffff);

      const root = new THREE.Group();
      // Keep a restrained elevated view without overpowering the composition.
      root.rotation.x = THREE.MathUtils.degToRad(12);
      scene.add(root);

      const lightningGroup = new THREE.Group();
      lightningGroup.position.z = -1.15;
      lightningGroup.visible = false;
      scene.add(lightningGroup);

      const createPlasmaBolt = (
        destination: InstanceType<typeof THREE.Vector3>,
      ) =>
        new LightningStrike({
          sourceOffset: new THREE.Vector3(0, 0, 0),
          destOffset: destination,
          radius0: 0.02,
          radius1: 0.0015,
          radius0Factor: 0.54,
          radius1Factor: 0.08,
          minRadius: 0.001,
          maxIterations: 7,
          isEternal: true,
          timeScale: 0.82,
          propagationTimeFactor: 0.08,
          vanishingTimeFactor: 0.94,
          subrayPeriod: 1.6,
          subrayDutyCycle: 0.78,
          maxSubrayRecursion: 3,
          ramification: 7,
          recursionProbability: 0.58,
          roughness: 0.86,
          straightness: 0.58,
        });
      const upperLightningDestination = new THREE.Vector3(-0.08, 2.18, 0);
      const lowerLightningDestination = new THREE.Vector3(0.07, -1.9, 0);
      const upperLightningGeometry = createPlasmaBolt(
        upperLightningDestination,
      );
      const lowerLightningGeometry = createPlasmaBolt(
        lowerLightningDestination,
      );
      const lightningMaterial = new THREE.MeshBasicMaterial({
        color: 0xd8fbff,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const upperLightningMesh = new THREE.Mesh(
        upperLightningGeometry,
        lightningMaterial,
      );
      const lowerLightningMesh = new THREE.Mesh(
        lowerLightningGeometry,
        lightningMaterial,
      );
      upperLightningMesh.frustumCulled = false;
      lowerLightningMesh.frustumCulled = false;
      upperLightningMesh.visible = false;
      lowerLightningMesh.visible = false;

      const createLocalArc = (
        source: InstanceType<typeof THREE.Vector3>,
        destination: InstanceType<typeof THREE.Vector3>,
      ) =>
        new LightningStrike({
          sourceOffset: source,
          destOffset: destination,
          radius0: 0.009,
          radius1: 0.0007,
          radius0Factor: 0.48,
          radius1Factor: 0.05,
          minRadius: 0.0005,
          maxIterations: 5,
          isEternal: true,
          timeScale: 1.05,
          propagationTimeFactor: 0.1,
          vanishingTimeFactor: 0.9,
          subrayPeriod: 1.3,
          subrayDutyCycle: 0.68,
          maxSubrayRecursion: 2,
          ramification: 3,
          recursionProbability: 0.42,
          roughness: 0.78,
          straightness: 0.7,
        });
      const createLocalArcCluster = (
        paths: Array<
          [
            InstanceType<typeof THREE.Vector3>,
            InstanceType<typeof THREE.Vector3>,
          ]
        >,
      ) => {
        const group = new THREE.Group();
        const geometries = paths.map(([source, destination]) =>
          createLocalArc(source, destination),
        );
        const meshes = geometries.map((geometry) => {
          const mesh = new THREE.Mesh(geometry, lightningMaterial);
          mesh.frustumCulled = false;
          return mesh;
        });
        group.add(...meshes);
        group.visible = false;
        return { group, geometries };
      };
      const logoArcCluster = createLocalArcCluster([
        [new THREE.Vector3(-0.08, 0.01, 0), new THREE.Vector3(-0.48, 0.25, 0)],
        [new THREE.Vector3(0.1, -0.01, 0), new THREE.Vector3(0.48, -0.23, 0)],
      ]);
      const featureArcCluster = createLocalArcCluster([
        [new THREE.Vector3(-0.12, 0.02, 0), new THREE.Vector3(-0.58, 0.31, 0)],
        [new THREE.Vector3(0.1, -0.02, 0), new THREE.Vector3(0.52, -0.32, 0)],
      ]);

      const plasmaCoreGeometry = new THREE.SphereGeometry(0.17, 24, 16);
      const plasmaCoreMaterial = new THREE.MeshBasicMaterial({
        color: 0xd8fbff,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
      });
      const plasmaCore = new THREE.Mesh(plasmaCoreGeometry, plasmaCoreMaterial);
      plasmaCore.scale.setScalar(0);

      const plasmaHaloCanvas = document.createElement("canvas");
      plasmaHaloCanvas.width = 128;
      plasmaHaloCanvas.height = 128;
      const plasmaHaloContext = plasmaHaloCanvas.getContext("2d");
      if (plasmaHaloContext) {
        const gradient = plasmaHaloContext.createRadialGradient(
          64,
          64,
          0,
          64,
          64,
          64,
        );
        gradient.addColorStop(0, "rgba(226, 251, 255, 1)");
        gradient.addColorStop(0.18, "rgba(92, 194, 255, 0.94)");
        gradient.addColorStop(0.5, "rgba(36, 117, 255, 0.42)");
        gradient.addColorStop(1, "rgba(36, 117, 255, 0)");
        plasmaHaloContext.fillStyle = gradient;
        plasmaHaloContext.fillRect(0, 0, 128, 128);
      }
      const plasmaHaloTexture = new THREE.CanvasTexture(plasmaHaloCanvas);
      plasmaHaloTexture.colorSpace = THREE.SRGBColorSpace;
      const plasmaHaloMaterial = new THREE.SpriteMaterial({
        map: plasmaHaloTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
      });
      const plasmaHalo = new THREE.Sprite(plasmaHaloMaterial);
      plasmaHalo.scale.setScalar(0);
      const plasmaLight = new THREE.PointLight(0x3fa7ff, 0, 7, 2);

      lightningGroup.add(
        upperLightningMesh,
        lowerLightningMesh,
        logoArcCluster.group,
        featureArcCluster.group,
        plasmaHalo,
        plasmaCore,
        plasmaLight,
      );

      const bloomComposer = new EffectComposer(renderer);
      const bloomRenderPass = new RenderPass(scene, camera);
      const lightningBloom = new UnrealBloomPass(
        new THREE.Vector2(1, 1),
        0,
        0.42,
        0.48,
      );
      bloomComposer.addPass(bloomRenderPass);
      bloomComposer.addPass(lightningBloom);
      const startEntrySpin = () => {
        if (!sceneReadyRef.current) {
          pendingEntryRef.current = true;
          return;
        }

        pendingEntryRef.current = false;
        entryTweenRef.current?.kill();
        entrySpinRef.current.value = -Math.PI * 4.5;
        entryTweenRef.current = gsap.to(entrySpinRef.current, {
          value: 0,
          duration: 1.18,
          ease: "power4.out",
          overwrite: true,
          onComplete: () => {
            entryTweenRef.current = null;
          },
        });
      };
      startEntryRef.current = startEntrySpin;
      sceneReadyRef.current = true;
      if (pendingEntryRef.current) startEntrySpin();

      scene.add(new THREE.HemisphereLight(0xffffff, 0x6f6f8f, 2.4));
      const keyLight = new THREE.DirectionalLight(0xffffff, 5);
      keyLight.position.set(3, 4, 5);
      scene.add(keyLight);
      const accentLight = new THREE.PointLight(0xff2d20, 18, 12);
      accentLight.position.set(-3, -1.5, 3);
      scene.add(accentLight);
      const baseAccentColor = new THREE.Color(0xff2d20);
      const surgeAccentColor = new THREE.Color(0x3fa7ff);
      const getResponsiveModelScale = () => {
        const viewportWidth = window.visualViewport?.width ?? window.innerWidth;

        if (viewportWidth < 640) {
          const mobileProgress = THREE.MathUtils.clamp(
            (viewportWidth - 320) / 320,
            0,
            1,
          );
          return THREE.MathUtils.lerp(0.54, 0.68, mobileProgress);
        }

        return viewportWidth < 1024 ? 0.84 : 1;
      };
      let visibleObjectScaleBase = Math.max(0.1, modelScale || 1);
      let visibleObjectResponsiveScale = getResponsiveModelScale();

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
        mesh.scale.setScalar(
          visibleObjectScaleBase * visibleObjectResponsiveScale,
        );
        root.add(mesh);
        return mesh;
      }

      let visibleObject: InstanceType<typeof THREE.Object3D> = addFallback();

      cleanUpScene = () => {
        disposeObject(root);
        disposeObject(lightningGroup);
        brandedLensRenderTarget?.dispose();
        brandedChromeRenderTarget?.dispose();
        studioRenderTarget.dispose();
        plasmaHaloTexture.dispose();
        lightningBloom.dispose();
        bloomComposer.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      };

      if (modelUrl) {
        const loader = new GLTFLoader();
        await loader.loadAsync(modelUrl).then(
          (gltf) => {
            if (cancelled) {
              disposeObject(gltf.scene);
              return;
            }

            root.remove(visibleObject);
            disposeObject(visibleObject);

            const model = gltf.scene;
            model.traverse((child) => {
              const mesh = child as InstanceType<typeof THREE.Mesh>;
              if (!mesh.isMesh || !mesh.material) return;

              const isLens =
                child.name.toLowerCase().includes("lenses") ||
                (Array.isArray(mesh.material)
                  ? mesh.material
                  : [mesh.material]
                ).some(
                  (material) => material.name.toLowerCase() === "chrome black",
                );
              const materials = Array.isArray(mesh.material)
                ? mesh.material
                : [mesh.material];

              if (isLens && brandedLensEnvironment) {
                const reflectedMaterials = materials.map((material) => {
                  if (!(material instanceof THREE.MeshStandardMaterial)) {
                    return material;
                  }

                  return new THREE.MeshBasicMaterial({
                    name: material.name,
                    color: 0x020204,
                    envMap: brandedLensEnvironment,
                    combine: THREE.AddOperation,
                    reflectivity: 1,
                    side: material.side,
                    transparent: material.transparent,
                    opacity: material.opacity,
                    depthTest: material.depthTest,
                    depthWrite: material.depthWrite,
                    toneMapped: false,
                  });
                });
                mesh.material = Array.isArray(mesh.material)
                  ? reflectedMaterials
                  : reflectedMaterials[0];
                return;
              }

              materials.forEach((material) => {
                if (!(material instanceof THREE.MeshStandardMaterial)) return;

                if (isLens) {
                  material.color.set(0x0d0f13);
                  material.metalness = 1;
                  material.roughness = 0.024;
                  material.envMap = studioEnvironment;
                  material.envMapIntensity = 1;
                } else {
                  material.color.set(0xe8e8e8);
                  material.metalness = 1;
                  material.roughness = 0.065;
                  material.envMap =
                    brandedChromeRenderTarget?.texture || studioEnvironment;
                  material.envMapIntensity = 1;
                }

                material.needsUpdate = true;
              });
            });

            const initialBox = new THREE.Box3().setFromObject(model);
            const size = initialBox.getSize(new THREE.Vector3());
            const largestAxis = Math.max(size.x, size.y, size.z) || 1;
            visibleObjectScaleBase =
              (5 / largestAxis) * Math.max(0.1, modelScale || 1);
            model.scale.setScalar(
              visibleObjectScaleBase * visibleObjectResponsiveScale,
            );

            const centeredBox = new THREE.Box3().setFromObject(model);
            const center = centeredBox.getCenter(new THREE.Vector3());
            model.position.sub(center);

            visibleObject = model;
            root.add(model);
            // If the real model arrived after the entrance tween had already
            // finished on the fallback, replay it once on the glasses.
            if (entryKeyRef.current > 0 && !entryTweenRef.current) {
              startEntrySpin();
            }
          },
          () => {
            // The chrome fallback intentionally remains visible on load failure.
          },
        );
      }

      if (cancelled) return;

      let headerArcTargetsAvailable = false;
      const resize = () => {
        const bounds = targetCanvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(bounds.width));
        const height = Math.max(1, Math.round(bounds.height));
        renderer.setSize(width, height, false);
        bloomComposer.setPixelRatio(
          Math.min(window.devicePixelRatio || 1, 1.6),
        );
        bloomComposer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        const nextResponsiveScale = getResponsiveModelScale();
        targetCanvas.dataset.modelResponsiveScale =
          nextResponsiveScale.toFixed(4);
        visibleObject.scale.setScalar(
          visibleObjectScaleBase * nextResponsiveScale,
        );
        // The imported GLTF is centred after its responsive scale is applied.
        // Keep that offset proportional when a live resize crosses a
        // breakpoint, otherwise the glasses grow away from the canvas centre.
        if (visibleObjectResponsiveScale > 0) {
          visibleObject.position.multiplyScalar(
            nextResponsiveScale / visibleObjectResponsiveScale,
          );
        }
        visibleObjectResponsiveScale = nextResponsiveScale;

        const cameraDistance = Math.abs(
          camera.position.z - lightningGroup.position.z,
        );
        const visibleHalfHeight =
          Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * cameraDistance;
        const lightningEdgeMargin = 0.24;
        headerArcTargetsAvailable = window.matchMedia(
          "(min-width: 1280px)",
        ).matches;
        const destinationFromElement = (
          destination: InstanceType<typeof THREE.Vector3>,
          element: Element | null,
          fallbackX: number,
          fallbackY: number,
        ) => {
          const elementBounds = element?.getBoundingClientRect();
          const targetX = elementBounds
            ? elementBounds.left + elementBounds.width * 0.5
            : bounds.left + bounds.width * fallbackX;
          const targetY = elementBounds
            ? elementBounds.top + elementBounds.height * 0.5
            : bounds.top + bounds.height * fallbackY;
          const normalX =
            ((targetX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
          const normalY =
            1 - ((targetY - bounds.top) / Math.max(1, bounds.height)) * 2;

          destination.x = normalX * visibleHalfHeight * camera.aspect;
          destination.y = camera.position.y + normalY * visibleHalfHeight;
        };

        upperLightningDestination.x = -0.08;
        upperLightningDestination.y =
          camera.position.y + visibleHalfHeight - lightningEdgeMargin;
        destinationFromElement(
          logoArcCluster.group.position,
          document.getElementById("header-logo-main-desktop"),
          0.5,
          0.045,
        );
        destinationFromElement(
          featureArcCluster.group.position,
          document.querySelector('[data-header-feature-root="true"]'),
          0.055,
          0.05,
        );
        lowerLightningDestination.y =
          camera.position.y - visibleHalfHeight + lightningEdgeMargin;
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(targetCanvas);
      window.addEventListener("resize", resize, { passive: true });
      window.visualViewport?.addEventListener("resize", resize, {
        passive: true,
      });
      resize();

      lightningGroup.visible = true;
      const warmedVisibility = new Map<
        InstanceType<typeof THREE.Object3D>,
        boolean
      >();
      lightningGroup.traverse((object) => {
        warmedVisibility.set(object, object.visible);
        object.visible = true;
      });
      renderer.compile(scene, camera);
      bloomComposer.renderToScreen = false;
      lightningBloom.strength = 0.7;
      bloomComposer.render();
      bloomComposer.renderToScreen = true;
      lightningBloom.strength = 0;
      warmedVisibility.forEach((visible, object) => {
        object.visible = visible;
      });
      lightningGroup.visible = false;
      targetCanvas.dataset.funReady = "true";

      const clock = new THREE.Clock();
      let idleRotationY = 0;
      let surgeIntensity = 0;
      let powerCharge = 0;
      let backgroundCharge = 0;
      let wasLightningActive = false;
      const lastLightningUpdates = [-1, -1, -1, -1];
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const objectArticle = targetCanvas.closest<HTMLElement>(
        '[data-lifecycle-slide="object"]',
      );
      const surgeBackground = objectArticle?.querySelector<HTMLElement>(
        "[data-lifecycle-fun-background]",
      );

      const environment = createLifecycleEnvironment(
        environmentRoot.current,
        targetCanvas,
      );

      const render = () => {
        const transitionDelta = Math.min(clock.getDelta(), 0.25);
        const delta = Math.min(transitionDelta, 0.05);
        // Keep the prewarmed scene resident, but spend no GPU time on hidden slides.
        if (
          (!visibleRef.current || document.hidden) &&
          !boostedRef.current &&
          backgroundCharge < 0.001
        ) {
          animationFrame = window.requestAnimationFrame(render);
          return;
        }
        const elapsed = clock.elapsedTime;
        const boostActive = boostedRef.current && !prefersReducedMotion;

        // Immediate response, with a progressive 4.5-second build to full speed.
        surgeIntensity = boostActive
          ? Math.min(1, surgeIntensity + transitionDelta / 4.5)
          : THREE.MathUtils.damp(surgeIntensity, 0, 2.35, transitionDelta);
        powerCharge = THREE.MathUtils.damp(
          powerCharge,
          boostActive ? 1 : 0,
          boostActive ? 9 : 5,
          transitionDelta,
        );
        backgroundCharge = THREE.MathUtils.damp(
          backgroundCharge,
          boostActive ? 1 : 0,
          boostActive ? 5.2 : 3.8,
          transitionDelta,
        );
        const backgroundProgress = THREE.MathUtils.smoothstep(
          backgroundCharge,
          0,
          1,
        );
        currentSceneBackground.lerpColors(
          idleSceneBackground,
          poweredSceneBackground,
          backgroundProgress,
        );
        renderer.setClearColor(currentSceneBackground, 1);

        const lightningActive = boostActive && powerCharge > 0.78;
        if (lightningActive && !wasLightningActive) {
          lastLightningUpdates.forEach((_, index) => {
            lastLightningUpdates[index] = elapsed - 0.066 + index * 0.0165;
          });
        }
        wasLightningActive = lightningActive;

        if (!prefersReducedMotion) {
          const surgeRamp = Math.pow(
            THREE.MathUtils.smoothstep(surgeIntensity, 0, 1),
            1.7,
          );
          const multiplier = 1 + surgeRamp * 115;
          idleRotationY += delta * (rotationSpeed || 0.35) * multiplier;
          root.rotation.y = idleRotationY + entrySpinRef.current.value;

          const flicker = THREE.MathUtils.clamp(
            0.72 +
              Math.sin(elapsed * 31) * 0.16 +
              Math.sin(elapsed * 53.3) * 0.12,
            0.42,
            1,
          );
          const coreProgress = THREE.MathUtils.clamp(powerCharge / 0.78, 0, 1);
          const corePulse = lightningActive
            ? 1 + Math.sin(elapsed * 24) * 0.055
            : 1;
          const coreScale = (1 - Math.pow(1 - coreProgress, 2.4)) * corePulse;

          lightningGroup.visible = powerCharge > 0.012;
          plasmaCore.scale.setScalar(coreScale);
          plasmaHalo.scale.setScalar(coreScale * (0.9 + flicker * 0.2));
          plasmaHaloMaterial.opacity = coreProgress * (0.46 + flicker * 0.24);
          plasmaLight.intensity = coreProgress * (15 + flicker * 12);

          upperLightningMesh.visible = lightningActive;
          lowerLightningMesh.visible = lightningActive;
          logoArcCluster.group.visible =
            lightningActive && headerArcTargetsAvailable;
          featureArcCluster.group.visible =
            lightningActive && headerArcTargetsAvailable;
          lightningMaterial.opacity = lightningActive ? 0.9 + flicker * 0.1 : 0;
          lightningBloom.strength = lightningActive ? 0.58 + flicker * 0.18 : 0;
          lightningBloom.radius = 0.34 + flicker * 0.08;

          if (lightningActive) {
            // Keep each bolt at its original update rate, distributed across
            // frames instead of rebuilding every lightning mesh in one burst.
            const groupCount = headerArcTargetsAvailable ? 4 : 2;
            for (let group = 0; group < groupCount; group++) {
              if (elapsed - lastLightningUpdates[group] < 0.066) continue;
              lastLightningUpdates[group] = elapsed;
              if (group === 0) upperLightningGeometry.update(elapsed);
              else if (group === 1) lowerLightningGeometry.update(elapsed + 1.73);
              else {
                const cluster = group === 2 ? logoArcCluster : featureArcCluster;
                cluster.geometries.forEach((geometry, index) =>
                  geometry.update(
                    elapsed + (group === 2 ? 0.47 : 1.13) +
                    index * (group === 2 ? 0.61 : 0.57),
                  ),
                );
              }
            }
          }

          const visualIntensity = Math.max(powerCharge, surgeIntensity);
          accentLight.color.lerpColors(
            baseAccentColor,
            surgeAccentColor,
            visualIntensity,
          );
          accentLight.intensity = 18 + visualIntensity * (45 + flicker * 22);
          accentLight.position.x = THREE.MathUtils.lerp(-3, 0, visualIntensity);
          accentLight.position.y = THREE.MathUtils.lerp(
            -1.5,
            0.2,
            visualIntensity,
          );

          if (surgeBackground) {
            surgeBackground.style.opacity = String(
              Math.pow(backgroundCharge, 0.6),
            );
          }
        }
        const usingBloom = !prefersReducedMotion && powerCharge > 0.012;
        if (usingBloom) {
          bloomComposer.render();
        } else {
          renderer.render(scene, camera);
        }
        // The bloom pass draws its base with a colour-managed MeshBasicMaterial.
        // Use that same sRGB background for CSS; copy its extra light separately.
        displaySceneBackground
          .copy(currentSceneBackground)
          .convertLinearToSRGB();
        environment.update(
          backgroundProgress,
          displaySceneBackground.r,
        );
        animationFrame = window.requestAnimationFrame(render);
      };
      render();

      cleanUpScene = () => {
        sceneReadyRef.current = false;
        pendingEntryRef.current = false;
        entryTweenRef.current?.kill();
        entryTweenRef.current = null;
        entrySpinRef.current.value = 0;
        startEntryRef.current = () => {
          pendingEntryRef.current = true;
        };
        environment.dispose();
        window.cancelAnimationFrame(animationFrame);
        resizeObserver?.disconnect();
        window.removeEventListener("resize", resize);
        window.visualViewport?.removeEventListener("resize", resize);
        disposeObject(root);
        disposeObject(lightningGroup);
        brandedLensRenderTarget?.dispose();
        brandedChromeRenderTarget?.dispose();
        studioRenderTarget.dispose();
        plasmaHaloTexture.dispose();
        lightningBloom.dispose();
        bloomComposer.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        if (surgeBackground) surgeBackground.style.opacity = "0";
      };
      if (cancelled) cleanUpScene();
    }

    setWebglUnavailable(false);
    void setup().catch(() => {
      cleanUpScene();
      if (!cancelled) setWebglUnavailable(true);
    });

    return () => {
      cancelled = true;
      cleanUpScene();
    };
  }, [environmentRoot, modelScale, modelUrl, rotationSpeed]);

  if (webglUnavailable) {
    return (
      <div
        role="img"
        aria-label="Rotating three-dimensional lifecycle object"
        className="flex h-full w-full items-center justify-center [perspective:900px]"
      >
        <div className="relative aspect-square w-[min(54vw,430px)] animate-[spin_8s_linear_infinite] rounded-full bg-[conic-gradient(from_35deg,#282828,#f8f8f8_18%,#777_33%,#fff_48%,#343434_68%,#dedede_83%,#282828)] p-[clamp(1.1rem,4vw,2.8rem)] [transform:rotateX(64deg)_rotateZ(-14deg)]">
          <div className="h-full w-full rounded-full bg-background" />
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
