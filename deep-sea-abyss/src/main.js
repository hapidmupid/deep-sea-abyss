import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { LOADING_TEXTS } from './data.js';
import { createCameraPaths, createCameraPathHelper, getSliderStop } from './cameraPath.js';
import { createUI } from './ui.js';
import { createInteractionSystem, updateSpotlightTarget } from './interactions.js';
import { createProceduralWorld, updateProceduralAnimations } from './loaders.js';

// =========================
// 1. Inisialisasi UI
// =========================
const ui = createUI();
const { elements } = ui;

// LoadingManager tetap disiapkan agar nanti mudah diganti ke aset .glb asli.
// Pada versi procedural ini, progress loading disimulasikan karena belum ada file model eksternal.
const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (url, loaded, total) => {
  const progress = total > 0 ? (loaded / total) * 100 : 0;
  ui.setLoading(progress, `Memuat aset: ${url}`);
};

// =========================
// 2. Inisialisasi Scene, Kamera, Renderer
// =========================
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020711);
scene.fog = new THREE.FogExp2(0x00111f, 0.035);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 130);
camera.position.set(0, 8, 28);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;

// =========================
// 3. Pencahayaan Bawah Laut
// =========================
const ambientLight = new THREE.AmbientLight(0x15384f, 0.65);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x8fefff, 1.1);
moonLight.position.set(-7, 12, 7);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
scene.add(moonLight);

const fillLight = new THREE.PointLight(0x0b7c94, 1.2, 26, 2.1);
fillLight.position.set(6, 5, 3);
scene.add(fillLight);

// SpotLight senter yang mengikuti mouse.
const spotlightTarget = new THREE.Object3D();
spotlightTarget.position.set(0, 2, 0);
scene.add(spotlightTarget);

const flashlight = new THREE.SpotLight(0x7df7ff, 3.8, 34, Math.PI / 7.5, 0.48, 1.4);
flashlight.position.copy(camera.position);
flashlight.target = spotlightTarget;
flashlight.castShadow = true;
flashlight.shadow.mapSize.set(1024, 1024);
scene.add(flashlight);

const smoothSpotTarget = new THREE.Vector3(0, 2, 0);

// =========================
// 4. Membuat world procedural tanpa GLB
// =========================
const world = createProceduralWorld(scene);

// =========================
// 5. Membuat jalur kamera CatmullRomCurve3
// =========================
const { cameraCurve, lookAtCurve } = createCameraPaths();
const pathHelper = createCameraPathHelper(cameraCurve);
scene.add(pathHelper);

// Objek untuk menyimpan nilai progress kamera dari 0 sampai 1.
const cameraProgress = { value: 0 };
let cameraTween = null;
let isExplorationActive = false;
let introTimeline = null;

// =========================
// 6. Sistem Interaksi Raycaster
// =========================
const interaction = createInteractionSystem({
  camera,
  renderer,
  interactives: world.interactives,
  onSelect: handleCreatureSelect
});

// =========================
// 7. Audio Ambient Procedural
// =========================
// Karena belum memakai file audio, audio dibuat dengan Web Audio API sederhana.
let audioContext = null;
let ambientGain = null;
let isAudioOn = false;

function createAmbientAudio() {
  if (audioContext) return;

  audioContext = new AudioContext();
  ambientGain = audioContext.createGain();
  ambientGain.gain.value = 0.0;
  ambientGain.connect(audioContext.destination);

  const lowOsc = audioContext.createOscillator();
  lowOsc.type = 'sine';
  lowOsc.frequency.value = 48;

  const lowFilter = audioContext.createBiquadFilter();
  lowFilter.type = 'lowpass';
  lowFilter.frequency.value = 120;

  const shimmer = audioContext.createOscillator();
  shimmer.type = 'triangle';
  shimmer.frequency.value = 115;

  const shimmerGain = audioContext.createGain();
  shimmerGain.gain.value = 0.018;

  lowOsc.connect(lowFilter);
  lowFilter.connect(ambientGain);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(ambientGain);

  lowOsc.start();
  shimmer.start();
}

