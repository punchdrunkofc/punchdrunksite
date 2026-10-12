// ==================================================================
//  fisheye-bg.js — WebGL fisheye на фоне сайта
//  Фон искажается через fisheye-шейдер. Сайт — прямой, работает.
// ==================================================================

(function () {
  "use strict";

  // ---------- КОНТЕЙНЕР ----------
  const canvas = document.createElement("canvas");
  canvas.id = "fisheye-bg";
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    width: 100vw;
    height: 100vh;
  `;
  document.body.insertBefore(canvas, document.body.firstChild);

  // Скрываем старый body::before (логотип), чтобы не мешал
  const styleHide = document.createElement("style");
  styleHide.textContent = "body::before { display: none !important; }";
  document.head.appendChild(styleHide);

  // ---------- WEBGL ----------
  const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
  if (!gl) {
    canvas.remove();
    return;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener("resize", resize);

  // ---------- ВЕРШИННЫЙ ШЕЙДЕР ----------
  const vertSrc = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() {
      vUv = (aPos + 1.0) * 0.5;
      vUv.y = 1.0 - vUv.y;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  // ---------- ФРАГМЕНТНЫЙ ШЕЙДЕР (FISHEYE) ----------
  const fragSrc = `
    precision highp float;

    varying vec2 vUv;
    uniform vec2  uResolution;
    uniform float uTime;
    uniform float uStrength;

    // ---------- FISHEYE-ПРОЕКЦИЯ ----------
    vec2 fisheye(vec2 uv, float strength) {
      vec2 p = uv - 0.5;
      p.x *= uResolution.x / uResolution.y;

      float r = length(p);
      float r2 = r * r;

      // нелинейная проекция
      float f = 1.0 / (1.0 + r2 * 0.4 * strength);
      float warp = mix(1.0, pow(max(r, 0.0001), 0.85), 1.0 - f);

      p *= f * warp;

      p.x /= uResolution.x / uResolution.y;
      return p + 0.5;
    }

    // ---------- ХЕШ ----------
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = fisheye(vUv, uStrength);

      // за пределами кадра — чёрный
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.02, 0.01, 0.03, 1.0);
        return;
      }

      // ---------- СЛОИ ФОНА ----------
      vec3 color = vec3(0.039, 0.031, 0.059);

      // 1. радиальный градиент — центр ярче
      float grad = 1.0 - length(uv - 0.5) * 1.3;
      color += vec3(0.09, 0.02, 0.14) * max(grad, 0.0);

      // 2. горизонтальные сканлайны
      float scan = sin(uv.y * uResolution.y * 1.5) * 0.5 + 0.5;
      scan = step(0.6, scan);
      color *= (1.0 - scan * 0.1);

      // 3. зерно плёнки
      float n = hash(uv * uResolution.xy + uTime * 30.0);
      color += vec3(n * 0.025);

      // 4. вертикальные «полосы сбоя»
      float vStripe = step(0.995, hash(vec2(floor(uv.x * 80.0), uTime)));
      color += vec3(0.12, 0.02, 0.18) * vStripe;

      // 5. крест в центре — мягкое свечение
      vec2 c = uv - 0.5;
      float cross = max(0.0, 1.0 - abs(c.x) * 250.0) * 0.12;
      cross += max(0.0, 1.0 - abs(c.y) * 250.0) * 0.12;
      color += vec3(0.45, 0.12, 0.65) * cross;

      // 6. виньетка — сильно тёмные углы
      float r = length(c * vec2(uResolution.x / uResolution.y, 1.0));
      float vignette = smoothstep(1.0, 0.2, r);
      color *= mix(0.03, 1.0, vignette);

      // 7. фиолетовый оттенок
      color *= vec3(1.0, 0.85, 1.2);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // ---------- КОМПИЛЯЦИЯ ----------
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("fisheye-bg:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const v = compile(gl.VERTEX_SHADER, vertSrc);
  const f = compile(gl.FRAGMENT_SHADER, fragSrc);
  if (!v || !f) { canvas.remove(); return; }

  const prog = gl.createProgram();
  gl.attachShader(prog, v);
  gl.attachShader(prog, f);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("fisheye-bg:", gl.getProgramInfoLog(prog));
    canvas.remove();
    return;
  }
  gl.useProgram(prog);

  // ---------- ГЕОМЕТРИЯ ----------
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1,  1,-1,  -1,1,
    -1, 1,  1,-1,   1,1
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // ---------- UNIFORMS ----------
  const uResolution = gl.getUniformLocation(prog, "uResolution");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uStrength = gl.getUniformLocation(prog, "uStrength");

  // ---------- РЕНДЕР ----------
  const start = performance.now();

  function frame() {
    const t = (performance.now() - start) / 1000;

    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform1f(uStrength, window._fisheyeStrength || 1.0);

    gl.clearColor(0.02, 0.01, 0.03, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(frame);
  }
  frame();

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._removeFisheyeBg = () => {
    canvas.remove();
  };
  window._setFisheyeStrength = (n) => {
    window._fisheyeStrength = n;
  };
})();
