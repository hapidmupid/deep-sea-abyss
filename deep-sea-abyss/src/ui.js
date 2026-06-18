import { CREATURE_DATA } from './data.js';

// Mengambil semua elemen UI supaya mudah dipakai di main.js.
export function createUI() {
  const elements = {
    loadingScreen: document.querySelector('#loading-screen'),
    loadingBar: document.querySelector('#loading-bar'),
    loadingText: document.querySelector('#loading-text'),
    loadingPercent: document.querySelector('#loading-percent'),
    startBtn: document.querySelector('#start-btn'),
    skipBtn: document.querySelector('#skip-btn'),
    hud: document.querySelector('#hud'),
    depthValue: document.querySelector('#depth-value'),
    compassValue: document.querySelector('#compass-value'),
    audioBtn: document.querySelector('#audio-btn'),
    helpBtn: document.querySelector('#help-btn'),
    helpModal: document.querySelector('#help-modal'),
    understandBtn: document.querySelector('#understand-btn'),
    sliderContainer: document.querySelector('#slider-container'),
    cameraSlider: document.querySelector('#camera-slider'),
    locationLabel: document.querySelector('#location-label'),
    sliderPercent: document.querySelector('#slider-percent'),
    infoPanel: document.querySelector('#info-panel'),
    closePanel: document.querySelector('#close-panel'),
    panelTitle: document.querySelector('#panel-title'),
    panelScientific: document.querySelector('#panel-scientific'),
    panelEra: document.querySelector('#panel-era'),
    panelSize: document.querySelector('#panel-size'),
    panelDiet: document.querySelector('#panel-diet'),
    panelFact: document.querySelector('#panel-fact'),
    minimap: document.querySelector('#minimap'),
    mapCameraDot: document.querySelector('#map-camera-dot')
  };

  return {
    elements,

    // Update loading screen saat simulasi pemuatan berjalan.
    setLoading(progress, text) {
      const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
      elements.loadingBar.style.width = `${safeProgress}%`;
      elements.loadingPercent.textContent = `${safeProgress}%`;
      if (text) elements.loadingText.textContent = text;
    },

    showStartButton() {
      elements.startBtn.classList.remove('hidden');
    },

    closeLoadingScreen() {
      elements.loadingScreen.classList.add('closed');
    },

    showSkip() {
      elements.skipBtn.classList.remove('hidden');
    },

    hideSkip() {
      elements.skipBtn.classList.add('hidden');
    },

    showMainUI() {
      elements.hud.classList.remove('hidden-ui');
      elements.sliderContainer.classList.remove('hidden-ui');
      elements.minimap.classList.remove('hidden-ui');
      elements.hud.classList.add('show-ui');
      elements.sliderContainer.classList.add('show-ui');
      elements.minimap.classList.add('show-ui');
    },

    updateNavigationUI(percent, stop) {
      elements.cameraSlider.value = String(Math.round(percent));
      elements.sliderPercent.textContent = `${Math.round(percent)}%`;
      elements.locationLabel.textContent = stop.label;
      elements.depthValue.textContent = `${stop.depth} m`;
      elements.compassValue.textContent = stop.compass;
      updateMinimapDot(elements.mapCameraDot, percent);
    },

    showInfoPanel(creatureId) {
      const data = CREATURE_DATA[creatureId];
      if (!data) return;

      elements.panelTitle.textContent = data.name;
      elements.panelScientific.textContent = data.scientific;
      elements.panelEra.textContent = data.era;
      elements.panelSize.textContent = data.size;
      elements.panelDiet.textContent = data.diet;
      elements.panelFact.textContent = data.fact;
      elements.infoPanel.classList.add('open');
    },

    hideInfoPanel() {
      elements.infoPanel.classList.remove('open');
    },

    setAudioState(isOn) {
      elements.audioBtn.textContent = isOn ? 'Audio: ON' : 'Audio: OFF';
    },

    showHelp() {
      elements.helpModal.classList.remove('hidden');
    },

    hideHelp() {
      elements.helpModal.classList.add('hidden');
    }
  };
}

// Posisi titik minimap mengikuti persentase slider.
function updateMinimapDot(dot, percent) {
  if (!dot) return;
  const t = Math.max(0, Math.min(100, percent)) / 100;

  // Pendekatan sederhana dari kurva SVG: cukup interpolasi dari kiri ke kanan.
  const x = 20 + t * 180;
  const y = 82 - Math.sin(t * Math.PI * 2) * 34 + Math.sin(t * Math.PI) * 12;

  dot.setAttribute('cx', x.toFixed(1));
  dot.setAttribute('cy', y.toFixed(1));
}
