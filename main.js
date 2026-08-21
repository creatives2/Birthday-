import * as THREE from 'three';

/* =========================================================================
   a tiny universe — main.js
   Sections:
   1. Setup helpers (device detection, grain, textures)
   2. Terminal intro
   3. Three.js scene / hub universe
   4. Camera controls (drag orbit + fly-to tweens)
   5. Interactive objects + raycasting
   6. Special sequences (childhood, distance, space dream, drawing, letter, final)
   7. Music player
   8. Render loop
   ========================================================================= */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
const isLowPower = isCoarsePointer || window.innerWidth < 760 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

const state = {
  started: false,
  interacting: false,      // pointer currently dragging
  flying: false,           // camera tween in progress
  cinematic: false,        // fully non-interactive cinematic sequence
  discoveries: new Set(),
  drawingUnlocked: false,
  letterUnlocked: false,
  musicPlaying: false,
  musicReady: false,
};

const TOTAL_MAIN_NODES = CONFIG.surprises.length + 3; // + childhood + distance + spaceDream
const DRAWING_UNLOCK_THRESHOLD = Math.max(4, Math.ceil((CONFIG.surprises.length + 2) * 0.7));

/* ---------------------------------------------------------------------
   1. Setup helpers
--------------------------------------------------------------------- */

function makeRadialTexture(colorInner, colorOuter, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0, colorInner);
  grad.addColorStop(1, colorOuter);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function hexToCss(hex, alpha = 1) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/* --- film grain canvas (cheap, low-res noise upscaled) --- */
const grainCanvas = document.getElementById('grain-canvas');
const grainCtx = grainCanvas.getContext('2d');
let grainW = 96, grainH = 96;
function resizeGrain() {
  grainCanvas.width = window.innerWidth;
  grainCanvas.height = window.innerHeight;
}
function drawGrain() {
  const imgData = grainCtx.createImageData(grainW, grainH);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.random() * 255;
    imgData.data[i] = v; imgData.data[i+1] = v; imgData.data[i+2] = v;
    imgData.data[i+3] = 255;
  }
  // draw at small res then scale up via drawImage using an offscreen canvas
  if (!drawGrain._off) {
    drawGrain._off = document.createElement('canvas');
    drawGrain._off.width = grainW; drawGrain._off.height = grainH;
  }
  const offCtx = drawGrain._off.getContext('2d');
  offCtx.putImageData(imgData, 0, 0);
  grainCtx.imageSmoothingEnabled = false;
  grainCtx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
  grainCtx.drawImage(drawGrain._off, 0, 0, grainCanvas.width, grainCanvas.height);
}
resizeGrain();
let grainFrame = 0;
function tickGrain() {
  grainFrame++;
  const throttle = prefersReducedMotion ? 6 : 2;
  if (grainFrame % throttle === 0) drawGrain();
}

/* ---------------------------------------------------------------------
   2. Terminal intro
--------------------------------------------------------------------- */

const terminalScreen = document.getElementById('terminal-screen');
const terminalHeader = document.getElementById('terminal-header');
const terminalPromptLabel = document.getElementById('terminal-prompt-label');
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const hud = document.getElementById('hud');
const hintText = document.getElementById('hint-text');

terminalHeader.textContent = CONFIG.terminal.header;
terminalPromptLabel.textContent = CONFIG.terminal.prompt;

function focusTerminalInput() {
  try { terminalInput.focus({ preventScroll: true }); } catch (e) { terminalInput.focus(); }
}
terminalScreen.addEventListener('click', focusTerminalInput);
setTimeout(focusTerminalInput, 900);

function appendOutputLine(text, delayMs, extraClass) {
  return new Promise(resolve => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.textContent = text;
      if (extraClass) div.classList.add(extraClass);
      terminalOutput.appendChild(div);
      resolve();
    }, delayMs);
  });
}

