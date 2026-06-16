import * as THREE from 'three';
import { gsap } from 'gsap';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { initAudio, startBGM, setBGMEnabled, setSFXEnabled, playClickSfx, playHoverSfx, playWhooshSfx, playDiveSfx, playDetailSfx } from './audio.js';

// ==========================================
// STATE MACHINE
// ==========================================
const STATES = { LOADING: 0, LANDING: 1, STORY: 2, EXPLORING: 3, DETAIL: 4 };
let currentState = STATES.LOADING;

const screens = {
  loading: document.getElementById('loading-screen'),
  landing: document.getElementById('landing-page'),
  story: document.getElementById('story-sequence'),
  hud: document.getElementById('main-hud'),
  detail: document.getElementById('detail-view')
};

function changeState(newState) {
  currentState = newState;
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  if (newState === STATES.LOADING) screens.loading.classList.remove('hidden');
  else if (newState === STATES.LANDING) screens.landing.classList.remove('hidden');
  else if (newState === STATES.STORY) screens.story.classList.remove('hidden');
  else if (newState === STATES.EXPLORING) screens.hud.classList.remove('hidden');
  else if (newState === STATES.DETAIL) screens.detail.classList.remove('hidden');
}

// ==========================================
// AUDIO
// ==========================================
let isBgmEnabled = true;
let isSfxEnabled = true;
let audioInitialized = false;

function ensureAudio() {
  if (!audioInitialized) {
    initAudio();
    audioInitialized = true;
    if (isBgmEnabled) startBGM();
  }
}

function playSfx(type) {
  if (!isSfxEnabled || !audioInitialized) return;
  switch(type) {
    case 'click': playClickSfx(); break;
    case 'hover': playHoverSfx(); break;
    case 'whoosh': playWhooshSfx(); break;
    case 'dive': playDiveSfx(); break;
    case 'detail': playDetailSfx(); break;
  }
}

// ==========================================
// PARTICLES (2D canvas overlay)
// ==========================================
const pCanvas = document.getElementById('particles-canvas');
const pCtx = pCanvas.getContext('2d');
let particles = [];

function initParticles() {
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
  particles = [];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * pCanvas.width,
      y: Math.random() * pCanvas.height,
      r: Math.random() * 2 + 0.5,
      speedY: -(Math.random() * 0.3 + 0.1),
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.4 + 0.1
    });
  }
}
function drawParticles() {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  particles.forEach(p => {
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    pCtx.fillStyle = `rgba(0, 229, 255, ${p.opacity})`;
    pCtx.fill();
    p.y += p.speedY;
    p.x += p.speedX;
    if (p.y < -10) { p.y = pCanvas.height + 10; p.x = Math.random() * pCanvas.width; }
  });
}
initParticles();
window.addEventListener('resize', initParticles);

// ==========================================
// THREE.JS SETUP
// ==========================================
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x031225);
scene.fog = new THREE.FogExp2(0x031225, 0.006);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 35);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.8;
container.appendChild(renderer.domElement);

// OrbitControls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enabled = false;
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.maxDistance = 25;
orbitControls.minDistance = 3;
orbitControls.autoRotate = false;

// ==========================================
// LIGHTING
// ==========================================
const ambientLight = new THREE.AmbientLight(0x1a3a5c, 5.0);
scene.add(ambientLight);

// Main spotlight (flashlight) - mengikuti cursor
const spotLight = new THREE.SpotLight(0x88ccff, 200);
spotLight.angle = Math.PI / 3.5;
spotLight.penumbra = 0.9;
spotLight.decay = 1.2;
spotLight.distance = 120;
spotLight.castShadow = true;
spotLight.shadow.mapSize.set(1024, 1024);
scene.add(spotLight);
scene.add(spotLight.target);

// Cursor point light - cahaya kecil yang menempel ke arah cursor
const cursorLight = new THREE.PointLight(0x00e5ff, 15, 30);
scene.add(cursorLight);

// Rim lights untuk atmosfer
const rimLight = new THREE.PointLight(0x0077dd, 40, 200);
rimLight.position.set(-20, 10, -20);
scene.add(rimLight);

const topLight = new THREE.PointLight(0x1155aa, 30, 200);
topLight.position.set(0, 35, -15);
scene.add(topLight);

// Fill light dari bawah untuk mengurangi bayangan hitam pekat
const fillLight = new THREE.PointLight(0x0a2244, 15, 200);
fillLight.position.set(0, -5, 0);
scene.add(fillLight);

// Cahaya atmosferik tersebar di sepanjang jalur
const pathLight1 = new THREE.PointLight(0x0066cc, 12, 60);
pathLight1.position.set(0, 3, 0);
scene.add(pathLight1);

const pathLight2 = new THREE.PointLight(0x004488, 12, 60);
pathLight2.position.set(-8, 0, -15);
scene.add(pathLight2);

const pathLight3 = new THREE.PointLight(0x003366, 12, 60);
pathLight3.position.set(8, -1, -28);
scene.add(pathLight3);

// Hemisphere light untuk pencahayaan global natural
const hemiLight = new THREE.HemisphereLight(0x1155aa, 0x0a1520, 2.5);
scene.add(hemiLight);

// ==========================================
// ENVIRONMENT (Sea Floor, Rocks, Corals, Sand)
// ==========================================

