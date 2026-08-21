"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

const GLYPHS = "0011010100110101PATHEticZXCVBNM<>/{}[]$#@";
const GLYPH_FRAMES = 4;
const GLYPH_CHANGE_INTERVAL = 170;

function cellRandom(column: number, row: number, salt = 0) {
  let value =
    Math.imul(column + 1, 0x1f123bb5) ^
    Math.imul(row + 2, 0x5f356495) ^
    salt;
  value ^= value >>> 15;
  value = Math.imul(value, 0x2c1b3c6d);
  value ^= value >>> 12;
  value = Math.imul(value, 0x297a2d39);
  value ^= value >>> 15;
  return (value >>> 0) / 4294967295;
}

export default function MatrixRevealCanvas({
  progress,
  color = "#00ff46",
  density = 96,
  changeSpeed = 1,
  softness = 0.13,
}: {
  progress: MutableRefObject<{ value: number }>;
  color?: string;
  density?: number;
  changeSpeed?: number;
  softness?: number;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      host.dataset.webglFallback = "true";
      return;
    }

    // The chunky glyphs and soft fade retain their detail below native
    // resolution while leaving enough GPU headroom for the scene underneath.
    renderer.setPixelRatio(0.65);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const textureFrameWidth = 1024;
    const rainCanvas = document.createElement("canvas");
    rainCanvas.width = textureFrameWidth * GLYPH_FRAMES;
    rainCanvas.height = 512;
    const context = rainCanvas.getContext("2d");
    if (!context) {
      renderer.dispose();
      renderer.domElement.remove();
      host.dataset.webglFallback = "true";
      return;
    }

    const columns = Math.max(
      112,
      Math.min(260, Math.round(density * 1.75)),
    );
    const columnWidth = textureFrameWidth / columns;
    const glyphSize = columnWidth * 1.82;
    const rowHeight = columnWidth * 2;
    const texture = new THREE.CanvasTexture(rainCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uRain: { value: texture },
        uProgress: { value: 0 },
        uGlyphFrame: { value: 0 },
        uGlyphFrames: { value: GLYPH_FRAMES },
        uColor: { value: new THREE.Color(color) },
        uSoftness: { value: Math.max(0.03, Math.min(0.35, softness)) },
        uColumns: { value: columns },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uRain;
        uniform float uProgress;
        uniform float uGlyphFrame;
        uniform float uGlyphFrames;
        uniform vec3 uColor;
        uniform float uSoftness;
        uniform float uColumns;
        varying vec2 vUv;

        float edgeShape(float x, float progress) {
          return sin(x * 6.0 + progress * 1.5) * 0.03
            + sin(x * 17.0 - progress * 2.2) * 0.01;
        }

        float hash(float n) {
          n = fract(n * 0.1031);
          n *= n + 33.33;
          n *= n + n;
          return fract(n);
        }

        void main() {
          float screenY = 1.0 - vUv.y;
          float blendWidth = clamp(uSoftness * 1.45, 0.14, 0.3);
          float front = uProgress * (1.0 + blendWidth * 2.0)
            - blendWidth
            + edgeShape(vUv.x, uProgress) * blendWidth * 0.18;
          float column = floor(vUv.x * uColumns);
          float columnOffset =
            (hash(column * 1.71) - 0.5) * blendWidth * 0.72;
          float columnFront = front + columnOffset;
          float signedDistance = screenY - columnFront;
          float distanceAbove = max(-signedDistance, 0.0);
          float coreWidth = max(0.008, blendWidth * 0.075);
          float columnFadeLength = mix(
            blendWidth * 1.2,
            blendWidth * 2.85,
            hash(column + 12.37)
          );
          float towardEdge = 1.0 - smoothstep(0.0, columnFadeLength, distanceAbove);
          float longTrail = 1.0 - smoothstep(
            0.0,
            columnFadeLength * 1.55,
            distanceAbove
          );
          float revealMask = 1.0 - smoothstep(
            -blendWidth * 0.1,
            blendWidth * 0.46,
            signedDistance
          );
          float atlasX = (vUv.x + uGlyphFrame) / uGlyphFrames;
          vec4 rain = texture2D(uRain, vec2(atlasX, vUv.y));
          float tailLength = mix(
            1.28,
            0.0,
            smoothstep(0.56, 1.0, uProgress)
          );
          float trailTop = columnFront - tailLength;
          float trailingMask = smoothstep(
            trailTop,
            trailTop + blendWidth * 0.52,
            screenY
          );
          float glyph = smoothstep(0.08, 0.82, rain.a)
            * revealMask
            * trailingMask;
          float matrixCode = glyph * (
            0.2 + longTrail * 0.34 + towardEdge * 0.78
          );
          float whiteHeat =
            glyph * towardEdge * towardEdge * towardEdge;
          float columnMist = 1.0 - smoothstep(
            0.0,
            blendWidth * 0.42,
            abs(signedDistance)
          );
          float columnTip =
            (1.0 - smoothstep(0.0015, coreWidth, abs(signedDistance)))
            * glyph;
          float edgeFog = columnMist * glyph * 0.84;
          float entrance = smoothstep(0.015, 0.075, uProgress);
          float alpha = (matrixCode + edgeFog * 0.7 + columnTip * 0.2)
            * entrance;
          vec3 rgb = mix(
            uColor * 0.78,
            vec3(0.68, 1.0, 0.75),
            clamp(whiteHeat + edgeFog * 0.72 + columnTip * 0.24, 0.0, 1.0)
          );
          gl_FragColor = vec4(rgb, clamp(alpha, 0.0, 1.0));
        }
      `,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let visible = false;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
      },
      { rootMargin: "150px" },
    );
    intersectionObserver.observe(host);

    let frame = 0;
    let renderedAt = 0;
    let renderedProgress = -1;
    let renderedGlyphFrame = -1;
    let wasActive = false;
    const startedAt = performance.now();
    const drawRain = () => {
      context.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
      context.textAlign = "center";
      context.textBaseline = "middle";

      const rowCount = Math.ceil(rainCanvas.height / rowHeight) + 2;

      for (let glyphFrame = 0; glyphFrame < GLYPH_FRAMES; glyphFrame += 1) {
        const frameOffset = glyphFrame * textureFrameWidth;

        for (let column = 0; column < columns; column += 1) {
          const x = frameOffset + (column + 0.5) * columnWidth;
          const scale = 0.88 + cellRandom(column, 0, 113) * 0.26;
          const rowPhase = cellRandom(column, 0, 271) * rowHeight;
          context.font = `700 ${glyphSize * scale}px "Arial Narrow", Arial, sans-serif`;

          for (let row = -1; row < rowCount; row += 1) {
            if (cellRandom(column, row, 419) < 0.045) continue;

            const y = (row + 0.5) * rowHeight + rowPhase;
            const changes = cellRandom(column, row, 1199) < 0.38;
            const glyphSalt = changes ? 733 + glyphFrame * 811 : 733;
            const glyphIndex = Math.floor(
              cellRandom(column, row, glyphSalt) * GLYPHS.length,
            );
            const alpha = 0.28 + cellRandom(column, row, 991) * 0.62;
            context.fillStyle = `rgba(0,255,70,${alpha})`;
            context.fillText(GLYPHS[glyphIndex], x, y);
          }
        }
      }
      texture.needsUpdate = true;
    };
    drawRain();

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (!visible) return;

      const currentProgress = Math.max(0, Math.min(1, progress.current.value));
      const active = currentProgress > 0.002 && currentProgress < 0.998;
      if (!active) {
        if (wasActive) renderer.clear();
        wasActive = false;
        return;
      }

      wasActive = true;
      if (now - renderedAt < 30) return;
      const glyphFrame = Math.floor(
        (now - startedAt) /
          (GLYPH_CHANGE_INTERVAL / Math.max(0.2, Math.min(3, changeSpeed))),
      ) % GLYPH_FRAMES;
      if (
        Math.abs(currentProgress - renderedProgress) < 0.0002 &&
        glyphFrame === renderedGlyphFrame
      ) return;
      renderedAt = now;
      renderedProgress = currentProgress;
      renderedGlyphFrame = glyphFrame;
      material.uniforms.uProgress.value = currentProgress;
      material.uniforms.uGlyphFrame.value = glyphFrame;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      texture.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [changeSpeed, color, density, progress, softness]);

  return (
    <div
      ref={hostRef}
      data-matrix-reveal
      className="pointer-events-none absolute inset-0 z-50 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full data-[webgl-fallback=true]:bg-[linear-gradient(180deg,transparent,rgba(0,255,70,.82),#001b08)] data-[webgl-fallback=true]:opacity-0"
      aria-hidden="true"
    />
  );
}
