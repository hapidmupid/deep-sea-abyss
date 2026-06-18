import * as THREE from 'three';

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0.04,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0.0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  });
}

function addMesh(group, geometry, mat, position, scale = [1, 1, 1], rotation = [0, 0, 0], name = '') {
  const mesh = new THREE.Mesh(geometry, mat.clone ? mat.clone() : mat);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function makeInteractive(group, id) {
  group.userData.creatureId = id;
  group.userData.hoverScale = 1.035;
  group.traverse((child) => {
    child.userData.creatureId = id;
  });
  return group;
}

// Membuat semua aset 3D secara procedural, tanpa file .glb.
export function createProceduralWorld(scene) {
  const creatures = {};
  const interactives = [];
  const animatables = {
    seaweed: [],
    particles: null,
    bubbles: null,
    creatures: [],
    caustics: []
  };

  createEnvironment(scene, animatables);

  creatures.plesiosaurus = createPlesiosaurus();
  creatures.plesiosaurus.position.set(0, 1.7, 0);
  scene.add(creatures.plesiosaurus);

  creatures.mosasaurus = createMosasaurus();
  creatures.mosasaurus.position.set(-7.5, 2.8, -10.5);
  creatures.mosasaurus.rotation.y = 0.55;
  scene.add(creatures.mosasaurus);

  creatures.ammonite = createAmmoniteCluster();
  creatures.ammonite.position.set(4.2, 0.9, -5.6);
  scene.add(creatures.ammonite);

  creatures.anglerfish = createAnglerfish();
  creatures.anglerfish.position.set(6.8, 2.25, -13.5);
  creatures.anglerfish.rotation.y = -0.7;
  scene.add(creatures.anglerfish);

  for (const creature of Object.values(creatures)) {
    interactives.push(creature);
    animatables.creatures.push(creature);
  }

  return { creatures, interactives, animatables };
}

function createEnvironment(scene, animatables) {
  const terrainMat = material(0x052032, { roughness: 0.9 });
  const terrainGeo = new THREE.PlaneGeometry(64, 64, 80, 80);
  terrainGeo.rotateX(-Math.PI / 2);

  // Membuat dasar laut bergelombang dengan modifikasi vertex sederhana.
  const position = terrainGeo.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const y = Math.sin(x * 0.34) * 0.2 + Math.cos(z * 0.28) * 0.25 + Math.sin((x + z) * 0.18) * 0.18;
    position.setY(i, y - 0.2);
  }
  terrainGeo.computeVertexNormals();

  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.receiveShadow = true;
  scene.add(terrain);

  createCaveWalls(scene);
  createRocks(scene);
  createStalactites(scene);
  createCorals(scene);
  createSeaweed(scene, animatables);
  createParticles(scene, animatables);
  createBubbles(scene, animatables);
  createCaustics(scene, animatables);
}

function createCaveWalls(scene) {
  const wallMat = material(0x03111e, { roughness: 0.95 });
  const wallPositions = [
    [-17, 4, -6, 0, 0.25, 0],
    [17, 4, -6, 0, -0.25, 0],
    [0, 8.5, -8, Math.PI / 2, 0, 0]
  ];

  wallPositions.forEach(([x, y, z, rx, ry, rz], index) => {
    const geo = new THREE.PlaneGeometry(42, 24, 30, 16);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      pos.setZ(i, Math.sin(px * 0.45 + index) * 0.6 + Math.cos(py * 0.3) * 0.5);
    }
    geo.computeVertexNormals();

    const wall = new THREE.Mesh(geo, wallMat.clone());
    wall.position.set(x, y, z);
    wall.rotation.set(rx, ry, rz);
    wall.receiveShadow = true;
    scene.add(wall);
  });
}

function createRocks(scene) {
  const rockMat = material(0x0b2433, { roughness: 0.98 });
  const accentMat = material(0x0b5266, { roughness: 0.85, emissive: 0x001c22, emissiveIntensity: 0.25 });
  const points = [
    [-8, 0.55, 5, 2.4], [9, 0.7, 3, 1.8], [-12, 0.8, -4, 2.7], [11, 0.5, -8, 2.2],
    [-7, 0.65, -13, 2.9], [4, 0.45, -12, 1.7], [0, 0.45, 7, 1.4], [14, 1.2, -2, 3.1]
  ];

  points.forEach(([x, y, z, s], i) => {
    const geo = new THREE.DodecahedronGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, i % 3 === 0 ? accentMat.clone() : rockMat.clone());
    mesh.position.set(x, y, z);
    mesh.scale.set(s * 1.3, s * 0.8, s);
    mesh.rotation.set(Math.random(), Math.random(), Math.random());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  });
}