// Floor - dasar laut halus dengan subdivisi tinggi
const floorGeo = new THREE.PlaneGeometry(200, 200, 128, 128);
const floorPositions = floorGeo.attributes.position;
for (let i = 0; i < floorPositions.count; i++) {
  const x = floorPositions.getX(i);
  const z = floorPositions.getZ(i);
  // Undulasi halus multi-layer supaya tidak kasar
  const h = Math.sin(x * 0.15) * Math.cos(z * 0.1) * 1.2
          + Math.sin(x * 0.4 + 1.3) * Math.cos(z * 0.35) * 0.4
          + Math.sin(x * 0.8 + 2.6) * Math.cos(z * 0.7 + 1.0) * 0.15;
  floorPositions.setY(i, floorPositions.getY(i) + h);
}
floorGeo.computeVertexNormals();
const floorMat = new THREE.MeshStandardMaterial({ 
  color: 0x142838, roughness: 0.85, metalness: 0.05,
  flatShading: false
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -8;
floor.receiveShadow = true;
scene.add(floor);

// Lapisan pasir halus (sedikit lebih tinggi, warna lebih cerah)
const sandGeo = new THREE.PlaneGeometry(200, 200, 96, 96);
const sandPositions = sandGeo.attributes.position;
for (let i = 0; i < sandPositions.count; i++) {
  const x = sandPositions.getX(i);
  const z = sandPositions.getZ(i);
  const h = Math.sin(x * 0.2 + 0.5) * Math.cos(z * 0.15) * 0.8
          + Math.sin(x * 0.6) * 0.2;
  sandPositions.setY(i, sandPositions.getY(i) + h);
}
sandGeo.computeVertexNormals();
const sandMat = new THREE.MeshStandardMaterial({ 
  color: 0x1a3040, roughness: 0.95, metalness: 0.0,
  flatShading: false, transparent: true, opacity: 0.6
});
const sand = new THREE.Mesh(sandGeo, sandMat);
sand.rotation.x = -Math.PI / 2;
sand.position.y = -7.5;
sand.receiveShadow = true;
scene.add(sand);

// Rock generator - lebih halus
function createRock(x, y, z, scale) {
  const geo = new THREE.DodecahedronGeometry(1, 2); // Subdivisi lebih tinggi = lebih halus
  const positions = geo.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.15);
    positions.setY(i, positions.getY(i) + (Math.random() - 0.5) * 0.15);
    positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.15);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ 
    color: 0x1e3448, roughness: 0.75, metalness: 0.05,
    flatShading: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.scale.set(scale, scale * 0.7, scale);
  mesh.rotation.y = Math.random() * Math.PI;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

createRock(-15, -7, -8, 3);
createRock(12, -7, -20, 2.5);
createRock(-20, -7, -18, 4);
createRock(18, -7.5, -5, 2);
createRock(5, -7, -30, 3.5);
createRock(-8, -7, -25, 2);
createRock(10, -7.2, -10, 1.8);
createRock(-14, -7.3, -35, 3);
createRock(15, -7, -42, 2.8);
createRock(-5, -7.5, -45, 3.2);
createRock(20, -7, -50, 4.5);
createRock(-12, -7.2, -55, 2.5);
createRock(8, -7.4, -60, 3.0);
createRock(-2, -7, -20, 1.5);
createRock(0, -7.5, -40, 2.0);

// Coral generator - karang halus
function createCoral(x, y, z, type) {
  const group = new THREE.Group();
  const colors = [0x2a5566, 0x1e4455, 0x336677, 0x1a5544];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  if (type === 'branch') {
    // Karang bercabang
    for (let i = 0; i < 5; i++) {
      const h = 1.5 + Math.random() * 2.5;
      const geo = new THREE.CylinderGeometry(0.06, 0.15, h, 8);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
      const branch = new THREE.Mesh(geo, mat);
      branch.position.set((Math.random() - 0.5) * 1, h / 2, (Math.random() - 0.5) * 1);
      branch.rotation.x = (Math.random() - 0.5) * 0.3;
      branch.rotation.z = (Math.random() - 0.5) * 0.3;
      branch.castShadow = true;
      group.add(branch);
      // Ujung bulat
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x44aacc, emissive: 0x113344, emissiveIntensity: 0.3, roughness: 0.4 })
      );
      tip.position.set(branch.position.x, branch.position.y + h / 2, branch.position.z);
      group.add(tip);
    }
  } else if (type === 'fan') {
    // Kipas laut
    const fanGeo = new THREE.PlaneGeometry(2, 2.5, 8, 10);
    const fanPos = fanGeo.attributes.position;
    for (let i = 0; i < fanPos.count; i++) {
      fanPos.setZ(i, (Math.random() - 0.5) * 0.15);
    }
    fanGeo.computeVertexNormals();
    const fanMat = new THREE.MeshStandardMaterial({ 
      color: 0x225566, roughness: 0.5, metalness: 0.1,
      side: THREE.DoubleSide, transparent: true, opacity: 0.8
    });
    const fan = new THREE.Mesh(fanGeo, fanMat);
    fan.position.y = 1.2;
    fan.castShadow = true;
    fan.userData.swayOffset = Math.random() * Math.PI * 2;
    group.add(fan);
  } else {
    // Karang bola (brain coral)
    const geo = new THREE.SphereGeometry(0.6 + Math.random() * 0.5, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 });
    const ball = new THREE.Mesh(geo, mat);
    ball.scale.y = 0.6;
    ball.castShadow = true;
    group.add(ball);
  }
  
  group.position.set(x, y, z);
  scene.add(group);
  return group;
}

