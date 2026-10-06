"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type * as Three from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { InstagramProfile } from "@/lib/instagram/profile";
import {
  createProfileScreen,
  drawGlassImpact,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "./network-phone-textures";

export default function NetworkPhoneModel({
  pointer,
  onProfile,
}: {
  pointer: MutableRefObject<{ x: number; y: number }>;
  onProfile: (profile: InstagramProfile) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLCanvasElement>(null);
  const addImpactRef = useRef<(x?: number, y?: number) => void>(() => {});
  const [ready, setReady] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  const fallbackImpactRef = useRef<(x?: number, y?: number) => void>(() => {});
  const [impactCount, setImpactCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let started = false;
    let visible = false;
    let contextAvailable = true;
    let presented = false;
    let prepared = false;
    let frame = 0;
    let resume = () => {};
    let dispose = () => {};
    // ScrollSmoother clips its wrapper, so an IntersectionObserver rootMargin
    // cannot prewarm a child canvas outside it. Use the same scroll coordinates
    // as the rest of the page; keep the render observer viewport-only below.
    gsap.registerPlugin(ScrollTrigger);
    const preloader = ScrollTrigger.create({
      trigger: canvas,
      start: "top bottom+=2400",
      once: true,
      onEnter: () => {
        if (started) return;
        started = true;
        void setup();
      },
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) resume();
      },
      { rootMargin: "100px 0px" },
    );
    observer.observe(canvas);
    const lost = (event: Event) => {
      event.preventDefault();
      contextAvailable = false;
      presented = false;
      cancelAnimationFrame(frame);
      frame = 0;
      canvas.dataset.ready = "false";
      setReady(false);
      setFallbackActive(true);
    };
    const restored = () => {
      contextAvailable = true;
      resume();
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);

    async function setup() {
      let renderer: Three.WebGLRenderer | undefined;
      try {
        const [THREE, { RoundedBoxGeometry }, { RoomEnvironment }, profile] =
          await Promise.all([
            import("three"),
            import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
            import("three/examples/jsm/environments/RoomEnvironment.js"),
            createProfileScreen(onProfile),
          ]);
        if (cancelled) return;
        renderer = new THREE.WebGLRenderer({
          canvas: canvas!,
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        });
        const webgl = renderer;
        webgl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        webgl.outputColorSpace = THREE.SRGBColorSpace;
        webgl.toneMapping = THREE.ACESFilmicToneMapping;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
        camera.position.set(0, 0, 11.2);
        const pmrem = new THREE.PMREMGenerator(webgl);
        const room = new RoomEnvironment();
        const environment = pmrem.fromScene(room, 0.035, 0.1, 100, {
          size: 128,
        });
        room.dispose();
        pmrem.dispose();
        scene.environment = environment.texture;
        scene.environmentIntensity = 1.5;
        scene.add(new THREE.HemisphereLight(0xffffff, 0x687454, 3));
        const light = new THREE.DirectionalLight(0xffffff, 4);
        light.position.set(-3, 5, 6);
        scene.add(light);
        const phone = new THREE.Group();
        scene.add(phone);
        const metal = new THREE.MeshStandardMaterial({
          color: 0xb0ada6,
          metalness: 1,
          roughness: 0.28,
        });
        const black = new THREE.MeshStandardMaterial({
          color: 0x090b0e,
          metalness: 0.45,
          roughness: 0.2,
        });
        // Correct UVs on a rounded screen keep click impacts attached while tilting.
        const roundedShape = (
          width: number,
          height: number,
          radius: number,
        ) => {
          const shape = new THREE.Shape();
          const x = -width / 2,
            y = -height / 2;
          shape.moveTo(x + radius, y);
          shape.lineTo(x + width - radius, y);
          shape.quadraticCurveTo(x + width, y, x + width, y + radius);
          shape.lineTo(x + width, y + height - radius);
          shape.quadraticCurveTo(
            x + width,
            y + height,
            x + width - radius,
            y + height,
          );
          shape.lineTo(x + radius, y + height);
          shape.quadraticCurveTo(x, y + height, x, y + height - radius);
          shape.lineTo(x, y + radius);
          shape.quadraticCurveTo(x, y, x + radius, y);
          return shape;
        };
        const roundedPlane = (
          width: number,
          height: number,
          radius: number,
        ) => {
          const geometry = new THREE.ShapeGeometry(
            roundedShape(width, height, radius),
            16,
          );
          const positions = geometry.getAttribute("position");
          const uv = geometry.getAttribute("uv");
          for (let i = 0; i < uv.count; i++)
            uv.setXY(
              i,
              positions.getX(i) / width + 0.5,
              positions.getY(i) / height + 0.5,
            );
          return geometry;
        };
        const bodyGeometry = new THREE.ExtrudeGeometry(
          roundedShape(2.72, 5.66, 0.43),
          {
            depth: 0.26,
            bevelEnabled: true,
            bevelSegments: 3,
            steps: 1,
            bevelSize: 0.018,
            bevelThickness: 0.018,
            curveSegments: 16,
          },
        );
        bodyGeometry.translate(0, 0, -0.13);
        const body = new THREE.Mesh(bodyGeometry, metal);
        phone.add(body);
        const bezelGeometry = new THREE.ExtrudeGeometry(
          roundedShape(2.67, 5.61, 0.41),
          {
            depth: 0.05,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.012,
            bevelThickness: 0.012,
            curveSegments: 16,
          },
        );
        const bezel = new THREE.Mesh(bezelGeometry, black);
        bezel.position.z = 0.145;
        phone.add(bezel);
        const screenTexture = new THREE.CanvasTexture(profile);
        screenTexture.colorSpace = THREE.SRGBColorSpace;
        screenTexture.anisotropy = Math.min(
          8,
          webgl.capabilities.getMaxAnisotropy(),
        );
        const screenGeometry = roundedPlane(2.56, 5.48, 0.36);
        const screen = new THREE.Mesh(
          screenGeometry,
          new THREE.MeshBasicMaterial({
            map: screenTexture,
            toneMapped: false,
          }),
        );
        screen.position.z = 0.218;
        phone.add(screen);
        const fractures = document.createElement("canvas");
        fractures.width = SCREEN_WIDTH;
        fractures.height = SCREEN_HEIGHT;
        const glassContext = fractures.getContext("2d")!;
        drawGlassImpact(glassContext, 27, 72, 19, 0.85);
        drawGlassImpact(glassContext, 561, 798, 72, 0.9);
        drawGlassImpact(glassContext, 103, 1200, 140, 0.75);
        const fractureTexture = new THREE.CanvasTexture(fractures);
        const cracks = new THREE.Mesh(
          screenGeometry,
          new THREE.MeshBasicMaterial({
            map: fractureTexture,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          }),
        );
        cracks.position.z = 0.225;
        phone.add(cracks);
        const sheen = new THREE.Mesh(
          screenGeometry,
          new THREE.MeshPhysicalMaterial({
            color: 0xcedcf3,
            metalness: 0.1,
            roughness: 0.12,
            transparent: true,
            opacity: 0.055,
            clearcoat: 1,
            depthWrite: false,
          }),
        );
        sheen.position.z = 0.23;
        phone.add(sheen);
        const island = new THREE.Mesh(
          roundedPlane(0.73, 0.2, 0.1),
          new THREE.MeshBasicMaterial({ color: 0x06080a }),
        );
        island.position.set(0, 2.5, 0.24);
        phone.add(island);
        const cameraGlass = new THREE.Mesh(
          new THREE.CircleGeometry(0.036, 20),
          new THREE.MeshStandardMaterial({
            color: 0x203958,
            metalness: 0.8,
            roughness: 0.12,
          }),
        );
        cameraGlass.position.set(0.23, 2.5, 0.259);
        phone.add(cameraGlass);
        for (const [x, y, h] of [
          [-1.375, 1.95, 0.24],
          [-1.375, 1.2, 0.42],
          [-1.375, 0.56, 0.42],
          [1.375, 0.8, 0.7],
          [1.375, -1.3, 0.44],
        ]) {
          const button = new THREE.Mesh(
            new RoundedBoxGeometry(0.07, h, 0.16, 2, 0.03),
            metal,
          );
          button.position.set(x, y, 0);
          phone.add(button);
        }
        const port = new THREE.Mesh(
          new RoundedBoxGeometry(0.36, 0.025, 0.11, 2, 0.012),
          black,
        );
        port.position.set(0, -2.825, 0);
        phone.add(port);
        // Antenna breaks, speaker perforations, and the inset receiver give the
        // titanium rail the proportions and detail of a current Pro handset.
        const antennaMaterial = new THREE.MeshStandardMaterial({
          color: 0x777773,
          roughness: 0.8,
        });
        for (const x of [-1.369, 1.369])
          for (const y of [-2.12, 2.12]) {
            const band = new THREE.Mesh(
              new THREE.BoxGeometry(0.014, 0.045, 0.26),
              antennaMaterial,
            );
            band.position.set(x, y, 0);
            phone.add(band);
          }
        const speakerGeometry = new THREE.CircleGeometry(0.024, 10);
        for (const direction of [-1, 1])
          for (let i = 0; i < 5; i++) {
            const speaker = new THREE.Mesh(speakerGeometry, black);
            speaker.rotation.x = Math.PI / 2;
            speaker.position.set(direction * (0.39 + i * 0.105), -2.849, 0);
            phone.add(speaker);
          }
        const receiver = new THREE.Mesh(
          roundedPlane(0.48, 0.019, 0.009),
          black,
        );
        receiver.position.set(0, 2.775, 0.205);
        phone.add(receiver);
        canvas!.dataset.profileSource =
          profile.dataset.profileSource || "snapshot";
        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        let impacts = 0;
        let impulse = 0;
        let intro = reducedMotion ? 1 : 0;
        let elapsed = 0;
        let lastTime = 0;
        const raycaster = new THREE.Raycaster();
        const cursor = new THREE.Vector2();
        const impact = (x = SCREEN_WIDTH * 0.5, y = SCREEN_HEIGHT * 0.52) => {
          impacts++;
          // Accumulate damage in one texture, without allocating geometry per click.
          drawGlassImpact(glassContext, x, y, 781 + impacts * 97, 0.8);
          fractureTexture.needsUpdate = true;
          impulse = reducedMotion ? 0 : 1;
          canvas!.dataset.crackCount = String(impacts);
          setImpactCount(impacts);
          resume();
        };
        addImpactRef.current = impact;
        const onClick = (event: MouseEvent) => {
          const bounds = canvas!.getBoundingClientRect();
          cursor.set(
            ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
            (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
          );
          raycaster.setFromCamera(cursor, camera);
          const hit = raycaster.intersectObject(screen)[0];
          if (hit?.uv)
            impact(hit.uv.x * SCREEN_WIDTH, (1 - hit.uv.y) * SCREEN_HEIGHT);
        };
        canvas!.addEventListener("click", onClick);
        const resize = () => {
          const bounds = canvas!.getBoundingClientRect();
          webgl.setSize(
            Math.max(1, bounds.width),
            Math.max(1, bounds.height),
            false,
          );
          camera.aspect = bounds.width / Math.max(1, bounds.height);
          camera.updateProjectionMatrix();
          resume();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas!);
        const render = (time: number) => {
          frame = 0;
          if (
            cancelled ||
            !prepared ||
            !visible ||
            document.hidden ||
            !contextAvailable
          ) {
            lastTime = 0;
            return;
          }
          const delta = Math.min(
            lastTime ? (time - lastTime) / 1000 : 1 / 60,
            0.25,
          );
          lastTime = time;
          elapsed += delta;
          intro = Math.min(1, intro + delta * 1.3);
          const pop =
            1 +
            2.70158 * Math.pow(intro - 1, 3) +
            1.70158 * Math.pow(intro - 1, 2);
          phone.scale.setScalar(0.96 + pop * 0.04);
          phone.position.y =
            (1 - pop) * -0.12 +
            (reducedMotion ? 0 : Math.sin(elapsed * 1.1) * 0.1);
          phone.rotation.x = THREE.MathUtils.damp(
            phone.rotation.x,
            0.07 + (reducedMotion ? 0 : pointer.current.y * 0.22),
            5,
            delta,
          );
          phone.rotation.y = THREE.MathUtils.damp(
            phone.rotation.y,
            -0.12 + (reducedMotion ? 0 : pointer.current.x * 0.35),
            5,
            delta,
          );
          phone.rotation.z =
            -0.16 +
            (reducedMotion
              ? 0
              : Math.sin(elapsed * 0.7) * 0.035 +
                impulse * Math.sin(elapsed * 65) * 0.022);
          impulse = THREE.MathUtils.damp(impulse, 0, 10, delta);
          webgl.render(scene, camera);
          canvas!.dataset.ready = "true";
          if (!presented) {
            presented = true;
            setFallbackActive(false);
            setReady(true);
          }
          if (!reducedMotion) frame = requestAnimationFrame(render);
        };
        resume = () => {
          if (
            !frame &&
            prepared &&
            visible &&
            !cancelled &&
            contextAvailable &&
            !document.hidden
          )
            frame = requestAnimationFrame(render);
        };
        const onVisibility = () => {
          if (!document.hidden) resume();
        };
        document.addEventListener("visibilitychange", onVisibility);
        dispose = () => {
          resizeObserver.disconnect();
          document.removeEventListener("visibilitychange", onVisibility);
          canvas!.removeEventListener("click", onClick);
          const geometries = new Set<Three.BufferGeometry>();
          const materials = new Set<Three.Material>();
          phone.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              geometries.add(object.geometry);
              (Array.isArray(object.material)
                ? object.material
                : [object.material]
              ).forEach((material) => materials.add(material));
            }
          });
          geometries.forEach((geometry) => geometry.dispose());
          materials.forEach((material) => material.dispose());
          screenTexture.dispose();
          fractureTexture.dispose();
          environment.dispose();
          webgl.dispose();
        };
        resize();
        phone.rotation.set(0.07, -0.12, -0.16);
        phone.scale.setScalar(reducedMotion ? 1 : 0.96);
        phone.position.y = reducedMotion ? 0 : -0.12;
        // Upload the actual screen and finish GPU compilation before revealing
        // the canvas. The flat fallback is reserved for unavailable WebGL.
        await webgl.compileAsync(scene, camera);
        if (cancelled) return;
        prepared = true;
        if (contextAvailable) {
          webgl.render(scene, camera);
          presented = true;
          canvas!.dataset.ready = "true";
          setFallbackActive(false);
          setReady(true);
        }
        resume();
        // Use the current local feed capture. The API connection remains
        // available for a future live feed without changing the phone UI.
      } catch {
        dispose();
        renderer?.dispose();
        if (!cancelled) {
          setReady(false);
          setFallbackActive(true);
        }
      }
    }
    return () => {
      cancelled = true;
      observer.disconnect();
      preloader.kill();
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      cancelAnimationFrame(frame);
      dispose();
      addImpactRef.current = () => {};
    };
  }, [pointer, onProfile]);

  useEffect(() => {
    if (!fallbackActive) return;
    let cancelled = false;
    void createProfileScreen().then((profile) => {
      const canvas = fallbackRef.current;
      if (cancelled || !canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(profile, 0, 0);
      drawGlassImpact(ctx, 32, 80, 19);
      let count = 0;
      fallbackImpactRef.current = (x = 300, y = 650) => {
        drawGlassImpact(ctx, x, y, 781 + ++count * 97, 0.8);
        setImpactCount(count);
      };
    });
    return () => {
      cancelled = true;
    };
  }, [fallbackActive]);

  return (
    <div
      className="network-phone-model"
      data-phone-state={
        ready ? "ready" : fallbackActive ? "fallback" : "preparing"
      }
    >
      {
        <canvas
          ref={fallbackRef}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          className="network-phone-fallback"
          style={{
            opacity: fallbackActive ? 1 : 0,
            visibility: fallbackActive ? "visible" : "hidden",
            pointerEvents: fallbackActive ? "auto" : "none",
          }}
          aria-hidden={!fallbackActive}
          role="button"
          tabIndex={fallbackActive ? 0 : -1}
          aria-label="Crack the phone screen"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            fallbackImpactRef.current(
              ((event.clientX - rect.left) / rect.width) * SCREEN_WIDTH,
              ((event.clientY - rect.top) / rect.height) * SCREEN_HEIGHT,
            );
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fallbackImpactRef.current();
            }
          }}
        />
      }
      {
        <canvas
          ref={canvasRef}
          className="network-phone-canvas"
          style={{
            opacity: ready ? 1 : 0,
            pointerEvents: ready ? "auto" : "none",
          }}
          aria-hidden={!ready}
          role="button"
          tabIndex={ready ? 0 : -1}
          aria-label="Crack the phone screen"
          onKeyDown={(event) => {
            if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
              event.preventDefault();
              addImpactRef.current();
            }
          }}
        />
      }
      <span className="sr-only" role="status">
        {impactCount > 0
          ? `${impactCount} new ${impactCount === 1 ? "crack" : "cracks"} in the glass.`
          : ""}
      </span>
    </div>
  );
}