function toggleAudio() {
  createAmbientAudio();
  isAudioOn = !isAudioOn;
  gsap.to(ambientGain.gain, {
    value: isAudioOn ? 0.055 : 0.0,
    duration: 0.5,
    ease: 'power2.out'
  });
  ui.setAudioState(isAudioOn);
}

// =========================
// 8. Loading Manager Simulasi
// =========================
// Karena belum ada .glb, loading dibuat simulasi supaya tampilan tetap sesuai laporan.
function simulateLoading() {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 9 + 4;
    const textIndex = Math.min(LOADING_TEXTS.length - 1, Math.floor((progress / 100) * LOADING_TEXTS.length));
    ui.setLoading(progress, LOADING_TEXTS[textIndex]);

    if (progress >= 100) {
      clearInterval(interval);
      ui.setLoading(100, 'Ekosistem abyss siap dijelajahi.');
      ui.showStartButton();
    }
  }, 180);
}

// =========================
// 9. Kontrol Kamera Linear-Sliding Navigation
// =========================
function updateCameraFromProgress() {
  const t = THREE.MathUtils.clamp(cameraProgress.value, 0, 1);
  const position = cameraCurve.getPoint(t);
  const focus = lookAtCurve.getPoint(t);

  camera.position.copy(position);
  camera.lookAt(focus);

  flashlight.position.copy(camera.position);
  flashlight.position.y -= 0.1;

  const percent = t * 100;
  ui.updateNavigationUI(percent, getSliderStop(percent));
}

function setCameraPercent(percent, smooth = true) {
  const target = THREE.MathUtils.clamp(percent / 100, 0, 1);

  if (cameraTween) cameraTween.kill();

  if (smooth) {
    cameraTween = gsap.to(cameraProgress, {
      value: target,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: updateCameraFromProgress
    });
  } else {
    cameraProgress.value = target;
    updateCameraFromProgress();
  }
}

// =========================
// 10. Cinematic Intro Sequence
// =========================
function startIntroSequence() {
  createAmbientAudio();
  ui.closeLoadingScreen();
  ui.showSkip();

  isExplorationActive = false;
  camera.position.set(0, 8.5, 28);
  camera.lookAt(0, 2, 0);

  introTimeline = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    onComplete: finishIntro
  });

  introTimeline
    .to(camera.position, {
      x: 0,
      y: 6.2,
      z: 20,
      duration: 1.4,
      onUpdate: () => camera.lookAt(0, 2, 0)
    })
    .to(camera.position, {
      x: -1.6,
      y: 4.4,
      z: 15.5,
      duration: 1.4,
      onUpdate: () => camera.lookAt(0, 2, 0)
    })
    .to(camera.position, {
      x: 0,
      y: 4,
      z: 18,
      duration: 1.8,
      onUpdate: () => camera.lookAt(0, 2, 0)
    });
}

function finishIntro() {
  ui.hideSkip();
  ui.showMainUI();
  isExplorationActive = true;
  setCameraPercent(0, false);
}

function skipIntro() {
  if (introTimeline) introTimeline.kill();
  finishIntro();
}

// =========================
// 11. Trigger Klik Objek 3D
// =========================
function handleCreatureSelect(creatureId, root) {
  ui.showInfoPanel(creatureId);
  triggerCreatureAnimation(creatureId, root);
}

