"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const MATRIX_GLYPHS =
  "00110101001101010010110101ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/{}[]$#@+-*";
const CAMERA_SCROLL_START_LIFT = 9;
const CAMERA_SCROLL_END_LIFT = -0.55;
const AVATAR_WORLD_HEIGHT = 8.75;
const AVATAR_WORLD_POSITIONS = [
  [-20, 0, 25],
  [-14, 0, 20],
  [14, 0, 20],
  [20, 0, 25],
] as const;
const AVATAR_MODEL_SOURCES = [
  "/models/pathetic-talent-avatar.glb",
  "/models/pathetic-talent-designers.glb",
  "/models/pathetic-talent-editors.glb",
  "/models/pathetic-talent-videographers.glb",
] as const;
const MATRIX_TEXTURE_FRAME_COUNT = 4;
const MATRIX_TEXTURE_UPDATE_INTERVAL = 240;
const MATRIX_HOVER_TEXTURE_UPDATE_INTERVAL = 72;
const MATRIX_HOVER_PULSE_DURATION = 1080;
const BUILDING_BLOOM_LAYER = 1;
const BLOOM_PIXEL_RATIO = 0.24;
const BLOOM_MIN_FPS = 50;
const BLOOM_RESUME_FPS = 56;
const BLOOM_COOLDOWN = 6000;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function resolveAvatarModelSources(labels: string[], count: number) {
  const keywordSource = (
    label: string,
  ): (typeof AVATAR_MODEL_SOURCES)[number] | null => {
    const normalizedLabel = label.toLowerCase();
    if (normalizedLabel.includes("design")) return AVATAR_MODEL_SOURCES[1];
    if (normalizedLabel.includes("edit")) return AVATAR_MODEL_SOURCES[2];
    if (
      normalizedLabel.includes("video") ||
      normalizedLabel.includes("camera") ||
      normalizedLabel.includes("film")
    ) {
      return AVATAR_MODEL_SOURCES[3];
    }
    return null;
  };

  const matchedSources = Array.from({ length: count }, (_, index) =>
    keywordSource(labels[index] || ""),
  );
  const reservedSources = new Set(matchedSources.filter(Boolean));
  const usedSources = new Set<string>();

  return matchedSources.map((matchedSource) => {
    if (matchedSource && !usedSources.has(matchedSource)) {
      usedSources.add(matchedSource);
      return matchedSource;
    }

    const fallbackSource = AVATAR_MODEL_SOURCES.find(
      (source) => !reservedSources.has(source) && !usedSources.has(source),
    );
    const source = fallbackSource || AVATAR_MODEL_SOURCES[0];
    usedSources.add(source);
    return source;
  });
}