async function runTerminalSequence() {
  const nickname = CONFIG.nicknames.primary;
  let delay = 250;
  for (const line of CONFIG.terminal.lines) {
    await appendOutputLine(line, delay);
    delay = 550;
  }
  await appendOutputLine(CONFIG.terminal.welcomeLine(nickname), 700, 'welcome');
  await new Promise(r => setTimeout(r, 1400));
  terminalScreen.classList.add('fading');
  setTimeout(() => {
    terminalScreen.classList.add('hidden');
    beginUniverse();
  }, 1650);
}

terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = terminalInput.value.trim().toLowerCase();
    if (val.length === 0) return;
    terminalInput.disabled = true;
    if (val === CONFIG.name.toLowerCase() || val.includes(CONFIG.name.toLowerCase())) {
      runTerminalSequence();
    } else {
      // gentle nudge, not a hard rejection
      appendOutputLine("hmm, try your name?", 200).then(() => {
        terminalInput.disabled = false;
        terminalInput.value = '';
        focusTerminalInput();
      });
    }
  }
});

/* ---------------------------------------------------------------------
   3. Three.js scene setup
--------------------------------------------------------------------- */

let renderer, scene, camera, clock;
let starfield, pinkParticles, nebulaGroup;
let interactiveGroup = [];
let photoGroup = [];
let childhoodPlanet, drawingPlane, distanceBeacon, spaceDreamComet, letterBeacon;
let distancePointA, distancePointB, distanceLine;
let ambientLight, warmLight;
let musicAmplitude = 0;

const canvas = document.getElementById('scene-canvas');
const fallbackScreen = document.getElementById('webgl-fallback');

function initRenderer() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    return false;
  }
  if (!renderer) return false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowPower ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(new THREE.Color(CONFIG.colors.void), 1);
  return true;
}

function showFallback() {
  fallbackScreen.classList.remove('hidden');
  document.getElementById('fallback-letter').textContent = CONFIG.letter.body;
  terminalScreen.classList.add('hidden');
}

function initScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(CONFIG.colors.void, 0.012);

  camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 0, 14);

  ambientLight = new THREE.AmbientLight(new THREE.Color(CONFIG.colors.mutedPurple), 0.55);
  scene.add(ambientLight);
  warmLight = new THREE.PointLight(new THREE.Color(CONFIG.colors.gold), 0.4, 60);
  warmLight.position.set(6, 4, 8);
  scene.add(warmLight);
  const pinkLight = new THREE.PointLight(new THREE.Color(CONFIG.colors.blushPink), 0.35, 60);
  pinkLight.position.set(-8, -3, 6);
  scene.add(pinkLight);

  buildStarfield();
  buildNebula();
  buildPhotos();
  buildSurprises();
  buildChildhoodPlanet();
  buildDistanceScene();
  buildSpaceDreamComet();
  buildDrawingReveal();
  buildLetterBeacon();

  clock = new THREE.Clock();
}

