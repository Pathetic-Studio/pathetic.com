import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import { seededRandom, TAU } from "./credibility-universe-data";
import type {
  UniverseBody,
  UniverseComet,
  UniversePointer,
} from "./credibility-universe-physics";
import { MAX_COMETS } from "./credibility-universe-physics";

// The buffers store one independent displacement and velocity per star. The
// only visible primitive is Points; the compute targets contain numerical
// state, never a picture of the galaxy.
const orbitShader = `
  uniform sampler2D seeds;
  uniform float time;
  uniform vec2 radii;
  uniform vec2 center;
  uniform vec2 orientation;
  uniform vec2 orbitRotation;
  vec3 orbit(vec4 seed) {
    vec2 p=mat2(orbitRotation.x,orbitRotation.y,-orbitRotation.y,orbitRotation.x)*seed.xy*radii;
    p=mat2(orientation.x,orientation.y,-orientation.y,orientation.x)*p;
    return vec3(p+center,seed.z);
  }
`;

export async function createCredibilityGalaxy(
  renderer: THREE.WebGLRenderer,
  signal: AbortSignal,
  compact: boolean,
) {
  const columns = compact ? 128 : 256;
  const rows = compact ? 96 : 128;
  const count = columns * rows;
  const compute = new GPUComputationRenderer(columns, rows, renderer);
  // WebGL2 half-float render targets keep the simulation small on mobile.
  compute.setDataType(THREE.HalfFloatType);
  const seeds = compute.createTexture();
  const startPositions = compute.createTexture();
  const startVelocities = compute.createTexture();
  const seedData = seeds.image.data as Float32Array;
  const lookup = new Float32Array(count * 2);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const lights = new Float32Array(count);
  const random = seededRandom(64127);
  for (let i = 0; i < count; i++) {
    const population = random();
    const core = population < 0.14;
    const halo = population > 0.94;
    const r = core
      ? Math.sqrt(random()) * 0.22
      : Math.pow(random(), 0.7) * (halo ? 1.1 : 1);
    const spread = (random() + random() + random() - 1.5) * (0.45 - r * 0.15);
    const angle =
      core || halo
        ? random() * TAU
        : (i % 2) * Math.PI + r * 5.5 + spread + (i % 5 === 0 ? 0.38 : 0);
    // A shallow volume, with a thicker central cluster. There is no shared sheet.
    const depth =
      (random() + random() + random() - 1.5) * (core ? 0.9 : 0.45) - 0.3;
    seedData.set(
      [Math.cos(angle) * r, Math.sin(angle) * r, depth, random()],
      i * 4,
    );
    lookup.set(
      [((i % columns) + 0.5) / columns, (Math.floor(i / columns) + 0.5) / rows],
      i * 2,
    );
    const warmth = Math.exp(-r * r * 9);
    const tint = random();
    colors.set(
      [
        0.55 + warmth * 0.4 + tint * 0.12,
        0.72 + warmth * 0.12 + tint * 0.12,
        1 - warmth * 0.22,
      ],
      i * 3,
    );
    const bright = random() < 0.075;
    sizes[i] = bright ? 2.4 + random() * 1.8 : 1.15 + random() * 1.25;
    lights[i] = (0.34 + random() * 0.5) * (halo ? 0.45 : 1);
    if (i > 0 && i % 12000 === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (signal.aborted) break;
    }
  }
  if (signal.aborted) {
    seeds.dispose();
    startPositions.dispose();
    startVelocities.dispose();
    compute.dispose();
    throw new Error("Galaxy creation cancelled");
  }

  const shared = {
    seeds: { value: seeds },
    time: { value: 0 },
    radii: { value: new THREE.Vector2(9, 4) },
    center: { value: new THREE.Vector2() },
    orientation: { value: new THREE.Vector2(1, 0) },
    orbitRotation: { value: new THREE.Vector2(1, 0) },
  };
  const forces = {
    ...shared,
    dt: { value: 0 },
    pointer: { value: new THREE.Vector4(0, 0, 0, 0) },
    pointerVelocity: { value: new THREE.Vector2() },
    comets: {
      value: Array.from({ length: MAX_COMETS }, () => new THREE.Vector4()),
    },
    cometVelocities: {
      value: Array.from({ length: MAX_COMETS }, () => new THREE.Vector2()),
    },
    bodies: { value: Array.from({ length: 7 }, () => new THREE.Vector4()) },
    bodyVelocities: {
      value: Array.from({ length: 7 }, () => new THREE.Vector2()),
    },
  };
  const velocity = compute.addVariable(
    "velocities",
    `
    ${orbitShader}
    uniform float dt;
    uniform vec4 pointer;
    uniform vec2 pointerVelocity;
    uniform vec4 comets[${MAX_COMETS}];
    uniform vec2 cometVelocities[${MAX_COMETS}];
    uniform vec4 bodies[7];
    uniform vec2 bodyVelocities[7];
    void main() {
      vec2 uv=gl_FragCoord.xy/resolution.xy;
      vec4 seed=texture2D(seeds,uv);
      vec3 offset=texture2D(displacements,uv).xyz;
      vec3 velocity=texture2D(velocities,uv).xyz;
      vec3 p=orbit(seed)+offset;
      float response=.45+seed.w*.8;
      // A soft individual spring reforms the spiral over several seconds.
      vec3 acceleration=-offset*(1.25+seed.w*.35);
      vec2 delta=p.xy-pointer.xy;
      float distance=max(.12,length(delta));
      float reach=(pointer.w>0.?1.9:1.5)*(.75+seed.w*.4);
      float influence=exp(-distance*distance/(reach*reach)*2.)*pointer.z;
      vec2 radial=delta/distance;
      vec2 tangent=vec2(-radial.y,radial.x);
      vec2 scatter=vec2(sin(seed.w*173.+time*1.3),cos(seed.w*257.-time*1.7));
      // Different reach, mass and turbulent force for every star keep the wake
      // granular instead of piling points into the outline of a circular brush.
      acceleration.xy+=(radial*(pointer.w>0.?-.5:.8)+tangent*(pointer.w>0.?8.:3.)+pointerVelocity*.95+scatter*(pointer.w>0.?4.:2.))*influence*response;
      acceleration.z+=sin(seed.w*31.+time)*influence*.7;
      for(int i=0;i<7;i++) {
        vec2 away=p.xy-bodies[i].xy;
        float radius=bodies[i].z*1.15;
        float distanceSquared=dot(away,away);
        if(distanceSquared<radius*radius) {
          float d=max(.08,sqrt(distanceSquared));
          float wake=1.-d/radius;
          acceleration.xy+=(away/d*12.+bodyVelocities[i]*.7)*wake*wake*response;
        }
      }
      velocity+=acceleration*dt;
      // Sweep the moving comet through the stars, rather than emitting a
      // radial click pulse. Stars retain the momentum of the passing wake.
      for(int i=0;i<${MAX_COMETS};i++) {
        if(comets[i].w<.5)continue;
        vec2 travel=cometVelocities[i]*dt;
        vec2 from=comets[i].xy-travel;
        float t=clamp(dot(p.xy-from,travel)/max(dot(travel,travel),.0001),0.,1.);
        vec2 away=p.xy-(from+travel*t);
        float radius=comets[i].z+0.8;
        if(dot(away,away)<radius*radius) {
          float d=max(.05,length(away));
          float wake=1.-d/radius;
          velocity.xy+=(away/d*18.+cometVelocities[i]*2.5)*wake*response*dt;
          velocity.z+=(seed.w-.5)*wake*dt*5.;
        }
      }
      velocity*=exp(-dt*1.55);
      float speed=length(velocity);
      if(speed>5.)velocity*=5./speed;
      gl_FragColor=vec4(velocity,1.);
    }
  `,
    startVelocities,
  );
  const displacement = compute.addVariable(
    "displacements",
    `
    uniform float dt;
    void main() {
      vec2 uv=gl_FragCoord.xy/resolution.xy;
      vec3 offset=texture2D(displacements,uv).xyz;
      vec3 velocity=texture2D(velocities,uv).xyz;
      gl_FragColor=vec4(offset+velocity*dt,1.);
    }
  `,
    startPositions,
  );
  compute.setVariableDependencies(velocity, [velocity, displacement]);
  compute.setVariableDependencies(displacement, [velocity, displacement]);
  Object.assign(velocity.material.uniforms, forces);
  displacement.material.uniforms.dt = forces.dt;
  const error = compute.init();
  if (error) {
    seeds.dispose();
    compute.dispose();
    throw new Error(error);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(count * 3), 3),
  );
  geometry.setAttribute("lookup", new THREE.BufferAttribute(lookup, 2));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("light", new THREE.BufferAttribute(lights, 1));
  const uniforms = {
    ...shared,
    displacements: {
      value: compute.getCurrentRenderTarget(displacement).texture,
    },
    velocities: { value: compute.getCurrentRenderTarget(velocity).texture },
    extrapolate: { value: 0 },
    dpr: { value: 1 },
    reveal: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      ${orbitShader}
      uniform sampler2D displacements;
      uniform sampler2D velocities;
      uniform float extrapolate;
      uniform float dpr;
      attribute vec2 lookup;
      attribute vec3 color;
      attribute float size;
      attribute float light;
      varying vec3 vColor;
      varying float vLight;
      void main() {
        vec4 seed=texture2D(seeds,lookup);
        vec3 p=orbit(seed)+texture2D(displacements,lookup).xyz+texture2D(velocities,lookup).xyz*extrapolate;
        vColor=color;
        vLight=light*(.88+.12*sin(time*.7+seed.w*31.));
        gl_PointSize=size*dpr*clamp(1.+p.z*.08,.7,1.4);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }
    `,
    fragmentShader: `
      uniform float reveal;
      varying vec3 vColor;
      varying float vLight;
      void main() {
        float d=length(gl_PointCoord-.5);
        if(d>.5)discard;
        float core=1.-smoothstep(.12,.46,d);
        gl_FragColor=vec4(vColor,core*vLight*reveal);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(geometry, material);
  stars.frustumCulled = false;
  const group = new THREE.Group();
  group.add(stars);
  let previousTime = 0;
  let steps = 0;
  let accumulated = 0;
  let activeUntil = 0;
  let disposed = false;
  function reset() {
    for (const variable of [velocity, displacement]) {
      compute.renderTexture(
        variable.initialValueTexture,
        compute.getCurrentRenderTarget(variable),
      );
      compute.renderTexture(
        variable.initialValueTexture,
        compute.getAlternateRenderTarget(variable),
      );
    }
    uniforms.displacements.value =
      compute.getCurrentRenderTarget(displacement).texture;
    uniforms.velocities.value =
      compute.getCurrentRenderTarget(velocity).texture;
    uniforms.extrapolate.value = 0;
    accumulated = 0;
    forces.comets.value.forEach((comet) => (comet.w = 0));
  }
  return {
    group,
    setReveal(value: number) {
      uniforms.reveal.value = value;
    },
    resize(spanX: number, spanY: number, compact: boolean, dpr: number) {
      shared.radii.value.set(
        compact ? spanY * 0.45 : Math.min(spanX * 0.44, spanY * 0.94),
        compact ? spanX * 0.43 : spanY * 0.4,
      );
      const angle = compact ? Math.PI / 2 - 0.16 : 0.13;
      shared.orientation.value.set(Math.cos(angle), Math.sin(angle));
      shared.center.value.set(0, spanY * 0.07);
      uniforms.dpr.value = dpr;
    },
    render(
      time: number,
      pointer: UniversePointer,
      quiet: boolean,
      bodies: UniverseBody[],
      comets: UniverseComet[] = [],
    ) {
      const dt = Math.max(0, Math.min(time - previousTime, 1 / 30));
      previousTime = time;
      shared.time.value = time;
      shared.orbitRotation.value.set(
        Math.cos(time * 0.045),
        Math.sin(time * 0.045),
      );
      if (quiet || dt <= 0) return;
      accumulated += dt;
      if (
        pointer.down ||
        (pointer.active && Math.hypot(pointer.vx, pointer.vy) > 0.04) ||
        comets.some((comet) => comet.active)
      )
        activeUntil = time + 1.25;
      // Independent velocity simulation at 30 Hz in use, 15 Hz at rest.
      // Extrapolate between steps so drawing at 60 Hz stays smooth.
      const interval = time < activeUntil ? 1 / 30 : 1 / 15;
      if (accumulated + 0.000001 >= interval) {
        forces.dt.value = Math.min(accumulated, 1 / 15);
        accumulated = 0;
        forces.pointer.value.set(
          pointer.x,
          pointer.y,
          Number(pointer.active),
          Number(pointer.down),
        );
        forces.pointerVelocity.value.set(pointer.vx, pointer.vy);
        bodies.forEach((body, i) => {
          forces.bodies.value[i].set(body.x, body.y, body.radius, 0);
          forces.bodyVelocities.value[i].set(body.vx, body.vy);
        });
        forces.comets.value.forEach((value, i) => {
          const comet = comets[i];
          if (comet?.active) {
            value.set(comet.x, comet.y, comet.radius, 1);
            forces.cometVelocities.value[i].set(comet.vx, comet.vy);
          } else value.w = 0;
        });
        compute.compute();
        steps++;
        uniforms.displacements.value =
          compute.getCurrentRenderTarget(displacement).texture;
        uniforms.velocities.value =
          compute.getCurrentRenderTarget(velocity).texture;
      }
      uniforms.extrapolate.value = Math.min(accumulated, interval);
    },
    reset,
    count: () => count,
    // Called only by local interaction checks, never by the animation loop.
    sampleMotion() {
      if (process.env.NODE_ENV !== "development") return null;
      const sample = new Uint16Array(32 * 32 * 4);
      renderer.readRenderTargetPixels(
        compute.getCurrentRenderTarget(displacement),
        0,
        0,
        32,
        32,
        sample,
      );
      let moved = 0,
        distance = 0;
      for (let i = 0; i < sample.length; i += 4) {
        const d = Math.hypot(
          THREE.DataUtils.fromHalfFloat(sample[i]),
          THREE.DataUtils.fromHalfFloat(sample[i + 1]),
        );
        if (d > 0.2) moved++;
        distance += d;
      }
      return { moved, meanDistance: distance / 1024, steps };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      compute.dispose();
      seeds.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