function triggerCreatureAnimation(creatureId, root) {
  const parts = root.userData.parts || {};

  if (creatureId === 'plesiosaurus') {
    const timeline = gsap.timeline();
    timeline
      .to(root.position, { z: root.position.z + 0.75, duration: 0.45, ease: 'power2.out' })
      .to(parts.neck.rotation, { z: 0.34, duration: 0.35, ease: 'power2.inOut' }, '<')
      .to(parts.jawBottom.rotation, { z: -Math.PI / 2 - 0.35, duration: 0.25, ease: 'power2.out' }, '<')
      .to(parts.neck.rotation, { z: -0.08, duration: 0.75, ease: 'elastic.out(1, 0.45)' })
      .to(parts.jawBottom.rotation, { z: -Math.PI / 2, duration: 0.35, ease: 'power2.out' }, '<')
      .to(root.position, { z: root.position.z, duration: 0.8, ease: 'power2.inOut' }, '<');
  }

  if (creatureId === 'mosasaurus') {
    const startX = root.position.x;
    const startYRot = root.rotation.y;
    const timeline = gsap.timeline();
    timeline
      .to(root.position, { x: startX + 1.6, duration: 0.35, ease: 'power2.out' })
      .to(root.rotation, { y: startYRot + 1.1, z: 0.18, duration: 0.55, ease: 'power2.inOut' }, '<')
      .to(parts.jaw.rotation, { z: -Math.PI / 2 - 0.35, duration: 0.25 }, '<')
      .to(root.position, { x: startX, duration: 0.9, ease: 'power2.inOut' })
      .to(root.rotation, { y: startYRot, z: 0, duration: 0.9, ease: 'power2.inOut' }, '<')
      .to(parts.jaw.rotation, { z: -Math.PI / 2, duration: 0.35 }, '<');
  }

  if (creatureId === 'ammonite') {
    gsap.to(root.rotation, {
      z: root.rotation.z + Math.PI * 2.5,
      duration: 1.6,
      ease: 'power2.inOut'
    });
    gsap.fromTo(root.scale, { x: 1.08, y: 1.08, z: 1.08 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
  }

  if (creatureId === 'anglerfish') {
    const { lure, lureLight, lureGroup } = parts;
    const timeline = gsap.timeline();
    timeline
      .to(lure.scale, { x: 1.9, y: 1.9, z: 1.9, duration: 0.16, repeat: 5, yoyo: true, ease: 'power1.inOut' })
      .to(lure.material, { emissiveIntensity: 3.8, duration: 0.16, repeat: 5, yoyo: true }, '<')
      .to(lureLight, { intensity: 4.5, duration: 0.16, repeat: 5, yoyo: true }, '<')
      .to(lureGroup.rotation, { z: 0.45, duration: 0.45, yoyo: true, repeat: 1, ease: 'power2.inOut' }, '<');
  }
}

// =========================
// 12. Event Listener UI
// =========================
elements.startBtn.addEventListener('click', startIntroSequence);
elements.skipBtn.addEventListener('click', skipIntro);
elements.audioBtn.addEventListener('click', toggleAudio);
elements.helpBtn.addEventListener('click', ui.showHelp);
elements.understandBtn.addEventListener('click', ui.hideHelp);
elements.closePanel.addEventListener('click', ui.hideInfoPanel);

elements.cameraSlider.addEventListener('input', (event) => {
  if (!isExplorationActive) return;
  setCameraPercent(Number(event.target.value), true);
});

// Swipe gesture untuk mobile: geser kanan/kiri mengubah posisi slider.
let touchStartX = 0;
let touchLastX = 0;

window.addEventListener('touchstart', (event) => {
  if (!isExplorationActive || event.touches.length !== 1) return;
  touchStartX = event.touches[0].clientX;
  touchLastX = touchStartX;
}, { passive: true });

window.addEventListener('touchmove', (event) => {
  if (!isExplorationActive || event.touches.length !== 1) return;
  const x = event.touches[0].clientX;
  const delta = x - touchLastX;
  touchLastX = x;

  const current = Number(elements.cameraSlider.value);
  const next = THREE.MathUtils.clamp(current + delta * 0.09, 0, 100);
  elements.cameraSlider.value = String(next);
  setCameraPercent(next, true);
}, { passive: true });

window.addEventListener('touchend', () => {
  touchStartX = 0;
  touchLastX = 0;
});

// Mouse move juga dipakai untuk efek senter.
window.addEventListener('pointermove', (event) => {
  interaction.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  interaction.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Resize handler supaya canvas tetap responsif.
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// =========================
// 13. Render Loop
// =========================
const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  updateProceduralAnimations(world.animatables, elapsed);
  interaction.updateHover();
  updateSpotlightTarget({
    mouse: interaction.mouse,
    camera,
    targetObject: spotlightTarget,
    smoothTarget: smoothSpotTarget
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Posisi awal sebelum user menekan mulai.
updateCameraFromProgress();
simulateLoading();
animate();