const corals = [];
corals.push(createCoral(-12, -7.5, -5, 'branch'));
corals.push(createCoral(10, -7.5, -8, 'fan'));
corals.push(createCoral(-6, -7.8, -12, 'ball'));
corals.push(createCoral(14, -7.5, -18, 'branch'));
corals.push(createCoral(-16, -7.5, -22, 'fan'));
corals.push(createCoral(6, -7.8, -28, 'ball'));
corals.push(createCoral(-10, -7.5, -35, 'branch'));
corals.push(createCoral(8, -7.5, -40, 'fan'));
corals.push(createCoral(-14, -7.5, -48, 'branch'));
corals.push(createCoral(12, -7.5, -52, 'fan'));
corals.push(createCoral(-5, -7.8, -58, 'ball'));
corals.push(createCoral(4, -7.5, -15, 'fan'));
corals.push(createCoral(-2, -7.8, -25, 'ball'));
corals.push(createCoral(0, -7.5, -32, 'branch'));

// Kelp - lebih banyak dan lebih lebar
function createKelp(x, z) {
  const group = new THREE.Group();
  const stalkCount = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < stalkCount; i++) {
    const height = 5 + Math.random() * 8;
    const geo = new THREE.CylinderGeometry(0.04, 0.1, height, 8);
    const mat = new THREE.MeshStandardMaterial({ 
      color: 0x1a6644, roughness: 0.5, side: THREE.DoubleSide,
      emissive: 0x0a2211, emissiveIntensity: 0.2
    });
    const stalk = new THREE.Mesh(geo, mat);
    stalk.position.set((Math.random() - 0.5) * 2, height / 2 - 8, (Math.random() - 0.5) * 2);
    stalk.rotation.x = (Math.random() - 0.5) * 0.12;
    stalk.rotation.z = (Math.random() - 0.5) * 0.12;
    stalk.userData.swayOffset = Math.random() * Math.PI * 2;
    stalk.userData.swaySpeed = 0.4 + Math.random() * 0.4;
    stalk.castShadow = true;
    group.add(stalk);
    
    // Daun-daun kecil di sepanjang batang
    const leafCount = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < leafCount; j++) {
      const leafGeo = new THREE.PlaneGeometry(0.3 + Math.random() * 0.4, 0.8 + Math.random() * 0.6);
      const leafMat = new THREE.MeshStandardMaterial({ 
        color: 0x1d7755, roughness: 0.4, side: THREE.DoubleSide,
        transparent: true, opacity: 0.7
      });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(
        stalk.position.x + (Math.random() - 0.5) * 0.5,
        stalk.position.y - height / 2 + (j + 1) * (height / (leafCount + 1)),
        stalk.position.z + (Math.random() - 0.5) * 0.5
      );
      leaf.rotation.y = Math.random() * Math.PI;
      leaf.rotation.z = (Math.random() - 0.5) * 0.5;
      group.add(leaf);
    }
  }
  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

const kelps = [];
kelps.push(createKelp(-12, -3));
kelps.push(createKelp(8, -12));
kelps.push(createKelp(-5, -18));
kelps.push(createKelp(15, -8));
kelps.push(createKelp(-18, -22));
kelps.push(createKelp(6, -6));
kelps.push(createKelp(-9, -32));
kelps.push(createKelp(13, -38));
kelps.push(createKelp(-15, -45));
kelps.push(createKelp(10, -48));
kelps.push(createKelp(-6, -52));
kelps.push(createKelp(14, -58));
kelps.push(createKelp(-2, -10));
kelps.push(createKelp(2, -26));
kelps.push(createKelp(-4, -40));

// 3D Bubbles - lebih banyak
function createBubbleCluster(x, y, z) {
  const group = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.12, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ 
      color: 0xaaeeff, transparent: true, opacity: 0.25,
      roughness: 0, metalness: 0.6, emissive: 0x112233, emissiveIntensity: 0.2
    });
    const bubble = new THREE.Mesh(geo, mat);
    bubble.position.set((Math.random() - 0.5) * 3, Math.random() * 4, (Math.random() - 0.5) * 3);
    bubble.userData.baseY = bubble.position.y;
    bubble.userData.speed = 0.3 + Math.random() * 0.8;
    group.add(bubble);
  }
  group.position.set(x, y, z);
  scene.add(group);
  return group;
}

const bubbleClusters = [];
bubbleClusters.push(createBubbleCluster(-10, -5, -10));
bubbleClusters.push(createBubbleCluster(8, -6, -18));
bubbleClusters.push(createBubbleCluster(0, -4, -25));
bubbleClusters.push(createBubbleCluster(-7, -5, -35));
bubbleClusters.push(createBubbleCluster(10, -5, -42));
bubbleClusters.push(createBubbleCluster(3, -3, -5));
bubbleClusters.push(createBubbleCluster(-12, -4, -50));
bubbleClusters.push(createBubbleCluster(6, -5, -55));
bubbleClusters.push(createBubbleCluster(-4, -6, -60));
bubbleClusters.push(createBubbleCluster(2, -3, -15));
bubbleClusters.push(createBubbleCluster(-5, -4, -28));

// ==========================================
// ASSET LOADER (GLB Models)
// ==========================================
const objects = [];
const allGroups = [];
const mixers = [];

// Loading Manager untuk update UI loading ring
const loadingManager = new THREE.LoadingManager();
const ringCircumference = 283;
const ringEl = document.getElementById('ring-progress');
const percentEl = document.getElementById('loading-percent');

loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
  const progress = (itemsLoaded / itemsTotal) * 100;
  const offset = ringCircumference - (progress / 100) * ringCircumference;
  ringEl.style.strokeDashoffset = offset;
  percentEl.innerText = Math.floor(progress);
};

loadingManager.onLoad = function() {
  setTimeout(() => changeState(STATES.LANDING), 600);
};

const gltfLoader = new GLTFLoader(loadingManager);

function loadModel(path, name, targetSize, pos, rotY) {
  gltfLoader.load(path, (gltf) => {
    const model = gltf.scene;
    
    // 1. Reset scale ke 1 untuk mengukur ukuran asli model
    model.scale.setScalar(1);
    
    // 2. Hitung ukuran asli Bounding Box
    const originalBox = new THREE.Box3().setFromObject(model);
    const originalSize = new THREE.Vector3();
    originalBox.getSize(originalSize);
    
    // 3. Cari dimensi terpanjang dari model (x, y, atau z)
    const maxDim = Math.max(originalSize.x, originalSize.y, originalSize.z);
    
    // 4. Hitung faktor skala (Scale Factor)
    // Jika ukuran asli model besar, nilai skalanya akan menjadi desimal kecil. Jika kecil, akan membesar.
    const scaleFactor = maxDim > 0 ? (targetSize / maxDim) : 1;
    model.scale.setScalar(scaleFactor);
    
    // 5. Hitung ulang Bounding Box SETELAH model disesuaikan skalanya
    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledSize = new THREE.Vector3();
    scaledBox.getSize(scaledSize);
    const center = new THREE.Vector3();
    scaledBox.getCenter(center);
    
    const group = new THREE.Group();
    group.position.copy(pos);
    group.rotation.y = rotY;
    
    // Posisikan model agar titik tengahnya berada tepat di (0,0,0) relative ke parent group
    model.position.sub(center);
    group.add(model);
    
    // Buat hitbox invisible menggunakan ukuran yang sudah disesuaikan
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(scaledSize.x, scaledSize.y, scaledSize.z),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.userData = { 
      name: name, 
      state: 'idle', 
      group: group,
      modelMeshes: []
    };
    group.add(hitBox);
    
    // Aktifkan bayangan dan simpan warna emissive asli tiap mesh
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.userData.originalEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0x000000);
          hitBox.userData.modelMeshes.push(child);
        }
      }
    });

    // Jalankan animasi bawaan jika ada
    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      // Mainkan hanya animasi pertama (biasanya NLA track utama) 
      // agar tidak terjadi konflik antar track jika diexport dari Blender
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
      mixers.push({ mixer: mixer, group: group });
    }

    scene.add(group);
    objects.push(hitBox);
    allGroups.push(group);
  }, undefined, (error) => {
    console.error(`Gagal meload model ${path}:`, error);
  });
}

// Load Real Models
loadModel('./models/Plesiosaurus.glb', 'Plesiosaurus', 8.0, new THREE.Vector3(0, 1, 0), 0);

// We add spotlights specific to animals to make them very clear
const megalodonLight = new THREE.PointLight(0x44aaff, 30, 40);
megalodonLight.position.set(-8, 3, -15);
scene.add(megalodonLight);
loadModel('./models/megalodon.glb', 'Megalodon', 12.0, new THREE.Vector3(-10, 0, -15), Math.PI / 4);

const mosaLight = new THREE.PointLight(0x44aaff, 30, 40);
mosaLight.position.set(10, 4, -30);
scene.add(mosaLight);
loadModel('./models/mosasaurus.glb', 'Mosasaurus', 14.0, new THREE.Vector3(12, 1, -30), -Math.PI / 4);

// Senter (Flashlight) Model
gltfLoader.load('./models/senter.glb', (gltf) => {
  const senter = gltf.scene;
  senter.scale.setScalar(0.8);
  senter.position.set(1.5, -1.2, -2.5); // Kanan bawah layar
  
  // Arahkan senter ke depan agak ke tengah
  senter.rotation.set(-0.1, Math.PI - 0.2, 0); 
  
  // Pastikan bahan senter bereaksi terhadap cahaya
  senter.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  camera.add(senter);
  scene.add(camera);
});

// Additional decorative ambient lights for better visibility along the path
const extraPathLight1 = new THREE.PointLight(0x0055aa, 15, 60);
extraPathLight1.position.set(0, 2, -22);
scene.add(extraPathLight1);

const extraPathLight2 = new THREE.PointLight(0x0055aa, 15, 60);
extraPathLight2.position.set(0, 0, -40);
scene.add(extraPathLight2);


// ==========================================
// CAMERA SPLINE NAVIGATION
// ==========================================
const curvePoints = [
  new THREE.Vector3(0, 6, 25),      
  new THREE.Vector3(0, 3, 12),      
  new THREE.Vector3(0, 1, -2),      
  new THREE.Vector3(-8, 0, -10),    
  new THREE.Vector3(-4, -1, -22),   
  new THREE.Vector3(8, 0, -28),     
  new THREE.Vector3(0, -2, -38),    
  new THREE.Vector3(-5, -4, -50),   
  new THREE.Vector3(0, -6, -60)     
];
const cameraSpline = new THREE.CatmullRomCurve3(curvePoints);

let currentCameraT = 0;
let targetCameraT = 0;

