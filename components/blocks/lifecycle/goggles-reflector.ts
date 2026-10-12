import profile from "./goggles-reflector.json";

/** Original Blender reflector, reduced to its curved profile. Only used when
 * baking the reflection maps at setup; never drawn in the animation loop. */
export function createGogglesReflector(THREE: typeof import("three")) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  profile.columns.forEach(([x, z, u], column) => {
    positions.push(x, profile.bottom, z, x, profile.top, z);
    uvs.push(u, 0, u, 1);
    if (column > 0) {
      const i = column * 2;
      indices.push(i - 2, i, i - 1, i, i + 1, i - 1);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}
