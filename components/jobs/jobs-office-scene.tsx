'use client';

import { useEffect, useRef, useState } from 'react';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import styles from './jobs-office-scene.module.css';
import { createOfficeFurniture } from './jobs-office-furniture';
import { createTabletopCompoundBody } from './jobs-office-physics';
import { createJobsTitleMesh } from './jobs-title';

export type JobsSceneJob = {
  key: string;
  title: string;
  starColor?: JobStarColorName | null;
  team?: string | null;
  location?: string | null;
  employmentType?: string | null;
  summary?: string | null;
  applyUrl?: string | null;
  applyLabel?: string | null;
  position?: {
    x?: number | null;
    y?: number | null;
    z?: number | null;
  } | null;
};

export type JobStarColorName = 'yellow' | 'pink' | 'blue' | 'orange';

type JobStar = {
  key: string;
  root: THREE.Group;
  spinner: THREE.Group;
  hitArea: THREE.Sprite;
  toy: ToyBody;
  homePosition: THREE.Vector3;
  phase: number;
  offscreenFor: number;
  recovering: boolean;
};

type ToyKind = 'box' | 'ball' | 'paper' | 'water-cooler' | 'trash-can' | 'duck';

type ToyBody = {
  object: THREE.Object3D;
  body: CANNON.Body;
  half: THREE.Vector3;
  mass: number;
  jobKey?: string;
};

type RoomPropBody = ToyBody & {
  homePosition: CANNON.Vec3;
  homeQuaternion: CANNON.Quaternion;
};

type ToyActions = {
  addBox: () => void;
  addBall: () => void;
  addPaper: () => void;
  addWaterCooler: () => void;
  addTrashCan: () => void;
  addDuck: () => void;
  reset: () => void;
  scatter: () => void;
};

type Disposable = { dispose: () => void };

const FLOOR_Y = -1.28;
const VISUAL_FLOOR_SIZE = 120;
const OFFICE_ROOM_WIDTH = 14.2;
const OFFICE_ROOM_DEPTH = 14.2;
const OFFICE_ROOM_HEIGHT = 9;
const OFFICE_WALL_THICKNESS = 0.34;
// The source image already contains a carpet tile. Fewer repeats make each
// office tile read at a believable scale instead of as a dense noise pattern.
const CARPET_REPEAT = 32;
const CUBICLE_FOOTPRINT = 3.9;
const CUBICLE_HEIGHT = 1.95;
const CUBICLE_TABLE_HEIGHT = FLOOR_Y + 1.2;
const CUBICLE_SPAWN_Z = 0.05;
const GRAVITY = -7.5;
const BASE_CAMERA_DISTANCE = 6.4;
const BASE_CAMERA_FOV = 48;
const MIN_ZOOM = 0.52;
// A fixed orbit radius keeps a one-pointer drag from appearing to dolly the
// camera as it passes the square room's corners. Zoom changes field of view,
// rather than camera radius, so a wide view never pushes through a room wall.
const MAX_ZOOM = 1.28;
const DEFAULT_ZOOM = 0.92;
const DEFAULT_ORBIT_YAW = 0.68;
const DEFAULT_ORBIT_PITCH = 0.52;
const ORBIT_YAW_RANGE = 0.82;
const MIN_ORBIT_YAW = DEFAULT_ORBIT_YAW - ORBIT_YAW_RANGE;
const MAX_ORBIT_YAW = DEFAULT_ORBIT_YAW + ORBIT_YAW_RANGE;
const MIN_ORBIT_PITCH = 0.2;
const MAX_ORBIT_PITCH = 1.02;
const DUCK_GLB_PATH = '/desktop-flow/ads/duck.glb';
const BOX_GLB_PATH = '/desktop-flow/stack-toy/box.glb';
const COMPUTER_GLB_PATH = '/desktop-flow/stack-toy/computer.glb';
const GOGGLES_GLB_PATH = '/models/pathetic-goggles.glb';
const WATER_COOLER_GLB_PATH = '/desktop-flow/stack-toy/water cooler.glb';
const TRASH_CAN_GLB_PATH = '/desktop-flow/stack-toy/trashcan.glb';
const CUBICLE_GLB_PATH = '/desktop-flow/stack-toy/desk_001.glb';
const COUCH_GLB_PATH = '/desktop-flow/stack-toy/couch/couch.glb';
const COUCH_BASE_COLOR_PATH = '/desktop-flow/stack-toy/couch/Textures/couch-basecolor.webp';
const COUCH_NORMAL_PATH = '/desktop-flow/stack-toy/couch/Textures/couch-normal.webp';
const COUCH_ROUGHNESS_PATH = '/desktop-flow/stack-toy/couch/Textures/couch-roughness.webp';
const COUCH_METALLIC_PATH = '/desktop-flow/stack-toy/couch/Textures/couch-metallic.webp';
const CARPET_TEXTURE_PATH = '/desktop-flow/stack-toy/carpet-floor.avif';
const OFFICE_WINDOW_SKY_TEXTURE_PATH = '/desktop-flow/xp-ocean-wallpaper.avif';
const DUCK_QUACK_SOUND_PATH = '/desktop-flow/stack-toy/quack.mp3';
const DUCK_QUACK_POOL_SIZE = 8;
const DUCK_QUACK_START_SECONDS = 0.18;
const BOX_BASE_MATERIAL_NAME = 'Material.001';
const BOX_BAND_MATERIAL_NAME = 'Material.002';
const BOX_BASE_NODE_NAME = 'cube';
const BOX_BAND_NODE_NAME = 'cube.001';
const COMPUTER_SCREEN_MATERIAL_NAME = 'screen_hey';
const JOB_STAR_COLORS: Record<JobStarColorName, string> = {
  yellow: '#D8FF56',
  pink: '#F22978',
  blue: '#168CF2',
  orange: '#FF8A1F',
};
const DEFAULT_JOB_POSITIONS: ReadonlyArray<readonly [number, number, number]> = [
  [-2.25, 0.92, -0.55],
  [0.1, 1.42, -0.95],
  [2.25, 1.02, -0.45],
  [-1.45, 1.75, 0.55],
  [1.55, 1.88, 0.4],
  [-3.25, 1.5, -1.8],
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function resolveJobStarColor(color?: JobStarColorName | null): string {
  return JOB_STAR_COLORS[color || 'yellow'];
}

function createJobStarShape(): THREE.Shape {
  // Matches the slightly squat five-point star used by the site navigation
  // and newsletter controls, instead of the generic eight-point burst.
  const points: ReadonlyArray<readonly [number, number]> = [
    [0, 0.4886],
    [0.125, 0.1364],
    [0.5, 0.1364],
    [0.1818, -0.0795],
    [0.2955, -0.4432],
    [0, -0.2273],
    [-0.2955, -0.4432],
    [-0.1818, -0.0795],
    [-0.5, 0.1364],
    [-0.125, 0.1364],
  ];
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });

  shape.closePath();
  return shape;
}

function createJobGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create job glow texture');
  const gradient = context.createRadialGradient(128, 128, 10, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255, 255, 255, .82)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, .38)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, .1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createDuckAudio(): HTMLAudioElement {
  const audio = new Audio(DUCK_QUACK_SOUND_PATH);
  audio.preload = 'auto';
  audio.volume = 0.72;
  audio.load();
  return audio;
}

function playDuckQuack(audioPoolRef: { current: HTMLAudioElement[] }, audioIndexRef: { current: number }): void {
  if (typeof window === 'undefined') return;
  if (!audioPoolRef.current.length) {
    audioPoolRef.current = Array.from({ length: DUCK_QUACK_POOL_SIZE }, createDuckAudio);
  }
  const audio = audioPoolRef.current[audioIndexRef.current % audioPoolRef.current.length];
  audioIndexRef.current += 1;
  audio.pause();
  audio.currentTime = Math.min(
    DUCK_QUACK_START_SECONDS,
    Number.isFinite(audio.duration) ? Math.max(0, audio.duration - 0.05) : DUCK_QUACK_START_SECONDS,
  );
  void audio.play().catch(() => {
    // Browser autoplay policy can reject sound until the user interacts.
  });
}

function createCarpetFallbackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create carpet texture');

  context.fillStyle = '#45515f';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(20, 27, 35, 0.24)';
  for (let y = 0; y < canvas.height; y += 32) {
    for (let x = 0; x < canvas.width; x += 32) {
      if ((x / 32 + y / 32) % 2 === 0) context.fillRect(x, y, 32, 32);
    }
  }
  context.strokeStyle = 'rgba(158, 181, 200, 0.16)';
  context.lineWidth = 2;
  for (let index = 0; index <= 256; index += 32) {
    context.beginPath();
    context.moveTo(index, 0);
    context.lineTo(index, 256);
    context.moveTo(0, index);
    context.lineTo(256, index);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function createBallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create ball texture');

  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#ff2f3a');
  gradient.addColorStop(0.2, '#ffb000');
  gradient.addColorStop(0.42, '#ffff00');
  gradient.addColorStop(0.62, '#00d86a');
  gradient.addColorStop(0.82, '#00b8ff');
  gradient.addColorStop(1, '#a042ff');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(0, 0, 0, 0.72)';
  context.lineWidth = 4;
  for (let index = -64; index < 160; index += 22) {
    context.beginPath();
    context.moveTo(index, 0);
    context.quadraticCurveTo(index + 26, 32, index, 64);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function createPaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create paper texture');

  context.fillStyle = '#fffef6';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#161616';
  context.font = '900 46px Arial';
  context.fillText('RAMP EXPENSE', 36, 72);
  context.fillStyle = '#596778';
  context.font = '700 20px Courier New';
  context.fillText('READY FOR REVIEW', 36, 112);
  context.strokeStyle = '#9aa8b7';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(34, 138);
  context.lineTo(478, 138);
  context.stroke();
  context.font = '18px Courier New';
  ['TEAM LUNCH        $240.00', 'MYSTERY SaaS       $600.00', 'URGENT OFFSITE     $999.00'].forEach((row, index) => {
    context.fillText(row, 42, 200 + index * 66);
  });
  context.fillStyle = '#285cff';
  context.fillRect(36, 500, 190, 66);
  context.fillStyle = '#ffffff';
  context.font = '900 30px Arial';
  context.fillText('ACTION', 61, 545);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createCardboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create cardboard texture');

  context.fillStyle = '#a87a5b';
  context.fillRect(0, 0, 256, 256);
  context.fillStyle = 'rgba(255, 230, 174, 0.18)';
  for (let y = 0; y < 256; y += 9) {
    context.fillRect(0, y, 256, 2);
  }
  context.fillStyle = 'rgba(75, 38, 20, 0.18)';
  for (let x = 0; x < 256; x += 17) {
    context.fillRect(x, 0, 1, 256);
  }
  context.strokeStyle = '#5d3526';
  context.lineWidth = 5;
  context.strokeRect(7, 7, 242, 242);
  context.fillStyle = '#c19670';
  context.fillRect(108, 0, 40, 256);
  context.fillRect(0, 108, 256, 40);
  context.fillStyle = '#f6e7c8';
  context.fillRect(28, 28, 72, 42);
  context.fillStyle = '#4b2c20';
  context.font = 'bold 17px Arial';
  context.fillText('FRAGILE', 34, 54);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  return texture;
}

function createGrassBladeGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array([
        -0.5, 0, 0,
        0.5, 0, 0,
        0.42, 0.58, 0,
        0.18, 1, 0,
        -0.18, 1, 0,
        -0.42, 0.58, 0,
      ]),
      3,
    ),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 5, 5, 2, 4, 4, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

function createHeyTexture(disposables: Disposable[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#001eff';
    context.fillRect(0, 0, 128, 64);
    context.fillStyle = '#00f7ff';
    context.font = 'bold 32px Arial';
    context.save();
    context.translate(128, 0);
    context.scale(-1, 1);
    context.fillText('hey.', 33, 41);
    context.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI;
  texture.needsUpdate = true;
  disposables.push(texture);
  return texture;
}

function cannonVec(vector: THREE.Vector3): CANNON.Vec3 {
  return new CANNON.Vec3(vector.x, vector.y, vector.z);
}

function syncVisual(toy: ToyBody): void {
  toy.object.position.set(toy.body.position.x, toy.body.position.y, toy.body.position.z);
  toy.object.quaternion.set(toy.body.quaternion.x, toy.body.quaternion.y, toy.body.quaternion.z, toy.body.quaternion.w);
}

function setBodyReference(toy: ToyBody): void {
  toy.object.userData.toyBody = toy;
  toy.object.traverse((child) => {
    child.userData.toyBody = toy;
  });
}

function clampDraggedBody(toy: ToyBody): void {
  toy.body.position.y = Math.max(FLOOR_Y + toy.half.y, toy.body.position.y);
  syncVisual(toy);
}

function applyMeshFlags(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const isScreenSurface = materials.some((material) => materialNameMatches(material, COMPUTER_SCREEN_MATERIAL_NAME));
    mesh.castShadow = !isScreenSurface;
    mesh.receiveShadow = !isScreenSurface;
  });
}

