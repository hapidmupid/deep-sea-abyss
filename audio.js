// ==========================================
// AUDIO MANAGER - Deep Sea Abyss
// Semua suara dihasilkan secara prosedural
// menggunakan Web Audio API (tidak perlu file mp3)
// ==========================================

let audioCtx = null;
let bgmGainNode = null;
let sfxGainNode = null;
let bgmPlaying = false;

// Inisialisasi AudioContext (harus dipanggil setelah interaksi user)
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // Master gain nodes
  bgmGainNode = audioCtx.createGain();
  bgmGainNode.gain.value = 0.35;
  bgmGainNode.connect(audioCtx.destination);
  
  sfxGainNode = audioCtx.createGain();
  sfxGainNode.gain.value = 0.5;
  sfxGainNode.connect(audioCtx.destination);
  
  // Load external MP3 sound
  fetch('./models/megalodon.mp3')
    .then(response => response.arrayBuffer())
    .then(data => audioCtx.decodeAudioData(data))
    .then(buffer => {
      megalodonBuffer = buffer;
    })
    .catch(e => console.log("Gagal memuat megalodon.mp3 (file mungkin belum ada)", e));
}

let megalodonBuffer = null;

// ==========================================
// BACKGROUND MUSIC (Ambient Underwater Drone)
// ==========================================
let bgmOscillators = [];
let bgmNoiseSource = null;

function startBGM() {
  if (!audioCtx || bgmPlaying) return;
  bgmPlaying = true;
  
  // Layer 1: Deep bass drone (very low frequency hum)
  const drone1 = audioCtx.createOscillator();
  drone1.type = 'sine';
  drone1.frequency.value = 55; // A1 - sangat rendah
  const drone1Gain = audioCtx.createGain();
  drone1Gain.gain.value = 0.15;
  drone1.connect(drone1Gain);
  drone1Gain.connect(bgmGainNode);
  drone1.start();
  
  // Modulasi frekuensi perlahan untuk efek "bernapas"
  const lfo1 = audioCtx.createOscillator();
  lfo1.type = 'sine';
  lfo1.frequency.value = 0.05; // Sangat lambat
  const lfo1Gain = audioCtx.createGain();
  lfo1Gain.gain.value = 3;
  lfo1.connect(lfo1Gain);
  lfo1Gain.connect(drone1.frequency);
  lfo1.start();
  
  // Layer 2: Mid drone (harmonic)
  const drone2 = audioCtx.createOscillator();
  drone2.type = 'sine';
  drone2.frequency.value = 82.5; // E2
  const drone2Gain = audioCtx.createGain();
  drone2Gain.gain.value = 0.08;
  drone2.connect(drone2Gain);
  drone2Gain.connect(bgmGainNode);
  drone2.start();
  
  // Layer 3: Ethereal high pad
  const drone3 = audioCtx.createOscillator();
  drone3.type = 'sine';
  drone3.frequency.value = 220; // A3
  const drone3Gain = audioCtx.createGain();
  drone3Gain.gain.value = 0.03;
  const drone3Filter = audioCtx.createBiquadFilter();
  drone3Filter.type = 'lowpass';
  drone3Filter.frequency.value = 400;
  drone3.connect(drone3Filter);
  drone3Filter.connect(drone3Gain);
  drone3Gain.connect(bgmGainNode);
  drone3.start();
  
  // Modulasi pad
  const lfo3 = audioCtx.createOscillator();
  lfo3.type = 'sine';
  lfo3.frequency.value = 0.08;
  const lfo3Gain = audioCtx.createGain();
  lfo3Gain.gain.value = 15;
  lfo3.connect(lfo3Gain);
  lfo3Gain.connect(drone3.frequency);
  lfo3.start();
  
  // Layer 4: Filtered noise (ocean current / water sound)
  const bufferSize = audioCtx.sampleRate * 4;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.5;
  }
  
  bgmNoiseSource = audioCtx.createBufferSource();
  bgmNoiseSource.buffer = noiseBuffer;
  bgmNoiseSource.loop = true;
  
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 200;
  noiseFilter.Q.value = 0.5;
  
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.06;
  
  bgmNoiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(bgmGainNode);
  bgmNoiseSource.start();
  
  // Modulasi filter noise (suara arus berubah-ubah)
  const noiseLfo = audioCtx.createOscillator();
  noiseLfo.type = 'sine';
  noiseLfo.frequency.value = 0.03;
  const noiseLfoGain = audioCtx.createGain();
  noiseLfoGain.gain.value = 100;
  noiseLfo.connect(noiseLfoGain);
  noiseLfoGain.connect(noiseFilter.frequency);
  noiseLfo.start();
  
  // Layer 5: Random bubble pops (scheduled periodic "plings")
  scheduleBubblePops();
  
  bgmOscillators = [drone1, drone2, drone3, lfo1, lfo3, noiseLfo];
}

function stopBGM() {
  if (!bgmPlaying) return;
  bgmOscillators.forEach(osc => { try { osc.stop(); } catch(e) {} });
  if (bgmNoiseSource) { try { bgmNoiseSource.stop(); } catch(e) {} }
  bgmOscillators = [];
  bgmNoiseSource = null;
  bgmPlaying = false;
  if (bubbleInterval) { clearInterval(bubbleInterval); bubbleInterval = null; }
}