function createStalactites(scene) {
  const mat = material(0x071a25, { roughness: 0.95 });
  for (let i = 0; i < 24; i++) {
    const height = 1.4 + Math.random() * 2.4;
    const geo = new THREE.ConeGeometry(0.28 + Math.random() * 0.35, height, 7);
    const mesh = new THREE.Mesh(geo, mat.clone());
    mesh.position.set(-15 + Math.random() * 30, 8.2 - height / 2, -18 + Math.random() * 30);
    mesh.rotation.set(Math.PI, Math.random() * Math.PI, 0);
    mesh.castShadow = true;
    scene.add(mesh);
  }
}

function createCorals(scene) {
  const coralMats = [
    material(0x0b8aa3, { emissive: 0x003b44, emissiveIntensity: 0.4 }),
    material(0x336f8f, { emissive: 0x001f32, emissiveIntensity: 0.3 }),
    material(0x2bcec7, { emissive: 0x004f4b, emissiveIntensity: 0.45 })
  ];

  const bases = [[-4, 0.2, -4], [6, 0.2, -6], [-10, 0.2, 1], [9, 0.2, -12], [2, 0.2, 6]];
  bases.forEach((base, i) => {
    const group = new THREE.Group();
    group.position.set(...base);
    for (let b = 0; b < 6; b++) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.11, 0.8 + Math.random() * 0.8, 6),
        coralMats[(i + b) % coralMats.length].clone()
      );
      branch.position.set((Math.random() - 0.5) * 1.1, 0.5, (Math.random() - 0.5) * 1.1);
      branch.rotation.set((Math.random() - 0.5) * 0.7, 0, (Math.random() - 0.5) * 0.7);
      branch.castShadow = true;
      group.add(branch);
    }
    scene.add(group);
  });
}

function createSeaweed(scene, animatables) {
  const weedMat = material(0x0b735b, { roughness: 0.55, emissive: 0x00261d, emissiveIntensity: 0.15 });
  for (let i = 0; i < 34; i++) {
    const group = new THREE.Group();
    const count = 2 + Math.floor(Math.random() * 4);
    for (let j = 0; j < count; j++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2 + Math.random() * 1.2, 0.025), weedMat.clone());
      blade.position.set((Math.random() - 0.5) * 0.5, blade.geometry.parameters.height / 2, (Math.random() - 0.5) * 0.5);
      blade.rotation.z = (Math.random() - 0.5) * 0.5;
      group.add(blade);
    }
    group.position.set(-14 + Math.random() * 28, 0.15, -16 + Math.random() * 25);
    group.userData.phase = Math.random() * Math.PI * 2;
    scene.add(group);
    animatables.seaweed.push(group);
  }
}

function createParticles(scene, animatables) {
  const count = 1200;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = -18 + Math.random() * 36;
    positions[i * 3 + 1] = 0.4 + Math.random() * 8;
    positions[i * 3 + 2] = -20 + Math.random() * 38;
    speeds[i] = 0.002 + Math.random() * 0.006;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

  const mat = new THREE.PointsMaterial({
    color: 0x9ff6ff,
    size: 0.045,
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);
  animatables.particles = points;
}

function createBubbles(scene, animatables) {
  const count = 130;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = -16 + Math.random() * 32;
    positions[i * 3 + 1] = Math.random() * 7;
    positions[i * 3 + 2] = -18 + Math.random() * 32;
    speeds[i] = 0.008 + Math.random() * 0.018;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

  const mat = new THREE.PointsMaterial({
    color: 0xcdfbff,
    size: 0.075,
    transparent: true,
    opacity: 0.38,
    depthWrite: false
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);
  animatables.bubbles = points;
}

function createCaustics(scene, animatables) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x36e8ff,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3 + i * 1.2, 0.018, 8, 80), mat.clone());
    ring.position.set(-4 + i * 3, 0.08, -8 + i * 2.2);
    ring.rotation.x = Math.PI / 2;
    ring.scale.set(1, 0.45, 1);
    scene.add(ring);
    animatables.caustics.push(ring);
  }
}

