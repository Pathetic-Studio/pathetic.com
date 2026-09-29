import * as CANNON from 'cannon-es';
import * as THREE from 'three';

type ProjectedTriangle = {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  cx: number;
  cz: number;
};

type TabletopColliderOptions = {
  object: THREE.Object3D;
  material: CANNON.Material;
  meshName?: string;
  cellSize?: number;
  halfThickness?: number;
};

function pointInProjectedTriangle(x: number, z: number, triangle: ProjectedTriangle): boolean {
  const { ax, az, bx, bz, cx, cz } = triangle;
  const edgeA = (ax - cx) * (z - cz) - (az - cz) * (x - cx);
  const edgeB = (bx - ax) * (z - az) - (bz - az) * (x - ax);
  const edgeC = (cx - bx) * (z - bz) - (cz - bz) * (x - bx);
  const epsilon = 0.00001;
  return (
    (edgeA >= -epsilon && edgeB >= -epsilon && edgeC >= -epsilon)
    || (edgeA <= epsilon && edgeB <= epsilon && edgeC <= epsilon)
  );
}

/**
 * Builds a static compound collider from the visible top silhouette of a desk.
 *
 * cannon-es only implements Trimesh collision pairs for spheres and planes, so
 * a static Trimesh lets most of the stack's Box/ConvexPolyhedron pieces phase
 * through it. This rasterises the tabletop into a small collection of merged,
 * thick Box shapes instead. The boxes work with every toy shape and their
 * extra depth prevents thin/fast pieces tunnelling between fixed steps.
 */
export function createTabletopCompoundBody({
  object,
  material,
  meshName = 'table_geo',
  cellSize = 0.2,
  halfThickness = 0.24,
}: TabletopColliderOptions): CANNON.Body | null {
  object.updateMatrixWorld(true);
  const tabletopMeshes: THREE.Mesh[] = [];
  const tabletopBounds = new THREE.Box3();

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || child.name.trim().toLowerCase() !== meshName) return;
    tabletopMeshes.push(child);
    tabletopBounds.expandByObject(child, true);
  });

  if (!tabletopMeshes.length || tabletopBounds.isEmpty()) return null;

  const triangles: ProjectedTriangle[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const edgeA = new THREE.Vector3();
  const edgeB = new THREE.Vector3();
  const normal = new THREE.Vector3();
  // Ignore the lower skin of the thin tabletop while retaining its beveled
  // upper edge. The supplied model is about 6.5 cm thick after fitting.
  const upperSurfaceFloor = tabletopBounds.max.y - Math.max(
    0.045,
    (tabletopBounds.max.y - tabletopBounds.min.y) * 0.55,
  );

  tabletopMeshes.forEach((mesh) => {
    const position = mesh.geometry.getAttribute('position');
    if (!position) return;
    const index = mesh.geometry.getIndex();
    const indexCount = index?.count ?? position.count;

    for (let offset = 0; offset + 2 < indexCount; offset += 3) {
      const aIndex = index?.getX(offset) ?? offset;
      const bIndex = index?.getX(offset + 1) ?? offset + 1;
      const cIndex = index?.getX(offset + 2) ?? offset + 2;
      a.set(position.getX(aIndex), position.getY(aIndex), position.getZ(aIndex)).applyMatrix4(mesh.matrixWorld);
      b.set(position.getX(bIndex), position.getY(bIndex), position.getZ(bIndex)).applyMatrix4(mesh.matrixWorld);
      c.set(position.getX(cIndex), position.getY(cIndex), position.getZ(cIndex)).applyMatrix4(mesh.matrixWorld);
      edgeA.subVectors(b, a);
      edgeB.subVectors(c, a);
      normal.crossVectors(edgeA, edgeB).normalize();
      const centroidY = (a.y + b.y + c.y) / 3;
      if (Math.abs(normal.y) < 0.4 || centroidY < upperSurfaceFloor) continue;
      triangles.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z, cx: c.x, cz: c.z });
    }
  });

  if (!triangles.length) return null;

  const columns = Math.max(1, Math.ceil((tabletopBounds.max.x - tabletopBounds.min.x) / cellSize));
  const rows = Math.max(1, Math.ceil((tabletopBounds.max.z - tabletopBounds.min.z) / cellSize));
  const occupied = Array.from({ length: rows }, () => Array.from({ length: columns }, () => false));

  for (let row = 0; row < rows; row += 1) {
    const cellMinZ = tabletopBounds.min.z + row * cellSize;
    const cellMaxZ = Math.min(tabletopBounds.max.z, cellMinZ + cellSize);
    for (let column = 0; column < columns; column += 1) {
      const cellMinX = tabletopBounds.min.x + column * cellSize;
      const cellMaxX = Math.min(tabletopBounds.max.x, cellMinX + cellSize);
      const insetX = Math.min(0.018, (cellMaxX - cellMinX) * 0.2);
      const insetZ = Math.min(0.018, (cellMaxZ - cellMinZ) * 0.2);
      const samples = [
        [(cellMinX + cellMaxX) / 2, (cellMinZ + cellMaxZ) / 2],
        [cellMinX + insetX, cellMinZ + insetZ],
        [cellMaxX - insetX, cellMinZ + insetZ],
        [cellMinX + insetX, cellMaxZ - insetZ],
        [cellMaxX - insetX, cellMaxZ - insetZ],
      ];
      occupied[row][column] = triangles.some((triangle) => (
        samples.some(([x, z]) => pointInProjectedTriangle(x, z, triangle))
      ));
    }
  }

  const body = new CANNON.Body({ mass: 0, material });
  const visited = Array.from({ length: rows }, () => Array.from({ length: columns }, () => false));
  const tabletopTop = tabletopBounds.max.y - 0.002;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (!occupied[row][column] || visited[row][column]) continue;

      let width = 1;
      while (
        column + width < columns
        && occupied[row][column + width]
        && !visited[row][column + width]
      ) width += 1;

      let height = 1;
      while (row + height < rows) {
        let canExtend = true;
        for (let x = column; x < column + width; x += 1) {
          if (!occupied[row + height][x] || visited[row + height][x]) {
            canExtend = false;
            break;
          }
        }
        if (!canExtend) break;
        height += 1;
      }

      for (let z = row; z < row + height; z += 1) {
        for (let x = column; x < column + width; x += 1) visited[z][x] = true;
      }

      const minX = tabletopBounds.min.x + column * cellSize;
      const maxX = Math.min(tabletopBounds.max.x, tabletopBounds.min.x + (column + width) * cellSize);
      const minZ = tabletopBounds.min.z + row * cellSize;
      const maxZ = Math.min(tabletopBounds.max.z, tabletopBounds.min.z + (row + height) * cellSize);
      const padding = 0.008;
      body.addShape(
        new CANNON.Box(new CANNON.Vec3((maxX - minX) / 2 + padding, halfThickness, (maxZ - minZ) / 2 + padding)),
        new CANNON.Vec3((minX + maxX) / 2, tabletopTop - halfThickness, (minZ + maxZ) / 2),
      );
    }
  }

  return body.shapes.length ? body : null;
}
