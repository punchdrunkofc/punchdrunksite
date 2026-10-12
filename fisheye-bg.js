// ==================================================================
//  fisheye-bg.js — WebGL fisheye background
// ==================================================================

(function () {
  "use strict";

  // на этой странице фон прозрачный — WebGL рисует его
  document.body.classList.add("has-fisheye-bg");

  const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
  if (!gl) {
    console.error("fisheye-bg: webgl not supported");
    return;
  }

  const vertSrc = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() {
      vUv = (aPos + 1.0) * 0.5;
      vUv.y = 1.0 - vUv.y;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  const fragSrc = `
    precision mediump float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;

    void main() {
      vec2 uv = vUv - 0.5;
      uv.x *= uResolution.x / uResolution.y;
      float r = length(uv);
      float f = 1.0 / (1.0 + r * r * 0.6);
      uv *= f;
      uv.x /= uResolution.x / uResolution.y;
      uv += 0.5;

      vec3 color = vec3(0.04, 0.02, 0.06);

      vec2 c = vUv - 0.5;
      c.x *= uResolution.x / uResolution.y;
      float dist = length(c);
      float glow = 1.0 - smoothstep(0.0, 0.8, dist);
      color += vec3(0.35, 0.10, 0.55) * glow;

      float scan = sin(vUv.y * uResolution.y * 1.5) * 0.5 + 0.5;
      scan = step(0.7, scan);
      color *= (1.0 - scan * 0.15);

      float noise = fract(sin(dot(vUv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
      color += vec3(noise * 0.03);

      float vignette = smoothstep(0.9, 0.2, dist);
      color *= mix(0.05, 1.0, vignette);

      color *= vec3(1.0, 0.85, 1.2);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("fisheye-bg compile:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vert = compile(gl.VERTEX_SHADER, vertSrc);
  const frag = compile(gl.FRAGMENT_SHADER, fragSrc);
  if (!vert || !frag) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("fisheye-bg link:", gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, "uTime");
  const uResolution = gl.getUniformLocation(prog, "uResolution");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener("resize", resize);

  const start = performance.now();
  function render() {
    const t = (performance.now() - start) / 1000;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.clearColor(0.04, 0.02, 0.06, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }
  render();

  window._removeFisheyeBg = () => canvas.remove();
})();
