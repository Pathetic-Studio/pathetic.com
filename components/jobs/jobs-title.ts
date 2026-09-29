import * as THREE from 'three';
import { JOBS_TITLE_BOUNDS, JOBS_TITLE_PATHS } from './jobs-title-paths';

export function createJobsTitleMesh() {
  const [minX, minY, maxX, maxY] = JOBS_TITLE_BOUNDS;
  const height = 1.4;
  const depth = 0.18;
  const stroke = 0.025;
  const bevelDepth = 0.02;
  const scale = height / (maxY - minY);
  const x = (value: number) => (value - (minX + maxX) / 2) * scale;
  const y = (value: number) => (value - (minY + maxY) / 2) * scale;
  const shapes = JOBS_TITLE_PATHS.flatMap((commands) => {
    const path = new THREE.ShapePath();
    for (const command of commands) {
      switch (command[0]) {
        case 'M':
          path.moveTo(x(command[1]), y(command[2]));
          break;
        case 'L':
          path.lineTo(x(command[1]), y(command[2]));
          break;
        case 'Q':
          path.quadraticCurveTo(
            x(command[1]),
            y(command[2]),
            x(command[3]),
            y(command[4]),
          );
          break;
        case 'C':
          path.bezierCurveTo(
            x(command[1]),
            y(command[2]),
            x(command[3]),
            y(command[4]),
            x(command[5]),
            y(command[6]),
          );
          break;
        case 'Z':
          path.currentPath?.closePath();
          break;
      }
    }
    return path.toShapes();
  });

  // The bevel surrounds the white face with a black stroke, and joins it to
  // continuous side walls and a black rear cap. There are no spaced layers.
  const backingGeometry = new THREE.ExtrudeGeometry(shapes, {
    depth: depth - bevelDepth * 2,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: bevelDepth,
    bevelSize: stroke,
    bevelSegments: 3,
    curveSegments: 12,
  });
  backingGeometry.translate(0, 0, -depth + bevelDepth);
  const faceGeometry = new THREE.ShapeGeometry(shapes, 12);
  const backingMaterial = new THREE.MeshBasicMaterial({
    color: 0x050505,
    toneMapped: false,
  });
  const faceMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: false,
  });
  const backing = new THREE.Mesh(backingGeometry, backingMaterial);
  backing.name = 'jobs-solid-black-backing';
  const face = new THREE.Mesh(faceGeometry, faceMaterial);
  face.name = 'jobs-white-face';
  face.position.z = 0.001;

  const object = new THREE.Group();
  object.name = 'jobs-3d-title';
  object.add(backing, face);

  return {
    object,
    width: (maxX - minX) * scale + stroke * 2,
    height: height + stroke * 2,
    depth,
    disposables: [backingGeometry, faceGeometry, backingMaterial, faceMaterial],
  };
}
