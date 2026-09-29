import * as THREE from "three";

type Vertex = {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  uv: THREE.Vector2;
  height: number;
};

/** Cut the buried geometry away, leaving the authored roof height unchanged. */
export function cropBuildingAtFloor(mesh: THREE.Mesh, floorY: number) {
  mesh.updateWorldMatrix(true, false);
  const source = mesh.geometry;
  const position = source.getAttribute("position");
  const normal = source.getAttribute("normal");
  const uv = source.getAttribute("uv");
  const index = source.getIndex();
  const count = index ? index.count : position.count;
  const positions: number[] = [],
    normals: number[] = [],
    uvs: number[] = [];
  const intersections: THREE.Vector3[] = [];
  const read = (i: number): Vertex => {
    const id = index ? index.getX(i) : i;
    const p = new THREE.Vector3().fromBufferAttribute(position, id);
    return {
      position: p,
      normal: normal
        ? new THREE.Vector3().fromBufferAttribute(normal, id)
        : new THREE.Vector3(0, 1, 0),
      uv: uv
        ? new THREE.Vector2(uv.getX(id), uv.getY(id))
        : new THREE.Vector2(),
      height: p.clone().applyMatrix4(mesh.matrixWorld).y - floorY,
    };
  };
  const write = (v: Vertex) => {
    positions.push(...v.position.toArray());
    normals.push(...v.normal.toArray());
    uvs.push(...v.uv.toArray());
  };
  for (let i = 0; i < count; i += 3) {
    const triangle = [read(i), read(i + 1), read(i + 2)];
    const polygon: Vertex[] = [];
    for (let edge = 0; edge < 3; edge++) {
      const a = triangle[edge],
        b = triangle[(edge + 1) % 3];
      if (a.height >= 0) polygon.push(a);
      if (a.height >= 0 !== b.height >= 0) {
        const t = a.height / (a.height - b.height);
        const cut = {
          position: a.position.clone().lerp(b.position, t),
          normal: a.normal.clone().lerp(b.normal, t).normalize(),
          uv: a.uv.clone().lerp(b.uv, t),
          height: 0,
        };
        polygon.push(cut);
        intersections.push(cut.position.clone().applyMatrix4(mesh.matrixWorld));
      }
    }
    for (let v = 1; v < polygon.length - 1; v++) {
      write(polygon[0]);
      write(polygon[v]);
      write(polygon[v + 1]);
    }
  }
  // These buildings have convex footprints. A hull removes the diagonal
  // triangle intersections and gives the new base a clean perimeter edge.
  const unique = [
    ...new Map(
      intersections.map((p) => [`${p.x.toFixed(5)},${p.z.toFixed(5)}`, p]),
    ).values(),
  ].sort((a, b) => a.x - b.x || a.z - b.z);
  const cross = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) =>
    (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
  const hullHalf = (points: THREE.Vector3[]) => {
    const hull: THREE.Vector3[] = [];
    for (const point of points) {
      while (
        hull.length > 1 &&
        cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 1e-8
      )
        hull.pop();
      hull.push(point);
    }
    return hull.slice(0, -1);
  };
  const hull = [...hullHalf(unique), ...hullHalf([...unique].reverse())];
  if (hull.length >= 3) {
    const inverse = mesh.matrixWorld.clone().invert();
    const capNormal = new THREE.Vector3(0, -1, 0).transformDirection(
      mesh.matrixWorld.clone().transpose(),
    );
    const cap = hull.map(
      (p): Vertex => ({
        position: p.clone().applyMatrix4(inverse),
        normal: capNormal,
        uv: new THREE.Vector2(p.x * 0.1, p.z * 0.1),
        height: 0,
      }),
    );
    for (let i = 1; i < cap.length - 1; i++) {
      write(cap[0]);
      if (mesh.matrixWorld.determinant() < 0) {
        write(cap[i + 1]);
        write(cap[i]);
      } else {
        write(cap[i]);
        write(cap[i + 1]);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  mesh.geometry = geometry;
  return hull;
}
