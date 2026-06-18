# Deep Sea Abyss

**Deep Sea Abyss** adalah website 3D interaktif bertema **Virtual Tour Ekosistem Bawah Laut Purba**. Project ini dibuat menggunakan **Three.js**, **GSAP**, **HTML**, **CSS**, dan **JavaScript ES Module**.

Versi ini **belum menggunakan file `.glb`**, karena semua objek dibuat secara procedural dari geometry bawaan Three.js. Jadi project tetap bisa dijalankan meskipun belum ada aset Blender.

## Fitur Utama

- Website 3D fullscreen berbasis Three.js.
- Tema gua bawah laut purba / deep sea abyss.
- Objek procedural: Plesiosaurus, Mosasaurus, Ammonite, Anglerfish, batu, stalaktit, karang, seaweed, terrain, plankton, dan bubble.
- Sistem **Linear-Sliding Navigation** menggunakan `THREE.CatmullRomCurve3`.
- Kamera tidak memakai OrbitControls, jadi pengguna tidak bisa tersesat atau menembus objek.
- Slider bawah untuk menggerakkan kamera sepanjang jalur spline.
- Swipe gesture untuk perangkat mobile.
- SpotLight seperti senter yang mengikuti arah mouse.
- Raycaster untuk hover dan klik objek interaktif.
- Panel informasi edukatif saat objek diklik.
- Loading screen sinematik dan cinematic intro.
- HUD depth sensor, compass, audio toggle, panduan, dan minimap.
- Audio ambient dibuat procedural memakai Web Audio API, jadi tidak butuh file audio.

## Struktur Folder

```txt
deep-sea-abyss/
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── src/
│   ├── main.js
│   ├── style.css
│   ├── data.js
│   ├── ui.js
│   ├── cameraPath.js
│   ├── interactions.js
│   └── loaders.js
└── public/
    └── assets/
        ├── models/
        ├── textures/
        └── audio/
```

## Cara Menjalankan

Pastikan Node.js sudah terinstall.

```bash
npm install
npm run dev
```

Setelah itu buka URL yang muncul di terminal, biasanya:

```txt
http://localhost:5173/
```

## Cara Menggunakan Website

1. Buka website.
2. Tunggu loading screen sampai 100%.
3. Klik tombol **MULAI EKSPLORASI**.
4. Kamera akan menjalankan cinematic intro menuju Plesiosaurus.
5. Geser slider bawah untuk menjelajahi scene.
6. Gerakkan mouse untuk mengarahkan senter.
7. Arahkan mouse ke objek makhluk purba untuk highlight.
8. Klik Plesiosaurus, Mosasaurus, Ammonite, atau Anglerfish untuk membuka panel informasi.
9. Pada mobile, gunakan swipe kanan/kiri untuk menggerakkan kamera.

## File Penting

### `src/main.js`
Berisi inisialisasi scene, kamera, renderer, lighting, camera spline, event listener UI, intro cinematic, audio, dan render loop.

### `src/loaders.js`
Berisi pembuatan model procedural tanpa `.glb`, seperti Plesiosaurus, Mosasaurus, Ammonite, Anglerfish, terrain, cave wall, seaweed, coral, particle, bubble, dan animasi idle.

### `src/cameraPath.js`
Berisi jalur kamera dan titik fokus menggunakan `THREE.CatmullRomCurve3`.

### `src/interactions.js`
Berisi Raycaster untuk hover dan klik objek, serta fungsi mouse tracking untuk SpotLight.

### `src/ui.js`
Berisi fungsi untuk mengatur loading screen, HUD, slider, minimap, panel informasi, audio button, dan modal bantuan.

### `src/data.js`
Berisi data edukatif makhluk purba dan label posisi slider.

## Cara Mengganti Model Procedural dengan `.glb` Nanti

Untuk saat ini project tidak memakai `.glb`. Kalau nanti model dari Blender sudah jadi, langkah umumnya:

1. Letakkan file model ke folder:

```txt
public/assets/models/
```

2. Install dan import `GLTFLoader` dari Three.js:

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
```

3. Tambahkan fungsi loader di `src/loaders.js`.
4. Setelah model berhasil dimuat, beri `userData.creatureId` agar tetap bisa terdeteksi Raycaster.
5. Masukkan model ke `interactives` agar bisa di-hover dan diklik.
6. Jika model memiliki animasi, gunakan `THREE.AnimationMixer`. Kalau belum ada, tetap bisa memakai animasi fallback GSAP seperti versi procedural ini.

## Cara Mengatur Jalur Kamera

Buka file:

```txt
src/cameraPath.js
```

Ubah titik pada bagian:

```js
const cameraPoints = [ ... ];
const lookAtPoints = [ ... ];
```

`cameraPoints` adalah posisi kamera. `lookAtPoints` adalah arah pandang kamera. Pastikan jalurnya tidak terlalu dekat dengan objek agar tidak terjadi clipping.

## Cara Menambah Objek Edukatif

1. Tambahkan data objek di `src/data.js`.
2. Buat model procedural baru di `src/loaders.js`.
3. Beri ID objek dengan `makeInteractive(group, 'namaObjek')`.
4. Tambahkan trigger animasi di `triggerCreatureAnimation()` pada `src/main.js`.

## Cara Deploy ke Netlify

1. Jalankan build:

```bash
npm run build
```

2. Upload folder `dist/` ke Netlify.

Atau hubungkan repository GitHub ke Netlify, lalu gunakan command:

```bash
npm run build
```

Output folder:

```txt
dist
```

## Cara Deploy ke GitHub Pages

1. Install package `gh-pages` kalau diperlukan.
2. Ubah konfigurasi base di `vite.config.js` sesuai nama repository.
3. Jalankan build.
4. Upload folder `dist` ke branch GitHub Pages.

## Script Presentasi Singkat

Website Deep Sea Abyss ini merupakan website 3D interaktif bertema ekosistem bawah laut purba. Pada awal website, pengguna akan melihat loading screen, kemudian masuk ke cinematic intro. Setelah itu pengguna dapat menjelajahi scene menggunakan slider di bagian bawah. Kamera tidak bebas seperti OrbitControls, tetapi dikunci pada jalur spline agar pengguna tidak bingung arah. Di dalam scene terdapat beberapa objek interaktif seperti Plesiosaurus, Mosasaurus, Ammonite, dan Anglerfish. Ketika objek diklik, sistem akan menjalankan animasi dan menampilkan panel informasi edukatif. Selain itu, terdapat efek senter yang mengikuti mouse, partikel plankton, audio bawah laut, HUD kedalaman, dan minimap untuk memperkuat pengalaman virtual tour.