function createMatrixTextureFrames({
  color,
  seed,
  width,
  height,
  columns,
  background,
  lineOpacity = 0.08,
  gapChance = 0.1,
  minStrength = 0.18,
  maxStrength = 0.9,
  glowScale = 0.12,
  glyphWidth = 0.5,
}: {
  color: THREE.Color;
  seed: number;
  width: number;
  height: number;
  columns: number;
  background: string;
  lineOpacity?: number;
  gapChance?: number;
  minStrength?: number;
  maxStrength?: number;
  glowScale?: number;
  glyphWidth?: number;
}) {
  const random = seededRandom(seed);
  const columnWidth = width / columns;
  const glyphSize = columnWidth * 0.86;
  const rowHeight = glyphSize * 1.18;
  const colorStyle = `#${color.getHexString()}`;
  const columnData: Array<{
    x: number;
    opacity: number;
  }> = [];
  const glyphData: Array<{
    x: number;
    y: number;
    opacity: number;
    glyphIndex: number;
    changes: boolean;
    changeRate: number;
  }> = [];

  for (let column = 0; column < columns; column += 1) {
    const x = (column + 0.5) * columnWidth;
    const phase = random() * rowHeight;
    const streamStrength = minStrength + random() * (maxStrength - minStrength);
    columnData.push({
      x,
      opacity: lineOpacity * (0.55 + random() * 0.9),
    });

    for (
      let y = -rowHeight + phase, row = -1;
      y < height + rowHeight;
      y += rowHeight, row += 1
    ) {
      if (random() < gapChance) continue;
      glyphData.push({
        x,
        y,
        opacity: streamStrength * (0.28 + random() * 0.72),
        glyphIndex: Math.floor(random() * MATRIX_GLYPHS.length),
        changes: random() < 0.34,
        changeRate: 1 + Math.floor(random() * 3) + Math.abs(row % 2),
      });
    }
  }

  const renderFrame = (matrixFrame: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.globalAlpha = 1;
    context.shadowBlur = 0;
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.fillStyle = colorStyle;

    columnData.forEach((column) => {
      context.globalAlpha = column.opacity;
      context.fillRect(
        column.x - Math.max(0.35, columnWidth * 0.025),
        0,
        Math.max(0.7, columnWidth * 0.05),
        height,
      );
    });

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `400 ${glyphSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    context.shadowColor = colorStyle;
    context.shadowBlur = Math.max(0.5, glyphSize * glowScale);

    glyphData.forEach((glyph) => {
      const glyphIndex = glyph.changes
        ? (glyph.glyphIndex + matrixFrame * glyph.changeRate) %
          MATRIX_GLYPHS.length
        : glyph.glyphIndex;
      context.globalAlpha = glyph.opacity;
      context.fillText(
        MATRIX_GLYPHS[glyphIndex],
        glyph.x,
        glyph.y,
        columnWidth * glyphWidth,
      );
    });

    context.globalAlpha = 1;
    context.shadowBlur = 0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  };

  const textures = Array.from(
    { length: MATRIX_TEXTURE_FRAME_COUNT },
    (_, frameIndex) => renderFrame(frameIndex),
  ).filter((texture): texture is THREE.CanvasTexture => texture !== null);

  return textures.length === MATRIX_TEXTURE_FRAME_COUNT ? { textures } : null;
}

export default function TalentMatrixScene({
  color = "#00ff46",
  cameraScrollProgress,
  highlightAllBuildings,
  avatarCount = 0,
  avatarLabels = [],
  quality = "desktop",
}: {
  color?: string;
  density?: number;
  cameraScrollProgress?: MutableRefObject<{ value: number }>;
  highlightAllBuildings?: MutableRefObject<{ value: boolean }>;
  avatarCount?: number;
  avatarLabels?: string[];
  quality?: "desktop" | "tablet" | "mobile";
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const avatarLabelsKey = avatarLabels.slice(0, 4).join("\u0000");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      });
    } catch {
      host.dataset.webglFallback = "true";
      return;
    }

    const renderPixelRatio =
      quality === "desktop" ? 0.8 : quality === "tablet" ? 0.68 : 0.56;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, renderPixelRatio));
    renderer.setClearColor(0x000200, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    const avatarLabelLayer = document.createElement("div");
    avatarLabelLayer.dataset.matrixAvatarLabels = "true";
    Object.assign(avatarLabelLayer.style, {
      position: "absolute",
      inset: "0",
      zIndex: "4",
      overflow: "hidden",
      pointerEvents: "none",
    });
    host.appendChild(avatarLabelLayer);

    const scene = new THREE.Scene();
    const sceneColor = new THREE.Color(color);
    scene.background = new THREE.Color("#000200");
    scene.fog = new THREE.FogExp2(new THREE.Color("#000500"), 0.0045);
    scene.add(new THREE.HemisphereLight(0xf3fff5, 0x003815, 2.4));
    const avatarKeyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    avatarKeyLight.position.set(-3, 6, 5);
    scene.add(avatarKeyLight);

    const backgroundSurface = createMatrixTextureFrames({
      color: sceneColor,
      seed: 4102,
      width: 512,
      height: 512,
      columns: 32,
      background: "#000300",
      lineOpacity: 0.025,
      gapChance: 0.22,
      minStrength: 0.04,
      maxStrength: 0.76,
      glowScale: 0.05,
      glyphWidth: 0.26,
    });
    const floorSurface = createMatrixTextureFrames({
      color: sceneColor,
      seed: 9137,
      width: 512,
      height: 512,
      columns: 40,
      background: "#000500",
      lineOpacity: 0.12,
      gapChance: 0.06,
      minStrength: 0.3,
      maxStrength: 0.94,
      glowScale: 0.08,
      glyphWidth: 0.32,
    });
    const buildingSurface = createMatrixTextureFrames({
      color: sceneColor,
      seed: 2751,
      width: 256,
      height: 384,
      columns: 10,
      background: "#001006",
      lineOpacity: 0.08,
      gapChance: 0.08,
      minStrength: 0.28,
      maxStrength: 0.94,
      glowScale: 0.08,
      glyphWidth: 0.36,
    });

    if (!backgroundSurface || !floorSurface || !buildingSurface) {
      renderer.dispose();
      renderer.domElement.remove();
      host.dataset.webglFallback = "true";
      return;
    }

    const backgroundTexture = backgroundSurface.textures[0];
    const floorTexture = floorSurface.textures[0];
    const buildingTexture = buildingSurface.textures[0];
    const matrixTextures = [
      ...backgroundSurface.textures,
      ...floorSurface.textures,
      ...buildingSurface.textures,
    ];

    const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    backgroundSurface.textures.forEach((texture) => {
      texture.anisotropy = anisotropy;
      texture.repeat.set(1.05, 1);
      renderer.initTexture(texture);
    });
    floorSurface.textures.forEach((texture) => {
      texture.anisotropy = anisotropy;
      texture.repeat.set(2.8, 2.15);
      renderer.initTexture(texture);
    });
    buildingSurface.textures.forEach((texture) => {
      texture.anisotropy = anisotropy;
      texture.repeat.set(1, 1.65);
      renderer.initTexture(texture);
    });

    const backgroundMaterial = new THREE.MeshBasicMaterial({
      map: backgroundTexture,
      color: new THREE.Color("#56d872"),
      fog: false,
      side: THREE.DoubleSide,
    });
    const floorMaterial = new THREE.MeshBasicMaterial({
      map: floorTexture,
      color: new THREE.Color("#82ff92"),
      side: THREE.DoubleSide,
      fog: false,
    });
    const buildingMaterial = new THREE.MeshBasicMaterial({
      map: buildingTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const towerMaterial = new THREE.MeshBasicMaterial({
      map: buildingTexture,
      color: new THREE.Color("#b7ffc5"),
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
    });
    const buildingHoverFillMaterial = new THREE.MeshBasicMaterial({
      map: buildingTexture,
      color: new THREE.Color("#4dff73"),
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      toneMapped: false,
    });
    const buildingHoverShellMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#00ff46"),
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const buildingHoverEdgeMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color("#e3ffe8"),
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    type BuildingHoverTarget = {
      id: string;
      meshes: THREE.Mesh[];
    };
    type BuildingHoverVisual = {
      fill: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
      shell: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
      edges: THREE.LineSegments<
        THREE.BufferGeometry,
        THREE.LineBasicMaterial
      >;
      worldCenter: THREE.Vector3;
    };
    const interactiveBuildings: THREE.Mesh[] = [];
    const buildingHoverTargets = new Map<THREE.Mesh, BuildingHoverTarget>();
    const buildingHoverVisuals = new Map<THREE.Mesh, BuildingHoverVisual>();
    let allBuildingsHoverTarget: BuildingHoverTarget | null = null;
    let activeBuildingHoverTarget: BuildingHoverTarget | null = null;
    let activeBuildingHoverStartedAt = 0;
    let hoverMatrixFrame = 0;
    let lastHoverTextureUpdate = 0;
    let submitHoverWasActive = false;
    const bloomSelectionLayer = new THREE.Layers();
    bloomSelectionLayer.set(BUILDING_BLOOM_LAYER);
    const bloomDepthMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      colorWrite: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    const bloomMaterialCache = new Map<
      THREE.Mesh,
      THREE.Material | THREE.Material[]
    >();
    const bloomVisibilityCache = new Map<THREE.Object3D, boolean>();

    const prepareBloomOcclusion = () => {
      bloomMaterialCache.clear();
      bloomVisibilityCache.clear();
      scene.traverse((object) => {
        const isBloomSource = bloomSelectionLayer.test(object.layers);
        if (isBloomSource) return;

        if (object.userData.matrixHoverShell === true) {
          bloomVisibilityCache.set(object, object.visible);
          object.visible = false;
        } else if (object instanceof THREE.Mesh) {
          bloomMaterialCache.set(object, object.material);
          object.material = bloomDepthMaterial;
        } else if (
          object instanceof THREE.LineSegments ||
          object instanceof THREE.Points ||
          object instanceof THREE.Sprite
        ) {
          bloomVisibilityCache.set(object, object.visible);
          object.visible = false;
        }
      });
    };

    const restoreBloomOcclusion = () => {
      bloomMaterialCache.forEach((material, object) => {
        object.material = material;
      });
      bloomVisibilityCache.forEach((wasVisible, object) => {
        object.visible = wasVisible;
      });
      bloomMaterialCache.clear();
      bloomVisibilityCache.clear();
    };

    const getBuildingHoverVisual = (building: THREE.Mesh) => {
      const cachedVisual = buildingHoverVisuals.get(building);
      if (cachedVisual) return cachedVisual;

      const outline = building.children.find(
        (child): child is THREE.LineSegments =>
          child instanceof THREE.LineSegments &&
          child.name.endsWith("_Matrix_Outline"),
      );
      if (!outline) return null;

      const fillMaterial = buildingHoverFillMaterial.clone();
      const shellMaterial = buildingHoverShellMaterial.clone();
      const edgeMaterial = buildingHoverEdgeMaterial.clone();
      const fill = new THREE.Mesh(building.geometry, fillMaterial);
      fill.name = `${building.name}_Matrix_Hover_Fill`;
      fill.renderOrder = 2;
      fill.raycast = () => undefined;
      fill.layers.enable(BUILDING_BLOOM_LAYER);
      fill.visible = false;

      const shell = new THREE.Mesh(building.geometry, shellMaterial);
      shell.name = `${building.name}_Matrix_Hover_Shell`;
      shell.renderOrder = 2;
      shell.raycast = () => undefined;
      shell.scale.setScalar(1.016);
      shell.visible = false;
      shell.userData.matrixHoverShell = true;

      const edges = new THREE.LineSegments(
        outline.geometry,
        edgeMaterial,
      );
      edges.name = `${building.name}_Matrix_Hover_Edges`;
      edges.renderOrder = 3;
      edges.raycast = () => undefined;
      edges.layers.enable(BUILDING_BLOOM_LAYER);
      edges.scale.setScalar(1.006);
      edges.visible = false;

      building.add(fill, shell, edges);
      building.updateWorldMatrix(true, false);
      const worldCenter = new THREE.Box3()
        .setFromObject(building)
        .getCenter(new THREE.Vector3());
      const visual = { fill, shell, edges, worldCenter };
      buildingHoverVisuals.set(building, visual);
      return visual;
    };

    const setBuildingHoverVisual = (
      building: THREE.Mesh,
      visible: boolean,
    ) => {
      const visual = visible
        ? getBuildingHoverVisual(building)
        : buildingHoverVisuals.get(building);
      if (!visual) return;
      visual.fill.visible = visible;
      visual.shell.visible = visible;
      visual.edges.visible = visible;
      if (visible) {
        visual.fill.material.opacity = 0;
        visual.shell.material.opacity = 0;
        visual.edges.material.opacity = 0;
      }
    };

    const clearBuildingHover = () => {
      activeBuildingHoverTarget?.meshes.forEach((building) => {
        setBuildingHoverVisual(building, false);
      });
      activeBuildingHoverTarget = null;
      activeBuildingHoverStartedAt = 0;
      lastHoverTextureUpdate = 0;
      bloomOverlayMaterial.opacity = 0.55;
      bloomPass.strength = 0.8;
      host.style.cursor = "";
      delete host.dataset.hoveredBuilding;
      delete host.dataset.hoveredBuildingMeshes;
      delete host.dataset.hoverPulse;
      delete host.dataset.hoverMatrixFrame;
    };

    const setBuildingHover = (target: BuildingHoverTarget | null) => {
      if (target === activeBuildingHoverTarget) return;
      clearBuildingHover();
      if (!target?.meshes.length) return;

      target.meshes.forEach((building) => {
        setBuildingHoverVisual(building, true);
      });
      activeBuildingHoverTarget = target;
      activeBuildingHoverStartedAt = performance.now();
      hoverMatrixFrame = 0;
      lastHoverTextureUpdate = 0;
      host.style.cursor = target.id === "all-buildings" ? "" : "pointer";
      host.dataset.hoveredBuilding = target.id;
      host.dataset.hoveredBuildingMeshes = String(target.meshes.length);
    };

    const updateBuildingHoverPulse = (now: number) => {
      const target = activeBuildingHoverTarget;
      if (!target?.meshes.length) return;

      const attackProgress = THREE.MathUtils.clamp(
        (now - activeBuildingHoverStartedAt) / 180,
        0,
        1,
      );
      const attack = attackProgress * attackProgress * (3 - 2 * attackProgress);
      const timePhase =
        (now / MATRIX_HOVER_PULSE_DURATION) * Math.PI * 2;
      let pulseTotal = 0;

      target.meshes.forEach((building) => {
        const visual = buildingHoverVisuals.get(building);
        if (!visual) return;

        const spatialPhase =
          target.id === "all-buildings"
            ? visual.worldCenter.x * 0.11 + visual.worldCenter.z * 0.035
            : target.id === "Central_Tiered_Tower"
              ? visual.worldCenter.y * 0.22
              : 0;
        const sinePulse =
          0.5 + 0.5 * Math.sin(timePhase - spatialPhase - Math.PI / 2);
        const crest = Math.pow(sinePulse, 1.65);
        const pulse = 0.12 + crest * 0.88;
        pulseTotal += pulse;

        visual.fill.material.opacity = attack * (0.06 + pulse * 0.7);
        visual.shell.material.opacity = attack * (0.03 + pulse * 0.3);
        visual.edges.material.opacity = attack * (0.18 + pulse * 0.82);
        visual.shell.scale.setScalar(1.012 + pulse * 0.012);
        visual.edges.scale.setScalar(1.004 + pulse * 0.004);
      });

      const averagePulse = pulseTotal / target.meshes.length;
      bloomOverlayMaterial.opacity = 0.24 + averagePulse * 0.42;
      bloomPass.strength = 0.58 + averagePulse * 0.58;
      host.dataset.hoverPulse = averagePulse.toFixed(3);

      const hoverTextureInterval =
        quality === "desktop"
          ? MATRIX_HOVER_TEXTURE_UPDATE_INTERVAL
          : quality === "tablet"
            ? 92
            : 112;
      if (now - lastHoverTextureUpdate >= hoverTextureInterval) {
        hoverMatrixFrame =
          (hoverMatrixFrame + 1) % MATRIX_TEXTURE_FRAME_COUNT;
        const hoverTexture = buildingSurface.textures[hoverMatrixFrame];
        target.meshes.forEach((building) => {
          const visual = buildingHoverVisuals.get(building);
          if (visual) visual.fill.material.map = hoverTexture;
        });
        host.dataset.hoverMatrixFrame = String(hoverMatrixFrame);
        lastHoverTextureUpdate =
          now - ((now - lastHoverTextureUpdate) % hoverTextureInterval);
      }
    };

    const fallbackCamera = new THREE.PerspectiveCamera(48, 1, 0.1, 190);
    fallbackCamera.position.set(0, 5.3, 24);
    fallbackCamera.lookAt(new THREE.Vector3(0, 10.2, -42));
    scene.add(fallbackCamera);
    let activeCamera = fallbackCamera;
    const bloomRenderPass = new RenderPass(scene, activeCamera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.8,
      0.28,
      0.1,
    );
    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.setPixelRatio(BLOOM_PIXEL_RATIO);
    bloomComposer.addPass(bloomRenderPass);
    bloomComposer.addPass(bloomPass);

    const bloomOverlayScene = new THREE.Scene();
    const bloomOverlayCamera = new THREE.OrthographicCamera(
      -1,
      1,
      1,
      -1,
      0,
      1,
    );
    const bloomOverlayGeometry = new THREE.PlaneGeometry(2, 2);
    const bloomOverlayMaterial = new THREE.MeshBasicMaterial({
      map: bloomComposer.renderTarget2.texture,
      color: new THREE.Color("#caffd3"),
      transparent: true,
      opacity: 0.55,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    bloomOverlayScene.add(
      new THREE.Mesh(bloomOverlayGeometry, bloomOverlayMaterial),
    );
    const cameraBasePosition = fallbackCamera.position.clone();
    const cameraBaseQuaternion = fallbackCamera.quaternion.clone();
    let cameraBaseFov = fallbackCamera.fov;
    const avatarGroup = new THREE.Group();
    avatarGroup.name = "Talent_Avatars_World";
    scene.add(avatarGroup);
    const avatarLabelElements: Array<{
      element: HTMLSpanElement;
      worldPosition: THREE.Vector3;
      projectedPosition: THREE.Vector3;
      screenOffsetY: number;
    }> = [];
    const avatarTextures = new Set<THREE.Texture>();
    const resolvedAvatarLabels = avatarLabelsKey.split("\u0000");
    host.dataset.avatarLayout = "world";

    let disposed = false;
    let warmupIdleHandle: number | null = null;
    let warmupTimerHandle: number | null = null;
    let warmupVersion = 0;
    const idleScheduler = window as unknown as {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const scheduleShaderWarmup = () => {
      if (disposed) return;

      warmupVersion += 1;
      const version = warmupVersion;
      if (
        warmupIdleHandle !== null &&
        typeof idleScheduler.cancelIdleCallback === "function"
      ) {
        idleScheduler.cancelIdleCallback(warmupIdleHandle);
        warmupIdleHandle = null;
      }
      if (warmupTimerHandle !== null) {
        window.clearTimeout(warmupTimerHandle);
        warmupTimerHandle = null;
      }

      const warm = () => {
        warmupIdleHandle = null;
        warmupTimerHandle = null;
        if (disposed || version !== warmupVersion) return;

        void renderer
          .compileAsync(scene, activeCamera)
          .then(() => {
            if (!disposed && version === warmupVersion) {
              host.dataset.shaderWarmup = "ready";
            }
          })
          .catch(() => {
            if (!disposed) host.dataset.shaderWarmup = "fallback";
          });
      };

      if (typeof idleScheduler.requestIdleCallback === "function") {
        warmupIdleHandle = idleScheduler.requestIdleCallback(warm, {
          timeout: 1200,
        });
      } else {
        warmupTimerHandle = window.setTimeout(warm, 120);
      }
    };

    const modelLoader = new GLTFLoader();
    modelLoader.load(
      "/models/pathetic-city.glb",
      ({ scene: cityModel }) => {
        if (disposed) {
          cityModel.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;
            object.geometry.dispose();
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            materials.forEach((material) => material.dispose());
          });
          return;
        }

        cityModel.name = "Pathetic_City_Model";
        cityModel.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;

          const originalMaterials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          const isBackdrop = object.name.startsWith("Matrix_Backdrop_");
          const isFloor = object.name.startsWith("Matrix_Floor_");
          const isTower = object.name.startsWith("Tower_");

          if (isBackdrop) {
            object.material = backgroundMaterial;
            object.renderOrder = -2;
            // Extend only the vertical backdrop on touch layouts. Scaling the
            // whole city changed the camera composition and avatar positions,
            // while the authored desktop backdrop already fills its frame.
            object.scale.y *=
              quality === "mobile" ? 1.28 : quality === "tablet" ? 1.15 : 1;
          } else if (isFloor) {
            object.material = floorMaterial;
            object.renderOrder = -1;
          } else {
            object.material = isTower ? towerMaterial : buildingMaterial;
            object.userData.matrixInteractive = true;
            interactiveBuildings.push(object);
            const outline = new THREE.LineSegments(
              new THREE.EdgesGeometry(object.geometry, 28),
              new THREE.LineBasicMaterial({
                color: sceneColor,
                transparent: true,
                opacity: isTower ? 0.98 : 0.78,
              }),
            );
            outline.name = `${object.name}_Matrix_Outline`;
            outline.renderOrder = 1;
            object.add(outline);
          }

          originalMaterials.forEach((material) => material.dispose());
        });

        const centralTowerMeshes = interactiveBuildings.filter((building) =>
          building.name.startsWith("Tower_"),
        );
        const centralTowerTarget: BuildingHoverTarget = {
          id: "Central_Tiered_Tower",
          meshes: centralTowerMeshes,
        };
        interactiveBuildings.forEach((building) => {
          buildingHoverTargets.set(
            building,
            building.name.startsWith("Tower_")
              ? centralTowerTarget
              : { id: building.name || "building", meshes: [building] },
          );
        });
        allBuildingsHoverTarget = {
          id: "all-buildings",
          meshes: interactiveBuildings,
        };
        host.dataset.buildingHoverTargets = String(
          interactiveBuildings.length - centralTowerMeshes.length + 1,
        );

        scene.add(cityModel);
        const modelCamera = cityModel.getObjectByName("Website_Camera_1440x900");
        if (modelCamera instanceof THREE.PerspectiveCamera) {
          activeCamera = modelCamera;
          bloomRenderPass.camera = activeCamera;
          cameraBasePosition.copy(modelCamera.position);
          cameraBaseQuaternion.copy(modelCamera.quaternion);
          cameraBaseFov = modelCamera.fov;
          host.dataset.cameraSource = "gltf";
          resize();
        } else {
          host.dataset.cameraSource = "fallback";
        }
        scheduleShaderWarmup();
      },
      undefined,
      () => {
        if (!disposed) host.dataset.modelError = "true";
      },
    );

    if (avatarCount > 0) {
      const avatarLoader = new GLTFLoader();
      const requestedAvatarCount = Math.min(avatarCount, 4);
      const avatarModelSources = resolveAvatarModelSources(
        resolvedAvatarLabels,
        requestedAvatarCount,
      );
      let loadedAvatarCount = 0;
      let failedAvatarCount = 0;

      host.dataset.avatarSources = avatarModelSources
        .map((source) => source.split("/").at(-1)?.replace(".glb", "") || "")
        .join(",");

      const disposeDetachedAvatarModel = (model: THREE.Object3D) => {
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            Object.values(material).forEach((value) => {
              if (value instanceof THREE.Texture) value.dispose();
            });
            material.dispose();
          });
        });
      };

      avatarModelSources.forEach((source, index) => {
        avatarLoader.load(
          source,
          ({ scene: avatarModel }) => {
            if (disposed) {
              disposeDetachedAvatarModel(avatarModel);
              return;
            }

            avatarModel.name = `Pathetic_Talent_Avatar_Source_${index + 1}`;
            avatarModel.traverse((object) => {
              if (!(object instanceof THREE.Mesh)) return;
              object.frustumCulled = false;
              const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];
              materials.forEach((material) => {
                Object.values(material).forEach((value) => {
                  if (value instanceof THREE.Texture) {
                    avatarTextures.add(value);
                  }
                });
                if (material instanceof THREE.MeshStandardMaterial) {
                  material.roughness = 0.78;
                  material.metalness = 0;
                  material.emissive.set("#003d16");
                  material.emissiveIntensity = 0.22;
                }
              });
              object.renderOrder = 5;
            });

            const bounds = new THREE.Box3().setFromObject(avatarModel);
            const center = bounds.getCenter(new THREE.Vector3());
            const size = bounds.getSize(new THREE.Vector3());
            const normalizedAvatar = new THREE.Group();
            avatarModel.position.set(-center.x, -bounds.min.y, -center.z);
            normalizedAvatar.add(avatarModel);
            normalizedAvatar.scale.setScalar(1 / Math.max(size.y, 0.001));

            const avatar = new THREE.Group();
            avatar.name = `Talent_Avatar_${index + 1}`;
            avatar.add(normalizedAvatar);
            const worldPosition = AVATAR_WORLD_POSITIONS[index];
            avatar.position.set(
              worldPosition[0],
              worldPosition[1],
              worldPosition[2],
            );
            avatar.scale.setScalar(AVATAR_WORLD_HEIGHT);

            const groundGlow = new THREE.Mesh(
              new THREE.CircleGeometry(0.38, 28),
              new THREE.MeshBasicMaterial({
                color: sceneColor,
                transparent: true,
                opacity: 0.16,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
              }),
            );
            groundGlow.name = `Talent_Avatar_Ground_Glow_${index + 1}`;
            groundGlow.rotation.x = -Math.PI / 2;
            groundGlow.position.y = 0.004;
            groundGlow.renderOrder = 4;
            avatar.add(groundGlow);
            avatarGroup.add(avatar);

            const label = resolvedAvatarLabels[index]?.trim();
            if (label) {
              const labelElement = document.createElement("span");
              labelElement.dataset.matrixAvatarLabel = String(index + 1);
              labelElement.textContent = label.toUpperCase();
              Object.assign(labelElement.style, {
                position: "absolute",
                left: "0",
                top: "0",
                color: "#f4fff6",
                fontFamily: "var(--font-sans), Arial, sans-serif",
                fontSize:
                  quality === "mobile"
                    ? "clamp(19px, 5vw, 25px)"
                    : quality === "tablet"
                      ? "clamp(22px, 3vw, 30px)"
                      : "clamp(16px, 1.25vw, 22px)",
                fontWeight: "900",
                fontStyle: "normal",
                lineHeight: "1",
                letterSpacing: "-0.045em",
                whiteSpace: "nowrap",
                WebkitTextStroke:
                  quality === "mobile"
                    ? "2.5px #000"
                    : quality === "tablet"
                      ? "3px #000"
                      : "2px #000",
                paintOrder: "stroke fill",
                textShadow: "0 2px 0 #000, 0 0 8px rgba(0,0,0,.95)",
                transform: "translate3d(-9999px,-9999px,0)",
                transformOrigin: "50% 50%",
                willChange: "transform, opacity",
              });
              avatarLabelLayer.appendChild(labelElement);
              avatarLabelElements.push({
                element: labelElement,
                worldPosition: new THREE.Vector3(
                  worldPosition[0],
                  AVATAR_WORLD_HEIGHT + 1.7,
                  worldPosition[2],
                ),
                projectedPosition: new THREE.Vector3(),
                screenOffsetY:
                  quality === "tablet" && (index === 0 || index === 3)
                    ? -42
                    : 0,
              });
            }

            loadedAvatarCount += 1;
            host.dataset.avatarLoaded = `${loadedAvatarCount}/${requestedAvatarCount}`;
            host.dataset.avatarSource = "gltf-multi";
            scheduleShaderWarmup();
          },
          undefined,
          () => {
            if (disposed) return;
            failedAvatarCount += 1;
            host.dataset.avatarError = `${failedAvatarCount}/${requestedAvatarCount}`;
          },
        );
      });
    }

    const pointer = new THREE.Vector2();
    const buildingRaycaster = new THREE.Raycaster();
    let pointerInside = false;
    let buildingPickPending = false;

    const updateBuildingHover = () => {
      if (highlightAllBuildings?.current.value) return;
      if (!pointerInside || !interactiveBuildings.length) {
        setBuildingHover(null);
        return;
      }

      scene.updateMatrixWorld(true);
      activeCamera.updateMatrixWorld(true);
      buildingRaycaster.setFromCamera(pointer, activeCamera);
      const hit = buildingRaycaster.intersectObjects(
        interactiveBuildings,
        false,
      )[0];
      setBuildingHover(
        hit?.object instanceof THREE.Mesh
          ? buildingHoverTargets.get(hit.object) || null
          : null,
      );
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
      pointer.y =
        (0.5 -
          (event.clientY - rect.top) / Math.max(rect.height, 1)) *
        2;
      pointerInside = true;
      buildingPickPending = true;
    };
    const onPointerLeave = () => {
      pointerInside = false;
      setBuildingHover(null);
    };
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (finePointer) {
      host.addEventListener("pointermove", onPointerMove, { passive: true });
      host.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      bloomComposer.setSize(width, height);
      const aspect = width / height;
      activeCamera.aspect = aspect;
      const referenceAspect = 1440 / 900;
      // Keep the portrait world intentionally closer. The previous fit widened
      // the FOV until the city/background felt miniature on touch layouts.
      const maximumPortraitFit =
        quality === "desktop" ? 1 : quality === "tablet" ? 1.22 : 1.34;
      const portraitFit = THREE.MathUtils.clamp(
        referenceAspect / Math.max(aspect, 0.01),
        1,
        maximumPortraitFit,
      );
      activeCamera.fov = THREE.MathUtils.radToDeg(
        2 *
          Math.atan(
            Math.tan(THREE.MathUtils.degToRad(cameraBaseFov) / 2) *
              portraitFit,
          ),
      );
      activeCamera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let nearby = false;
    let onscreen = false;
    const nearbyObserver = new IntersectionObserver(
      ([entry]) => {
        nearby = entry?.isIntersecting ?? false;
      },
      { rootMargin: `${Math.min(window.innerHeight * 0.8, 900)}px 0px` },
    );
    const viewportObserver = new IntersectionObserver(([entry]) => {
      onscreen = entry?.isIntersecting ?? false;
      if (!onscreen) {
        pointerInside = false;
        setBuildingHover(null);
      }
    });
    nearbyObserver.observe(host);
    viewportObserver.observe(host);

    let frame = 0;
    let matrixFrame = 0;
    let lastMatrixSurfaceUpdate = 0;
    let previousFrameTime = 0;
    let smoothedFps = 60;
    let bloomLowFpsStartedAt = 0;
    let bloomCooldownUntil = 0;
    let bloomWasRendered = false;
    let bloomState = "";
    let lastWarmRender = 0;

    const setBloomState = (state: string) => {
      if (state === bloomState) return;
      bloomState = state;
      host.dataset.buildingBloom = state;
    };

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (!nearby) {
        previousFrameTime = 0;
        return;
      }

      // Keep the context and compiled programs warm before the canvas re-enters
      // view, without paying for a full-rate offscreen scene.
      if (!onscreen && now - lastWarmRender < 120) return;
      lastWarmRender = now;

      if (previousFrameTime > 0) {
        const frameDuration = Math.max(1, Math.min(100, now - previousFrameTime));
        const instantFps = 1000 / frameDuration;
        smoothedFps = THREE.MathUtils.lerp(smoothedFps, instantFps, 0.045);
      }
      previousFrameTime = now;

      const matrixTextureInterval =
        quality === "desktop"
          ? MATRIX_TEXTURE_UPDATE_INTERVAL
          : quality === "tablet"
            ? 320
            : 410;
      if (now - lastMatrixSurfaceUpdate >= matrixTextureInterval) {
        matrixFrame = (matrixFrame + 1) % MATRIX_TEXTURE_FRAME_COUNT;
        backgroundMaterial.map = backgroundSurface.textures[matrixFrame];
        floorMaterial.map = floorSurface.textures[matrixFrame];
        buildingMaterial.map = buildingSurface.textures[matrixFrame];
        towerMaterial.map = buildingSurface.textures[matrixFrame];
        buildingHoverFillMaterial.map = buildingSurface.textures[matrixFrame];
        host.dataset.matrixFrame = `${matrixFrame}`;
        host.dataset.matrixSurface = "precomputed";
        lastMatrixSurfaceUpdate =
          now - ((now - lastMatrixSurfaceUpdate) % matrixTextureInterval);
      }

      activeCamera.position.x +=
        (cameraBasePosition.x + pointer.x * 0.42 - activeCamera.position.x) * 0.035;
      const cameraProgress = Math.max(
        0,
        Math.min(1, cameraScrollProgress?.current.value ?? 0),
      );
      const cameraScrollLift = cameraScrollProgress
        ? THREE.MathUtils.lerp(
            CAMERA_SCROLL_START_LIFT,
            CAMERA_SCROLL_END_LIFT,
            cameraProgress,
          )
        : 0;
      activeCamera.position.y +=
        (cameraBasePosition.y +
          cameraScrollLift -
          pointer.y * 0.16 -
          activeCamera.position.y) *
        0.08;
      activeCamera.position.z +=
        (cameraBasePosition.z - activeCamera.position.z) * 0.035;
      activeCamera.quaternion.slerp(cameraBaseQuaternion, 0.08);
      activeCamera.updateMatrixWorld(true);
      avatarLabelElements.forEach(
        ({ element, worldPosition, projectedPosition, screenOffsetY }) => {
          projectedPosition.copy(worldPosition).project(activeCamera);
          const visible =
            projectedPosition.z > -1 &&
            projectedPosition.z < 1 &&
            projectedPosition.x > -1.18 &&
            projectedPosition.x < 1.18 &&
            projectedPosition.y > -1.18 &&
            projectedPosition.y < 1.18;
          const projectedX =
            (projectedPosition.x * 0.5 + 0.5) * host.clientWidth;
          const y =
            (-projectedPosition.y * 0.5 + 0.5) * host.clientHeight +
            screenOffsetY;
          const labelHalfWidth = element.offsetWidth / 2;
          const edgePadding = 8;
          const x = THREE.MathUtils.clamp(
            projectedX,
            labelHalfWidth + edgePadding,
            Math.max(
              labelHalfWidth + edgePadding,
              host.clientWidth - labelHalfWidth - edgePadding,
            ),
          );
          element.style.opacity = visible ? "1" : "0";
          element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        },
      );
      const submitHoverIsActive = !!highlightAllBuildings?.current.value;
      if (submitHoverIsActive) {
        if (
          allBuildingsHoverTarget &&
          activeBuildingHoverTarget !== allBuildingsHoverTarget
        ) {
          setBuildingHover(allBuildingsHoverTarget);
        }
      } else if (submitHoverWasActive) {
        setBuildingHover(null);
        buildingPickPending = pointerInside;
      }
      submitHoverWasActive = submitHoverIsActive;
      if (pointerInside && buildingPickPending) {
        updateBuildingHover();
        buildingPickPending = false;
      }

      const hasHoveredBuilding = activeBuildingHoverTarget !== null;
      if (hasHoveredBuilding) updateBuildingHoverPulse(now);
      let renderBloom =
        quality === "desktop" &&
        hasHoveredBuilding &&
        now >= bloomCooldownUntil &&
        (bloomWasRendered || smoothedFps >= BLOOM_RESUME_FPS);

      if (renderBloom && smoothedFps < BLOOM_MIN_FPS) {
        bloomLowFpsStartedAt ||= now;
        if (now - bloomLowFpsStartedAt > 550) {
          bloomCooldownUntil = now + BLOOM_COOLDOWN;
          bloomLowFpsStartedAt = 0;
          renderBloom = false;
        }
      } else {
        bloomLowFpsStartedAt = 0;
      }

      if (renderBloom) {
        const cameraLayerMask = activeCamera.layers.mask;
        activeCamera.layers.set(0);
        prepareBloomOcclusion();
        try {
          bloomComposer.render();
        } finally {
          restoreBloomOcclusion();
          activeCamera.layers.mask = cameraLayerMask;
        }
      }

      renderer.setRenderTarget(null);
      renderer.autoClear = true;
      renderer.render(scene, activeCamera);
      if (renderBloom) {
        renderer.autoClear = false;
        renderer.render(bloomOverlayScene, bloomOverlayCamera);
        renderer.autoClear = true;
      }

      bloomWasRendered = renderBloom;
      setBloomState(
        !hasHoveredBuilding
          ? "idle"
          : renderBloom
            ? "on"
            : now < bloomCooldownUntil
              ? "cooldown"
              : "off-performance",
      );
    };
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      nearbyObserver.disconnect();
      viewportObserver.disconnect();
      if (
        warmupIdleHandle !== null &&
        typeof idleScheduler.cancelIdleCallback === "function"
      ) {
        idleScheduler.cancelIdleCallback(warmupIdleHandle);
      }
      if (warmupTimerHandle !== null) {
        window.clearTimeout(warmupTimerHandle);
      }
      if (finePointer) {
        host.removeEventListener("pointermove", onPointerMove);
        host.removeEventListener("pointerleave", onPointerLeave);
      }
      clearBuildingHover();
      buildingHoverVisuals.forEach(({ fill, shell, edges }) => {
        fill.removeFromParent();
        shell.removeFromParent();
        edges.removeFromParent();
        fill.material.dispose();
        shell.material.dispose();
        edges.material.dispose();
      });
      buildingHoverVisuals.clear();
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.LineSegments ||
          object instanceof THREE.Points ||
          object instanceof THREE.Sprite
        ) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material?.dispose());
        }
      });
      matrixTextures.forEach((texture) => texture.dispose());
      avatarTextures.forEach((texture) => texture.dispose());
      avatarLabelLayer.remove();
      buildingHoverFillMaterial.dispose();
      buildingHoverShellMaterial.dispose();
      buildingHoverEdgeMaterial.dispose();
      bloomDepthMaterial.dispose();
      bloomOverlayGeometry.dispose();
      bloomOverlayMaterial.dispose();
      bloomPass.dispose();
      bloomComposer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [
    avatarCount,
    avatarLabelsKey,
    cameraScrollProgress,
    color,
    highlightAllBuildings,
    quality,
  ]);

  return (
    <div
      ref={hostRef}
      data-matrix-scene
      data-matrix-quality={quality}
      className="absolute inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full data-[webgl-fallback=true]:bg-[repeating-linear-gradient(90deg,transparent_0_4vw,rgba(0,255,70,.13)_4vw_calc(4vw+1px)),repeating-linear-gradient(0deg,transparent_0_4vw,rgba(0,255,70,.12)_4vw_calc(4vw+1px))]"
      aria-hidden="true"
    />
  );
}