/* --- starfield with a fraction of blush-pink stars --- */
function buildStarfield() {
  const count = isLowPower ? CONFIG.performance.starsLow : CONFIG.performance.starsHigh;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cream = new THREE.Color(CONFIG.colors.cream);
  const pink = new THREE.Color(CONFIG.colors.blushPink);
  const gold = new THREE.Color(CONFIG.colors.gold);

  for (let i = 0; i < count; i++) {
    const r = 60 + Math.random() * 220;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);

    let c = cream;
    const roll = Math.random();
    if (roll < 0.10) c = pink;
    else if (roll < 0.18) c = gold;
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.55, vertexColors: true, transparent: true, opacity: 0.9,
    sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  starfield = new THREE.Points(geo, mat);
  scene.add(starfield);

  // close, larger drifting pink particles (the "loved" layer)
  const pCount = isLowPower ? CONFIG.performance.pinkParticlesLow : CONFIG.performance.pinkParticlesHigh;
  const pPositions = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const r = 4 + Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    pPositions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pPositions[i*3+2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pTex = makeRadialTexture(hexToCss(CONFIG.colors.blushPink, 0.9), hexToCss(CONFIG.colors.blushPink, 0));
  const pMat = new THREE.PointsMaterial({
    size: 0.9, map: pTex, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending
  });
  pinkParticles = new THREE.Points(pGeo, pMat);
  scene.add(pinkParticles);
}

/* --- soft nebula patches, purple + blush pink --- */
function buildNebula() {
  nebulaGroup = new THREE.Group();
  const configs = [
    { color: hexToCss(CONFIG.colors.mutedPurple, 0.55), pos: [-30, 10, -60], scale: 70 },
    { color: hexToCss(CONFIG.colors.blushPink, 0.30), pos: [40, -12, -80], scale: 60 },
    { color: hexToCss(CONFIG.colors.midnightNavy, 0.6), pos: [0, 30, -100], scale: 90 },
    { color: hexToCss(CONFIG.colors.blushPink, 0.22), pos: [-50, -25, -50], scale: 50 },
  ];
  configs.forEach(cfg => {
    const tex = makeRadialTexture(cfg.color, 'rgba(0,0,0,0)');
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(...cfg.pos);
    sprite.scale.set(cfg.scale, cfg.scale, 1);
    nebulaGroup.add(sprite);
  });
  scene.add(nebulaGroup);
}

/* --- floating cinematic photographs --- */
const textureLoader = new THREE.TextureLoader();

function buildPhotos() {
  CONFIG.photos.forEach((photo, i) => {
    const angle = (i / CONFIG.photos.length) * Math.PI * 2;
    const radius = 9 + (i % 2) * 2.5;
    const group = new THREE.Group();
    group.position.set(Math.cos(angle) * radius, Math.sin(i * 1.7) * 3, Math.sin(angle) * radius - 2);

    const geo = new THREE.PlaneGeometry(2.6, 3.4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    textureLoader.load(photo.src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
    }, undefined, () => {});
    group.add(mesh);

    // soft pink glow rim behind the photo
    const glowTex = makeRadialTexture(hexToCss(CONFIG.colors.blushPink, 0.35), 'rgba(0,0,0,0)');
    const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(5, 5, 1);
    glow.position.z = -0.3;
    group.add(glow);

    group.userData = { baseY: group.position.y, phase: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.15 };
    scene.add(group);
    photoGroup.push(group);
  });
}

/* --- little floating surprises (interactive objects) --- */
function makeGlowSprite(colorHex, size) {
  const tex = makeRadialTexture(hexToCss(colorHex, 0.85), 'rgba(0,0,0,0)');
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(size, size, 1);
  return sprite;
}

function buildSurpriseMesh(type) {
  const group = new THREE.Group();
  let core;
  const goldMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.gold, emissive: CONFIG.colors.gold, emissiveIntensity: 0.5, roughness: 0.4 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.blushPink, emissive: CONFIG.colors.blushPink, emissiveIntensity: 0.4, roughness: 0.5 });
  const creamMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.cream, emissive: CONFIG.colors.gold, emissiveIntensity: 0.25, roughness: 0.6 });

  if (type === 'moon') {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 20), creamMat);
  } else if (type === 'star') {
    core = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), pinkMat);
  } else if (type === 'gift') {
    core = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), pinkMat);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.15, 0.85), goldMat);
    lid.position.y = 0.42;
    core.add(lid);
  } else { // planet
    core = new THREE.Mesh(new THREE.SphereGeometry(0.6, 22, 22), goldMat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.04, 8, 40), pinkMat);
    ring.rotation.x = Math.PI / 2.4;
    core.add(ring);
  }
  group.add(core);
  group.add(makeGlowSprite(type === 'star' ? CONFIG.colors.blushPink : CONFIG.colors.gold, 2.6));
  return group;
}

function buildSurprises() {
  const n = CONFIG.surprises.length;
  CONFIG.surprises.forEach((s, i) => {
    const mesh = buildSurpriseMesh(s.type);
    const angle = (i / n) * Math.PI * 2 + 0.4;
    const radius = 6 + (i % 3) * 1.8;
    const height = Math.sin(i * 2.1) * 4;
    mesh.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    mesh.userData = {
      kind: 'surprise', config: s,
      basePos: mesh.position.clone(), phase: Math.random() * Math.PI * 2, teased: false
    };
    scene.add(mesh);
    interactiveGroup.push(mesh);
  });
}