function updateCameraPosition(t) {
  if (currentState !== STATES.EXPLORING) return;
  const pos = cameraSpline.getPointAt(t);
  camera.position.copy(pos);
  
  const lookT = Math.min(t + 0.1, 1);
  const lookPos = cameraSpline.getPointAt(lookT);
  camera.lookAt(lookPos);
  
  const depth = Math.floor(4000 + t * 3000);
  document.getElementById('depth-sensor').innerText = `${Math.max(500, depth)}m`;
  
  const thumb = document.getElementById('scroll-thumb');
  thumb.style.top = `${t * 170}px`;
}

window.addEventListener('wheel', (e) => {
  if (currentState !== STATES.EXPLORING) return;
  const scrollDelta = (e.deltaY > 0 ? -1 : 1) * 0.015;
  targetCameraT = Math.max(0, Math.min(1, targetCameraT + scrollDelta));
  gsap.to({ t: currentCameraT }, {
    t: targetCameraT,
    duration: 0.8,
    ease: "power2.out",
    onUpdate: function () {
      currentCameraT = this.targets()[0].t;
      updateCameraPosition(currentCameraT);
    }
  });
});

// ==========================================
// RAYCASTER & INTERACTION
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;
let selectedObject = null;

// Fungsi helper untuk mengubah warna emissive
function setEmissive(obj, hexColor) {
  if (obj.userData.modelMeshes) {
    obj.userData.modelMeshes.forEach(m => {
      if(m.material && m.material.emissive) m.material.emissive.setHex(hexColor);
    });
  } else {
    if(obj.material && obj.material.emissive) obj.material.emissive.setHex(hexColor);
  }
}

function restoreEmissive(obj) {
  if (obj.userData.modelMeshes) {
    obj.userData.modelMeshes.forEach(m => {
      if(m.material && m.material.emissive) m.material.emissive.copy(m.userData.originalEmissive);
    });
  } else {
    if(obj.material && obj.material.emissive) obj.material.emissive.setHex(0x000000);
  }
}

window.addEventListener('mousemove', (event) => {
  if (currentState !== STATES.EXPLORING) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const vec = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);
  const dir = vec.sub(camera.position).normalize();
  const dist = Math.abs(camera.position.z) / Math.abs(dir.z);
  const target = camera.position.clone().add(dir.multiplyScalar(Math.min(dist, 30)));
  gsap.to(spotLight.target.position, { x: target.x, y: target.y, z: target.z, duration: 0.4, overwrite: true });
  
  // Posisi lampu disesuaikan dengan posisi senter
  const lightOffset = new THREE.Vector3(1.5, -1.2, -2.5);
  lightOffset.applyQuaternion(camera.quaternion);
  spotLight.position.copy(camera.position).add(lightOffset);
  
  // Cahaya kecil yang mengikuti titik tuju cursor
  gsap.to(cursorLight.position, { x: target.x, y: target.y, z: target.z, duration: 0.5, overwrite: true });

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (hoveredObject !== obj) {
      if (hoveredObject && hoveredObject.userData.state !== 'click') {
        restoreEmissive(hoveredObject);
        hoveredObject.userData.state = 'idle';
      }
      hoveredObject = obj;
      if (hoveredObject.userData.state !== 'click') {
        setEmissive(hoveredObject, 0x003322); // Highlight color
        hoveredObject.userData.state = 'hover';
        playSfx('hover');
      }
      document.body.style.cursor = 'pointer';
    }
  } else {
    if (hoveredObject && hoveredObject.userData.state !== 'click') {
      restoreEmissive(hoveredObject);
      hoveredObject.userData.state = 'idle';
    }
    hoveredObject = null;
    document.body.style.cursor = 'default';
  }
});

window.addEventListener('click', () => {
  if (currentState !== STATES.EXPLORING || !hoveredObject) return;
  playSfx('click');
  
  hoveredObject.userData.state = 'click';
  selectedObject = hoveredObject;
  
  const g = hoveredObject.userData.group;
  gsap.to(g.rotation, { y: g.rotation.y + Math.PI * 2, duration: 1.2, ease: "elastic.out(1, 0.4)" });
  gsap.to(g.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.3, yoyo: true, repeat: 1 });
  
  showInfoPanel(hoveredObject.userData.name);
});

// ==========================================
// UI LOGIC
// ==========================================

// --- Landing ---
document.getElementById('btn-explore').addEventListener('click', () => {
  ensureAudio(); // Inisialisasi audio pada interaksi pertama user
  playSfx('click');
  changeState(STATES.STORY);
  startStorySequence();
});

// --- Settings ---
const settingsModal = document.getElementById('settings-modal');
document.getElementById('btn-settings').addEventListener('click', () => { ensureAudio(); playSfx('click'); settingsModal.classList.remove('hidden'); });
document.getElementById('btn-hud-settings').addEventListener('click', () => { playSfx('click'); settingsModal.classList.remove('hidden'); });
document.getElementById('btn-close-settings').addEventListener('click', () => { playSfx('click'); settingsModal.classList.add('hidden'); });
document.getElementById('toggle-bgm').addEventListener('change', (e) => { isBgmEnabled = e.target.checked; ensureAudio(); setBGMEnabled(isBgmEnabled); });
document.getElementById('toggle-sfx').addEventListener('change', (e) => { isSfxEnabled = e.target.checked; setSFXEnabled(isSfxEnabled); });