function createPlesiosaurus() {
  const group = new THREE.Group();
  group.name = 'Plesiosaurus Procedural';

  const skin = material(0x194b55, { roughness: 0.48, emissive: 0x00151a, emissiveIntensity: 0.12 });
  const belly = material(0x9dcbd5, { roughness: 0.38 });
  const eyeMat = material(0x071014, { roughness: 0.2, emissive: 0x36e8ff, emissiveIntensity: 0.35 });
  const mouthMat = material(0x0b0508, { roughness: 0.4 });

  const body = addMesh(group, new THREE.SphereGeometry(1, 32, 16), skin, [0, 0, 0], [2.1, 0.62, 0.82], [0, 0, 0], 'body');
  addMesh(group, new THREE.SphereGeometry(1, 24, 12), belly, [0.15, -0.12, 0], [1.55, 0.32, 0.58], [0, 0, 0], 'belly');

  const neck = new THREE.Group();
  group.add(neck);
  const neckSegments = [];
  for (let i = 0; i < 7; i++) {
    const x = 1.6 + i * 0.37;
    const y = 0.05 + Math.sin(i * 0.6) * 0.18;
    const seg = addMesh(neck, new THREE.SphereGeometry(1, 16, 10), skin, [x, y, 0], [0.36 - i * 0.018, 0.25, 0.24], [0, 0, 0], 'neck');
    neckSegments.push(seg);
  }

  const head = new THREE.Group();
  head.position.set(4.15, 0.06, 0);
  neck.add(head);
  addMesh(head, new THREE.SphereGeometry(1, 22, 12), skin, [0, 0, 0], [0.58, 0.32, 0.34], [0, 0, 0], 'head');
  const jawTop = addMesh(head, new THREE.ConeGeometry(0.16, 0.7, 8), skin, [0.58, 0.02, 0], [1, 1, 0.75], [0, 0, -Math.PI / 2], 'top jaw');
  const jawBottom = addMesh(head, new THREE.ConeGeometry(0.13, 0.58, 8), mouthMat, [0.55, -0.12, 0], [1, 0.7, 0.62], [0, 0, -Math.PI / 2], 'bottom jaw');
  addMesh(head, new THREE.SphereGeometry(0.055, 12, 8), eyeMat, [0.28, 0.16, 0.26], [1, 1, 1], [0, 0, 0], 'eye');
  addMesh(head, new THREE.SphereGeometry(0.055, 12, 8), eyeMat, [0.28, 0.16, -0.26], [1, 1, 1], [0, 0, 0], 'eye');

  const tail = new THREE.Group();
  group.add(tail);
  for (let i = 0; i < 5; i++) {
    addMesh(tail, new THREE.SphereGeometry(1, 14, 9), skin, [-1.85 - i * 0.38, 0, 0], [0.45 - i * 0.045, 0.24, 0.22], [0, 0, 0], 'tail');
  }

  const flippers = new THREE.Group();
  group.add(flippers);
  const flipperGeo = new THREE.ConeGeometry(0.28, 1.55, 18);
  const flipperConfig = [
    [0.65, -0.25, 0.72, Math.PI / 2.5, 0.15, -0.5],
    [0.65, -0.25, -0.72, -Math.PI / 2.5, -0.15, -0.5],
    [-0.9, -0.28, 0.64, Math.PI / 2.7, 0.2, 0.6],
    [-0.9, -0.28, -0.64, -Math.PI / 2.7, -0.2, 0.6]
  ];
  flipperConfig.forEach((cfg, index) => {
    const [x, y, z, rx, ry, rz] = cfg;
    addMesh(flippers, flipperGeo, skin, [x, y, z], [0.9, 1.05, 0.38], [rx, ry, rz], `flipper-${index}`);
  });

  group.userData.parts = { body, neck, neckSegments, head, jawTop, jawBottom, tail, flippers };
  return makeInteractive(group, 'plesiosaurus');
}