/* --- childhood photo planet --- */
function buildChildhoodPlanet() {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(1.1, 28, 28);
  const mat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
  const sphere = new THREE.Mesh(geo, mat);
  textureLoader.load(CONFIG.childhoodPhoto.src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
  }, undefined, () => {});
  group.add(sphere);
  group.add(makeGlowSprite(CONFIG.colors.gold, 3.4));
  group.position.set(-13, 5, -6);
  group.userData = { kind: 'childhood', basePos: group.position.clone(), phase: 0 };
  scene.add(group);
  interactiveGroup.push(group);
  childhoodPlanet = group;
}

/* --- distance scene: two points far apart + a beacon near the hub to trigger the view --- */
function buildDistanceScene() {
  const matA = new THREE.MeshStandardMaterial({ color: CONFIG.colors.gold, emissive: CONFIG.colors.gold, emissiveIntensity: 0.8 });
  const matB = new THREE.MeshStandardMaterial({ color: CONFIG.colors.blushPink, emissive: CONFIG.colors.blushPink, emissiveIntensity: 0.8 });
  distancePointA = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), matA);
  distancePointA.position.set(-46, 6, -40);
  distancePointB = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), matB);
  distancePointB.position.set(46, -4, -55);
  distancePointA.add(makeGlowSprite(CONFIG.colors.gold, 3));
  distancePointB.add(makeGlowSprite(CONFIG.colors.blushPink, 3));
  scene.add(distancePointA, distancePointB);

  const lineGeo = new THREE.BufferGeometry().setFromPoints([distancePointA.position, distancePointB.position]);
  const lineMat = new THREE.LineDashedMaterial({ color: CONFIG.colors.blushPink, transparent: true, opacity: 0.5, dashSize: 1.4, gapSize: 0.8 });
  distanceLine = new THREE.Line(lineGeo, lineMat);
  distanceLine.computeLineDistances();
  scene.add(distanceLine);

  distanceBeacon = buildSurpriseMesh('star');
  distanceBeacon.position.set(9, -5, 3);
  distanceBeacon.userData = { kind: 'distance', basePos: distanceBeacon.position.clone(), phase: 1.2 };
  scene.add(distanceBeacon);
  interactiveGroup.push(distanceBeacon);
}

/* --- space dream comet trigger --- */
function buildSpaceDreamComet() {
  const group = buildSurpriseMesh('planet');
  group.position.set(0, 9, -8);
  group.userData = { kind: 'spaceDream', basePos: group.position.clone(), phase: 2.4 };
  scene.add(group);
  interactiveGroup.push(group);
  spaceDreamComet = group;
}

/* --- secret drawing (hidden until unlocked) --- */
function buildDrawingReveal() {
  const geo = new THREE.PlaneGeometry(3.6, 2.8);
  const mat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0, side: THREE.DoubleSide });
  drawingPlane = new THREE.Mesh(geo, mat);
  textureLoader.load(CONFIG.ourDrawing.src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
  }, undefined, () => {});
  drawingPlane.position.set(-6, -6, -14);
  drawingPlane.visible = false;
  drawingPlane.userData = { kind: 'drawing', basePos: drawingPlane.position.clone(), phase: 0.6 };
  scene.add(drawingPlane);
  // note: added to interactiveGroup only once unlocked (see unlockDrawing)
}

/* --- letter beacon (appears once enough has been discovered) --- */
function buildLetterBeacon() {
  letterBeacon = buildSurpriseMesh('moon');
  letterBeacon.position.set(3, 7, 5);
  letterBeacon.userData = { kind: 'letter', basePos: letterBeacon.position.clone(), phase: 3.1 };
  letterBeacon.visible = false;
  scene.add(letterBeacon);
  // added to interactiveGroup once unlocked
}

