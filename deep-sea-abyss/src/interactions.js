import * as THREE from 'three';

// Modul interaksi: Raycaster untuk hover dan klik objek 3D.
export function createInteractionSystem({ camera, renderer, interactives, onSelect }) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(999, 999);
  let hoveredRoot = null;

  function setPointerFromEvent(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function findInteractiveRoot(object) {
    let current = object;
    while (current) {
      if (current.userData?.creatureId) return current;
      current = current.parent;
    }
    return null;
  }

  function applyHighlight(root, active) {
    if (!root) return;

    root.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      // Material dibuat clone agar highlight tidak ikut mengubah objek lain.
      if (!child.userData.originalScale) child.userData.originalScale = child.scale.clone();
      if (child.material.emissive) {
        if (!child.userData.originalEmissive) {
          child.userData.originalEmissive = child.material.emissive.clone();
        }
        child.material.emissive.copy(active ? new THREE.Color(0x1ceaff) : child.userData.originalEmissive);
      }
    });

    if (active) {
      root.scale.setScalar(root.userData.hoverScale || 1.04);
    } else {
      root.scale.setScalar(1);
    }
  }

  function updateHover() {
    raycaster.setFromCamera(mouse, camera);
    const intersections = raycaster.intersectObjects(interactives, true);
    const nextRoot = intersections.length > 0 ? findInteractiveRoot(intersections[0].object) : null;

    if (nextRoot !== hoveredRoot) {
      applyHighlight(hoveredRoot, false);
      hoveredRoot = nextRoot;
      applyHighlight(hoveredRoot, true);
      document.body.classList.toggle('is-hovering', Boolean(hoveredRoot));
    }
  }

  function handlePointerMove(event) {
    setPointerFromEvent(event);
  }

  function handleClick() {
    if (hoveredRoot?.userData?.creatureId) {
      onSelect(hoveredRoot.userData.creatureId, hoveredRoot);
    }
  }

  renderer.domElement.addEventListener('pointermove', handlePointerMove);
  renderer.domElement.addEventListener('click', handleClick);

  return {
    mouse,
    updateHover,
    dispose() {
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
    }
  };
}

// Konversi posisi mouse menjadi target sorot senter di world space.
export function updateSpotlightTarget({ mouse, camera, targetObject, smoothTarget }) {
  const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera);

  const direction = vector.sub(camera.position).normalize();
  const distance = 18;
  const desired = camera.position.clone().add(direction.multiplyScalar(distance));

  smoothTarget.lerp(desired, 0.12);
  targetObject.position.copy(smoothTarget);
}
