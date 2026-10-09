import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Small procedural models; pieces sharing a material are one draw call. */
export function createSpacecraft(kind: "rocket" | "ufo", color: string) {
  const model = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const metal = new THREE.MeshPhongMaterial({
    color: "#dce4ee",
    specular: "#fff",
    shininess: 85,
  });
  const accent = new THREE.MeshPhongMaterial({
    color,
    specular: "#b2e8ff",
    shininess: 70,
  });
  const glass = new THREE.MeshPhongMaterial({
    color: "#123754",
    emissive: "#061926",
    specular: "#b7efff",
    shininess: 110,
  });
  materials.push(metal, accent, glass);
  const add = (parts: THREE.BufferGeometry[], material: THREE.Material) => {
    const triangles = parts.map((part) =>
      part.index ? part.toNonIndexed() : part,
    );
    const geometry = mergeGeometries(triangles);
    triangles.forEach((part, i) => {
      if (part !== parts[i]) part.dispose();
    });
    parts.forEach((part) => part.dispose());
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    model.add(mesh);
    return mesh;
  };
  let flame: THREE.Mesh | null = null;
  if (kind === "rocket") {
    const profile = [
      [0.3, -0.85],
      [0.5, -0.65],
      [0.54, -0.15],
      [0.5, 0.6],
      [0.35, 0.98],
      [0, 1.45],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const body = new THREE.LatheGeometry(profile, 20);
    const nozzle = new THREE.CylinderGeometry(0.31, 0.38, 0.23, 16).translate(
      0,
      -0.92,
      0,
    );
    const rim = new THREE.TorusGeometry(0.23, 0.045, 6, 20).translate(
      0,
      0.47,
      0.47,
    );
    add([body, nozzle, rim], metal);
    const cap = new THREE.ConeGeometry(0.36, 0.53, 20).translate(0, 1.19, 0);
    const shape = new THREE.Shape();
    shape.moveTo(0.35, -0.1);
    shape.lineTo(0.93, -0.9);
    shape.lineTo(0.84, -1.15);
    shape.lineTo(0.34, -0.69);
    shape.closePath();
    const fin = new THREE.ExtrudeGeometry(shape, {
      depth: 0.08,
      bevelEnabled: false,
    }).translate(0, 0, -0.04);
    const leftFin = fin.clone().rotateY(Math.PI);
    const backFin = fin.clone().rotateY(Math.PI / 2);
    add([cap, fin, leftFin, backFin], accent);
    add(
      [
        new THREE.SphereGeometry(0.19, 16, 10)
          .scale(1, 1, 0.24)
          .translate(0, 0.47, 0.51),
      ],
      glass,
    );
    const flameMaterial = new THREE.MeshBasicMaterial({ color: "#ffc878" });
    materials.push(flameMaterial);
    // Modelled flame, not a light/shadow or a postprocessing effect.
    flame = add(
      [
        new THREE.ConeGeometry(0.22, 0.68, 12)
          .rotateZ(Math.PI)
          .translate(0, -0.29, 0),
      ],
      flameMaterial,
    );
    flame.position.y = -1.03;
    model.rotation.z = -0.35;
  } else {
    const profile = [
      [0, -0.33],
      [0.6, -0.3],
      [1.22, -0.12],
      [1.45, 0.01],
      [1.25, 0.15],
      [0.65, 0.3],
      [0, 0.3],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    add([new THREE.LatheGeometry(profile, 28)], metal);
    add(
      [
        new THREE.SphereGeometry(0.68, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2)
          .scale(1, 0.9, 1)
          .translate(0, 0.22, 0),
      ],
      glass,
    );
    const lights = Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      return new THREE.SphereGeometry(0.075, 6, 4).translate(
        Math.cos(angle) * 1.3,
        0.02,
        Math.sin(angle) * 1.3,
      );
    });
    // Emissive portholes add the saucer character without ten extra lights.
    accent.emissive.set(color);
    accent.emissiveIntensity = 0.5;
    add(lights, accent);
    model.rotation.set(0.2, 0, -0.12);
  }
  return {
    model,
    flame,
    geometries,
    materials,
    logoY: kind === "rocket" ? -0.12 : -0.12,
    logoZ: kind === "rocket" ? 0.61 : 1.38,
  };
}
