import * as THREE from "three";

type Disposable = { dispose: () => void };

export function createOfficeFurniture(resources: Disposable[]) {
  const track = <T extends Disposable>(resource: T): T => {
    resources.push(resource);
    return resource;
  };
  const woodCanvas = document.createElement("canvas");
  woodCanvas.width = 512;
  woodCanvas.height = 256;
  const ctx = woodCanvas.getContext("2d")!;
  ctx.fillStyle = "#70482d";
  ctx.fillRect(0, 0, 512, 256);
  for (let row = 0; row < 260; row++) {
    ctx.strokeStyle = row % 3 ? "rgba(32,15,5,.2)" : "rgba(222,177,115,.22)";
    ctx.lineWidth = 0.5 + (row % 3) * 0.4;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const y =
        row +
        Math.sin(x * 0.018 + row * 0.13) * 2.4 +
        Math.sin(x * 0.041) * 0.7;
      if (!x) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const woodTexture = track(new THREE.CanvasTexture(woodCanvas));
  woodTexture.colorSpace = THREE.SRGBColorSpace;
  const wood = track(
    new THREE.MeshPhongMaterial({
      color: 0xcfb090,
      map: woodTexture,
      bumpMap: woodTexture,
      bumpScale: 0.012,
      specular: 0x58412c,
      shininess: 25,
    }),
  );
  const ceramic = track(
    new THREE.MeshPhongMaterial({
      color: 0xd9cdbb,
      specular: 0xa2937b,
      shininess: 12,
    }),
  );
  const soil = track(
    new THREE.MeshPhongMaterial({ color: 0x261d12, shininess: 1 }),
  );
  const stem = track(
    new THREE.MeshPhongMaterial({ color: 0x466035, shininess: 12 }),
  );
  const leafMaterials = [0x23472c, 0x355b30, 0x487341, 0x274c34].map((color) =>
    track(
      new THREE.MeshPhongMaterial({
        color,
        side: THREE.DoubleSide,
        shininess: 34,
        specular: 0x617a48,
      }),
    ),
  );
  const leafGeometry = track(new THREE.PlaneGeometry(1, 1, 8, 14));
  const vertices = leafGeometry.getAttribute("position");
  for (let i = 0; i < vertices.count; i++) {
    const t = vertices.getY(i) + 0.5;
    const across = vertices.getX(i) * 2;
    const width =
      Math.pow(Math.sin(t * Math.PI), 0.72) * (0.9 + 0.1 * Math.sin(t * 9));
    vertices.setXYZ(
      i,
      across * width * 0.31,
      t,
      Math.sin(t * Math.PI) * 0.16 -
        Math.abs(across) * width * 0.1 -
        t * t * 0.25,
    );
  }
  leafGeometry.computeVertexNormals();
  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material) =>
    new THREE.Mesh(track(geometry), material);
  const connect = (
    from: THREE.Vector3,
    to: THREE.Vector3,
    radius: number,
    material = stem,
  ) => {
    const object = mesh(
      new THREE.CylinderGeometry(radius * 0.6, radius, from.distanceTo(to), 8),
      material,
    );
    object.position.copy(from).add(to).multiplyScalar(0.5);
    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      to.clone().sub(from).normalize(),
    );
    return object;
  };
  return {
    coffeeTable() {
      const table = new THREE.Group();
      table.name = "Walnut_Coffee_Table";
      const shape = new THREE.Shape();
      shape.absellipse(0, 0, 0.94, 0.51, 0, Math.PI * 2, false, 0);
      const top = mesh(
        new THREE.ExtrudeGeometry(shape, {
          depth: 0.075,
          bevelEnabled: true,
          bevelSize: 0.025,
          bevelThickness: 0.02,
          bevelSegments: 3,
          curveSegments: 32,
        }),
        wood,
      );
      top.rotation.x = -Math.PI / 2;
      top.position.y = 0.59;
      table.add(top);
      for (const [x, z] of [
        [-0.57, -0.28],
        [0.57, -0.28],
        [-0.57, 0.28],
        [0.57, 0.28],
      ]) {
        table.add(
          connect(
            new THREE.Vector3(x * 1.08, 0.025, z * 1.13),
            new THREE.Vector3(x, 0.6, z),
            0.045,
            wood,
          ),
        );
      }
      for (const z of [-0.27, 0.27])
        table.add(
          connect(
            new THREE.Vector3(-0.58, 0.48, z),
            new THREE.Vector3(0.58, 0.48, z),
            0.032,
            wood,
          ),
        );
      const cupMaterial = track(
        new THREE.MeshPhongMaterial({ color: 0xf2eee7, shininess: 75 }),
      );
      const cup = mesh(
        new THREE.LatheGeometry(
          [
            new THREE.Vector2(0.045, 0),
            new THREE.Vector2(0.059, 0.015),
            new THREE.Vector2(0.07, 0.14),
            new THREE.Vector2(0.061, 0.14),
            new THREE.Vector2(0.05, 0.025),
          ],
          24,
        ),
        cupMaterial,
      );
      cup.position.set(-0.43, 0.7, 0.07);
      table.add(cup);
      const coffee = mesh(new THREE.CircleGeometry(0.059, 24), soil);
      coffee.rotation.x = -Math.PI / 2;
      coffee.position.set(-0.43, 0.83, 0.07);
      table.add(coffee);
      const handle = mesh(
        new THREE.TorusGeometry(0.046, 0.012, 8, 18),
        cupMaterial,
      );
      handle.position.set(-0.35, 0.773, 0.07);
      table.add(handle);
      return table;
    },
    plant() {
      const plant = new THREE.Group();
      plant.name = "Rubber_Plant_Ceramic_Pot";
      const pot = mesh(
        new THREE.LatheGeometry(
          [
            new THREE.Vector2(0.24, 0),
            new THREE.Vector2(0.29, 0.035),
            new THREE.Vector2(0.35, 0.53),
            new THREE.Vector2(0.36, 0.57),
            new THREE.Vector2(0.33, 0.59),
            new THREE.Vector2(0.315, 0.54),
            new THREE.Vector2(0.26, 0.06),
          ],
          40,
        ),
        ceramic,
      );
      plant.add(pot);
      const dirt = mesh(new THREE.CircleGeometry(0.315, 32), soil);
      dirt.rotation.x = -Math.PI / 2;
      dirt.position.y = 0.54;
      plant.add(dirt);
      for (let branch = 0; branch < 3; branch++) {
        const angle = branch * 2.4;
        const top = new THREE.Vector3(
          Math.cos(angle) * 0.21,
          1.65 + branch * 0.14,
          Math.sin(angle) * 0.21,
        );
        plant.add(connect(new THREE.Vector3(0, 0.53, 0), top, 0.025));
        for (let i = 0; i < 6; i++) {
          const t = 0.25 + i * 0.13;
          const a = angle + i * 2.399;
          const base = new THREE.Vector3(
            top.x * t,
            0.54 + (top.y - 0.54) * t,
            top.z * t,
          );
          const tip = base
            .clone()
            .add(
              new THREE.Vector3(Math.cos(a) * 0.18, 0.065, Math.sin(a) * 0.18),
            );
          plant.add(connect(base, tip, 0.01));
          const leaf = new THREE.Mesh(
            leafGeometry,
            leafMaterials[(i + branch) % leafMaterials.length],
          );
          leaf.position.copy(tip);
          leaf.rotation.set(0.68 + Math.sin(i) * 0.16, a, 0.16 * Math.cos(a));
          leaf.scale.setScalar(0.35 + (i % 3) * 0.055);
          plant.add(leaf);
        }
      }
      return plant;
    },
  };
}
