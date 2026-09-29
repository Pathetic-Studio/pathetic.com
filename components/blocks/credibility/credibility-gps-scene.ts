import * as THREE from "three";
import { gpsOrbitPoint } from "./credibility-gps-data";

export type GpsScene = ReturnType<typeof createGpsScene>;

/** Line geometry is batched: the entire globe graticule is one draw call. */
function lineGeometry(paths: THREE.Vector3[][], close = false) {
  const points: number[] = [];
  for (const path of paths) {
    for (let i = 0; i < path.length - (close ? 0 : 1); i++) {
      points.push(
        ...path[i].toArray(),
        ...path[(i + 1) % path.length].toArray(),
      );
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points, 3),
  );
  return geometry;
}

export function createGpsScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  // Thin CRT lines work at native resolution; avoid a full-panel supersample.
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.setClearColor(0x020b05, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-9, 9, 3.75, -3.75, 0.1, 40);
  camera.position.z = 18;
  const earth = new THREE.Group();
  scene.add(earth);
  let disposed = false,
    aspect = 2.4,
    compact = false,
    previousTime = 0;
  let pointerX = 0,
    pointerY = 0,
    inclinationX = 0.4,
    inclinationY = -0.2;
  const surface = new THREE.ShaderMaterial({
    uniforms: { map: { value: null }, ready: { value: 0 } },
    vertexShader: `varying vec2 vUv;varying vec3 n;void main(){vUv=uv;n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D map;uniform float ready;varying vec2 vUv;varying vec3 n;
      float land(vec2 uv){vec3 t=texture2D(map,uv).rgb;return smoothstep(.005,.095,max(t.r,t.g)-t.b);}
      void main(){float m=land(vUv)*ready;float edge=clamp(length(vec2(dFdx(m),dFdy(m)))*5.,0.,1.);
      float hatch=1.-smoothstep(.07,.23,abs(fract(vUv.y*120.)-.5));
      float facing=max(n.z,0.);float rim=pow(1.-facing,5.);
      vec3 color=vec3(.004,.025,.014)+vec3(.14,1.,.48)*(m*hatch*.48+edge*.6)*(.35+.65*facing);
      color+=vec3(.08,.6,.32)*rim*.45;gl_FragColor=vec4(color,1.);}`,
  });
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(1.77, 40, 28), surface));
  const texture = new THREE.TextureLoader().load(
    "/images/credibility/earth-day.webp",
    (image) => {
      if (disposed) {
        image.dispose();
        return;
      }
      surface.uniforms.map.value = image;
      surface.uniforms.ready.value = 1;
      if (
        canvas.getBoundingClientRect().bottom > 0 &&
        canvas.getBoundingClientRect().top < innerHeight &&
        !document.hidden
      )
        renderer.render(scene, camera);
    },
  );
  const paths: THREE.Vector3[][] = [];
  const radius = 1.785,
    steps = 80;
  for (let lat = -75; lat <= 75; lat += 15) {
    const a = THREE.MathUtils.degToRad(lat);
    paths.push(
      Array.from({ length: steps }, (_, i) => {
        const t = (i / steps) * Math.PI * 2;
        return new THREE.Vector3(
          radius * Math.cos(a) * Math.cos(t),
          radius * Math.sin(a),
          radius * Math.cos(a) * Math.sin(t),
        );
      }),
    );
  }
  for (let lon = 0; lon < 180; lon += 15) {
    const a = THREE.MathUtils.degToRad(lon);
    paths.push(
      Array.from({ length: steps }, (_, i) => {
        const t = (i / steps) * Math.PI * 2;
        return new THREE.Vector3(
          radius * Math.cos(t) * Math.cos(a),
          radius * Math.sin(t),
          radius * Math.cos(t) * Math.sin(a),
        );
      }),
    );
  }
  earth.add(
    new THREE.LineSegments(
      lineGeometry(paths, true),
      new THREE.LineBasicMaterial({
        color: 0x66ffa1,
        transparent: true,
        opacity: 0.52,
      }),
    ),
  );
  const stars = new Float32Array(220 * 3);
  for (let i = 0; i < 220; i++) {
    stars[i * 3] = (((i * 167 + 23) % 997) / 997 - 0.5) * 28;
    stars[i * 3 + 1] = (((i * 79 + 11) % 991) / 991 - 0.5) * 10;
    stars[i * 3 + 2] = -6;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(stars, 3));
  scene.add(
    new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: 0x82dca1,
        size: 1.1,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.48,
      }),
    ),
  );
  const orbitGeometry = new THREE.BufferGeometry();
  const orbitPositions = new Float32Array(2 * 120 * 2 * 3);
  orbitGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(orbitPositions, 3),
  );
  const logoOrbit = new THREE.LineSegments(
    orbitGeometry,
    new THREE.LineBasicMaterial({
      color: 0x68ff9c,
      transparent: true,
      opacity: 0.3,
    }),
  );
  logoOrbit.matrixAutoUpdate = false;
  scene.add(logoOrbit);
  const satelliteOrbit = new THREE.Group();
  scene.add(satelliteOrbit);
  const orbitRadius = 2.46;
  satelliteOrbit.add(
    new THREE.LineSegments(
      lineGeometry(
        [
          Array.from({ length: 112 }, (_, i) => {
            const t = (i / 112) * Math.PI * 2;
            return new THREE.Vector3(
              Math.cos(t) * orbitRadius,
              Math.sin(t) * orbitRadius,
              0,
            );
          }),
        ],
        true,
      ),
      new THREE.LineBasicMaterial({
        color: 0x97ffc7,
        transparent: true,
        opacity: 0.35,
      }),
    ),
  );
  const satellite = new THREE.Group();
  scene.add(satellite);
  const solid = new THREE.MeshBasicMaterial({ color: 0x123e28 });
  const panelMaterial = new THREE.MeshBasicMaterial({ color: 0x082b1b });
  const satellitePaths: THREE.Vector3[][] = [];
  const addBox = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
  ) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    satellite.add(mesh);
    const edges = new THREE.EdgesGeometry(geometry);
    const a = edges.attributes.position;
    for (let i = 0; i < a.count; i += 2)
      satellitePaths.push([
        new THREE.Vector3(a.getX(i) + x, a.getY(i) + y, a.getZ(i) + z),
        new THREE.Vector3(
          a.getX(i + 1) + x,
          a.getY(i + 1) + y,
          a.getZ(i + 1) + z,
        ),
      ]);
    edges.dispose();
  };
  addBox(0, 0, 0, 0.27, 0.36, 0.24, solid);
  for (const side of [-1, 1]) {
    addBox(side * 0.43, 0, 0, 0.48, 0.32, 0.035, panelMaterial);
    for (let i = 1; i < 5; i++) {
      const x = side * 0.43 - 0.24 + i * 0.096;
      satellitePaths.push([
        new THREE.Vector3(x, -0.16, 0.02),
        new THREE.Vector3(x, 0.16, 0.02),
      ]);
    }
    satellitePaths.push([
      new THREE.Vector3(side * 0.43 - 0.24, 0, 0.02),
      new THREE.Vector3(side * 0.43 + 0.24, 0, 0.02),
    ]);
  }
  satellitePaths.push(
    [new THREE.Vector3(0, 0.18, 0.12), new THREE.Vector3(0, 0.4, 0.25)],
    [new THREE.Vector3(-0.19, 0, 0), new THREE.Vector3(0.19, 0, 0)],
  );
  satellite.add(
    new THREE.LineSegments(
      lineGeometry(satellitePaths),
      new THREE.LineBasicMaterial({ color: 0xb7ffd2 }),
    ),
  );
  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.08, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x8afbb7,
      side: THREE.DoubleSide,
      wireframe: true,
    }),
  );
  dish.rotation.x = Math.PI / 2;
  dish.position.z = 0.19;
  satellite.add(dish);
  const focus = new THREE.Group();
  scene.add(focus);
  const focusMaterial = new THREE.MeshBasicMaterial({
    color: 0xb6ffd0,
    depthTest: false,
  });
  focus.add(
    new THREE.Mesh(new THREE.RingGeometry(0.07, 0.08, 24), focusMaterial),
  );
  focus.add(new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), focusMaterial));
  const beamGeometry = new THREE.BufferGeometry();
  const beamPositions = new Float32Array(6);
  beamGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(beamPositions, 3),
  );
  scene.add(
    new THREE.Line(
      beamGeometry,
      new THREE.LineBasicMaterial({
        color: 0xa1ffbf,
        transparent: true,
        opacity: 0.3,
        depthTest: true,
      }),
    ),
  );
  const focusNormal = new THREE.Vector3();
  const focusPoint = new THREE.Vector3(),
    satellitePoint = new THREE.Vector3();
  return {
    resize(width: number, height: number) {
      aspect = width / height;
      compact = width < 700;
      camera.left = -3.75 * aspect;
      camera.right = 3.75 * aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      earth.scale.setScalar(compact ? 0.64 : 1);
      satelliteOrbit.scale.setScalar(compact ? 0.63 : 1);
      satellite.scale.setScalar(compact ? 0.44 : 0.66);
      let cursor = 0;
      for (let ring = 0; ring < 2; ring++)
        for (let i = 0; i < 120; i++)
          for (let point = 0; point < 2; point++) {
            const a = ((i + point) / 120) * Math.PI * 2,
              scale = ring ? 0.8 : 1;
            const orbitPoint = gpsOrbitPoint(a, compact);
            orbitPositions[cursor++] = orbitPoint.x * aspect * 7.5 * scale;
            orbitPositions[cursor++] =
              (ring ? -orbitPoint.y + Math.cos(a) * 0.135 : -orbitPoint.y) *
              7.5 *
              scale;
            orbitPositions[cursor++] = Math.sin(a) * 1.6;
          }
      orbitGeometry.attributes.position.needsUpdate = true;
      orbitGeometry.computeBoundingSphere();
    },
    render(
      time: number,
      target: { x: number; y: number },
      orbitMatrix: number[],
    ) {
      logoOrbit.matrix.fromArray(orbitMatrix);
      logoOrbit.matrixWorldNeedsUpdate = true;
      const dt = Math.min(previousTime ? time - previousTime : 0.033, 0.08);
      previousTime = time;
      const smooth = 1 - Math.exp(-dt * 4);
      pointerX += (target.x - pointerX) * smooth;
      pointerY += (target.y - pointerY) * smooth;
      earth.rotation.set(
        pointerY * 0.3,
        time * 0.045 + pointerX * 0.6 - 0.4,
        -0.2,
      );
      const r = 1.8 * (compact ? 0.64 : 1);
      focusPoint
        .set(pointerX * 0.76, -pointerY * 0.76, 1)
        .normalize()
        .multiplyScalar(r);
      focus.position.copy(focusPoint);
      focus.lookAt(focusNormal.copy(focusPoint).multiplyScalar(2));
      // The orbit plane and dish follow the selected ground point with a delay.
      const follow = 1 - Math.exp(-dt * 1.4);
      inclinationX += (0.55 + pointerY * 0.8 - inclinationX) * follow;
      inclinationY += (-0.3 + pointerX * 0.8 - inclinationY) * follow;
      satelliteOrbit.rotation.set(inclinationX, inclinationY, -0.32);
      satelliteOrbit.updateMatrixWorld();
      const angle = time * 0.28 + 0.6;
      satellitePoint
        .set(Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius, 0)
        .applyMatrix4(satelliteOrbit.matrixWorld);
      satellite.position.copy(satellitePoint);
      satellite.lookAt(focusPoint);
      satellitePoint.toArray(beamPositions, 0);
      focusPoint.toArray(beamPositions, 3);
      beamGeometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      return {
        x: pointerX,
        y: pointerY,
        drawCalls: renderer.info.render.calls,
      };
    },
    dispose() {
      disposed = true;
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material)
          (Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          ).forEach((m) => materials.add(m));
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      texture.dispose();
      renderer.dispose();
    },
  };
}
