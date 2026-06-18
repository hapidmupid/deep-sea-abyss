import * as THREE from 'three';
import { SLIDER_STOPS } from './data.js';

// Membuat jalur kamera dan jalur titik fokus menggunakan CatmullRomCurve3.
export function createCameraPaths() {
  const cameraPoints = [
    new THREE.Vector3(0, 4, 18),
    new THREE.Vector3(8, 5, 10),
    new THREE.Vector3(12, 3.6, 0),
    new THREE.Vector3(5, 5, -10),
    new THREE.Vector3(-6, 6, -16),
    new THREE.Vector3(-12, 7, -6),
    new THREE.Vector3(0, 8, 8)
  ];

  const lookAtPoints = [
    new THREE.Vector3(0, 2, 0),
    new THREE.Vector3(2, 2, -2),
    new THREE.Vector3(4, 1.2, -6),
    new THREE.Vector3(-4, 3, -10),
    new THREE.Vector3(-8, 4, -12),
    new THREE.Vector3(0, 3, 0),
    new THREE.Vector3(0, 2, 0)
  ];

  const cameraCurve = new THREE.CatmullRomCurve3(cameraPoints, false, 'catmullrom', 0.35);
  const lookAtCurve = new THREE.CatmullRomCurve3(lookAtPoints, false, 'catmullrom', 0.35);

  return { cameraCurve, lookAtCurve, cameraPoints, lookAtPoints };
}

// Mengambil label terdekat berdasarkan nilai slider.
export function getSliderStop(percent) {
  let closest = SLIDER_STOPS[0];
  let bestDistance = Math.abs(percent - closest.value);

  for (const stop of SLIDER_STOPS) {
    const distance = Math.abs(percent - stop.value);
    if (distance < bestDistance) {
      closest = stop;
      bestDistance = distance;
    }
  }

  return closest;
}

// Membuat garis visual jalur kamera di scene, agar konsep spline terlihat saat demo.
export function createCameraPathHelper(cameraCurve) {
  const points = cameraCurve.getPoints(120);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color: 0x36e8ff,
    transparent: true,
    opacity: 0.35,
    dashSize: 0.6,
    gapSize: 0.35
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  line.name = 'Camera Spline Helper';
  return line;
}
