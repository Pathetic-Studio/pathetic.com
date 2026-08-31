import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const OUTPUT_PATH = path.resolve("public/models/matrix-city-blockout.glb");
const CAMERA_ASPECT = 1440 / 900;
const CAMERA_TARGET = new THREE.Vector3(0, 10.2, -42);

class NodeFileReader {
  result = null;
  onloadend = null;
  onerror = null;

  async readAsArrayBuffer(blob) {
    try {
      this.result = await blob.arrayBuffer();
      this.onloadend?.({ target: this });
    } catch (error) {
      this.onerror?.(error);
    }
  }

  async readAsDataURL(blob) {
    try {
      const bytes = Buffer.from(await blob.arrayBuffer());
      this.result = `data:${blob.type || "application/octet-stream"};base64,${bytes.toString("base64")}`;
      this.onloadend?.({ target: this });
    } catch (error) {
      this.onerror?.(error);
    }
  }
}

globalThis.FileReader ??= NodeFileReader;

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const scene = new THREE.Scene();
scene.name = "Talent_Matrix_Blockout";
scene.userData = {
  source: "components/blocks/talent-matrix/talent-matrix-scene.tsx",
  coordinateSystem: "Three.js Y-up, camera looks toward negative Z",
  referenceViewport: "1440x900",
  note: "Geometry and camera match the website blockout. Matrix textures remain procedural in the website and are intentionally not baked into this modeling GLB.",
};

const buildingMaterial = new THREE.MeshBasicMaterial({
  name: "Matrix_Building_Blockout",
  color: new THREE.Color("#003d16"),
});
const towerMaterial = new THREE.MeshBasicMaterial({
  name: "Central_Tower_Blockout",
  color: new THREE.Color("#007a2b"),
});
const floorMaterial = new THREE.MeshBasicMaterial({
  name: "Matrix_Floor_Guide",
  color: new THREE.Color("#001d0a"),
  side: THREE.DoubleSide,
});
const backdropMaterial = new THREE.MeshBasicMaterial({
  name: "Matrix_Backdrop_Guide",
  color: new THREE.Color("#000b04"),
  side: THREE.DoubleSide,
});

const backdrop = new THREE.Mesh(
  new THREE.PlaneGeometry(142, 68),
  backdropMaterial,
);
backdrop.name = "Matrix_Backdrop_142x68";
backdrop.position.set(0, 25, -72);
scene.add(backdrop);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(156, 124),
  floorMaterial,
);
floor.name = "Matrix_Floor_156x124";
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, -0.08, -15);
scene.add(floor);

const city = new THREE.Group();
city.name = "City_Blockout";
scene.add(city);

const rows = [
  { name: "Far", z: -53, distances: [12, 19, 27, 36, 46, 58], minHeight: 13, maxHeight: 30 },
  { name: "Middle", z: -42, distances: [18, 27, 38, 51], minHeight: 11, maxHeight: 22 },
  { name: "Near", z: -27, distances: [22, 35, 50], minHeight: 9, maxHeight: 17 },
  { name: "Foreground", z: -11, distances: [27, 45], minHeight: 8, maxHeight: 15 },
];
const random = seededRandom(8051978);
const requestedCount = 30;
let buildingIndex = 0;

for (const [rowIndex, row] of rows.entries()) {
  const rowGroup = new THREE.Group();
  rowGroup.name = `Row_${String(rowIndex + 1).padStart(2, "0")}_${row.name}`;
  city.add(rowGroup);

  for (const distance of row.distances) {
    for (const side of [-1, 1]) {
      if (buildingIndex >= requestedCount) break;

      const width = 4.6 + random() * (rowIndex === 0 ? 3.1 : 4.1);
      const depth = width * (0.72 + random() * 0.32);
      const height = row.minHeight + random() * (row.maxHeight - row.minHeight);
      random(); // Runtime edge-opacity sample; consumed to keep placement identical.
      const x = side * (distance + (random() - 0.5) * 1.35);
      const z = row.z + (random() - 0.5) * 1.4;

      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        buildingMaterial,
      );
      const sideName = side < 0 ? "L" : "R";
      building.name = `Building_${String(buildingIndex + 1).padStart(2, "0")}_${row.name}_${sideName}`;
      building.position.set(x, height / 2, z);
      building.userData = {
        row: row.name,
        websiteIndex: buildingIndex,
        dimensions: { width, height, depth },
      };
      rowGroup.add(building);
      buildingIndex += 1;
    }
  }
}

const tower = new THREE.Group();
tower.name = "Central_Tiered_Tower";
tower.position.set(0, 0, -46);
tower.scale.setScalar(0.85);
city.add(tower);

const towerSections = [
  { width: 8.4, height: 15, depth: 7.1 },
  { width: 6.8, height: 6.8, depth: 5.8 },
  { width: 5.2, height: 5.8, depth: 4.4 },
  { width: 3.65, height: 5, depth: 3.1 },
  { width: 2.1, height: 4.1, depth: 1.8 },
];
let towerY = 0;

for (const [index, section] of towerSections.entries()) {
  const tier = new THREE.Mesh(
    new THREE.BoxGeometry(section.width, section.height, section.depth),
    towerMaterial,
  );
  tier.name = `Tower_Tier_${String(index + 1).padStart(2, "0")}`;
  tier.position.y = towerY + section.height / 2;
  tier.userData.dimensions = section;
  tower.add(tier);
  towerY += section.height;
}

const mast = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.38, 5.8, 6),
  towerMaterial,
);
mast.name = "Tower_Mast";
mast.position.y = towerY + 2.9;
tower.add(mast);

const antenna = new THREE.Mesh(
  new THREE.CylinderGeometry(0.055, 0.1, 5.2, 5),
  towerMaterial,
);
antenna.name = "Tower_Antenna";
antenna.position.y = towerY + 8.4;
tower.add(antenna);

const cameraTarget = new THREE.Object3D();
cameraTarget.name = "Website_Camera_Target";
cameraTarget.position.copy(CAMERA_TARGET);
cameraTarget.userData = { purpose: "Look-at target used by the website camera" };
scene.add(cameraTarget);

const camera = new THREE.PerspectiveCamera(48, CAMERA_ASPECT, 0.1, 190);
camera.name = "Website_Camera_1440x900";
camera.position.set(0, 5.3, 24);
camera.lookAt(CAMERA_TARGET);
camera.userData = {
  lookAt: CAMERA_TARGET.toArray(),
  referenceViewport: [1440, 900],
  note: "Set Blender output aspect to 16:10 to reproduce the website reference framing.",
};
scene.add(camera);

scene.updateMatrixWorld(true);

const exporter = new GLTFExporter();
const result = await exporter.parseAsync(scene, {
  binary: true,
  onlyVisible: false,
  trs: true,
});

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, Buffer.from(result));
process.stdout.write(`Wrote ${OUTPUT_PATH} (${Buffer.byteLength(result)} bytes)\n`);
