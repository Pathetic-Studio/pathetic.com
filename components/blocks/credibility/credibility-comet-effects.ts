import * as THREE from "three";
import { seededRandom, TAU } from "./credibility-universe-data";
import {
  MAX_FRAGMENTS,
  MAX_IMPACTS,
  type UniverseFragment,
  type UniverseImpact,
} from "./credibility-universe-physics";

/** Two draw calls for all tumbling debris and short-lived impact sparks. */
export function createCometEffects(dpr: THREE.IUniform<number>) {
  const group = new THREE.Group();
  const rock = new THREE.IcosahedronGeometry(1, 0);
  const rockMaterial = new THREE.MeshPhongMaterial({
    color: "#ffa85c",
    emissive: "#a4300c",
    emissiveIntensity: 0.6,
    shininess: 20,
    specular: "#ffddb6",
  });
  const chunks = new THREE.InstancedMesh(rock, rockMaterial, MAX_FRAGMENTS);
  chunks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  chunks.frustumCulled = false;
  chunks.count = 0;
  const dummy = new THREE.Object3D();
  const rng = seededRandom(5112);
  const color = new THREE.Color();
  for (let i = 0; i < MAX_FRAGMENTS; i++)
    chunks.setColorAt(
      i,
      color.setHSL(0.07 + rng() * 0.04, 0.6, 0.45 + rng() * 0.4),
    );
  group.add(chunks);

  const perImpact = 37;
  const seeds = new Float32Array(MAX_IMPACTS * perImpact * 3);
  for (let i = 0; i < MAX_IMPACTS; i++) {
    for (let j = 0; j < perImpact; j++) {
      seeds.set(
        [i, j === 0 ? -1 : rng() * TAU, rng()],
        (i * perImpact + j) * 3,
      );
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(seeds, 3));
  const impacts = {
    value: Array.from(
      { length: MAX_IMPACTS },
      () => new THREE.Vector4(0, 0, -1, 1),
    ),
  };
  const material = new THREE.ShaderMaterial({
    uniforms: { impacts, dpr },
    vertexShader: `
      uniform vec4 impacts[${MAX_IMPACTS}];uniform float dpr;
      varying float opacity;varying float flash;
      void main(){
        vec4 hit=impacts[int(position.x)];
        float age=max(0.,hit.z);flash=step(position.y,0.);
        float life=clamp(age/.85,0.,1.);
        vec2 direction=vec2(cos(position.y),sin(position.y));
        vec2 offset=direction*(.15+age*(2.8+position.z*3.2))*hit.w*(1.-flash);
        opacity=hit.z<0.?0.:pow(1.-life,1.6);
        if(flash>.5)opacity*=1.-smoothstep(.04,.44,age);
        gl_PointSize=mix(3.+position.z*4.,85.+age*160.,flash)*dpr*hit.w;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(hit.xy+offset,.25,1.);
      }`,
    fragmentShader: `
      varying float opacity;varying float flash;
      void main(){
        float d=length(gl_PointCoord-.5);
        float glow=1.-smoothstep(0.,.5,d);
        vec3 tint=mix(vec3(1.,.46,.12),vec3(1.,.9,.6),flash);
        gl_FragColor=vec4(tint,glow*opacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparks = new THREE.Points(geometry, material);
  sparks.frustumCulled = false;
  sparks.visible = false;
  group.add(sparks);

  return {
    group,
    render(
      fragments: UniverseFragment[],
      hits: UniverseImpact[],
      quiet: boolean,
    ) {
      group.visible = !quiet;
      if (quiet) return;
      let count = 0;
      for (const fragment of fragments) {
        if (!fragment.active) continue;
        const size = fragment.size * Math.min(1, (4 - fragment.age) * 2);
        dummy.position.set(fragment.x, fragment.y, fragment.z);
        dummy.rotation.set(
          fragment.angle * 0.7,
          fragment.angle * 1.2,
          fragment.angle,
        );
        dummy.scale.set(size, size * 0.7, size * 0.9);
        dummy.updateMatrix();
        chunks.setMatrixAt(count++, dummy.matrix);
      }
      chunks.count = count;
      chunks.visible = count > 0;
      if (count) chunks.instanceMatrix.needsUpdate = true;
      sparks.visible = hits.some((hit) => hit.active);
      hits.forEach((hit, i) =>
        impacts.value[i].set(
          hit.x,
          hit.y,
          hit.active ? hit.age : -1,
          hit.radius,
        ),
      );
    },
    dispose() {
      chunks.dispose();
      rock.dispose();
      rockMaterial.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
