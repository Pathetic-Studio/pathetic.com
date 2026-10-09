/** A single small WebGL quad twists the portal's texture inside its fixed rim.
 * The cutout itself never rotates. No Three scene or fullscreen render target. */
export function createAbyssWarp(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 640;
  canvas.dataset.abyssWarp = "";
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    transform: image.style.transform,
    transformOrigin: "50% 50%",
    pointerEvents: "none",
  });
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;
  const shader = (type: number, source: string) => {
    const result = gl.createShader(type)!;
    gl.shaderSource(result, source);
    gl.compileShader(result);
    return result;
  };
  const vertex = shader(
    gl.VERTEX_SHADER,
    `
    attribute vec2 position; varying vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}
  `,
  );
  const fragment = shader(
    gl.FRAGMENT_SHADER,
    `
    precision mediump float;
    uniform sampler2D picture;
    uniform vec2 fit;
    uniform float time, strength;
    varying vec2 uv;
    mat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
    void main(){
      vec2 sampleUV=(uv-.5)/fit+.5;
      if(sampleUV.x<0.||sampleUV.x>1.||sampleUV.y<0.||sampleUV.y>1.)discard;
      vec2 centre=vec2(.55,.49);
      vec2 q=turn(.53)*(sampleUV-centre);
      q.y*=1.85;
      float r=length(q);
      float envelope=smoothstep(.025,.10,r)*(1.-smoothstep(.27,.52,r));
      float twist=(time*.40+.12*sin(time*1.6-r*22.))*envelope*strength;
      q=turn(twist)*q;
      q*=1.+.035*sin(r*30.-time*2.)*envelope*strength;
      q.y/=1.85;
      sampleUV=turn(-.53)*q+centre;
      gl_FragColor=texture2D(picture,sampleUV);
    }
  `,
  );
  const program = gl.createProgram()!;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const timeUniform = gl.getUniformLocation(program, "time");
  const strengthUniform = gl.getUniformLocation(program, "strength");
  const fitUniform = gl.getUniformLocation(program, "fit");
  let ready = false,
    disposed = false;
  const visibility = image.style.visibility;
  const lost = () => {
    ready = false;
    image.style.visibility = visibility;
    canvas.style.display = "none";
  };
  const upload = () => {
    if (disposed || !image.naturalWidth) return;
    try {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      const ratio = image.naturalWidth / image.naturalHeight;
      gl.uniform2f(fitUniform, Math.min(1, ratio), Math.min(1, 1 / ratio));
      ready = true;
    } catch {
      /* Keep the unmodified image if a custom asset disallows WebGL. */
    }
  };
  image.parentElement?.appendChild(canvas);
  canvas.addEventListener("webglcontextlost", lost);
  image.addEventListener("load", upload);
  if (image.complete) upload();
  return {
    render(time: number, strength: number) {
      if (!ready || disposed || gl.isContextLost()) return;
      gl.uniform1f(timeUniform, time);
      gl.uniform1f(strengthUniform, strength);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      image.style.visibility = "hidden";
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      image.removeEventListener("load", upload);
      canvas.removeEventListener("webglcontextlost", lost);
      image.style.visibility = visibility;
      canvas.remove();
      gl.deleteBuffer(buffer);
      gl.deleteTexture(texture);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
