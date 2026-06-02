// MetaBalls (ogl), ported to vanilla and wired to the page.
// Loaded as type="module"; uses the importmap declared in the HTML.
import { Renderer, Program, Mesh, Triangle, Transform, Vec3, Camera } from 'ogl';

/* =================== METABALLS =================== */
function parseHexColor(hex) {
  const c = hex.replace('#', '');
  return [parseInt(c.substring(0, 2), 16) / 255, parseInt(c.substring(2, 4), 16) / 255, parseInt(c.substring(4, 6), 16) / 255];
}
const _fract = x => x - Math.floor(x);
function hash31(p) {
  let r = [p * 0.1031, p * 0.103, p * 0.0973].map(_fract);
  const yzx = [r[1], r[2], r[0]];
  const d = r[0] * (yzx[0] + 33.33) + r[1] * (yzx[1] + 33.33) + r[2] * (yzx[2] + 33.33);
  for (let i = 0; i < 3; i++) r[i] = _fract(r[i] + d);
  return r;
}
function hash33(v) {
  let p = [v[0] * 0.1031, v[1] * 0.103, v[2] * 0.0973].map(_fract);
  const yxz = [p[1], p[0], p[2]];
  const d = p[0] * (yxz[0] + 33.33) + p[1] * (yxz[1] + 33.33) + p[2] * (yxz[2] + 33.33);
  for (let i = 0; i < 3; i++) p[i] = _fract(p[i] + d);
  const xxy = [p[0], p[0], p[1]], yxx = [p[1], p[0], p[0]], zyx = [p[2], p[1], p[0]];
  const res = [];
  for (let i = 0; i < 3; i++) res[i] = _fract((xxy[i] + yxx[i]) * zyx[i]);
  return res;
}
function initMetaBalls(container, opts) {
  opts = opts || {};
  const color = opts.color ?? '#c8102e';
  const cursorBallColor = opts.cursorBallColor ?? '#f4b431';
  const speed = opts.speed ?? 0.3;
  const enableMouseInteraction = opts.enableMouseInteraction !== false;
  const hoverSmoothness = opts.hoverSmoothness ?? 0.07;
  const animationSize = opts.animationSize ?? 30;
  const ballCount = opts.ballCount ?? 15;
  const clumpFactor = opts.clumpFactor ?? 1;
  const cursorBallSize = opts.cursorBallSize ?? 3;
  const enableTransparency = true;

  const vertex = `#version 300 es
precision highp float; layout(location = 0) in vec2 position;
void main(){ gl_Position = vec4(position,0.0,1.0); }`;
  const fragment = `#version 300 es
precision highp float;
uniform vec3 iResolution; uniform float iTime; uniform vec3 iMouse;
uniform vec3 iColor; uniform vec3 iCursorColor; uniform float iAnimationSize;
uniform int iBallCount; uniform float iCursorBallSize; uniform vec3 iMetaBalls[50];
uniform float iClumpFactor; uniform bool enableTransparency; out vec4 outColor;
float getMetaBallValue(vec2 c, float r, vec2 p){ vec2 d=p-c; float dd=dot(d,d); return (r*r)/dd; }
void main(){
  vec2 fc=gl_FragCoord.xy; float scale=iAnimationSize/iResolution.y;
  vec2 coord=(fc-iResolution.xy*0.5)*scale;
  vec2 mouseW=(iMouse.xy-iResolution.xy*0.5)*scale;
  float m1=0.0;
  for(int i=0;i<50;i++){ if(i>=iBallCount) break; m1+=getMetaBallValue(iMetaBalls[i].xy,iMetaBalls[i].z,coord); }
  float m2=getMetaBallValue(mouseW,iCursorBallSize,coord);
  float total=m1+m2;
  float f=smoothstep(-1.0,1.0,(total-1.3)/min(1.0,fwidth(total)));
  vec3 cFinal=vec3(0.0);
  if(total>0.0){ float a1=m1/total,a2=m2/total; cFinal=iColor*a1+iCursorColor*a2; }
  outColor=vec4(cFinal*f, enableTransparency ? f : 1.0);
}`;

  const dpr = 1;
  const renderer = new Renderer({ dpr, alpha: true, premultipliedAlpha: false });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  container.appendChild(gl.canvas);
  gl.canvas.style.pointerEvents = 'none';

  const camera = new Camera(gl, { left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 10 });
  camera.position.z = 1;
  const geometry = new Triangle(gl);
  const [r1, g1, b1] = parseHexColor(color);
  const [r2, g2, b2] = parseHexColor(cursorBallColor);
  const metaBallsUniform = [];
  for (let i = 0; i < 50; i++) metaBallsUniform.push(new Vec3(0, 0, 0));

  const program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      iTime: { value: 0 }, iResolution: { value: new Vec3(0, 0, 0) }, iMouse: { value: new Vec3(0, 0, 0) },
      iColor: { value: new Vec3(r1, g1, b1) }, iCursorColor: { value: new Vec3(r2, g2, b2) },
      iAnimationSize: { value: animationSize }, iBallCount: { value: ballCount },
      iCursorBallSize: { value: cursorBallSize }, iMetaBalls: { value: metaBallsUniform },
      iClumpFactor: { value: clumpFactor }, enableTransparency: { value: enableTransparency }
    }
  });
  const mesh = new Mesh(gl, { geometry, program });
  const scene = new Transform();
  mesh.setParent(scene);

  const effectiveBallCount = Math.min(ballCount, 50);
  const ballParams = [];
  for (let i = 0; i < effectiveBallCount; i++) {
    const idx = i + 1; const h1 = hash31(idx);
    const st = h1[0] * (2 * Math.PI);
    const dtFactor = 0.1 * Math.PI + h1[1] * (0.4 * Math.PI - 0.1 * Math.PI);
    const baseScale = 5.0 + h1[1] * 5.0;
    const h2 = hash33(h1);
    const toggle = Math.floor(h2[0] * 2.0);
    const radiusVal = 0.5 + h2[2] * 1.5;
    ballParams.push({ st, dtFactor, baseScale, toggle, radius: radiusVal });
  }

  const mouseBallPos = { x: 0, y: 0 };
  let pointerInside = false, pointerX = 0, pointerY = 0;
  let paused = false, alive = true;

  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    renderer.setSize(width * dpr, height * dpr);
    gl.canvas.style.width = width + 'px';
    gl.canvas.style.height = height + 'px';
    program.uniforms.iResolution.value.set(gl.canvas.width, gl.canvas.height, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function onPointerMove(e) {
    if (!enableMouseInteraction) return;
    const rect = container.getBoundingClientRect();
    pointerX = ((e.clientX - rect.left) / rect.width) * gl.canvas.width;
    pointerY = (1 - (e.clientY - rect.top) / rect.height) * gl.canvas.height;
  }
  function onPointerEnter() { if (enableMouseInteraction) pointerInside = true; }
  function onPointerLeave() { if (enableMouseInteraction) pointerInside = false; }
  const listenTarget = container.parentElement || container;
  listenTarget.addEventListener('pointermove', onPointerMove);
  listenTarget.addEventListener('pointerenter', onPointerEnter);
  listenTarget.addEventListener('pointerleave', onPointerLeave);

  const startTime = performance.now();
  let rafId;
  function update(t) {
    if (!alive) return;
    rafId = requestAnimationFrame(update);
    if (paused) return;
    const elapsed = (t - startTime) * 0.001;
    program.uniforms.iTime.value = elapsed;
    for (let i = 0; i < effectiveBallCount; i++) {
      const p = ballParams[i];
      const dt = elapsed * speed * p.dtFactor;
      const th = p.st + dt;
      const x = Math.cos(th), y = Math.sin(th + dt * p.toggle);
      metaBallsUniform[i].set(x * p.baseScale * clumpFactor, y * p.baseScale * clumpFactor, p.radius);
    }
    let targetX, targetY;
    if (pointerInside) { targetX = pointerX; targetY = pointerY; }
    else {
      const cx = gl.canvas.width * 0.5, cy = gl.canvas.height * 0.5;
      targetX = cx + Math.cos(elapsed * speed) * gl.canvas.width * 0.15;
      targetY = cy + Math.sin(elapsed * speed) * gl.canvas.height * 0.15;
    }
    mouseBallPos.x += (targetX - mouseBallPos.x) * hoverSmoothness;
    mouseBallPos.y += (targetY - mouseBallPos.y) * hoverSmoothness;
    program.uniforms.iMouse.value.set(mouseBallPos.x, mouseBallPos.y, 0);
    renderer.render({ scene, camera });
  }
  rafId = requestAnimationFrame(update);

  return {
    setPaused(p) { paused = p; },
    destroy() {
      alive = false; cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      listenTarget.removeEventListener('pointermove', onPointerMove);
      listenTarget.removeEventListener('pointerenter', onPointerEnter);
      listenTarget.removeEventListener('pointerleave', onPointerLeave);
      if (gl.canvas.parentElement) gl.canvas.parentElement.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  };
}

/* =================== WIRING + VISIBILITY GATING =================== */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = window.matchMedia('(max-width: 900px)').matches;
const heavyOK = !prefersReduced && !isSmall;

let meta = null;

function gate(hostId, instGetter) {
  const el = document.getElementById(hostId);
  if (!el) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      const inst = instGetter();
      if (inst) inst.setPaused(!en.isIntersecting);
    });
  }, { threshold: 0.01 });
  io.observe(el.parentElement || el);
}

function startMeta() {
  if (meta || !heavyOK) return;
  const host = document.getElementById('metaballs-host');
  if (host) { try { meta = initMetaBalls(host, {}); } catch (e) { console.warn('MetaBalls init failed', e); } }
}
function stopMeta() { if (meta) { meta.destroy(); meta = null; } }

// Expose controls for the Tweaks panel
window.__effects = {
  meta: { start: startMeta, stop: stopMeta, get: () => meta },
  heavyOK
};

if (heavyOK) {
  startMeta();
  gate('metaballs-host', () => meta);
}

document.dispatchEvent(new CustomEvent('effects-ready'));
