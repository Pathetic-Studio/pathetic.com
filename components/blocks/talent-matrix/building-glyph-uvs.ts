import * as THREE from "three";

// The 256 × 384 texture keeps the same pixel density on every facade.
const TILE_WIDTH = 8;
const TILE_HEIGHT = TILE_WIDTH * (384 / 256);

/** Apply authored scale, then unwrap the cropped faces in world units. */
export function applyBuildingGlyphUVs(mesh: THREE.Mesh) {
  // cropBuildingAtFloor has already made a private, non-indexed geometry.
  const geometry = mesh.geometry;
  const mirrored = mesh.scale.x * mesh.scale.y * mesh.scale.z < 0;
  geometry.scale(mesh.scale.x, mesh.scale.y, mesh.scale.z);
  mesh.scale.set(1, 1, 1);
  mesh.updateWorldMatrix(true, false);

  // Baking a negative scale also requires reversing the triangle winding.
  if (mirrored) {
    for (const attribute of Object.values(geometry.attributes)) {
      const values = attribute.array;
      for (let i = 0; i < attribute.count; i += 3) {
        for (let component = 0; component < attribute.itemSize; component++) {
          const a = (i + 1) * attribute.itemSize + component;
          const b = (i + 2) * attribute.itemSize + component;
          const value = values[a];
          values[a] = values[b];
          values[b] = value;
        }
      }
      attribute.needsUpdate = true;
    }
  }

  const positions = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  const vertices = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const edge = new THREE.Vector3(), normal = new THREE.Vector3();
  const across = new THREE.Vector3(), up = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < positions.count; i += 3) {
    vertices.forEach((vertex, j) =>
      vertex.fromBufferAttribute(positions, i + j).applyMatrix4(mesh.matrixWorld),
    );
    normal.subVectors(vertices[1], vertices[0])
      .cross(edge.subVectors(vertices[2], vertices[0])).normalize();
    if (Math.abs(normal.y) > .99) across.set(1, 0, 0);
    else across.crossVectors(worldUp, normal).normalize();
    up.crossVectors(normal, across).normalize();
    vertices.forEach((vertex, j) => {
      uv.setXY(i + j, vertex.dot(across) / TILE_WIDTH, vertex.dot(up) / TILE_HEIGHT);
    });
  }
  uv.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}