/* ---------------------------------------------------------------------
   4. Camera controls
--------------------------------------------------------------------- */

const controlState = {
  radius: 14, theta: 0, phi: Math.PI / 2.1,
  targetTheta: 0, targetPhi: Math.PI / 2.1, targetRadius: 14,
  dragging: false, lastX: 0, lastY: 0, moved: 0,
  autoDrift: !prefersReducedMotion,
};

function updateCameraFromSpherical() {
  const { radius, theta, phi } = controlState;
  camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
  camera.position.y = radius * Math.cos(phi);
  camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
  camera.lookAt(0, 0, 0);
}

function onPointerDown(e) {
  if (state.flying || state.cinematic || !state.started) return;
  controlState.dragging = true;
  controlState.moved = 0;
  controlState.lastX = e.clientX; controlState.lastY = e.clientY;
}
function onPointerMove(e) {
  if (!controlState.dragging) return;
  const dx = e.clientX - controlState.lastX;
  const dy = e.clientY - controlState.lastY;
  controlState.lastX = e.clientX; controlState.lastY = e.clientY;
  controlState.moved += Math.abs(dx) + Math.abs(dy);
  controlState.targetTheta -= dx * 0.0045;
  controlState.targetPhi -= dy * 0.0035;
  controlState.targetPhi = Math.max(0.5, Math.min(Math.PI - 0.5, controlState.targetPhi));
}
function onPointerUp(e) {
  if (!controlState.dragging) return;
  controlState.dragging = false;
  if (controlState.moved < 6) handleTap(e.clientX, e.clientY);
}

let lastPinchDist = null;
function onTouchMove(e) {
  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    if (lastPinchDist != null) {
      const delta = dist - lastPinchDist;
      controlState.targetRadius = Math.max(4, Math.min(40, controlState.targetRadius - delta * 0.03));
    }
    lastPinchDist = dist;
  }
}
function onTouchEnd() { lastPinchDist = null; }

function onWheel(e) {
  if (state.flying || state.cinematic || !state.started) return;
  controlState.targetRadius = Math.max(4, Math.min(40, controlState.targetRadius + e.deltaY * 0.01));
}

canvas.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('touchmove', onTouchMove, { passive: true });
canvas.addEventListener('touchend', onTouchEnd);
canvas.addEventListener('wheel', onWheel, { passive: true });