function createMosasaurus() {
  const group = new THREE.Group();
  group.name = 'Mosasaurus Procedural';

  const skin = material(0x27323c, { roughness: 0.58, emissive: 0x000d13, emissiveIntensity: 0.18 });
  const mouth = material(0x160509, { roughness: 0.52 });
  const eyeMat = material(0xffd36e, { roughness: 0.25, emissive: 0xffaa22, emissiveIntensity: 0.5 });

  addMesh(group, new THREE.SphereGeometry(1, 28, 14), skin, [0, 0, 0], [2.8, 0.55, 0.7], [0, 0, 0], 'body');
  addMesh(group, new THREE.ConeGeometry(0.5, 2.1, 16), skin, [2.4, 0, 0], [1, 1, 0.75], [0, 0, -Math.PI / 2], 'snout');
  const jaw = addMesh(group, new THREE.ConeGeometry(0.32, 1.5, 12), mouth, [2.6, -0.2, 0], [1, 0.75, 0.6], [0, 0, -Math.PI / 2], 'jaw');
  addMesh(group, new THREE.ConeGeometry(0.45, 2.0, 14), skin, [-2.8, 0, 0], [1, 1, 0.55], [0, 0, Math.PI / 2], 'tail');
  addMesh(group, new THREE.SphereGeometry(0.08, 12, 8), eyeMat, [2.0, 0.21, 0.34], [1, 1, 1], [0, 0, 0], 'eye');
  addMesh(group, new THREE.SphereGeometry(0.08, 12, 8), eyeMat, [2.0, 0.21, -0.34], [1, 1, 1], [0, 0, 0], 'eye');

  const fins = new THREE.Group();
  group.add(fins);
  addMesh(fins, new THREE.ConeGeometry(0.22, 1.4, 12), skin, [0.9, -0.2, 0.68], [1, 1, 0.42], [Math.PI / 2.8, 0, -0.6], 'fin');
  addMesh(fins, new THREE.ConeGeometry(0.22, 1.4, 12), skin, [0.9, -0.2, -0.68], [1, 1, 0.42], [-Math.PI / 2.8, 0, -0.6], 'fin');
  addMesh(fins, new THREE.ConeGeometry(0.18, 1.0, 12), skin, [-1.0, -0.2, 0.58], [1, 1, 0.36], [Math.PI / 2.9, 0, 0.5], 'fin');
  addMesh(fins, new THREE.ConeGeometry(0.18, 1.0, 12), skin, [-1.0, -0.2, -0.58], [1, 1, 0.36], [-Math.PI / 2.9, 0, 0.5], 'fin');

  group.userData.parts = { jaw, fins };
  return makeInteractive(group, 'mosasaurus');
}

function createAmmoniteCluster() {
  const cluster = new THREE.Group();
  cluster.name = 'Ammonite Cluster Procedural';
  const shellMat = material(0xd58d4c, { roughness: 0.5, metalness: 0.08, emissive: 0x231105, emissiveIntensity: 0.15 });
  const lineMat = material(0x5c321f, { roughness: 0.75 });

  for (let n = 0; n < 3; n++) {
    const shell = new THREE.Group();
    shell.position.set((n - 1) * 1.15, n * 0.25, (n % 2) * 0.65);
    shell.scale.setScalar(0.82 + n * 0.18);

    // Spiral dibuat dari beberapa torus yang mengecil.
    for (let i = 0; i < 6; i++) {
      const torus = addMesh(shell, new THREE.TorusGeometry(0.38 + i * 0.12, 0.045, 10, 48), shellMat, [0, 0, 0], [1, 1, 1], [Math.PI / 2, 0, 0.15 * i], 'shell-ring');
      torus.position.x = i * 0.11;
    }
    addMesh(shell, new THREE.SphereGeometry(0.22, 16, 10), lineMat, [0.05, 0, 0], [1, 1, 0.32], [0, 0, 0], 'inner-shell');

    cluster.add(shell);
  }

  cluster.userData.parts = { shells: cluster.children };
  return makeInteractive(cluster, 'ammonite');
}

function createAnglerfish() {
  const group = new THREE.Group();
  group.name = 'Anglerfish Procedural';

  const skin = material(0x141923, { roughness: 0.7, emissive: 0x020a0c, emissiveIntensity: 0.22 });
  const finMat = material(0x253947, { roughness: 0.62 });
  const lureMat = material(0x36e8ff, { emissive: 0x36e8ff, emissiveIntensity: 1.8, roughness: 0.25 });
  const eyeMat = material(0xe9fbff, { emissive: 0x73f3ff, emissiveIntensity: 0.5 });

  addMesh(group, new THREE.SphereGeometry(1, 24, 14), skin, [0, 0, 0], [1.1, 0.7, 0.65], [0, 0, 0], 'body');
  addMesh(group, new THREE.ConeGeometry(0.38, 0.95, 14), skin, [-1.05, 0, 0], [1, 0.75, 0.65], [0, 0, Math.PI / 2], 'tail');
  addMesh(group, new THREE.ConeGeometry(0.22, 0.9, 12), finMat, [0.1, -0.05, 0.58], [1, 1, 0.34], [Math.PI / 2.6, 0, -0.2], 'fin');
  addMesh(group, new THREE.ConeGeometry(0.22, 0.9, 12), finMat, [0.1, -0.05, -0.58], [1, 1, 0.34], [-Math.PI / 2.6, 0, -0.2], 'fin');
  addMesh(group, new THREE.SphereGeometry(0.075, 12, 8), eyeMat, [0.45, 0.18, 0.42], [1, 1, 1], [0, 0, 0], 'eye');
  addMesh(group, new THREE.SphereGeometry(0.075, 12, 8), eyeMat, [0.45, 0.18, -0.42], [1, 1, 1], [0, 0, 0], 'eye');

  const lureGroup = new THREE.Group();
  lureGroup.position.set(0.35, 0.58, 0);
  group.add(lureGroup);
  addMesh(lureGroup, new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8), finMat, [0.05, 0.32, 0], [1, 1, 1], [0.25, 0, -0.3], 'lure-stem');
  const lure = addMesh(lureGroup, new THREE.SphereGeometry(0.14, 18, 12), lureMat, [0.38, 0.72, 0], [1, 1, 1], [0, 0, 0], 'lure-light');
  const point = new THREE.PointLight(0x36e8ff, 1.4, 5.5, 1.7);
  point.position.copy(lure.position);
  lureGroup.add(point);

  group.userData.parts = { lure, lureLight: point, lureGroup };
  return makeInteractive(group, 'anglerfish');
}

