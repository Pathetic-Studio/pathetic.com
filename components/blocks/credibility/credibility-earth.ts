import * as THREE from "three";

export type CredibilityEarth = {
  resize: (size: number) => void;
  render: (elapsed: number, pointerX: number, pointerY: number) => void;
  dispose: () => void;
};

// Loaded near the viewport. The section owns scheduling, so there is no second RAF.
export async function createCredibilityEarth(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
): Promise<CredibilityEarth> {
  const loader = new THREE.TextureLoader();
  const maps = await Promise.allSettled([
    loader.loadAsync("/images/credibility/earth-day.webp"),
    loader.loadAsync("/images/credibility/earth-clouds.webp"),
  ]);
  const day = maps[0].status === "fulfilled" ? maps[0].value : null;
  const clouds = maps[1].status === "fulfilled" ? maps[1].value : null;
  if (signal.aborted || !day) {
    day?.dispose();
    clouds?.dispose();
    throw new Error("Earth texture unavailable or scene cancelled");
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch (error) {
    day.dispose();
    clouds?.dispose();
    throw error;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  day.colorSpace = THREE.SRGBColorSpace;
  day.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  if (clouds) clouds.colorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    -1.08,
    1.08,
    1.08,
    -1.08,
    0.1,
    20,
  );
  camera.position.z = 4;
  const world = new THREE.Group();
  world.rotation.z = 0.1;
  scene.add(world);
  const geometry = new THREE.SphereGeometry(1, 64, 40);
  const material = new THREE.MeshPhongMaterial({
    map: day,
    shininess: 8,
    specular: new THREE.Color("#354563"),
  });
  const earth = new THREE.Mesh(geometry, material);
  world.add(earth);
  const cloudMaterial = new THREE.MeshPhongMaterial({
    map: clouds,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    shininess: 0,
  });
  const cloudLayer = new THREE.Mesh(geometry, cloudMaterial);
  cloudLayer.scale.setScalar(1.006);
  cloudLayer.visible = Boolean(clouds);
  world.add(cloudLayer);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = -viewPosition.xyz;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 3.0);
        gl_FragColor = vec4(0.22, 0.38, 1.0, rim * 0.55);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(geometry, atmosphereMaterial);
  atmosphere.scale.setScalar(1.018);
  world.add(atmosphere);
  scene.add(new THREE.AmbientLight(0xffffff, 1.35));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(-3, 4, 5);
  scene.add(sun);

  let disposed = false;
  return {
    resize(size) {
      if (!disposed)
        renderer.setSize(
          Math.max(1, Math.round(size)),
          Math.max(1, Math.round(size)),
          false,
        );
    },
    render(elapsed, pointerX, pointerY) {
      if (disposed) return;
      world.rotation.x = 0.12 + pointerY * 0.025;
      world.rotation.y = pointerX * 0.035;
      earth.rotation.y = -Math.PI / 2 + elapsed * 0.055;
      cloudLayer.rotation.y = -Math.PI / 2 + elapsed * 0.062;
      renderer.render(scene, camera);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      day.dispose();
      clouds?.dispose();
      geometry.dispose();
      material.dispose();
      cloudMaterial.dispose();
      atmosphereMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