/* --- fly-to tween helper --- */
function flyCameraTo(targetPos, lookAtPos, duration = 1800) {
  return new Promise(resolve => {
    state.flying = true;
    const startPos = camera.position.clone();
    const startLook = new THREE.Vector3();
    camera.getWorldDirection(startLook);
    const startLookPoint = camera.position.clone().add(startLook.multiplyScalar(10));
    const t0 = performance.now();
    function step(now) {
      const t = Math.min(1, (now - t0) / duration);
      const ease = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
      camera.position.lerpVectors(startPos, targetPos, ease);
      const look = new THREE.Vector3().lerpVectors(startLookPoint, lookAtPos, ease);
      camera.lookAt(look);
      if (t < 1) requestAnimationFrame(step);
      else {
        state.flying = false;
        // resync spherical state to new position so drag-orbit resumes smoothly
        const p = camera.position;
        controlState.radius = p.length();
        controlState.phi = Math.acos(Math.max(-1, Math.min(1, p.y / controlState.radius)));
        controlState.theta = Math.atan2(p.z, p.x);
        controlState.targetRadius = controlState.radius;
        controlState.targetPhi = controlState.phi;
        controlState.targetTheta = controlState.theta;
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

/* ---------------------------------------------------------------------
   5. Interaction / raycasting
--------------------------------------------------------------------- */

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
const messageCard = document.getElementById('message-card');
const messageCardText = document.getElementById('message-card-text');
const messageCardInner = document.getElementById('message-card-inner');
const messageCardClose = document.getElementById('message-card-close');

function handleTap(clientX, clientY) {
  if (state.flying || state.cinematic || !state.started) return;
  pointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
  pointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  const targets = interactiveGroup.filter(o => o.visible !== false);
  const hits = raycaster.intersectObjects(targets, true);
  if (hits.length === 0) return;
  let obj = hits[0].object;
  while (obj.parent && !obj.userData.kind) obj = obj.parent;
  if (!obj.userData.kind) return;
  onObjectActivated(obj);
}

async function onObjectActivated(obj) {
  const kind = obj.userData.kind;
  if (kind === 'surprise') await activateSurprise(obj);
  else if (kind === 'childhood') await activateChildhood(obj);
  else if (kind === 'distance') await activateDistance(obj);
  else if (kind === 'spaceDream') await activateSpaceDream(obj);
  else if (kind === 'drawing') await activateDrawing(obj);
  else if (kind === 'letter') await activateLetter();
}

function worldPos(obj) {
  const v = new THREE.Vector3();
  obj.getWorldPosition(v);
  return v;
}

function markDiscovered(id) {
  if (state.discoveries.has(id)) return;
  state.discoveries.add(id);
  maybeUnlockDrawing();
}

function showMessageCard(text) {
  messageCardText.textContent = text;
  messageCard.classList.remove('hidden');
}
function hideMessageCard() {
  messageCard.classList.add('hidden');
}
messageCardClose.addEventListener('click', hideMessageCard);
messageCard.addEventListener('click', (e) => { if (e.target === messageCard) hideMessageCard(); });

async function activateSurprise(obj) {
  const cfg = obj.userData.config;
  const pos = worldPos(obj);
  const camTarget = pos.clone().normalize().multiplyScalar(pos.length() * 0.55);
  await flyCameraTo(camTarget, pos, 1500);
  if (cfg.teaser && !obj.userData.teased) {
    obj.userData.teased = true;
    showMessageCard(cfg.teaser);
    const revealOnce = () => {
      messageCardText.textContent = cfg.message;
      markDiscovered(cfg.id);
      messageCardInner.removeEventListener('click', revealOnce);
    };
    messageCardInner.addEventListener('click', revealOnce, { once: true });
  } else {
    showMessageCard(cfg.message);
    markDiscovered(cfg.id);
  }
}

async function activateChildhood(obj) {
  const pos = worldPos(obj);
  const camTarget = pos.clone().add(new THREE.Vector3(0, 0, 3.2));
  await flyCameraTo(camTarget, pos, 2000);
  showMessageCard(CONFIG.childhoodPhoto.message);
  markDiscovered('childhood');
}

async function activateDistance(obj) {
  const mid = new THREE.Vector3().addVectors(distancePointA.position, distancePointB.position).multiplyScalar(0.5);
  const camTarget = mid.clone().add(new THREE.Vector3(0, 12, 30));
  await flyCameraTo(camTarget, mid, 2200);
  showMessageCard(CONFIG.distance.message);
  markDiscovered('distance');
}

async function activateSpaceDream(obj) {
  state.cinematic = true;
  hud.classList.add('hidden');
  const dreamText = document.getElementById('dream-text');
  dreamText.classList.remove('hidden');

  const waypoints = [
    new THREE.Vector3(0, 4, 10),
    new THREE.Vector3(-4, 6, -20),
    new THREE.Vector3(6, 2, -55),
    new THREE.Vector3(0, 0, -95),
  ];
  const lookTarget = new THREE.Vector3(0, 0, -140);

  for (let i = 0; i < waypoints.length; i++) {
    const line = CONFIG.spaceDream.lines[i];
    const flightDuration = prefersReducedMotion ? 1200 : 3400;
    const flightPromise = flyCameraTo(waypoints[i], lookTarget, flightDuration);
    if (line) {
      setTimeout(() => {
        dreamText.textContent = line;
        dreamText.classList.add('show');
      }, flightDuration * 0.25);
      setTimeout(() => { dreamText.classList.remove('show'); }, flightDuration * 0.85);
    }
    await flightPromise;
  }

  dreamText.classList.add('hidden');
  markDiscovered('spaceDream');
  // return gently to the hub
  await flyCameraTo(new THREE.Vector3(0, 3, 14), new THREE.Vector3(0,0,0), 2400);
  state.cinematic = false;
  hud.classList.remove('hidden');
}

function maybeUnlockDrawing() {
  if (state.drawingUnlocked) return;
  if (state.discoveries.size >= DRAWING_UNLOCK_THRESHOLD) {
    state.drawingUnlocked = true;
    drawingPlane.visible = true;
    drawingPlane.material.opacity = 0; // will fade on activation approach; but glow hints it's there
    const glow = makeGlowSprite(CONFIG.colors.blushPink, 4.5);
    glow.position.copy(drawingPlane.position);
    scene.add(glow);
    drawingPlane.userData.glowRef = glow;
    interactiveGroup.push(drawingPlane);
    hintText.textContent = 'something new is glowing, out there';
    setTimeout(() => { if (hintText.textContent.includes('glowing')) hintText.textContent = ''; }, 6000);
  }
  maybeUnlockLetter();
}

function maybeUnlockLetter() {
  if (state.letterUnlocked) return;
  const enoughMain = state.discoveries.size >= TOTAL_MAIN_NODES - 1;
  if (enoughMain) {
    state.letterUnlocked = true;
    letterBeacon.visible = true;
    interactiveGroup.push(letterBeacon);
  }
}

async function activateDrawing(obj) {
  state.cinematic = true;
  const pos = worldPos(obj);
  const camTarget = pos.clone().add(new THREE.Vector3(0, 0, 3.4));
  // dim the world for a quieter moment
  const startAmbient = ambientLight.intensity;
  const t0 = performance.now();
  function dim() {
    const t = Math.min(1, (performance.now() - t0) / 1500);
    ambientLight.intensity = startAmbient * (1 - 0.6*t);
    warmLight.intensity = 0.4 + 0.5*t;
    if (t < 1) requestAnimationFrame(dim);
  }
  dim();

  await flyCameraTo(camTarget, pos, 2600);

  // fade in the drawing
  const fadeStart = performance.now();
  await new Promise(resolve => {
    function fade() {
      const t = Math.min(1, (performance.now() - fadeStart) / 2200);
      obj.material.opacity = t;
      if (obj.userData.glowRef) obj.userData.glowRef.material.opacity = 0.9 - t*0.3;
      if (t < 1) requestAnimationFrame(fade); else resolve();
    }
    fade();
  });

  showMessageCard(CONFIG.ourDrawing.revealMessage);
  markDiscovered('drawing');
  ambientLight.intensity = startAmbient;
  state.cinematic = false;
}

/* ---------------------------------------------------------------------
   6. Letter + final scene
--------------------------------------------------------------------- */

const letterScreen = document.getElementById('letter-screen');
const letterHeading = document.getElementById('letter-heading');
const letterBody = document.getElementById('letter-body');
const letterContinue = document.getElementById('letter-continue');
const finalScreen = document.getElementById('final-screen');
const finalLines = document.getElementById('final-lines');
const oneMoreThingBtn = document.getElementById('one-more-thing');
const secretMessageEl = document.getElementById('secret-message');

letterHeading.textContent = CONFIG.letter.heading;
letterBody.textContent = CONFIG.letter.body;

async function activateLetter() {
  state.cinematic = true;
  hud.classList.add('hidden');
  hideMessageCard();
  letterScreen.classList.remove('hidden');
}

letterContinue.addEventListener('click', () => {
  letterScreen.classList.add('hidden');
  runFinalScene();
});

function runFinalScene() {
  finalScreen.classList.remove('hidden');
  finalLines.innerHTML = '';
  CONFIG.finalScene.lines.forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'line';
    div.textContent = line;
    finalLines.appendChild(div);
    setTimeout(() => div.classList.add('show'), 500 + i * 1200);
  });
  const totalDelay = 500 + CONFIG.finalScene.lines.length * 1200 + 600;
  setTimeout(() => {
    oneMoreThingBtn.textContent = CONFIG.finalScene.oneMoreThingLabel;
    oneMoreThingBtn.classList.remove('hidden');
    oneMoreThingBtn.classList.add('show');
  }, totalDelay);
}

oneMoreThingBtn.addEventListener('click', () => {
  secretMessageEl.textContent = CONFIG.finalScene.secretMessage;
  secretMessageEl.classList.remove('hidden');
  requestAnimationFrame(() => secretMessageEl.classList.add('show'));
  oneMoreThingBtn.classList.add('hidden');
}, { once: true });

/* ---------------------------------------------------------------------
   7. Music player
--------------------------------------------------------------------- */

const musicToggle = document.getElementById('music-toggle');
const bgAudio = document.getElementById('bg-audio');
bgAudio.src = CONFIG.music.src;

musicToggle.addEventListener('click', () => {
  if (!state.musicPlaying) {
    bgAudio.play().then(() => {
      state.musicPlaying = true;
      musicToggle.classList.add('playing');
    }).catch(() => {
      hintText.textContent = `add your song at ${CONFIG.music.src}`;
      setTimeout(() => { hintText.textContent = ''; }, 4000);
    });
  } else {
    bgAudio.pause();
    state.musicPlaying = false;
    musicToggle.classList.remove('playing');
  }
});

/* ---------------------------------------------------------------------
   8. Render loop
--------------------------------------------------------------------- */

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  resizeGrain();
}
window.addEventListener('resize', onResize);

function animateObjects(t) {
  // photos gently float + rotate
  photoGroup.forEach(g => {
    g.position.y = g.userData.baseY + Math.sin(t * 0.4 + g.userData.phase) * 0.6;
    g.rotation.y = Math.sin(t * 0.2 + g.userData.phase) * 0.3;
    g.rotation.z = Math.cos(t * 0.15 + g.userData.phase) * 0.05;
  });
  // interactive objects gently bob + rotate, pulse a little more if music playing
  const pulse = state.musicPlaying ? 1 + Math.sin(t * 3) * 0.08 : 1;
  interactiveGroup.forEach(o => {
    const ud = o.userData;
    if (!ud.basePos) return;
    o.position.y = ud.basePos.y + Math.sin(t * 0.6 + ud.phase) * 0.35;
    o.rotation.y = t * 0.3 + ud.phase;
    o.scale.setScalar(pulse);
  });
  if (nebulaGroup) nebulaGroup.rotation.y = t * 0.01;
  if (starfield) starfield.rotation.y = t * 0.004;
  if (pinkParticles) {
    pinkParticles.rotation.y = -t * 0.006;
    pinkParticles.material.opacity = 0.45 + (state.musicPlaying ? Math.sin(t * 2) * 0.15 : 0.05);
  }
}

function tick() {
  requestAnimationFrame(tick);
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  if (!state.flying && !state.cinematic && state.started) {
    if (controlState.autoDrift && !controlState.dragging) {
      controlState.targetTheta += dt * 0.012;
    }
    controlState.theta += (controlState.targetTheta - controlState.theta) * 0.08;
    controlState.phi += (controlState.targetPhi - controlState.phi) * 0.08;
    controlState.radius += (controlState.targetRadius - controlState.radius) * 0.08;
    updateCameraFromSpherical();
  }

  animateObjects(t);
  tickGrain();
  renderer.render(scene, camera);
}

/* ---------------------------------------------------------------------
   Boot
--------------------------------------------------------------------- */

function beginUniverse() {
  state.started = true;
  hud.classList.remove('hidden');
  hintText.textContent = 'drag to look around · tap the glowing things';
  setTimeout(() => { if (hintText.textContent.includes('drag')) hintText.textContent = ''; }, 7000);
  updateCameraFromSpherical();
}

(function boot() {
  const ok = initRenderer();
  if (!ok || !window.WebGLRenderingContext) {
    showFallback();
    return;
  }
  try {
    initScene();
  } catch (e) {
    console.error(e);
    showFallback();
    return;
  }
  tick();
})();