// --- Story ---
const storyData = [
  { icon: '🌍', text: 'Ratusan juta tahun yang lalu, samudra bumi dikuasai oleh raksasa prasejarah yang misterius dan menakutkan.' },
  { icon: '🦕', text: 'Era Mesozoikum merupakan zaman keemasan bagi reptil laut — dari Plesiosaurus yang anggun hingga Mosasaurus sang predator puncak.' },
  { icon: '🦈', text: 'Hingga era Kenozoikum, lautan diteror oleh Megalodon, hiu prasejarah terbesar yang pernah hidup dengan gigitan mematikan penghancur tulang.' },
  { icon: '🌊', text: 'Kini, saatnya Anda menyelam melintasi waktu untuk menyaksikan wujud asli dari monster-monster samudra ini secara langsung...' }
];
let currentStoryIdx = 0;

function startStorySequence() {
  currentStoryIdx = 0;
  updateStory();
}

function updateStory() {
  const data = storyData[currentStoryIdx];
  document.getElementById('story-icon').innerText = data.icon;
  const textEl = document.getElementById('story-text');
  textEl.style.opacity = 0;
  setTimeout(() => {
    textEl.innerText = data.text;
    gsap.to(textEl, { opacity: 1, duration: 0.6 });
  }, 200);
  
  document.querySelectorAll('.story-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentStoryIdx);
  });
}

document.getElementById('btn-next-story').addEventListener('click', () => {
  playSfx('click');
  currentStoryIdx++;
  if (currentStoryIdx >= storyData.length) enterExploringState();
  else updateStory();
});
document.getElementById('btn-skip-story').addEventListener('click', () => { playSfx('click'); enterExploringState(); });

function enterExploringState() {
  changeState(STATES.EXPLORING);
  playSfx('dive'); // Efek suara menyelam
  gsap.to(camera.position, {
    x: curvePoints[1].x, y: curvePoints[1].y, z: curvePoints[1].z,
    duration: 3.5, ease: "power3.inOut",
    onUpdate: () => {
      const lookTarget = cameraSpline.getPointAt(0.05);
      lookTarget.y -= 2;
      camera.lookAt(lookTarget);
    },
    onComplete: () => { targetCameraT = 0; currentCameraT = 0; updateCameraPosition(0); }
  });
  
  setTimeout(() => {
    gsap.to(document.getElementById('hud-hint'), { opacity: 0, duration: 1 });
  }, 5000);
  
  document.getElementById('hud-hint').style.opacity = 1;
  document.getElementById('hud-hint').innerHTML = "<span>🖱️ Scroll Mouse ke ATAS untuk Maju, ke BAWAH untuk Mundur</span>";
}

// --- Info Panel ---
const infoPanel = document.getElementById('info-panel');
document.getElementById('btn-close-panel').addEventListener('click', () => {
  playSfx('click');
  infoPanel.classList.remove('active');
  if (selectedObject) { restoreEmissive(selectedObject); selectedObject.userData.state = 'idle'; }
  selectedObject = null;
});

