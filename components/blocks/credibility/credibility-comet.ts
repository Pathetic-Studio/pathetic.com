import * as THREE from "three";
import { seededRandom } from "./credibility-universe-data";

/** Shared by the brand comet and the three reusable incoming comets. +X is forward. */
export function createCometTail(
  time: THREE.IUniform<number>,
  dpr: THREE.IUniform<number>,
) {
  const geometry = new THREE.BufferGeometry();
  const seeds = new Float32Array(192 * 3);
  const rng = seededRandom(772);
  for (let i = 0; i < 192; i++)
    seeds.set([rng(), rng() - 0.5, rng() - 0.5], i * 3);
  geometry.setAttribute("position", new THREE.BufferAttribute(seeds, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: { time, dpr },
    vertexShader: `
      uniform float time;uniform float dpr;varying float life;
      void main(){
        float t=fract(position.x+time*.65);life=1.-t;
        vec3 p=vec3(-.35-t*3.8,position.y*(.12+t*.7),-.3+position.z*.2);
        gl_PointSize=(2.+life*7.)*dpr;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader: `
      varying float life;
      void main(){
        float a=1.-smoothstep(.05,.5,length(gl_PointCoord-.5));
        gl_FragColor=vec4(1.,.4+life*.5,.08+life*.4,a*life*.8);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return { geometry, material };
}