function materialNameMatches(material: THREE.Material, targetName: string): boolean {
  return material.name.trim().toLowerCase() === targetName;
}

export function JobsOfficeScene({
  jobs,
  emptyMessage = 'No open roles right now. Move some furniture while you wait.',
}: {
  jobs: JobsSceneJob[];
  emptyMessage?: string | null;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);
  const jobLabelRefs = useRef(new Map<string, HTMLDivElement>());
  const clearSelectionRef = useRef<() => void>(() => undefined);
  const duckAudioPoolRef = useRef<HTMLAudioElement[]>([]);
  const duckAudioIndexRef = useRef(0);
  const [activeJobKey, setActiveJobKey] = useState<string | null>(null);
  const activeJob = jobs.find((job) => job.key === activeJobKey) ?? null;
  const actionsRef = useRef<ToyActions>({
    addBox: () => undefined,
    addBall: () => undefined,
    addPaper: () => undefined,
    addWaterCooler: () => undefined,
    addTrashCan: () => undefined,
    addDuck: () => undefined,
    reset: () => undefined,
    scatter: () => undefined,
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const mountElement = mount;
    const initialIsCompact = mountElement.clientWidth < 768;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !initialIsCompact,
        powerPreference: 'high-performance',
      });
    } catch {
      mountElement.classList.add(styles.noWebgl);
      return;
    }
    duckAudioPoolRef.current = Array.from({ length: DUCK_QUACK_POOL_SIZE }, createDuckAudio);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = null;

    const camera = new THREE.PerspectiveCamera(BASE_CAMERA_FOV, 1, 0.1, 90);
    const baseTarget = new THREE.Vector3(0, FLOOR_Y + CUBICLE_HEIGHT * 0.46, 0);
    let orbitYaw = DEFAULT_ORBIT_YAW;
    let orbitPitch = DEFAULT_ORBIT_PITCH;
    let zoom = DEFAULT_ZOOM;

    function applyCameraPose(): void {
      const distance = BASE_CAMERA_DISTANCE;
      const horizontalDistance = Math.cos(orbitPitch) * distance;
      const viewportAspect = Math.max(0.42, camera.aspect || mountElement.clientWidth / Math.max(1, mountElement.clientHeight));
      const responsiveFovScale = viewportAspect < 0.62
        ? 1.62
        : viewportAspect < 0.9
          ? 1.25
          : 1;
      camera.position.set(
        baseTarget.x + Math.sin(orbitYaw) * horizontalDistance,
        baseTarget.y + Math.sin(orbitPitch) * distance,
        baseTarget.z + Math.cos(orbitYaw) * horizontalDistance,
      );
      camera.fov = BASE_CAMERA_FOV * zoom * responsiveFovScale;
      camera.updateProjectionMatrix();
      camera.lookAt(baseTarget);
    }

    function zoomCamera(multiplier: number): void {
      zoom = clamp(zoom * multiplier, MIN_ZOOM, MAX_ZOOM);
      applyCameraPose();
    }

    applyCameraPose();

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !initialIsCompact;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, initialIsCompact ? 1 : 1.25));
    renderer.domElement.className = styles.canvas;
    mountElement.appendChild(renderer.domElement);

    const disposables: Disposable[] = [];
    const toys: ToyBody[] = [];
    const jobStarBodies: ToyBody[] = [];
    const roomProps: RoomPropBody[] = [];
    let effectDisposed = false;
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, GRAVITY, 0) });
    world.allowSleep = true;
    world.broadphase = new CANNON.SAPBroadphase(world);
    const solver = world.solver as CANNON.GSSolver;
    solver.iterations = 11;
    solver.tolerance = 0.001;

    const floorMaterial = new CANNON.Material('office-floor');
    const cubiclePhysicsMaterial = new CANNON.Material('cubicle');
    const toyMaterial = new CANNON.Material('desktop-toy');
    world.addContactMaterial(new CANNON.ContactMaterial(floorMaterial, toyMaterial, { friction: 0.58, restitution: 0.22 }));
    world.addContactMaterial(new CANNON.ContactMaterial(cubiclePhysicsMaterial, toyMaterial, { friction: 0.62, restitution: 0.12 }));
    world.addContactMaterial(new CANNON.ContactMaterial(toyMaterial, toyMaterial, { friction: 0.44, restitution: 0.28 }));

    const floorBody = new CANNON.Body({ mass: 0, material: floorMaterial });
    floorBody.addShape(new CANNON.Plane());
    floorBody.position.set(0, FLOOR_Y, 0);
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(floorBody);

    function addStaticCubicleBox(half: CANNON.Vec3, position: CANNON.Vec3): CANNON.Body {
      const body = new CANNON.Body({ mass: 0, material: cubiclePhysicsMaterial });
      body.addShape(new CANNON.Box(half));
      body.position.copy(position);
      world.addBody(body);
      return body;
    }

    const cubicleCollisionBodies: CANNON.Body[] = [];

    function addMovableCubicleBox(half: CANNON.Vec3, position: CANNON.Vec3): CANNON.Body {
      const body = addStaticCubicleBox(half, position);
      cubicleCollisionBodies.push(body);
      return body;
    }

    const roomHalfWidth = OFFICE_ROOM_WIDTH / 2;
    const roomHalfDepth = OFFICE_ROOM_DEPTH / 2;
    const roomWallHalfHeight = OFFICE_ROOM_HEIGHT / 2;
    const roomWallCenterY = FLOOR_Y + roomWallHalfHeight;
    const roomWallHalfThickness = OFFICE_WALL_THICKNESS / 2;
    addStaticCubicleBox(
      new CANNON.Vec3(roomHalfWidth, roomWallHalfHeight, roomWallHalfThickness),
      new CANNON.Vec3(0, roomWallCenterY, -roomHalfDepth),
    );
    addStaticCubicleBox(
      new CANNON.Vec3(roomHalfWidth, roomWallHalfHeight, roomWallHalfThickness),
      new CANNON.Vec3(0, roomWallCenterY, roomHalfDepth),
    );
    addStaticCubicleBox(
      new CANNON.Vec3(roomWallHalfThickness, roomWallHalfHeight, roomHalfDepth),
      new CANNON.Vec3(-roomHalfWidth, roomWallCenterY, 0),
    );
    addStaticCubicleBox(
      new CANNON.Vec3(roomWallHalfThickness, roomWallHalfHeight, roomHalfDepth),
      new CANNON.Vec3(roomHalfWidth, roomWallCenterY, 0),
    );

    const panelHalfHeight = CUBICLE_HEIGHT / 2;
    const panelCenterY = FLOOR_Y + panelHalfHeight;
    const panelEdge = CUBICLE_FOOTPRINT / 2 - 0.08;
    const panelThickness = 0.085;
    // The cubicle is open toward +Z. These panels keep the early stack gathered,
    // while the open front lets a larger pile naturally spill onto the office floor.
    addMovableCubicleBox(
      new CANNON.Vec3(panelEdge, panelHalfHeight, panelThickness),
      new CANNON.Vec3(0, panelCenterY, -panelEdge),
    );
    addMovableCubicleBox(
      new CANNON.Vec3(panelThickness, panelHalfHeight, panelEdge),
      new CANNON.Vec3(-panelEdge, panelCenterY, 0),
    );
    addMovableCubicleBox(
      new CANNON.Vec3(panelThickness, panelHalfHeight, panelEdge),
      new CANNON.Vec3(panelEdge, panelCenterY, 0),
    );

    const desktopVisualHalfThickness = 0.055;
    // Extend the tabletop colliders downward while preserving their visible top
    // edge. This prevents fast objects (especially the thin card) tunnelling
    // through the desk between fixed physics steps.
    const desktopHalfThickness = 0.18;
    const desktopY = CUBICLE_TABLE_HEIGHT;
    const desktopColliderY = desktopY - (desktopHalfThickness - desktopVisualHalfThickness);
    addMovableCubicleBox(
      new CANNON.Vec3(1.33, desktopHalfThickness, 0.43),
      new CANNON.Vec3(0, desktopColliderY, -1.26),
    );
    addMovableCubicleBox(
      new CANNON.Vec3(0.43, desktopHalfThickness, 0.71),
      new CANNON.Vec3(-1.26, desktopColliderY, -0.2),
    );
    addMovableCubicleBox(
      new CANNON.Vec3(0.43, desktopHalfThickness, 0.71),
      new CANNON.Vec3(1.26, desktopColliderY, -0.2),
    );
    // These six simple boxes are also used for the desk drag sweep. Imported
    // detail colliders may be added later, but their compound AABB spans empty
    // space inside the U-shaped desk and is therefore unsuitable for sweeping.
    const cubicleDragCollisionBodies = cubicleCollisionBodies.slice();

    const carpetTexture = createCarpetFallbackTexture();
    carpetTexture.repeat.set(CARPET_REPEAT, CARPET_REPEAT);
    const ballTexture = createBallTexture();
    const paperTexture = createPaperTexture();
    const cardboardTexture = createCardboardTexture();
    cardboardTexture.repeat.set(1.1, 1.1);
    disposables.push(carpetTexture, ballTexture, paperTexture, cardboardTexture);

    const carpetMaterial = new THREE.MeshPhongMaterial({ map: carpetTexture, color: 0xffffff, shininess: 3 });
    const cardboardMaterial = new THREE.MeshPhongMaterial({ map: cardboardTexture, color: 0xffffff, specular: 0xffe7c2, shininess: 18 });
    const boxBaseMaterial = new THREE.MeshPhongMaterial({ color: 0xb98254, specular: 0xffdfae, shininess: 16, flatShading: true });
    const boxBandMaterial = new THREE.MeshPhongMaterial({ color: 0xd9ad78, specular: 0xffedc7, shininess: 20, flatShading: true });
    const tapeMaterial = new THREE.MeshPhongMaterial({ color: 0xc4966d, specular: 0xffffff, shininess: 24 });
    const labelMaterial = new THREE.MeshPhongMaterial({ color: 0xf7ecd4, specular: 0xffffff, shininess: 10 });
    const ballMaterial = new THREE.MeshPhongMaterial({ map: ballTexture, shininess: 36 });
    const paperMaterial = new THREE.MeshPhongMaterial({
      map: paperTexture,
      color: 0xffffff,
      shininess: 4,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    const waitingCouchMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.02,
    });
    const waitingTableMaterial = new THREE.MeshPhongMaterial({ color: 0xa6b4bf, specular: 0xffffff, shininess: 42 });
    const waitingAccentMaterial = new THREE.MeshPhongMaterial({ color: 0xe3f0f7, specular: 0xffffff, shininess: 54 });
    const waterCoolerFallbackMaterial = new THREE.MeshPhongMaterial({ color: 0xdfe7eb, specular: 0xffffff, shininess: 38 });
    const waterBottleFallbackMaterial = new THREE.MeshPhongMaterial({
      color: 0x80d8f2,
      transparent: true,
      opacity: 0.72,
      specular: 0xffffff,
      shininess: 72,
    });
    const trashCanFallbackMaterial = new THREE.MeshPhongMaterial({ color: 0x7d8a93, specular: 0xe9f4fa, shininess: 28 });
    const plantMaterial = new THREE.MeshPhongMaterial({ color: 0x27a93d, shininess: 22, flatShading: true, side: THREE.DoubleSide });
    const potMaterial = new THREE.MeshPhongMaterial({ color: 0xd67d15, shininess: 16, side: THREE.DoubleSide });
    const soilMaterial = new THREE.MeshPhongMaterial({ color: 0x5a2c16, shininess: 5, flatShading: true });
    const duckMaterial = new THREE.MeshPhongMaterial({ color: 0xf7de25, specular: 0xffffff, shininess: 38, flatShading: true });
    const duckBeakMaterial = new THREE.MeshPhongMaterial({ color: 0xf57f1f, specular: 0xffffff, shininess: 28, flatShading: true });
    const duckEyeMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1700 });
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: createHeyTexture(disposables),
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    screenMaterial.name = COMPUTER_SCREEN_MATERIAL_NAME;
    disposables.push(
      carpetMaterial,
      cardboardMaterial,
      boxBaseMaterial,
      boxBandMaterial,
      tapeMaterial,
      labelMaterial,
      ballMaterial,
      paperMaterial,
      waitingCouchMaterial,
      waitingTableMaterial,
      waitingAccentMaterial,
      waterCoolerFallbackMaterial,
      waterBottleFallbackMaterial,
      trashCanFallbackMaterial,
      plantMaterial,
      potMaterial,
      soilMaterial,
      duckMaterial,
      duckBeakMaterial,
      duckEyeMaterial,
      screenMaterial,
    );

    const textureLoader = new THREE.TextureLoader();

    function configureLoadedTexture(texture: THREE.Texture, repeatX?: number, repeatY?: number): void {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      if (repeatX !== undefined && repeatY !== undefined) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
      }
    }

    function loadExternalTexture(
      path: string,
      material: THREE.MeshPhongMaterial,
      repeatX?: number,
      repeatY?: number,
    ): void {
      textureLoader.load(
        path,
        (texture) => {
          if (effectDisposed) {
            texture.dispose();
            return;
          }
          configureLoadedTexture(texture, repeatX, repeatY);
          material.map = texture;
          material.needsUpdate = true;
          disposables.push(texture);
        },
        undefined,
        () => {
          // The generated placeholder stays visible until the supplied asset exists.
        },
      );
    }

    loadExternalTexture(CARPET_TEXTURE_PATH, carpetMaterial, CARPET_REPEAT, CARPET_REPEAT);

    function loadCouchTexture(
      path: string,
      property: 'map' | 'normalMap' | 'roughnessMap' | 'metalnessMap',
      colorTexture = false,
    ): void {
      textureLoader.load(
        path,
        (texture) => {
          if (effectDisposed) {
            texture.dispose();
            return;
          }
          texture.flipY = false;
          texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
          if (colorTexture) texture.colorSpace = THREE.SRGBColorSpace;
          waitingCouchMaterial[property] = texture;
          waitingCouchMaterial.needsUpdate = true;
          disposables.push(texture);
        },
        undefined,
        () => undefined,
      );
    }

    loadCouchTexture(COUCH_BASE_COLOR_PATH, 'map', true);
    loadCouchTexture(COUCH_NORMAL_PATH, 'normalMap');
    loadCouchTexture(COUCH_ROUGHNESS_PATH, 'roughnessMap');
    loadCouchTexture(COUCH_METALLIC_PATH, 'metalnessMap');

    const ambient = new THREE.HemisphereLight(0xe9f3ff, 0x26313d, 1.45);
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(3.8, 7, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    key.shadow.camera.left = -7;
    key.shadow.camera.right = 7;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -7;
    const fill = new THREE.PointLight(0xa8ccff, 1.6, 14);
    fill.position.set(-4, 2.8, 4);
    scene.add(ambient, key, fill);

    const floorGeometry = new THREE.PlaneGeometry(VISUAL_FLOOR_SIZE, VISUAL_FLOOR_SIZE);
    disposables.push(floorGeometry);

    const floor = new THREE.Mesh(floorGeometry, carpetMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    floor.receiveShadow = true;
    scene.add(floor);

    const officeWallMaterial = new THREE.MeshPhongMaterial({
      color: 0xf7f7f2,
      specular: 0xffffff,
      shininess: 10,
    });
    const officeFrameMaterial = new THREE.MeshPhongMaterial({
      color: 0xe4e9ee,
      specular: 0xffffff,
      shininess: 28,
    });
    const officeTrimMaterial = new THREE.MeshPhongMaterial({
      color: 0xb8c1ca,
      specular: 0xeaf5ff,
      shininess: 18,
    });
    const officeWindowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      toneMapped: false,
    });
    textureLoader.load(
      OFFICE_WINDOW_SKY_TEXTURE_PATH,
      (sourceTexture) => {
        if (effectDisposed) {
          sourceTexture.dispose();
          return;
        }
        configureLoadedTexture(sourceTexture);
        sourceTexture.wrapS = THREE.ClampToEdgeWrapping;
        sourceTexture.wrapT = THREE.ClampToEdgeWrapping;
        // Crop the wallpaper to its sky-only upper band. The chosen horizontal
        // offset gives the sole right-wall window a balanced cloud field.
        sourceTexture.repeat.set(0.51, 0.59);
        sourceTexture.offset.set(0.32, 0.41);
        sourceTexture.needsUpdate = true;
        officeWindowMaterial.map = sourceTexture;
        officeWindowMaterial.color.setHex(0xffffff);
        officeWindowMaterial.needsUpdate = true;
        disposables.push(sourceTexture);
      },
      undefined,
      () => undefined,
    );
    const backWallGeometry = new THREE.BoxGeometry(
      OFFICE_ROOM_WIDTH,
      OFFICE_ROOM_HEIGHT,
      OFFICE_WALL_THICKNESS,
    );
    const sideWallGeometry = new THREE.BoxGeometry(
      OFFICE_WALL_THICKNESS,
      OFFICE_ROOM_HEIGHT,
      OFFICE_ROOM_DEPTH,
    );
    const longTrimGeometry = new THREE.BoxGeometry(OFFICE_ROOM_WIDTH, 0.3, 0.24);
    const sideTrimGeometry = new THREE.BoxGeometry(0.24, 0.3, OFFICE_ROOM_DEPTH);
    const windowViewGeometry = new THREE.PlaneGeometry(5.25, 3.42);
    const windowVerticalFrameGeometry = new THREE.BoxGeometry(0.18, 3.92, 0.2);
    const windowHorizontalFrameGeometry = new THREE.BoxGeometry(5.62, 0.18, 0.2);
    const jobsTitle = createJobsTitleMesh();
    const { width: jobsWordWidth, height: jobsWordHeight, depth: jobsWordDepth } = jobsTitle;
    disposables.push(
      officeWallMaterial,
      officeFrameMaterial,
      officeTrimMaterial,
      officeWindowMaterial,
      ...jobsTitle.disposables,
      backWallGeometry,
      sideWallGeometry,
      longTrimGeometry,
      sideTrimGeometry,
      windowViewGeometry,
      windowVerticalFrameGeometry,
      windowHorizontalFrameGeometry,
    );

    const officeRoom = new THREE.Group();
    officeRoom.name = 'stack-toy-office-room';
    const backWall = new THREE.Mesh(backWallGeometry, officeWallMaterial);
    backWall.position.set(0, roomWallCenterY, -roomHalfDepth);
    const frontWall = new THREE.Mesh(backWallGeometry, officeWallMaterial);
    frontWall.position.set(0, roomWallCenterY, roomHalfDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, officeWallMaterial);
    leftWall.position.set(-roomHalfWidth, roomWallCenterY, 0);
    const rightWall = new THREE.Mesh(sideWallGeometry, officeWallMaterial);
    rightWall.position.set(roomHalfWidth, roomWallCenterY, 0);
    officeRoom.add(backWall, frontWall, leftWall, rightWall);

    const backTrim = new THREE.Mesh(longTrimGeometry, officeTrimMaterial);
    backTrim.position.set(0, FLOOR_Y + 0.18, -roomHalfDepth + 0.22);
    const frontTrim = new THREE.Mesh(longTrimGeometry, officeTrimMaterial);
    frontTrim.position.set(0, FLOOR_Y + 0.18, roomHalfDepth - 0.22);
    const leftTrim = new THREE.Mesh(sideTrimGeometry, officeTrimMaterial);
    leftTrim.position.set(-roomHalfWidth + 0.22, FLOOR_Y + 0.18, 0);
    const rightTrim = new THREE.Mesh(sideTrimGeometry, officeTrimMaterial);
    rightTrim.position.set(roomHalfWidth - 0.22, FLOOR_Y + 0.18, 0);
    officeRoom.add(backTrim, frontTrim, leftTrim, rightTrim);

    const windowCenters = [-0.8];
    const windowCenterY = FLOOR_Y + 4.15;
    function addWindowWall(
      name: string,
      position: [number, number, number],
      rotationY: number,
      windowMaterial: THREE.MeshBasicMaterial,
    ): void {
      const wallWindows = new THREE.Group();
      wallWindows.name = name;
      wallWindows.position.set(...position);
      wallWindows.rotation.y = rotationY;
      windowCenters.forEach((center, index) => {
        const window = new THREE.Group();
        window.name = `${name}-window-${index + 1}`;
        window.position.x = center;

        const view = new THREE.Mesh(windowViewGeometry, windowMaterial);
        view.position.z = 0.23;
        const leftFrame = new THREE.Mesh(windowVerticalFrameGeometry, officeFrameMaterial);
        leftFrame.position.set(-2.715, 0, 0.31);
        const rightFrame = new THREE.Mesh(windowVerticalFrameGeometry, officeFrameMaterial);
        rightFrame.position.set(2.715, 0, 0.31);
        const topFrame = new THREE.Mesh(windowHorizontalFrameGeometry, officeFrameMaterial);
        topFrame.position.set(0, 1.87, 0.31);
        const bottomFrame = new THREE.Mesh(windowHorizontalFrameGeometry, officeFrameMaterial);
        bottomFrame.position.set(0, -1.87, 0.31);
        window.add(view, leftFrame, rightFrame, topFrame, bottomFrame);
        wallWindows.add(window);
      });
      officeRoom.add(wallWindows);
    }

    // With the default three-quarter camera the back wall reads as the visible
    // right-hand wall. Keep the scene to this one window so it is immediately
    // visible without allowing a full orbit around the room.
    addWindowWall(
      'office-right-window',
      [0, windowCenterY, -roomHalfDepth + 0.18],
      0,
      officeWindowMaterial,
    );
    applyMeshFlags(officeRoom);
    scene.add(officeRoom);

    const jobsWord = jobsTitle.object;
    jobsWord.scale.setScalar(0.72);
    mountElement.dataset.officeWalls = '4';
    mountElement.dataset.officeWindows = String(windowCenters.length);

    const fallbackPanelMaterial = new THREE.MeshPhongMaterial({
      color: 0x9aa5b2,
      specular: 0xdde8f2,
      shininess: 12,
    });
    const fallbackDeskMaterial = new THREE.MeshPhongMaterial({
      color: 0xc2c0b7,
      specular: 0xffffff,
      shininess: 20,
    });
    const fallbackFrameMaterial = new THREE.MeshPhongMaterial({
      color: 0x596775,
      specular: 0xdce8f2,
      shininess: 34,
    });
    const fallbackBackPanelGeometry = new THREE.BoxGeometry(CUBICLE_FOOTPRINT - 0.16, CUBICLE_HEIGHT, 0.16);
    const fallbackSidePanelGeometry = new THREE.BoxGeometry(0.16, CUBICLE_HEIGHT, CUBICLE_FOOTPRINT - 0.16);
    const fallbackBackDeskGeometry = new THREE.BoxGeometry(2.63, 0.11, 0.84);
    const fallbackSideDeskGeometry = new THREE.BoxGeometry(0.84, 0.11, 1.39);
    const fallbackLegGeometry = new THREE.BoxGeometry(0.075, 1.12, 0.075);
    disposables.push(
      fallbackPanelMaterial,
      fallbackDeskMaterial,
      fallbackFrameMaterial,
      fallbackBackPanelGeometry,
      fallbackSidePanelGeometry,
      fallbackBackDeskGeometry,
      fallbackSideDeskGeometry,
      fallbackLegGeometry,
    );

    const fallbackCubicle = new THREE.Group();
    const fallbackBackPanel = new THREE.Mesh(fallbackBackPanelGeometry, fallbackPanelMaterial);
    fallbackBackPanel.position.set(0, panelCenterY, -panelEdge);
    const fallbackLeftPanel = new THREE.Mesh(fallbackSidePanelGeometry, fallbackPanelMaterial);
    fallbackLeftPanel.position.set(-panelEdge, panelCenterY, 0);
    const fallbackRightPanel = new THREE.Mesh(fallbackSidePanelGeometry, fallbackPanelMaterial);
    fallbackRightPanel.position.set(panelEdge, panelCenterY, 0);
    const fallbackBackDesk = new THREE.Mesh(fallbackBackDeskGeometry, fallbackDeskMaterial);
    fallbackBackDesk.position.set(0, desktopY, -1.26);
    const fallbackLeftDesk = new THREE.Mesh(fallbackSideDeskGeometry, fallbackDeskMaterial);
    fallbackLeftDesk.position.set(-1.26, desktopY, -0.2);
    const fallbackRightDesk = new THREE.Mesh(fallbackSideDeskGeometry, fallbackDeskMaterial);
    fallbackRightDesk.position.set(1.26, desktopY, -0.2);
    fallbackCubicle.add(
      fallbackBackPanel,
      fallbackLeftPanel,
      fallbackRightPanel,
      fallbackBackDesk,
      fallbackLeftDesk,
      fallbackRightDesk,
    );
    [
      [-1.6, -0.88],
      [-0.91, -0.88],
      [0.91, -0.88],
      [1.6, -0.88],
    ].forEach(([x, z]) => {
      const leg = new THREE.Mesh(fallbackLegGeometry, fallbackFrameMaterial);
      leg.position.set(x, FLOOR_Y + 0.56, z);
      fallbackCubicle.add(leg);
    });
    applyMeshFlags(fallbackCubicle);
    scene.add(fallbackCubicle);
    let activeCubicleVisual: THREE.Object3D = fallbackCubicle;
    const activeCubicleHomePosition = fallbackCubicle.position.clone();

    function translateCubicle(deltaX: number, deltaZ: number): void {
      if (Math.abs(deltaX) < 0.0001 && Math.abs(deltaZ) < 0.0001) return;
      // Pointer events can arrive far apart. Move the desk in short steps and
      // sweep its broad, reliable collider boxes so it pushes intersected room
      // props and stack items instead of teleporting through them.
      const maxStep = 0.12;
      const stepCount = Math.max(1, Math.ceil(Math.hypot(deltaX, deltaZ) / maxStep));
      const stepX = deltaX / stepCount;
      const stepZ = deltaZ / stepCount;

      for (let step = 0; step < stepCount; step += 1) {
        const sweptBounds = cubicleDragCollisionBodies.map((body) => {
          body.updateAABB();
          const lowerX = body.aabb.lowerBound.x;
          const lowerY = body.aabb.lowerBound.y;
          const lowerZ = body.aabb.lowerBound.z;
          const upperX = body.aabb.upperBound.x;
          const upperY = body.aabb.upperBound.y;
          const upperZ = body.aabb.upperBound.z;
          return {
            body,
            lowerX,
            lowerY,
            lowerZ,
            upperX,
            upperY,
            upperZ,
          };
        });

        activeCubicleVisual.position.x += stepX;
        activeCubicleVisual.position.z += stepZ;
        activeCubicleVisual.updateMatrixWorld(true);
        cubicleCollisionBodies.forEach((body) => {
          body.position.x += stepX;
          body.position.z += stepZ;
          body.aabbNeedsUpdate = true;
          body.updateAABB();
        });

        [...toys, ...roomProps].forEach((item) => {
          item.body.aabbNeedsUpdate = true;
          item.body.updateAABB();
          const itemBounds = item.body.aabb;
          const intersectsSweep = sweptBounds.some((sweep) => {
            const nextAabb = sweep.body.aabb;
            const minX = Math.min(sweep.lowerX, nextAabb.lowerBound.x);
            const minY = Math.min(sweep.lowerY, nextAabb.lowerBound.y);
            const minZ = Math.min(sweep.lowerZ, nextAabb.lowerBound.z);
            const maxX = Math.max(sweep.upperX, nextAabb.upperBound.x);
            const maxY = Math.max(sweep.upperY, nextAabb.upperBound.y);
            const maxZ = Math.max(sweep.upperZ, nextAabb.upperBound.z);
            return (
              itemBounds.lowerBound.x <= maxX
              && itemBounds.upperBound.x >= minX
              && itemBounds.lowerBound.y <= maxY
              && itemBounds.upperBound.y >= minY
              && itemBounds.lowerBound.z <= maxZ
              && itemBounds.upperBound.z >= minZ
            );
          });
          if (!intersectsSweep) return;
          item.body.position.x += stepX;
          item.body.position.z += stepZ;
          item.body.aabbNeedsUpdate = true;
          item.body.updateAABB();
          item.body.wakeUp();
          syncVisual(item);
        });
      }
    }

    const boxGeometry = new THREE.BoxGeometry(0.62, 0.62, 0.62);
    const bigBoxGeometry = new THREE.BoxGeometry(1.12, 1.16, 1.04);
    const boxFlapGeometry = new THREE.BoxGeometry(0.56, 0.045, 0.5);
    const boxTapeGeometry = new THREE.BoxGeometry(0.08, 0.035, 1.08);
    const boxFrontTapeGeometry = new THREE.BoxGeometry(0.08, 0.58, 0.035);
    const boxLabelGeometry = new THREE.BoxGeometry(0.42, 0.3, 0.035);
    const potGeometry = new THREE.CylinderGeometry(0.46, 0.3, 0.68, 20, 1, true);
    const potRimGeometry = new THREE.TorusGeometry(0.46, 0.035, 8, 20);
    const potBaseGeometry = new THREE.CylinderGeometry(0.32, 0.27, 0.11, 20);
    const soilGeometry = new THREE.CylinderGeometry(0.41, 0.41, 0.035, 20);
    const grassBladeGeometry = createGrassBladeGeometry();
    const ballGeometry = new THREE.SphereGeometry(0.27, 24, 16);
    const paperGeometry = new THREE.IcosahedronGeometry(0.24, 2);
    const paperPositions = paperGeometry.getAttribute('position');
    for (let index = 0; index < paperPositions.count; index += 1) {
      const x = paperPositions.getX(index);
      const y = paperPositions.getY(index);
      const z = paperPositions.getZ(index);
      const crumple = 0.76
        + Math.sin(x * 31 + y * 17 - z * 23) * 0.11
        + Math.cos(x * 19 - y * 29 + z * 13) * 0.07;
      paperPositions.setXYZ(
        index,
        x * crumple * 1.04,
        y * crumple * 0.94,
        z * crumple,
      );
    }
    paperPositions.needsUpdate = true;
    paperGeometry.computeVertexNormals();
    const coolerBodyGeometry = new THREE.BoxGeometry(0.58, 0.82, 0.5);
    const coolerBottleGeometry = new THREE.CylinderGeometry(0.23, 0.29, 0.62, 18);
    const trashCanGeometry = new THREE.CylinderGeometry(0.36, 0.3, 0.92, 18, 1, true);
    const trashCanBottomGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.07, 18);
    const duckBodyGeometry = new THREE.SphereGeometry(0.34, 18, 12);
    const duckHeadGeometry = new THREE.SphereGeometry(0.22, 18, 12);
    const duckBeakGeometry = new THREE.ConeGeometry(0.11, 0.24, 4);
    const duckEyeGeometry = new THREE.SphereGeometry(0.024, 8, 6);
    const waitingCouchSeatGeometry = new THREE.BoxGeometry(3.7, 0.55, 1.35);
    const waitingCouchBackGeometry = new THREE.BoxGeometry(3.7, 1.25, 0.32);
    const waitingCouchArmGeometry = new THREE.BoxGeometry(0.32, 0.88, 1.38);
    const waitingTableTopGeometry = new THREE.BoxGeometry(1.18, 0.12, 0.76);
    const waitingTableLegGeometry = new THREE.CylinderGeometry(0.09, 0.13, 0.54, 12);
    const waitingMagazineGeometry = new THREE.BoxGeometry(0.5, 0.025, 0.32);
    disposables.push(
      boxGeometry,
      bigBoxGeometry,
      boxFlapGeometry,
      boxTapeGeometry,
      boxFrontTapeGeometry,
      boxLabelGeometry,
      potGeometry,
      potRimGeometry,
      potBaseGeometry,
      soilGeometry,
      grassBladeGeometry,
      ballGeometry,
      paperGeometry,
      coolerBodyGeometry,
      coolerBottleGeometry,
      trashCanGeometry,
      trashCanBottomGeometry,
      duckBodyGeometry,
      duckHeadGeometry,
      duckBeakGeometry,
      duckEyeGeometry,
      waitingCouchSeatGeometry,
      waitingCouchBackGeometry,
      waitingCouchArmGeometry,
      waitingTableTopGeometry,
      waitingTableLegGeometry,
      waitingMagazineGeometry,
    );

    let duckTemplate: THREE.Object3D | null = null;
    let boxTemplate: THREE.Object3D | null = null;
    let computerTemplate: THREE.Object3D | null = null;
    let waterCoolerTemplate: THREE.Object3D | null = null;
    let trashCanTemplate: THREE.Object3D | null = null;
    let cubicleObject: THREE.Object3D | null = null;
    let waitingRoomCouchObject: THREE.Object3D | null = null;
    let glassesObject: THREE.Object3D | null = null;
    let duckLoadCancelled = false;
    let boxLoadCancelled = false;
    let boxLoadComplete = false;
    let computerLoadCancelled = false;
    let waterCoolerLoadCancelled = false;
    let trashCanLoadCancelled = false;
    let waterCoolerLoadComplete = false;
    let trashCanLoadComplete = false;
    let cubicleLoadCancelled = false;
    let couchLoadCancelled = false;
    let glassesLoadCancelled = false;
    const pendingDuckPositions: THREE.Vector3[] = [];
    const pendingBoxSpawns: Array<{ position: THREE.Vector3; scale: number }> = [];
    const pendingComputerPositions: THREE.Vector3[] = [];
    const pendingWaterCoolerPositions: THREE.Vector3[] = [];
    const pendingTrashCanPositions: THREE.Vector3[] = [];

    function centerWaitingRoomObject(
      object: THREE.Object3D,
      rotationY = 0,
    ): THREE.Group {
      const rotatedObject = new THREE.Group();
      rotatedObject.rotation.y = rotationY;
      rotatedObject.add(object);
      rotatedObject.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(rotatedObject);
      const center = new THREE.Vector3();
      bounds.getCenter(center);
      rotatedObject.position.sub(center);

      const root = new THREE.Group();
      root.add(rotatedObject);
      root.updateMatrixWorld(true);
      applyMeshFlags(root);
      return root;
    }

    function measuredHalfExtents(object: THREE.Object3D, fallback: THREE.Vector3): THREE.Vector3 {
      object.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object);
      if (bounds.isEmpty()) return fallback.clone();
      const size = new THREE.Vector3();
      bounds.getSize(size);
      if (![size.x, size.y, size.z].every(Number.isFinite)) return fallback.clone();
      return size.multiplyScalar(0.5);
    }

    function placeWaitingRoomObject(
      object: THREE.Object3D,
      x: number,
      z: number,
      rotationY = 0,
      mass = 4,
      bottomY = FLOOR_Y,
    ): RoomPropBody {
      const placement = centerWaitingRoomObject(object, rotationY);
      const half = measuredHalfExtents(placement, new THREE.Vector3(0.5, 0.5, 0.5));
      const colliderHalf = new CANNON.Vec3(
        Math.max(0.04, half.x * 0.95),
        Math.max(0.03, half.y * 0.98),
        Math.max(0.04, half.z * 0.95),
      );
      const toy = createBodyObject(
        placement,
        half,
        new CANNON.Box(colliderHalf),
        mass,
        new THREE.Vector3(x, bottomY + half.y, z),
      );
      const toyIndex = toys.indexOf(toy);
      if (toyIndex >= 0) toys.splice(toyIndex, 1);
      toy.body.velocity.set(0, 0, 0);
      toy.body.angularVelocity.set(0, 0, 0);
      toy.body.linearDamping = 0.3;
      toy.body.angularDamping = 0.48;
      const prop: RoomPropBody = {
        ...toy,
        homePosition: toy.body.position.clone(),
        homeQuaternion: toy.body.quaternion.clone(),
      };
      setBodyReference(prop);
      roomProps.push(prop);
      return prop;
    }

    function replaceRoomPropVisual(
      prop: RoomPropBody,
      object: THREE.Object3D,
      rotationY = 0,
    ): void {
      const previousBottom = prop.body.position.y - prop.half.y;
      const nextVisual = centerWaitingRoomObject(object, rotationY);
      prop.object.clear();
      prop.object.add(nextVisual);
      prop.object.updateMatrixWorld(true);
      const nextHalf = measuredHalfExtents(prop.object, prop.half);
      prop.half.copy(nextHalf);
      prop.body.shapes.length = 0;
      prop.body.shapeOffsets.length = 0;
      prop.body.shapeOrientations.length = 0;
      prop.body.addShape(new CANNON.Box(new CANNON.Vec3(
        Math.max(0.04, nextHalf.x * 0.95),
        Math.max(0.03, nextHalf.y * 0.98),
        Math.max(0.04, nextHalf.z * 0.95),
      )));
      prop.body.position.y = previousBottom + nextHalf.y;
      prop.body.updateBoundingRadius();
      prop.body.aabbNeedsUpdate = true;
      prop.body.updateAABB();
      prop.homePosition.copy(prop.body.position);
      applyMeshFlags(prop.object);
      setBodyReference(prop);
      syncVisual(prop);
    }

    function createFallbackWaitingCouch(): THREE.Group {
      const couch = new THREE.Group();
      const seat = new THREE.Mesh(waitingCouchSeatGeometry, waitingCouchMaterial);
      seat.position.y = 0.65;
      const back = new THREE.Mesh(waitingCouchBackGeometry, waitingCouchMaterial);
      back.position.set(0, 1.12, -0.51);
      const leftArm = new THREE.Mesh(waitingCouchArmGeometry, waitingCouchMaterial);
      leftArm.position.set(-2.02, 0.78, 0);
      const rightArm = new THREE.Mesh(waitingCouchArmGeometry, waitingCouchMaterial);
      rightArm.position.set(2.02, 0.78, 0);
      couch.add(seat, back, leftArm, rightArm);
      couch.scale.setScalar(1.22);
      return couch;
    }

    const furniture = createOfficeFurniture(disposables);
    function createWaitingTable(): THREE.Group { return furniture.coffeeTable(); }

    function createFallbackWaitingCooler(): THREE.Group {
      const cooler = new THREE.Group();
      const cabinet = new THREE.Mesh(coolerBodyGeometry, waterCoolerFallbackMaterial);
      cabinet.position.y = 0.5;
      const bottle = new THREE.Mesh(coolerBottleGeometry, waterBottleFallbackMaterial);
      bottle.position.y = 1.22;
      cooler.add(cabinet, bottle);
      cooler.scale.setScalar(1.9);
      return cooler;
    }

    function createWaitingPlant(): THREE.Group { return furniture.plant(); }

    const waitingRoomLeftCouchProp = placeWaitingRoomObject(
      createFallbackWaitingCouch(),
      -5.65,
      1.2,
      Math.PI / 2,
      24,
    );
    const waitingRoomRightCouchProp = placeWaitingRoomObject(
      createFallbackWaitingCouch(),
      5.65,
      1.2,
      -Math.PI / 2,
      24,
    );
    const waitingRoomCoolerProp = placeWaitingRoomObject(
      createFallbackWaitingCooler(),
      5.48,
      -5.36,
      -0.18,
      9,
    );
    placeWaitingRoomObject(createWaitingTable(), 0, 3.7, 0, 6.5);
    placeWaitingRoomObject(createWaitingPlant(), -5.55, -5.2, 0, 3.2);
    const waitingMagazine = new THREE.Mesh(waitingMagazineGeometry, paperMaterial);
    waitingMagazine.rotation.x = -0.06;
    placeWaitingRoomObject(waitingMagazine, 0.08, 3.7, -0.2, 0.08, FLOOR_Y + 0.69);

    function centerAndScaleObject(object: THREE.Object3D, targetSize: number): THREE.Object3D {
      const wrapper = new THREE.Group();
      wrapper.add(object);
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      box.getSize(size);
      const largestAxis = Math.max(size.x, size.y, size.z) || 1;
      object.scale.setScalar(targetSize / largestAxis);
      const scaledBox = new THREE.Box3().setFromObject(object);
      const center = new THREE.Vector3();
      scaledBox.getCenter(center);
      object.position.sub(center);
      return wrapper;
    }

    function fitCubicleObject(object: THREE.Object3D): THREE.Object3D {
      object.updateMatrixWorld(true);
      const initialBox = new THREE.Box3().setFromObject(object);
      const initialSize = new THREE.Vector3();
      initialBox.getSize(initialSize);
      const horizontalSpan = Math.max(initialSize.x, initialSize.z) || 1;
      object.scale.multiplyScalar(CUBICLE_FOOTPRINT / horizontalSpan);
      object.updateMatrixWorld(true);

      const fittedBox = new THREE.Box3().setFromObject(object);
      const center = new THREE.Vector3();
      fittedBox.getCenter(center);
      object.position.x -= center.x;
      object.position.y += FLOOR_Y - fittedBox.min.y;
      object.position.z -= center.z;
      object.updateMatrixWorld(true);
      applyMeshFlags(object);
      return object;
    }

    function replaceTabletopCollider(object: THREE.Object3D): void {
      const body = createTabletopCompoundBody({
        object,
        material: cubiclePhysicsMaterial,
        halfThickness: desktopHalfThickness,
      });
      if (!body) return;
      // Keep the broad fallback tabletop boxes as a second, continuous safety
      // surface. The rasterised GLB silhouette is visually accurate, while the
      // overlapping broad boxes stop thin or fast items finding tiny gaps in
      // the imported mesh during a drag.
      world.addBody(body);
      cubicleCollisionBodies.push(body);
    }

    function disposeObject(object: THREE.Object3D): void {
      const textures = new Set<THREE.Texture>();
      const materials = new Set<THREE.Material>();
      const geometries = new Set<THREE.BufferGeometry>();
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        if (!geometries.has(child.geometry)) {
          child.geometry.dispose();
          geometries.add(child.geometry);
        }
        const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
        childMaterials.forEach((material) => {
          if (materials.has(material)) return;
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture && !textures.has(value)) {
              value.dispose();
              textures.add(value);
            }
          });
          material.dispose();
          materials.add(material);
        });
      });
    }

    function applyComputerScreenMaterial(object: THREE.Object3D): void {
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;

        let hasScreenSurface = false;
        if (Array.isArray(child.material)) {
          child.material = child.material.map((material) => {
            if (!materialNameMatches(material, COMPUTER_SCREEN_MATERIAL_NAME)) return material;
            hasScreenSurface = true;
            return screenMaterial;
          });
        } else if (materialNameMatches(child.material, COMPUTER_SCREEN_MATERIAL_NAME)) {
          child.material = screenMaterial;
          hasScreenSurface = true;
        }

        if (!hasScreenSurface) return;
        child.castShadow = false;
        child.receiveShadow = false;
      });
    }

    function boxMaterialFor(mesh: THREE.Mesh, material: THREE.Material): THREE.Material {
      const meshName = mesh.name.trim().toLowerCase();
      if (meshName === BOX_BAND_NODE_NAME || materialNameMatches(material, BOX_BAND_MATERIAL_NAME)) return boxBandMaterial;
      if (meshName === BOX_BASE_NODE_NAME || materialNameMatches(material, BOX_BASE_MATERIAL_NAME)) return boxBaseMaterial;
      return material;
    }

    function applyBoxMaterials(object: THREE.Object3D): void {
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.material = Array.isArray(child.material)
          ? child.material.map((material) => boxMaterialFor(child, material))
          : boxMaterialFor(child, child.material);
      });
    }

    function randomBoxScale(): number {
      return 0.78 + Math.random() * 0.48;
    }

    void Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/environments/RoomEnvironment.js'),
    ])
      .then(([{ GLTFLoader }, { RoomEnvironment }]) => {
        if (
          duckLoadCancelled
          && boxLoadCancelled
          && computerLoadCancelled
          && waterCoolerLoadCancelled
          && trashCanLoadCancelled
          && cubicleLoadCancelled
          && couchLoadCancelled
          && glassesLoadCancelled
        ) return;
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const roomEnvironment = new RoomEnvironment();
        const officeEnvironment = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
        roomEnvironment.dispose();
        pmremGenerator.dispose();
        disposables.push(officeEnvironment);
        const loader = new GLTFLoader();
        loader.load(
          CUBICLE_GLB_PATH,
          (gltf) => {
            if (cubicleLoadCancelled) {
              disposeObject(gltf.scene);
              return;
            }
            // The supplied model is authored open toward +X; rotate that opening to
            // +Z so its visible panels line up with the static cubicle colliders.
            const existingOffsetX = activeCubicleVisual.position.x - activeCubicleHomePosition.x;
            const existingOffsetZ = activeCubicleVisual.position.z - activeCubicleHomePosition.z;
            gltf.scene.rotation.y = -Math.PI / 2;
            cubicleObject = fitCubicleObject(gltf.scene);
            activeCubicleHomePosition.copy(cubicleObject.position);
            cubicleObject.position.x += existingOffsetX;
            cubicleObject.position.z += existingOffsetZ;
            cubicleObject.updateMatrixWorld(true);
            replaceTabletopCollider(cubicleObject);
            scene.remove(fallbackCubicle);
            scene.add(cubicleObject);
            activeCubicleVisual = cubicleObject;
          },
          undefined,
          () => {
            // Keep the lightweight built-in cubicle if the supplied GLB cannot load.
          },
        );
        loader.load(
          COUCH_GLB_PATH,
          (gltf) => {
            if (couchLoadCancelled) {
              disposeObject(gltf.scene);
              return;
            }
            gltf.scene.traverse((child) => {
              if (!(child instanceof THREE.Mesh)) return;
              const previousMaterials = Array.isArray(child.material) ? child.material : [child.material];
              child.material = waitingCouchMaterial;
              previousMaterials.forEach((material) => material.dispose());
            });
            waitingRoomCouchObject = centerAndScaleObject(gltf.scene, 5.1);
            const secondCouchObject = waitingRoomCouchObject.clone(true);
            replaceRoomPropVisual(waitingRoomLeftCouchProp, waitingRoomCouchObject, Math.PI / 2);
            replaceRoomPropVisual(waitingRoomRightCouchProp, secondCouchObject, -Math.PI / 2);
          },
          undefined,
          () => {
            // The simple upholstered fallback keeps the scene composed if the
            // optional couch model is unavailable.
          },
        );
        loader.load(
          GOGGLES_GLB_PATH,
          (gltf) => {
            if (glassesLoadCancelled) {
              disposeObject(gltf.scene);
              return;
            }

            gltf.scene.traverse((child) => {
              if (!(child instanceof THREE.Mesh)) return;
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((material) => {
                if (!(material instanceof THREE.MeshStandardMaterial)) return;
                const materialName = material.name.toLowerCase();
                const isLens = child.name.toLowerCase().includes('lenses')
                  || materialName.includes('chrome black')
                  || materialName.includes('lens');
                material.metalness = 1;
                material.roughness = isLens ? 0.025 : 0.11;
                material.envMap = officeEnvironment;
                material.envMapIntensity = isLens ? 1.45 : 1.18;
                if (isLens) material.color.set(0x090b0e);
                material.needsUpdate = true;
              });
            });

            glassesObject = centerAndScaleObject(gltf.scene, 3);
            const half = measuredHalfExtents(
              glassesObject,
              new THREE.Vector3(1.68, 0.62, 0.48),
            );
            const initialRotation = new CANNON.Quaternion();
            initialRotation.setFromEuler(-0.18, 0.26, -0.08);
            const glassesToy = createBodyObject(
              glassesObject,
              half,
              new CANNON.Box(new CANNON.Vec3(
                Math.max(0.26, half.x * 0.9),
                Math.max(0.16, half.y * 0.82),
                Math.max(0.16, half.z * 0.82),
              )),
              2.8,
              new THREE.Vector3(2.55, FLOOR_Y + 4.2, 2.75),
              initialRotation,
            );
            glassesToy.body.velocity.set(0.12, -0.2, -0.06);
            glassesToy.body.angularVelocity.set(0.24, 0.42, -0.18);
            glassesToy.body.linearDamping = 0.12;
            glassesToy.body.angularDamping = 0.24;
          },
          undefined,
          () => undefined,
        );
        loader.load(
          BOX_GLB_PATH,
          (gltf) => {
            boxLoadComplete = true;
            if (boxLoadCancelled) {
              disposeObject(gltf.scene);
              return;
            }
            applyBoxMaterials(gltf.scene);
            boxTemplate = centerAndScaleObject(gltf.scene, 0.64);
            pendingBoxSpawns.splice(0).forEach(({ position, scale }) => {
              createBox(position, scale);
            });
          },
          undefined,
          () => {
            boxLoadComplete = true;
            boxTemplate = null;
            pendingBoxSpawns.splice(0).forEach(({ position, scale }) => {
              createBox(position, scale);
            });
          },
        );
        loader.load(
          DUCK_GLB_PATH,
          (gltf) => {
            if (duckLoadCancelled) {
              disposeObject(gltf.scene);
              return;
            }
            duckTemplate = centerAndScaleObject(gltf.scene, 0.52);
            const queuedPositions = pendingDuckPositions.splice(0);
            queuedPositions.forEach((position) => {
              createDuck(position);
            });
          },
          undefined,
          () => {
            duckTemplate = null;
          },
        );
        loader.load(
          COMPUTER_GLB_PATH,
          (gltf) => {
            if (computerLoadCancelled) {
              disposeObject(gltf.scene);
              return;
            }
            gltf.scene.rotation.y = -Math.PI / 2;
            applyComputerScreenMaterial(gltf.scene);
            computerTemplate = centerAndScaleObject(gltf.scene, 1.1);
            const queuedPositions = pendingComputerPositions.splice(0);
            queuedPositions.forEach((position) => {
              createMonitor(position);
            });
          },
          undefined,
          () => {
            computerTemplate = null;
          },
        );
        loader.load(
          WATER_COOLER_GLB_PATH,
          (gltf) => {
            waterCoolerLoadComplete = true;
            if (waterCoolerLoadCancelled) {
              disposeObject(gltf.scene);
              return;
            }
            waterCoolerTemplate = centerAndScaleObject(gltf.scene, 2.9);
            replaceRoomPropVisual(waitingRoomCoolerProp, waterCoolerTemplate.clone(true), -0.18);
            pendingWaterCoolerPositions.splice(0).forEach((position) => {
              createWaterCooler(position);
            });
          },
          undefined,
          () => {
            waterCoolerLoadComplete = true;
            waterCoolerTemplate = null;
            pendingWaterCoolerPositions.splice(0).forEach((position) => {
              createWaterCooler(position);
            });
          },
        );
        loader.load(
          TRASH_CAN_GLB_PATH,
          (gltf) => {
            trashCanLoadComplete = true;
            if (trashCanLoadCancelled) {
              disposeObject(gltf.scene);
              return;
            }
            trashCanTemplate = centerAndScaleObject(gltf.scene, 0.72);
            pendingTrashCanPositions.splice(0).forEach((position) => {
              createTrashCan(position);
            });
          },
          undefined,
          () => {
            trashCanLoadComplete = true;
            trashCanTemplate = null;
            pendingTrashCanPositions.splice(0).forEach((position) => {
              createTrashCan(position);
            });
          },
        );
      })
      .catch(() => {
        duckTemplate = null;
        boxLoadComplete = true;
        boxTemplate = null;
        computerTemplate = null;
        waterCoolerLoadComplete = true;
        waterCoolerTemplate = null;
        trashCanLoadComplete = true;
        trashCanTemplate = null;
        pendingWaterCoolerPositions.splice(0).forEach((position) => {
          createWaterCooler(position);
        });
        pendingTrashCanPositions.splice(0).forEach((position) => {
          createTrashCan(position);
        });
      });

    function createBodyObject(
      object: THREE.Object3D,
      half: THREE.Vector3,
      shape: CANNON.Shape,
      mass: number,
      position: THREE.Vector3,
      quaternion?: CANNON.Quaternion,
      collection: ToyBody[] = toys,
    ): ToyBody {
      applyMeshFlags(object);
      const body = new CANNON.Body({
        mass,
        material: toyMaterial,
        position: cannonVec(position),
        shape,
      });
      if (quaternion) body.quaternion.copy(quaternion);
      body.linearDamping = 0.08;
      body.angularDamping = 0.18;
      body.allowSleep = true;
      body.sleepSpeedLimit = 0.12;
      body.sleepTimeLimit = 0.45;
      body.velocity.set((Math.random() - 0.5) * 0.45, 0, (Math.random() - 0.5) * 0.45);
      body.angularVelocity.set((Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.45);

      const toy: ToyBody = { object, body, half, mass };
      setBodyReference(toy);
      collection.push(toy);
      scene.add(object);
      world.addBody(body);
      syncVisual(toy);
      return toy;
    }

    function createJobsTitle(): ToyBody {
      const half = measuredHalfExtents(
        jobsWord,
        new THREE.Vector3(jobsWordWidth * 0.46, jobsWordHeight * 0.46, jobsWordDepth * 0.5),
      );
      const initialRotation = new CANNON.Quaternion();
      initialRotation.setFromEuler(-0.04, 0.08, -0.05);
      const titleToy = createBodyObject(
        jobsWord,
        half,
        new CANNON.Box(new CANNON.Vec3(
          Math.max(0.3, half.x * 0.96),
          Math.max(0.22, half.y * 0.94),
          Math.max(0.12, half.z * 0.9),
        )),
        3.4,
        new THREE.Vector3(
          mountElement.clientWidth < 768 ? 1.1 : 0.35,
          2.2,
          2.55,
        ),
        initialRotation,
      );
      titleToy.body.velocity.set(0.08, -0.08, -0.03);
      titleToy.body.angularVelocity.set(0.04, 0.08, -0.04);
      titleToy.body.linearDamping = 0.16;
      titleToy.body.angularDamping = 0.34;
      return titleToy;
    }

    function createToy(kind: ToyKind, position: THREE.Vector3): ToyBody | null {
      if (kind === 'ball') {
        return createBodyObject(
          new THREE.Mesh(ballGeometry, ballMaterial),
          new THREE.Vector3(0.27, 0.27, 0.27),
          new CANNON.Sphere(0.27),
          0.45,
          position,
        );
      }

      if (kind === 'paper') {
        const paper = new THREE.Mesh(paperGeometry, paperMaterial);
        paper.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        );
        return createBodyObject(
          paper,
          new THREE.Vector3(0.21, 0.2, 0.21),
          new CANNON.Sphere(0.2),
          0.06,
          position,
        );
      }

      if (kind === 'water-cooler') {
        return createWaterCooler(position);
      }

      if (kind === 'trash-can') {
        return createTrashCan(position);
      }

      if (kind === 'duck') {
        return createDuck(position);
      }

      return createBox(position, randomBoxScale());
    }

    function createBox(position: THREE.Vector3, scale = 1): ToyBody | null {
      if (!boxTemplate && !boxLoadComplete) {
        pendingBoxSpawns.push({ position: position.clone(), scale });
        return null;
      }

      const object = boxTemplate ? boxTemplate.clone(true) : new THREE.Mesh(boxGeometry, cardboardMaterial);
      object.scale.multiplyScalar(scale);
      const half = measuredHalfExtents(object, new THREE.Vector3(0.31 * scale, 0.31 * scale, 0.31 * scale));

      return createBodyObject(
        object,
        half,
        new CANNON.Box(new CANNON.Vec3(half.x * 0.96, half.y * 0.96, half.z * 0.96)),
        Math.max(0.55, scale ** 3),
        position,
      );
    }

    function createDuck(position: THREE.Vector3): ToyBody | null {
      if (!duckTemplate) {
        pendingDuckPositions.push(position.clone());
        return null;
      }

      const group = duckTemplate.clone(true);
      const half = measuredHalfExtents(group, new THREE.Vector3(0.26, 0.2, 0.18));
      return createBodyObject(
        group,
        half,
        new CANNON.Box(new CANNON.Vec3(half.x * 0.94, half.y * 0.94, half.z * 0.94)),
        0.38,
        position,
      );
    }

    function createMonitor(position: THREE.Vector3): ToyBody | null {
      if (!computerTemplate) {
        pendingComputerPositions.push(position.clone());
        return null;
      }

      const object = computerTemplate.clone(true);
      const half = measuredHalfExtents(object, new THREE.Vector3(0.7, 0.82, 0.62));
      return createBodyObject(
        object,
        half,
        new CANNON.Box(new CANNON.Vec3(half.x * 0.94, half.y * 0.96, half.z * 0.94)),
        1.4,
        position,
      );
    }

    function createWaterCooler(position: THREE.Vector3): ToyBody | null {
      if (!waterCoolerTemplate && !waterCoolerLoadComplete) {
        pendingWaterCoolerPositions.push(position.clone());
        return null;
      }

      let object: THREE.Object3D;
      if (waterCoolerTemplate) {
        object = waterCoolerTemplate.clone(true);
      } else {
        const fallback = new THREE.Group();
        const cabinet = new THREE.Mesh(coolerBodyGeometry, waterCoolerFallbackMaterial);
        cabinet.position.y = -0.28;
        const bottle = new THREE.Mesh(coolerBottleGeometry, waterBottleFallbackMaterial);
        bottle.position.y = 0.43;
        fallback.add(cabinet, bottle);
        fallback.scale.setScalar(1.58);
        object = fallback;
      }

      const half = measuredHalfExtents(object, new THREE.Vector3(0.34, 0.8, 0.34));
      return createBodyObject(
        object,
        half,
        new CANNON.Box(new CANNON.Vec3(half.x * 0.94, half.y * 0.98, half.z * 0.94)),
        4.5,
        position,
      );
    }

    function createTrashCan(position: THREE.Vector3): ToyBody | null {
      if (!trashCanTemplate && !trashCanLoadComplete) {
        pendingTrashCanPositions.push(position.clone());
        return null;
      }

      let object: THREE.Object3D;
      if (trashCanTemplate) {
        object = trashCanTemplate.clone(true);
      } else {
        const fallback = new THREE.Group();
        const sides = new THREE.Mesh(trashCanGeometry, trashCanFallbackMaterial);
        const bottom = new THREE.Mesh(trashCanBottomGeometry, trashCanFallbackMaterial);
        bottom.position.y = -0.425;
        fallback.add(sides, bottom);
        fallback.scale.setScalar(0.78);
        object = fallback;
      }

      const half = measuredHalfExtents(object, new THREE.Vector3(0.38, 0.5, 0.38));
      return createBodyObject(
        object,
        half,
        new CANNON.Box(new CANNON.Vec3(half.x * 0.94, half.y * 0.97, half.z * 0.94)),
        0.5,
        position,
      );
    }

    function createCardboardBox(position: THREE.Vector3): ToyBody {
      const group = new THREE.Group();
      const box = new THREE.Mesh(bigBoxGeometry, cardboardMaterial);
      const topTape = new THREE.Mesh(boxTapeGeometry, tapeMaterial);
      topTape.position.y = 0.602;
      const frontTape = new THREE.Mesh(boxFrontTapeGeometry, tapeMaterial);
      frontTape.position.set(0, 0.12, 0.54);
      const label = new THREE.Mesh(boxLabelGeometry, labelMaterial);
      label.position.set(-0.24, 0.08, 0.56);
      group.add(box, topTape, frontTape, label);

      [
        { x: -0.31, z: 0, rz: -0.24 },
        { x: 0.31, z: 0, rz: 0.24 },
        { x: 0, z: -0.29, rx: 0.22 },
        { x: 0, z: 0.29, rx: -0.22 },
      ].forEach((flap) => {
        const mesh = new THREE.Mesh(boxFlapGeometry, cardboardMaterial);
        mesh.position.set(flap.x, 0.64, flap.z);
        mesh.rotation.set(flap.rx ?? 0, 0, flap.rz ?? 0);
        group.add(mesh);
      });

      return createBodyObject(group, new THREE.Vector3(0.62, 0.72, 0.58), new CANNON.Box(new CANNON.Vec3(0.62, 0.72, 0.58)), 1.8, position);
    }

    function createPlant(position: THREE.Vector3): ToyBody {
      const group = furniture.plant();
      group.scale.setScalar(0.48);
      const object = centerWaitingRoomObject(group);
      const half = measuredHalfExtents(object, new THREE.Vector3(0.24, 0.61, 0.24));
      return createBodyObject(
        object,
        half,
        new CANNON.Box(new CANNON.Vec3(half.x * 0.94, half.y * 0.96, half.z * 0.94)),
        0.6,
        position,
      );
    }

    function clearBodies(): void {
      while (toys.length) {
        const toy = toys.pop();
        if (!toy) continue;
        scene.remove(toy.object);
        world.removeBody(toy.body);
      }
    }

    function restoreRoomProps(): void {
      roomProps.forEach((prop) => {
        prop.body.type = CANNON.Body.DYNAMIC;
        prop.body.mass = prop.mass;
        prop.body.updateMassProperties();
        prop.body.position.copy(prop.homePosition);
        prop.body.quaternion.copy(prop.homeQuaternion);
        prop.body.velocity.set(0, 0, 0);
        prop.body.angularVelocity.set(0, 0, 0);
        prop.body.force.set(0, 0, 0);
        prop.body.torque.set(0, 0, 0);
        prop.body.wakeUp();
        syncVisual(prop);
      });
    }

    function resetBodies(): void {
      clearBodies();
      translateCubicle(
        activeCubicleHomePosition.x - activeCubicleVisual.position.x,
        activeCubicleHomePosition.z - activeCubicleVisual.position.z,
      );
      orbitYaw = DEFAULT_ORBIT_YAW;
      orbitPitch = DEFAULT_ORBIT_PITCH;
      zoom = DEFAULT_ZOOM;
      applyCameraPose();
      restoreRoomProps();
      pendingDuckPositions.length = 0;
      pendingBoxSpawns.length = 0;
      pendingComputerPositions.length = 0;
      pendingWaterCoolerPositions.length = 0;
      pendingTrashCanPositions.length = 0;

      createJobsTitle();

      // Start every object over the cubicle's open center. The small offsets avoid
      // perfect interpenetration without turning the reset into a room-wide scatter.
      createPlant(new THREE.Vector3(-0.18, FLOOR_Y + 1.12, CUBICLE_SPAWN_Z + 0.1));
      createBox(new THREE.Vector3(0.16, FLOOR_Y + 2.42, CUBICLE_SPAWN_Z - 0.12), 1.14);
      createMonitor(new THREE.Vector3(-0.14, FLOOR_Y + 3.94, CUBICLE_SPAWN_Z + 0.08));
      createBox(new THREE.Vector3(-0.2, FLOOR_Y + 5.92, CUBICLE_SPAWN_Z + 0.12), 0.86);
      createBox(new THREE.Vector3(0.14, FLOOR_Y + 6.68, CUBICLE_SPAWN_Z - 0.12), 1.02);
      createToy('paper', new THREE.Vector3(-0.18, FLOOR_Y + 7.5, CUBICLE_SPAWN_Z + 0.1));
      const cooler = createToy('water-cooler', new THREE.Vector3(0.18, FLOOR_Y + 8.5, CUBICLE_SPAWN_Z - 0.08));
      if (cooler) cooler.body.quaternion.setFromEuler(0, 0, Math.PI / 8);
      createToy('trash-can', new THREE.Vector3(-0.12, FLOOR_Y + 9.55, CUBICLE_SPAWN_Z + 0.06));
      createToy('paper', new THREE.Vector3(0.16, FLOOR_Y + 10.28, CUBICLE_SPAWN_Z - 0.1));
      createDuck(new THREE.Vector3(-0.14, FLOOR_Y + 11, CUBICLE_SPAWN_Z + 0.08));
    }

    function addToy(kind: ToyKind): void {
      const toy = createToy(
        kind,
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.56,
          FLOOR_Y + 4.65,
          CUBICLE_SPAWN_Z + (Math.random() - 0.5) * 0.56,
        ),
      );
      if (!toy) return;
      toy.body.velocity.set((Math.random() - 0.5) * 1.2, 0.5, (Math.random() - 0.5) * 1.2);
      toy.body.wakeUp();
    }

    function scatterBodies(): void {
      [...toys, ...roomProps].forEach((toy) => {
        toy.body.type = CANNON.Body.DYNAMIC;
        toy.body.mass = toy.mass;
        toy.body.updateMassProperties();
        toy.body.velocity.set((Math.random() - 0.5) * 5.4, 3.2 + Math.random() * 2.2, (Math.random() - 0.5) * 4.4);
        toy.body.angularVelocity.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
        toy.body.wakeUp();
      });
    }

    actionsRef.current = {
      addBox: () => addToy('box'),
      addBall: () => addToy('ball'),
      addPaper: () => addToy('paper'),
      addWaterCooler: () => addToy('water-cooler'),
      addTrashCan: () => addToy('trash-can'),
      addDuck: () => {
        playDuckQuack(duckAudioPoolRef, duckAudioIndexRef);
        addToy('duck');
      },
      reset: resetBodies,
      scatter: scatterBodies,
    };

    resetBodies();

    const jobStarGeometry = new THREE.ExtrudeGeometry(createJobStarShape(), {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.035,
      curveSegments: 2,
    });
    jobStarGeometry.translate(0, 0, -0.06);
    const jobGlowTexture = createJobGlowTexture();
    const jobStarHitMaterial = new THREE.SpriteMaterial({
      transparent: true,
      opacity: 0.001,
      depthWrite: false,
    });
    disposables.push(
      jobStarGeometry,
      jobGlowTexture,
      jobStarHitMaterial,
    );

    const jobStars: JobStar[] = jobs.map((job, index) => {
      const defaultPosition = DEFAULT_JOB_POSITIONS[index % DEFAULT_JOB_POSITIONS.length];
      const position = new THREE.Vector3(
        clamp(job.position?.x ?? defaultPosition[0], -5.2, 5.2),
        clamp(job.position?.y ?? defaultPosition[1], FLOOR_Y + 1, 4.6),
        clamp(job.position?.z ?? defaultPosition[2], -4.9, 4.9),
      );
      const root = new THREE.Group();
      root.name = `job-star-${job.key}`;
      const starColor = resolveJobStarColor(job.starColor);

      const spinner = new THREE.Group();
      const glowMaterial = new THREE.SpriteMaterial({
        map: jobGlowTexture,
        color: starColor,
        transparent: true,
        opacity: 0.76,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      disposables.push(glowMaterial);
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.set(1.85, 1.85, 1);
      glow.position.z = -0.08;

      const material = new THREE.MeshBasicMaterial({
        color: starColor,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      disposables.push(material);
      const star = new THREE.Mesh(jobStarGeometry, material);
      const hitArea = new THREE.Sprite(jobStarHitMaterial);
      hitArea.scale.set(1.42, 1.42, 1);
      hitArea.userData.jobKey = job.key;
      spinner.add(star);
      root.add(glow, spinner, hitArea);
      const toy = createBodyObject(
        root,
        new THREE.Vector3(0.56, 0.56, 0.12),
        new CANNON.Sphere(0.5),
        0.34,
        position,
        undefined,
        jobStarBodies,
      );
      toy.jobKey = job.key;
      toy.body.fixedRotation = true;
      toy.body.updateMassProperties();
      toy.body.linearDamping = 0.12;
      toy.body.angularDamping = 1;
      toy.body.allowSleep = false;
      toy.body.velocity.set(0, 0, 0);
      toy.body.angularVelocity.set(0, 0, 0);
      star.castShadow = false;
      star.receiveShadow = false;
      hitArea.castShadow = false;
      hitArea.receiveShadow = false;

      return {
        key: job.key,
        root,
        spinner,
        hitArea,
        toy,
        homePosition: position.clone(),
        phase: index * 1.37,
        offscreenFor: 0,
        recovering: false,
      };
    });
    mountElement.dataset.jobStarCount = String(jobStars.length);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const dragPoint = new THREE.Vector3();
    const selectedOffset = new THREE.Vector3();
    const selectedLastPosition = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    const starProjection = new THREE.Vector3();
    const jobLabelProjection = new THREE.Vector3();
    const detailAnchor = new THREE.Vector3();
    const detailProjection = new THREE.Vector3();
    let selectedBody: ToyBody | null = null;
    let selectedCubicle = false;
    let selectedPointerId: number | null = null;
    let selectedLastTime = performance.now();
    let selectedMoved = false;
    let selectedStartX = 0;
    let selectedStartY = 0;
    let orbitActive = false;
    let orbitPointerId: number | null = null;
    let orbitLastX = 0;
    let orbitLastY = 0;
    let selectedJobKey: string | null = null;
    let detailAnchorKey: string | null = null;
    const activePointers = new Map<number, { x: number; y: number }>();
    let pinchDistance = 0;

    clearSelectionRef.current = () => {
      selectedJobKey = null;
      detailAnchorKey = null;
      setActiveJobKey(null);
    };

    function currentPinchDistance(): number {
      const [first, second] = Array.from(activePointers.values());
      if (!first || !second) return 0;
      return Math.hypot(second.x - first.x, second.y - first.y);
    }

    function releaseSelectedBody(activateJob = false): void {
      const releasedBody = selectedBody;
      if (releasedBody) {
        releasedBody.body.type = CANNON.Body.DYNAMIC;
        releasedBody.body.mass = releasedBody.mass;
        releasedBody.body.updateMassProperties();
        releasedBody.body.velocity.scale(1.18, releasedBody.body.velocity);
        releasedBody.body.angularVelocity.scale(1.35, releasedBody.body.angularVelocity);
        releasedBody.body.wakeUp();
      }
      if (activateJob && releasedBody?.jobKey) {
        selectedJobKey = releasedBody.jobKey;
        detailAnchorKey = null;
        setActiveJobKey(releasedBody.jobKey);
      }
      selectedBody = null;
      selectedMoved = false;
      selectedCubicle = false;
      selectedPointerId = null;
    }

    function updatePointer(event: PointerEvent): void {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onPointerDown(event: PointerEvent): void {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      renderer.domElement.setPointerCapture(event.pointerId);

      if (activePointers.size >= 2) {
        releaseSelectedBody();
        orbitActive = false;
        orbitPointerId = null;
        pinchDistance = currentPinchDistance();
        return;
      }

      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(
        [...toys, ...jobStarBodies, ...roomProps].map((toy) => toy.object),
        true,
      );
      const hit = intersections.find((intersection) => intersection.object.userData.toyBody);
      const cubicleHit = hit
        ? null
        : raycaster.intersectObject(activeCubicleVisual, true)[0] ?? null;

      if (!hit && !cubicleHit) {
        if (selectedJobKey) {
          selectedJobKey = null;
          setActiveJobKey(null);
        }
        orbitActive = true;
        orbitPointerId = event.pointerId;
        orbitLastX = event.clientX;
        orbitLastY = event.clientY;
        return;
      }

      if (cubicleHit) {
        selectedCubicle = true;
        selectedPointerId = event.pointerId;
        selectedOffset.set(
          activeCubicleVisual.position.x - cubicleHit.point.x,
          0,
          activeCubicleVisual.position.z - cubicleHit.point.z,
        );
        dragPlane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 1, 0),
          cubicleHit.point,
        );
        return;
      }

      if (!hit) return;

      const toy = hit.object.userData.toyBody as ToyBody;
      selectedBody = toy;
      selectedPointerId = event.pointerId;
      selectedMoved = false;
      selectedStartX = event.clientX;
      selectedStartY = event.clientY;
      toy.body.type = CANNON.Body.KINEMATIC;
      toy.body.mass = 0;
      toy.body.updateMassProperties();
      toy.body.velocity.set(0, 0, 0);
      toy.body.angularVelocity.set(0, 0, 0);
      toy.body.wakeUp();

      selectedOffset.subVectors(toy.object.position, hit.point);
      selectedLastPosition.copy(toy.object.position);
      selectedLastTime = performance.now();
      camera.getWorldDirection(cameraDirection);
      dragPlane.setFromNormalAndCoplanarPoint(cameraDirection.multiplyScalar(-1), hit.point);
    }

    function onPointerMove(event: PointerEvent): void {
      if (activePointers.has(event.pointerId)) {
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }

      if (activePointers.size === 0) {
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        const isOverJob = raycaster.intersectObjects(
          jobStars.map((jobStar) => jobStar.hitArea),
          false,
        ).length > 0;
        renderer.domElement.style.cursor = isOverJob ? 'pointer' : 'grab';
      }

      if (activePointers.size >= 2) {
        const nextDistance = currentPinchDistance();
        if (pinchDistance > 0 && nextDistance > 0) {
          zoomCamera(pinchDistance / nextDistance);
        }
        pinchDistance = nextDistance;
        return;
      }

      if (selectedCubicle && selectedPointerId === event.pointerId) {
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;

        const roomLimitX = roomHalfWidth - CUBICLE_FOOTPRINT / 2 - 0.45;
        const roomLimitZ = roomHalfDepth - CUBICLE_FOOTPRINT / 2 - 0.45;
        const nextX = clamp(
          dragPoint.x + selectedOffset.x,
          activeCubicleHomePosition.x - roomLimitX,
          activeCubicleHomePosition.x + roomLimitX,
        );
        const nextZ = clamp(
          dragPoint.z + selectedOffset.z,
          activeCubicleHomePosition.z - roomLimitZ,
          activeCubicleHomePosition.z + roomLimitZ,
        );
        const deltaX = nextX - activeCubicleVisual.position.x;
        const deltaZ = nextZ - activeCubicleVisual.position.z;
        translateCubicle(deltaX, deltaZ);
        return;
      }

      if (selectedBody && selectedPointerId === event.pointerId) {
        if (Math.hypot(event.clientX - selectedStartX, event.clientY - selectedStartY) > 7) {
          selectedMoved = true;
        }
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;

        const now = performance.now();
        const elapsed = Math.max(16, now - selectedLastTime) / 1000;
        const target = dragPoint.add(selectedOffset);
        selectedBody.body.position.set(target.x, target.y, target.z);
        clampDraggedBody(selectedBody);

        const currentPosition = selectedBody.body.position;
        selectedBody.body.velocity.set(
          (currentPosition.x - selectedLastPosition.x) / elapsed,
          (currentPosition.y - selectedLastPosition.y) / elapsed,
          (currentPosition.z - selectedLastPosition.z) / elapsed,
        );
        selectedBody.body.angularVelocity.set(
          selectedBody.body.velocity.z * 1.9,
          selectedBody.body.velocity.x * 1.2,
          -selectedBody.body.velocity.x * 1.8,
        );
        selectedLastPosition.set(currentPosition.x, currentPosition.y, currentPosition.z);
        syncVisual(selectedBody);
        selectedLastTime = now;
        return;
      }

      if (!orbitActive || orbitPointerId !== event.pointerId) return;
      const dx = event.clientX - orbitLastX;
      const dy = event.clientY - orbitLastY;
      orbitLastX = event.clientX;
      orbitLastY = event.clientY;
      orbitYaw = clamp(orbitYaw - dx * 0.006, MIN_ORBIT_YAW, MAX_ORBIT_YAW);
      orbitPitch = clamp(orbitPitch + dy * 0.005, MIN_ORBIT_PITCH, MAX_ORBIT_PITCH);
      applyCameraPose();
    }

    function onWheel(event: WheelEvent): void {
      event.preventDefault();
      zoomCamera(Math.exp(event.deltaY * 0.001));
    }

    function releasePointer(event: PointerEvent): void {
      activePointers.delete(event.pointerId);
      if (selectedPointerId === event.pointerId) {
        releaseSelectedBody(event.type === 'pointerup' && !selectedMoved);
      }
      if (orbitPointerId === event.pointerId || activePointers.size < 2) {
        orbitActive = false;
        orbitPointerId = null;
      }
      pinchDistance = activePointers.size >= 2 ? currentPinchDistance() : 0;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', releasePointer);
    renderer.domElement.addEventListener('pointercancel', releasePointer);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    function resize(): void {
      const width = Math.max(1, mountElement.clientWidth);
      const height = Math.max(1, mountElement.clientHeight);
      const isCompact = width < 768;
      renderer.shadowMap.enabled = !isCompact;
      key.castShadow = !isCompact;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCompact ? 1 : 1.25));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      applyCameraPose();
    }

    const clock = new THREE.Clock();
    let animationFrame = 0;

    function render(): void {
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      jobStars.forEach((jobStar) => {
        const body = jobStar.toy.body;
        if (body.type !== CANNON.Body.DYNAMIC) return;
        const home = jobStar.homePosition;
        const dx = body.position.x - home.x;
        const dy = body.position.y - home.y;
        const dz = body.position.z - home.z;
        const distanceFromHomeSq = dx * dx + dy * dy + dz * dz;
        starProjection.set(body.position.x, body.position.y, body.position.z).project(camera);
        const outsideRoom = Math.abs(body.position.x) > roomHalfWidth - 0.48
          || Math.abs(body.position.z) > roomHalfDepth - 0.48
          || body.position.y < FLOOR_Y - 0.4
          || body.position.y > FLOOR_Y + OFFICE_ROOM_HEIGHT - 0.48;
        const outsideViewport = starProjection.z < -1
          || starProjection.z > 1
          || Math.abs(starProjection.x) > 1.22
          || Math.abs(starProjection.y) > 1.22;

        if (outsideRoom || (outsideViewport && distanceFromHomeSq > 1)) {
          jobStar.offscreenFor += delta;
        } else {
          jobStar.offscreenFor = Math.max(0, jobStar.offscreenFor - delta * 2);
        }
        if (jobStar.offscreenFor > 0.32) jobStar.recovering = true;

        const hoverY = home.y + Math.sin(elapsed * 1.15 + jobStar.phase) * 0.1;
        body.force.y += body.mass * -GRAVITY;
        if (jobStar.recovering) {
          const spring = 12;
          const damping = 3.4;
          body.force.x += body.mass * ((home.x - body.position.x) * spring - body.velocity.x * damping);
          body.force.y += body.mass * ((hoverY - body.position.y) * spring - body.velocity.y * damping);
          body.force.z += body.mass * ((home.z - body.position.z) * spring - body.velocity.z * damping);
          if (distanceFromHomeSq < 0.1 && body.velocity.lengthSquared() < 0.45) {
            jobStar.recovering = false;
            jobStar.offscreenFor = 0;
          }
        } else {
          body.force.y += body.mass * ((hoverY - body.position.y) * 5.2 - body.velocity.y * 1.55);
        }
      });
      world.step(1 / 60, delta, 3);
      toys.forEach(syncVisual);
      jobStarBodies.forEach(syncVisual);
      roomProps.forEach(syncVisual);

      const viewportWidth = Math.max(1, mountElement.clientWidth);
      const viewportHeight = Math.max(1, mountElement.clientHeight);
      jobStars.forEach((jobStar, index) => {
        const isActive = selectedJobKey === jobStar.key;
        jobStar.spinner.rotation.y = elapsed * (0.28 + (index % 3) * 0.025) + jobStar.phase * 0.28;
        const targetScale = isActive ? 1.38 : 1;
        const scaleEase = 1 - Math.exp(-delta * 10);
        const currentScale = THREE.MathUtils.lerp(jobStar.root.scale.x, targetScale, scaleEase);
        jobStar.root.scale.setScalar(currentScale);
        const pulse = 1 + Math.sin(elapsed * 3.2 + jobStar.phase) * 0.035;
        jobStar.spinner.scale.setScalar(pulse);

        const label = jobLabelRefs.current.get(jobStar.key);
        if (label) {
          jobLabelProjection.copy(jobStar.root.position).project(camera);
          const projectedX = (jobLabelProjection.x * 0.5 + 0.5) * viewportWidth;
          const projectedY = (-jobLabelProjection.y * 0.5 + 0.5) * viewportHeight
            + (viewportWidth < 640 ? 42 : 56);
          const labelHalfWidth = label.offsetWidth * 0.5;
          const labelX = clamp(projectedX, labelHalfWidth + 8, viewportWidth - labelHalfWidth - 8);
          const labelY = clamp(projectedY, 8, viewportHeight - label.offsetHeight - 8);
          label.style.setProperty('--job-label-x', `${labelX}px`);
          label.style.setProperty('--job-label-y', `${labelY}px`);
          label.style.visibility = jobLabelProjection.z < -1
            || jobLabelProjection.z > 1
            || Math.abs(jobLabelProjection.x) > 1.14
            || Math.abs(jobLabelProjection.y) > 1.14
            ? 'hidden'
            : 'visible';
        }
      });

      const activeStar = selectedJobKey
        ? jobStars.find((jobStar) => jobStar.key === selectedJobKey)
        : null;
      if (activeStar && detailRef.current) {
        if (detailAnchorKey !== activeStar.key) {
          detailAnchor.copy(activeStar.root.position);
          detailAnchorKey = activeStar.key;
        }
        const projected = detailProjection.copy(detailAnchor).project(camera);
        const width = Math.max(1, mountElement.clientWidth);
        const height = Math.max(1, mountElement.clientHeight);
        const panelHalfWidth = width < 640 ? 154 : 184;
        const x = clamp((projected.x * 0.5 + 0.5) * width, panelHalfWidth, width - panelHalfWidth);
        const y = clamp((-projected.y * 0.5 + 0.5) * height + 24, 92, Math.max(92, height - 280));
        detailRef.current.style.setProperty('--job-detail-x', `${x}px`);
        detailRef.current.style.setProperty('--job-detail-y', `${y}px`);
        detailRef.current.style.visibility = projected.z > 1 ? 'hidden' : 'visible';
      } else {
        detailAnchorKey = null;
      }

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    }

    resize();
    render();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mountElement);

    return () => {
      effectDisposed = true;
      duckLoadCancelled = true;
      boxLoadCancelled = true;
      computerLoadCancelled = true;
      waterCoolerLoadCancelled = true;
      trashCanLoadCancelled = true;
      cubicleLoadCancelled = true;
      couchLoadCancelled = true;
      glassesLoadCancelled = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', releasePointer);
      renderer.domElement.removeEventListener('pointercancel', releasePointer);
      renderer.domElement.removeEventListener('wheel', onWheel);
      delete mountElement.dataset.officeWalls;
      delete mountElement.dataset.officeWindows;
      delete mountElement.dataset.jobStarCount;
      clearSelectionRef.current = () => undefined;
      jobStars.forEach((jobStar) => scene.remove(jobStar.root));
      clearBodies();
      while (roomProps.length) {
        const prop = roomProps.pop();
        if (!prop) continue;
        scene.remove(prop.object);
        world.removeBody(prop.body);
      }
      world.bodies.slice().forEach((body) => world.removeBody(body));
      if (duckTemplate) disposeObject(duckTemplate);
      if (boxTemplate) disposeObject(boxTemplate);
      if (computerTemplate) disposeObject(computerTemplate);
      if (waterCoolerTemplate) disposeObject(waterCoolerTemplate);
      if (trashCanTemplate) disposeObject(trashCanTemplate);
      if (cubicleObject) disposeObject(cubicleObject);
      if (waitingRoomCouchObject) disposeObject(waitingRoomCouchObject);
      if (glassesObject) disposeObject(glassesObject);
      renderer.domElement.remove();
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      duckAudioPoolRef.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      duckAudioPoolRef.current = [];
    };
  }, [jobs]);

  return (
    <div
      className={styles.scene}
      data-jobs-office-scene
    >
      <div ref={mountRef} className={styles.viewport}>
        <div className={styles.fallback}>WebGL unavailable</div>
      </div>

      <div className={styles.hud}>
        <div className={styles.jobLabels} aria-hidden="true">
          {jobs.map((job) => (
            <div
              key={job.key}
              ref={(node) => {
                if (node) jobLabelRefs.current.set(job.key, node);
                else jobLabelRefs.current.delete(job.key);
              }}
              className={styles.jobLabel}
              style={{ backgroundColor: resolveJobStarColor(job.starColor) }}
            >
              {job.title}
            </div>
          ))}
        </div>

        {activeJob && (
          <article ref={detailRef} className={styles.detail} data-active-job={activeJob.key}>
            <button
              type="button"
              className={styles.detailClose}
              onClick={() => clearSelectionRef.current()}
              aria-label="Close job details"
            >
              ×
            </button>
            {activeJob.team && <p className={styles.detailTeam}>{activeJob.team}</p>}
            <h2 className={styles.detailTitle}>{activeJob.title}</h2>
            {(activeJob.location || activeJob.employmentType) && (
              <p className={styles.detailMeta}>
                {[activeJob.location, activeJob.employmentType].filter(Boolean).join(' · ')}
              </p>
            )}
            {activeJob.summary && (
              <div className={styles.detailCopy}>
                {activeJob.summary.split(/\n\s*\n/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
            {activeJob.applyUrl && (
              <a
                className={styles.detailLink}
                href={activeJob.applyUrl}
                target={activeJob.applyUrl.startsWith('http') ? '_blank' : undefined}
                rel={activeJob.applyUrl.startsWith('http') ? 'noreferrer' : undefined}
              >
                {activeJob.applyLabel || 'Apply for this role'}
              </a>
            )}
          </article>
        )}

        {jobs.length === 0 && <p className={styles.empty}>{emptyMessage}</p>}
      </div>
    </div>
  );
}