const creatureData = {
  'Plesiosaurus': { 
    era: 'ERA MESOZOIKUM', size: '3.5 – 5 meter', diet: 'Karnivora (Ikan, Cumi)', 
    desc: 'Reptil laut purba yang berenang menggunakan metode "underwater flight" dengan empat sirip dayungnya yang kuat. Lehernya yang panjang digunakan untuk menangkap ikan dengan gesit.',
    history: 'Plesiosaurus pertama kali ditemukan oleh Mary Anning pada awal abad ke-19 di Inggris. Mereka menguasai lautan selama jutaan tahun sebelum punah bersama dinosaurus pada akhir zaman Kapur.',
    funfact: 'Bentuk tubuh Plesiosaurus sering dikaitkan dengan legenda "Monster Loch Ness". Padahal lehernya yang panjang sebenarnya tidak cukup fleksibel untuk diangkat tinggi menyerupai leher angsa di atas air!',
    anatomy: {
      mulut: 'Rahangnya dipenuhi gigi runcing berbentuk kerucut yang melengkung ke belakang, dirancang sempurna untuk mencengkeram mangsa licin seperti ikan dan cumi-cumi agar tidak lepas.',
      tubuh: 'Tubuhnya lebar dan pipih mirip penyu namun tanpa cangkang. Bentuk ini memberikan stabilitas tinggi saat bermanuver di air.',
      sirip: 'Keempat sirip raksasanya bergerak menyerupai sayap burung saat terbang (underwater flight). Mengepak secara diagonal untuk menghasilkan daya dorong yang kuat dan efisien.',
      ekor: 'Ekornya relatif pendek dan meruncing, lebih berfungsi sebagai kemudi (rudder) untuk mengarahkan laju ketimbang sebagai pendorong utama.'
    },
    anatomyOffsets: {
      mulut: new THREE.Vector3(0, 0.5, 3.5),
      tubuh: new THREE.Vector3(0, 0, 0),
      sirip: new THREE.Vector3(1.5, -0.5, 1),
      ekor: new THREE.Vector3(0, 0, -3.5)
    }
  },
  'Megalodon': { 
    era: 'ERA MIOSEN – PLIOSEN', size: '15 – 18 meter', diet: 'Karnivora (Paus, Ikan Besar)', 
    desc: 'Hiu raksasa prasejarah yang merupakan predator terbesar yang pernah hidup di lautan. Gigitannya adalah yang terkuat dari semua makhluk yang pernah diketahui.',
    history: 'Fosil gigi Megalodon ditemukan di seluruh dunia, membuktikan bahwa mereka menguasai seluruh samudra hangat dan beriklim sedang. Mereka punah sekitar 3.6 juta tahun lalu diduga karena perubahan iklim dan penurunan populasi paus.',
    funfact: 'Nama "Megalodon" berarti "Gigi Besar". Satu gigi Megalodon bisa berukuran sebesar telapak tangan manusia dewasa, hampir 3 kali lipat gigi hiu putih raksasa modern!',
    anatomy: {
      mulut: 'Rahangnya bisa terbuka cukup lebar untuk menelan sebuah mobil utuh, dilengkapi dengan sekitar 276 gigi bergerigi yang tersusun dalam 5 baris.',
      tubuh: 'Tubuhnya sangat besar dan padat seperti hiu putih namun jauh lebih masif, dirancang untuk berburu mangsa-mangsa berukuran raksasa.',
      sirip: 'Sirip punggung (dorsal fin) dan sirip dadanya sangat kuat untuk menstabilkan tubuh raksasanya saat mengejar mangsa di laut lepas.',
      ekor: 'Sirip ekor asimetrisnya yang kuat memberikan daya dorong ledakan kecepatan (burst speed) yang cukup untuk menyergap paus dari kedalaman.'
    },
    anatomyOffsets: {
      mulut: new THREE.Vector3(0, 0, 4),
      tubuh: new THREE.Vector3(0, 0, 0),
      sirip: new THREE.Vector3(2, 0, 0),
      ekor: new THREE.Vector3(0, 0, -4)
    }
  },
  'Mosasaurus': { 
    era: 'ERA KAPUR AKHIR', size: '14 – 17 meter', diet: 'Karnivora (Reptil laut, Ikan, Ammonite)', 
    desc: 'Kadal laut raksasa yang mendominasi lautan pada akhir zaman dinosaurus. Mereka bernapas dengan paru-paru dan berkerabat dekat dengan biawak dan ular modern.',
    history: 'Fosil pertamanya ditemukan di dekat sungai Meuse di Belanda, sehingga namanya berarti "Kadal Sungai Meuse". Mereka adalah pemangsa puncak tak terbantahkan di laut purba yang dangkal.',
    funfact: 'Mosasaurus memiliki engsel rahang ganda yang fleksibel, mirip seperti ular, memungkinkan mereka menelan mangsa yang sangat besar secara utuh!',
    anatomy: {
      mulut: 'Memiliki barisan gigi tajam berbentuk kerucut yang melengkung ke belakang. Uniknya, mereka juga punya gigi tambahan di langit-langit mulut (pterygoid teeth) untuk menahan mangsa yang meronta.',
      tubuh: 'Bentuk tubuhnya panjang dan berotot seperti ular raksasa atau buaya silinder, membuatnya gesit dalam menyergap mangsa.',
      sirip: 'Keempat kakinya telah berevolusi menjadi sirip dayung yang kuat, namun lebih berfungsi untuk bermanuver dan menyeimbangkan tubuh.',
      ekor: 'Ekornya memiliki sirip asimetris di bagian bawah (hypocercal tail fin) seperti hiu, namun terbalik. Ini memberikan dorongan yang sangat kuat.'
    },
    anatomyOffsets: {
      mulut: new THREE.Vector3(0, 0.5, 4.5),
      tubuh: new THREE.Vector3(0, 0, 0),
      sirip: new THREE.Vector3(1.5, -0.5, 1),
      ekor: new THREE.Vector3(0, 0, -4.5)
    }
  }
};

function showInfoPanel(name) {
  const data = creatureData[name];
  if (!data) return;
  document.getElementById('info-title').innerText = name;
  document.getElementById('info-era').innerText = data.era;
  document.getElementById('info-size').innerText = data.size;
  document.getElementById('info-diet').innerText = data.diet;
  document.getElementById('info-desc').innerText = data.desc;
  infoPanel.classList.add('active');
}

// --- Museum Sidebar Logic ---
let currentMuseumTab = 'sejarah';
let currentSubTab = 'mulut';

function updateMuseumContent() {
  if (!selectedObject) return;
  const data = creatureData[selectedObject.userData.name];
  if (!data) return;
  
  document.getElementById('museum-title').innerText = selectedObject.userData.name;
  document.getElementById('museum-era').innerText = data.era;
  
  const textEl = document.getElementById('museum-text');
  const subtabsEl = document.getElementById('anatomy-subtabs');
  
  if (currentMuseumTab === 'anatomi') {
    subtabsEl.classList.remove('hidden');
    textEl.innerText = data.anatomy[currentSubTab];
  } else {
    subtabsEl.classList.add('hidden');
    if (currentMuseumTab === 'sejarah') textEl.innerText = data.history;
    else if (currentMuseumTab === 'funfact') textEl.innerText = data.funfact;
  }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    playSfx('click');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMuseumTab = btn.dataset.tab;
    updateMuseumContent();
  });
});

document.querySelectorAll('.subtab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    playSfx('click');
    document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSubTab = btn.dataset.subtab;
    updateMuseumContent();
  });
});

// --- Detail View ---
let savedCameraPos = new THREE.Vector3();
let isStudioLight = false;

// Lampu tambahan untuk Mode Studio
const studioDirLight = new THREE.DirectionalLight(0xffffff, 0);
studioDirLight.position.set(10, 20, 10);
scene.add(studioDirLight);

document.getElementById('btn-light-toggle').addEventListener('click', (e) => {
  playSfx('click');
  isStudioLight = !isStudioLight;
  e.target.classList.toggle('active');
  
  if (isStudioLight) {
    scene.background = new THREE.Color(0x2a4a60); // Biru laut cerah / Studio
    ambientLight.intensity = 8;
    studioDirLight.intensity = 2;
  } else {
    scene.background = new THREE.Color(0x010810); // Balik ke Abyss
    ambientLight.intensity = 6;
    studioDirLight.intensity = 0;
  }
});