// Bubble pops acak sebagai bagian dari BGM
let bubbleInterval = null;
function scheduleBubblePops() {
  bubbleInterval = setInterval(() => {
    if (!audioCtx || !bgmPlaying) return;
    // Random chance untuk membunyikan gelembung
    if (Math.random() > 0.4) return;
    
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    const baseFreq = 800 + Math.random() * 1500;
    osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, audioCtx.currentTime + 0.08);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.02 + Math.random() * 0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(bgmGainNode);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }, 600 + Math.random() * 1200);
}

// ==========================================
// SOUND EFFECTS
// ==========================================

function playClickSfx() {
  if (!audioCtx) return;
  
  // Click: dua nada pendek berurutan (bleep-bloop)
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.06);
  
  const gain1 = audioCtx.createGain();
  gain1.gain.setValueAtTime(0.25, audioCtx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
  
  osc1.connect(gain1);
  gain1.connect(sfxGainNode);
  osc1.start();
  osc1.stop(audioCtx.currentTime + 0.12);
  
  // Nada kedua (lebih rendah, sedikit terlambat)
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(440, audioCtx.currentTime + 0.05);
  osc2.frequency.exponentialRampToValueAtTime(330, audioCtx.currentTime + 0.12);
  
  const gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0, audioCtx.currentTime);
  gain2.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
  
  osc2.connect(gain2);
  gain2.connect(sfxGainNode);
  osc2.start();
  osc2.stop(audioCtx.currentTime + 0.18);
}

function playHoverSfx() {
  if (!audioCtx) return;
  
  // Hover: lembut ping tinggi
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.08);
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(sfxGainNode);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function playWhooshSfx() {
  if (!audioCtx) return;
  
  // Whoosh: noise burst dengan filter sweep (untuk transisi halaman)
  const bufferSize = audioCtx.sampleRate * 0.6;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 2;
  filter.frequency.setValueAtTime(300, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.15);
  filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.5);
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  
  source.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGainNode);
  source.start();
  source.stop(audioCtx.currentTime + 0.6);
}

function playDiveSfx() {
  if (!audioCtx) return;
  
  // Dive: nada turun perlahan (untuk masuk ke laut)
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 1.5);
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 1.5);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGainNode);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.5);
  
  // Suara gelembung tambahan
  for (let i = 0; i < 6; i++) {
    const delay = Math.random() * 1.2;
    const bubbleOsc = audioCtx.createOscillator();
    bubbleOsc.type = 'sine';
    const freq = 500 + Math.random() * 2000;
    bubbleOsc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    bubbleOsc.frequency.exponentialRampToValueAtTime(freq * 1.8, audioCtx.currentTime + delay + 0.06);
    
    const bubbleGain = audioCtx.createGain();
    bubbleGain.gain.setValueAtTime(0, audioCtx.currentTime);
    bubbleGain.gain.setValueAtTime(0.04, audioCtx.currentTime + delay);
    bubbleGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.1);
    
    bubbleOsc.connect(bubbleGain);
    bubbleGain.connect(sfxGainNode);
    bubbleOsc.start();
    bubbleOsc.stop(audioCtx.currentTime + delay + 0.12);
  }
}

function playAnimalSfx(animalName) {
  if (!audioCtx) return;
  
  if (animalName === 'Megalodon' && megalodonBuffer) {
    const source = audioCtx.createBufferSource();
    source.buffer = megalodonBuffer;
    
    const gain = audioCtx.createGain();
    gain.gain.value = 1.0; // Volume maksimal untuk auman megalodon
    
    source.connect(gain);
    gain.connect(sfxGainNode);
    source.start();
  }
}

function playDetailSfx() {
  if (!audioCtx) return;
  
  // Suara "sonar ping" saat masuk detail view
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1046.5; // C6
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
  
  // Reverb simulasi menggunakan delay
  const delay = audioCtx.createDelay();
  delay.delayTime.value = 0.15;
  const feedbackGain = audioCtx.createGain();
  feedbackGain.gain.value = 0.3;
  
  osc.connect(gain);
  gain.connect(sfxGainNode);
  gain.connect(delay);
  delay.connect(feedbackGain);
  feedbackGain.connect(delay);
  feedbackGain.connect(sfxGainNode);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.8);
}

// ==========================================
// KONTROL VOLUME
// ==========================================
function setBGMEnabled(enabled) {
  if (enabled) {
    if (bgmGainNode) bgmGainNode.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.3);
    if (!bgmPlaying) startBGM();
  } else {
    if (bgmGainNode) bgmGainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
  }
}

function setSFXEnabled(enabled) {
  if (sfxGainNode) {
    sfxGainNode.gain.value = enabled ? 0.5 : 0;
  }
}

export {
  initAudio,
  startBGM,
  stopBGM,
  setBGMEnabled,
  setSFXEnabled,
  playClickSfx,
  playHoverSfx,
  playWhooshSfx,
  playDiveSfx,
  playDetailSfx,
  playAnimalSfx
};