// Animasi idle yang terus berjalan selama render loop.
export function updateProceduralAnimations(animatables, time) {
  for (const group of animatables.seaweed) {
    group.rotation.z = Math.sin(time * 1.2 + group.userData.phase) * 0.08;
    group.rotation.x = Math.cos(time * 0.8 + group.userData.phase) * 0.04;
  }

  if (animatables.particles) {
    const pos = animatables.particles.geometry.attributes.position;
    const speeds = animatables.particles.geometry.attributes.speed;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, pos.getY(i) + speeds.getX(i));
      pos.setX(i, pos.getX(i) + Math.sin(time + i) * 0.0015);
      if (pos.getY(i) > 8.8) pos.setY(i, 0.25);
    }
    pos.needsUpdate = true;
  }

  if (animatables.bubbles) {
    const pos = animatables.bubbles.geometry.attributes.position;
    const speeds = animatables.bubbles.geometry.attributes.speed;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, pos.getY(i) + speeds.getX(i));
      if (pos.getY(i) > 9) pos.setY(i, 0.15);
    }
    pos.needsUpdate = true;
  }

  for (const ring of animatables.caustics) {
    ring.rotation.z += 0.002;
    ring.material.opacity = 0.055 + Math.sin(time * 1.8 + ring.position.x) * 0.025;
  }

  for (const creature of animatables.creatures) {
    const id = creature.userData.creatureId;
    if (id === 'plesiosaurus') animatePlesiosaurusIdle(creature, time);
    if (id === 'mosasaurus') animateMosasaurusIdle(creature, time);
    if (id === 'ammonite') animateAmmoniteIdle(creature, time);
    if (id === 'anglerfish') animateAnglerfishIdle(creature, time);
  }
}

function animatePlesiosaurusIdle(group, time) {
  const parts = group.userData.parts;
  group.position.y = 1.7 + Math.sin(time * 0.9) * 0.18;
  parts.neck.rotation.z = Math.sin(time * 1.15) * 0.08;
  parts.tail.rotation.z = Math.sin(time * 1.35 + 1.4) * 0.12;
  parts.flippers.children.forEach((fin, i) => {
    fin.rotation.x += Math.sin(time * 2.1 + i) * 0.002;
  });
}

function animateMosasaurusIdle(group, time) {
  group.position.y = 2.8 + Math.sin(time * 0.7) * 0.15;
  group.rotation.z = Math.sin(time * 0.85) * 0.025;
  const parts = group.userData.parts;
  parts.fins.rotation.x = Math.sin(time * 1.8) * 0.1;
}

function animateAmmoniteIdle(group, time) {
  group.rotation.y = Math.sin(time * 0.4) * 0.18;
  group.position.y = 0.9 + Math.sin(time * 1.1) * 0.12;
  group.userData.parts.shells.forEach((shell, i) => {
    shell.rotation.z += 0.004 + i * 0.0015;
  });
}

function animateAnglerfishIdle(group, time) {
  group.position.y = 2.25 + Math.sin(time * 1.3) * 0.14;
  const { lure, lureLight, lureGroup } = group.userData.parts;
  lureGroup.rotation.z = Math.sin(time * 1.4) * 0.12;
  const glow = 1.2 + Math.sin(time * 4.0) * 0.65;
  lure.material.emissiveIntensity = glow;
  lureLight.intensity = 1.0 + glow * 0.7;
}