document.getElementById('btn-detail').addEventListener('click', () => {
  if (!selectedObject) return;
  playSfx('detail'); // Sonar ping
  
  savedCameraPos.copy(camera.position);
  infoPanel.classList.remove('active');
  changeState(STATES.DETAIL);
  
  // Reset tabs to default saat membuka
  currentMuseumTab = 'sejarah';
  currentSubTab = 'mulut';
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'sejarah'));
  document.querySelectorAll('.subtab-btn').forEach(b => b.classList.toggle('active', b.dataset.subtab === 'mulut'));
  updateMuseumContent();
  
  allGroups.forEach(g => { if (g !== selectedObject.userData.group) g.visible = false; });
  floor.visible = false;
  kelps.forEach(k => k.visible = false);
  bubbleClusters.forEach(b => b.visible = false);
  
  scene.fog = null;
  ambientLight.intensity = 6;
  
  // Reset pencahayaan studio jika sisa dari sebelumnya
  isStudioLight = false;
  document.getElementById('btn-light-toggle').classList.remove('active');
  scene.background = new THREE.Color(0x010810);
  studioDirLight.intensity = 0;
  
  const objPos = selectedObject.userData.group.position.clone();
  const g = selectedObject.userData.group;
  
  // Animasi masuk hewan (Majestic Spin)
  gsap.fromTo(g.rotation, 
    { y: g.rotation.y - Math.PI }, 
    { y: g.rotation.y, duration: 2, ease: "power2.out" }
  );

  gsap.to(camera.position, {
    x: objPos.x + 5, y: objPos.y + 3, z: objPos.z + 10,
    duration: 1.2, ease: "power2.inOut",
    onUpdate: () => camera.lookAt(objPos),
    onComplete: () => {
      orbitControls.target.copy(objPos);
      orbitControls.enabled = true;
      orbitControls.autoRotate = true; // Kamera berputar mengelilingi hewan secara otomatis
      orbitControls.autoRotateSpeed = 1.5;
      spotLight.position.set(objPos.x + 10, objPos.y + 10, objPos.z + 10);
      spotLight.target.position.copy(objPos);
    }
  });
});

document.getElementById('btn-back-detail').addEventListener('click', () => {
  playSfx('whoosh');
  orbitControls.enabled = false;
  orbitControls.autoRotate = false;
  
  allGroups.forEach(g => g.visible = true);
  floor.visible = true;
  kelps.forEach(k => k.visible = true);
  bubbleClusters.forEach(b => b.visible = true);
  
  scene.fog = new THREE.FogExp2(0x031225, 0.006);
  ambientLight.intensity = 5.0;
  
  // Matikan lampu studio
  isStudioLight = false;
  document.getElementById('btn-light-toggle').classList.remove('active');
  scene.background = new THREE.Color(0x031225);
  studioDirLight.intensity = 0;
  
  changeState(STATES.EXPLORING);
  infoPanel.classList.add('active');
  
  gsap.to(camera.position, {
    x: savedCameraPos.x, y: savedCameraPos.y, z: savedCameraPos.z,
    duration: 1.2, ease: "power2.inOut",
    onUpdate: () => {
      const lp = cameraSpline.getPointAt(Math.min(currentCameraT + 0.1, 1));
      camera.lookAt(lp);
    },
    onComplete: () => updateCameraPosition(currentCameraT)
  });
});

// ==========================================
// RESIZE
// ==========================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// RENDER LOOP
// ==========================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.elapsedTime;
  
  drawParticles();
  
  // Update animasi model GLB
  mixers.forEach(m => {
    if (m.group.visible) {
      m.mixer.update(delta);
    }
  });
  
  kelps.forEach(kelpGroup => {
    kelpGroup.children.forEach(stalk => {
      const off = stalk.userData.swayOffset || 0;
      const spd = stalk.userData.swaySpeed || 0.5;
      stalk.rotation.x = Math.sin(time * spd + off) * 0.08;
      stalk.rotation.z = Math.cos(time * spd * 0.7 + off) * 0.05;
    });
  });
  
  bubbleClusters.forEach(cluster => {
    cluster.children.forEach(bubble => {
      const base = bubble.userData.baseY || 0;
      const spd = bubble.userData.speed || 1;
      bubble.position.y = base + ((time * spd) % 8);
      if (bubble.position.y > base + 8) bubble.position.y = base;
    });
  });
  
  if (currentState !== STATES.DETAIL) {
    objects.forEach(obj => {
      const g = obj.userData.group;
      const state = obj.userData.state;
      let speed = 1.5, amp = 0.15, rotAmp = 0.02;
      
      if (state === 'hover') { speed = 3; amp = 0.4; rotAmp = 0.05; }
      
      g.position.y += Math.sin(time * speed) * amp * 0.02;
      g.rotation.z = Math.sin(time * speed * 0.8) * rotAmp;
      g.rotation.x = Math.cos(time * speed * 0.6) * rotAmp * 0.5;
    });
  }

  if (orbitControls.enabled) orbitControls.update();
  if (currentState === STATES.DETAIL) {
    const lightOffset = new THREE.Vector3(1.5, -1.2, -2.5);
    lightOffset.applyQuaternion(camera.quaternion);
    spotLight.position.copy(camera.position).add(lightOffset);
  }
  
  renderer.render(scene, camera);
}

animate();
