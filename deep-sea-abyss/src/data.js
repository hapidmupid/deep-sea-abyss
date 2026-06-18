// Data objek edukatif yang akan tampil pada panel informasi.
export const CREATURE_DATA = {
  plesiosaurus: {
    name: 'Plesiosaurus',
    scientific: 'Plesiosauria',
    era: 'Mesozoikum, terutama Jura hingga Kapur',
    size: 'Sekitar 3–15 meter tergantung spesies',
    diet: 'Karnivora, memangsa ikan dan hewan laut kecil',
    fact: 'Plesiosaurus merupakan reptil laut purba yang terkenal dengan leher panjang dan empat sirip besar. Gerak renangnya sering dijelaskan seperti underwater flight, yaitu gerakan sirip menyerupai kepakan sayap di dalam air.'
  },
  mosasaurus: {
    name: 'Mosasaurus',
    scientific: 'Mosasauridae',
    era: 'Kapur Akhir',
    size: 'Dapat mencapai lebih dari 10 meter',
    diet: 'Karnivora puncak',
    fact: 'Mosasaurus adalah predator laut besar pada masa Kapur. Tubuhnya panjang, rahangnya kuat, dan menjadi salah satu pemangsa paling dominan di ekosistem laut purba.'
  },
  ammonite: {
    name: 'Ammonite',
    scientific: 'Ammonoidea',
    era: 'Devon hingga Kapur',
    size: 'Bervariasi dari kecil hingga sangat besar',
    diet: 'Organisme laut kecil dan plankton',
    fact: 'Ammonite adalah moluska laut bercangkang spiral. Fosil ammonite sering digunakan ilmuwan sebagai penanda umur lapisan batuan karena penyebarannya luas dan bentuknya khas.'
  },
  anglerfish: {
    name: 'Anglerfish',
    scientific: 'Lophiiformes',
    era: 'Representasi ikan laut dalam modern sebagai pendukung visual abyss',
    size: 'Bervariasi tergantung spesies',
    diet: 'Karnivora',
    fact: 'Anglerfish dikenal dengan organ bercahaya di kepalanya yang disebut lure. Cahaya ini digunakan untuk menarik mangsa di lingkungan laut dalam yang sangat gelap.'
  }
};

// Label slider sesuai posisi kamera di jalur eksplorasi.
export const SLIDER_STOPS = [
  { value: 0, label: 'Tampak Depan Plesiosaurus', compass: 'NE', depth: 1240 },
  { value: 25, label: 'Sisi Tubuh Plesiosaurus', compass: 'E', depth: 1360 },
  { value: 50, label: 'Koloni Ammonite', compass: 'SE', depth: 1490 },
  { value: 75, label: 'Sarang Mosasaurus', compass: 'S', depth: 1630 },
  { value: 100, label: 'Panorama Ekosistem Abyss', compass: 'SW', depth: 1770 }
];

export const LOADING_TEXTS = [
  'Memuat ekosistem purba...',
  'Menyiapkan cahaya abyss...',
  'Membangunkan Plesiosaurus...',
  'Mengaktifkan jalur kamera spline...',
  'Menyusun partikel plankton...',
  'Menyiapkan panel informasi edukatif...'
];
