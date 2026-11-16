# Numoria ⚡
> **Dual-Task Cognitive Web Game: Visuomotor Tracking & Working Memory (Mental Math)**

Aplikasi web game kognitif interaktif berbasis **HTML5 Canvas, CSS3, dan Vanilla JavaScript murni**, dirancang khusus untuk menguji dan melatih kapasitas perhatian ganda (*divided attention*), koordinasi visual-motorik (*visuomotor tracking*), dan memori kerja aritmatika (*working memory & mental math*).

Aplikasi ini 100% statis, modular, tanpa backend, tanpa library eksternal berat, dan siap di-host langsung di **GitHub Pages**.

---

## 🌟 Pembaruan Terkini (Revisi ke-3)

1. **Rasio Tampilan Desktop Ultra-Wide & Presisi di Tengah Layar**:
   - Kotak game desktop diposisikan **presisi di tengah layar (*dead center*)** secara vertikal maupun horizontal (`display: flex` centering pada viewport).
   - Dimensi console desktop dioptimalkan agar tidak terlalu tebal vertikal (`height: min(74vh, 560px)`) dan memanjang secara horizontal (`max-width: 1360px`, `width: 96vw`) memberikan alur pandang horizontal yang lega dan sinematik.

2. **Dedicated Visual Slider Control (Kecepatan Instan 1:1 Tanpa Batas)**:
   - **Pada HP**: Slider terletak **di bawah slide/canvas**, memudahkan ibu jari pemain mengontrol posisi tanpa menghalangi alur gelombang.
   - **Pada Desktop**: Slider terletak **di samping slide/canvas** (vertikal di sebelah kanan target line).
   - **Kecepatan 1:1 Tanpa Batas**: Slider bergerak instan mengikuti kecepatan tangan atau kursor mouse pemain secara langsung—gerak cepat langsung melesat cepat, gerak lambat meluncur halus tanpa batasan kecepatan/damping buatan.

3. **Garis Gelombang Bersih (Clean Wave Line)**:
   - Menggantikan pita ribbon poligon dengan **garis gelombang neon (*wave line*)** yang bersih, tajam, dan elegan (ala visualisasi osiloskop / laser rhythm track).
   - Memiliki node lingkaran `START` (Head) penanda awal gelombang dan node `END` (Tail) penanda akhir gelombang.
   - Area deteksi toleransi spasial 36px di sekitar garis target (*judgment line*).

4. **Optimasi Performa Tinggi (Ringan & Cepat)**:
   - Menghilangkan kalkulasi `shadowBlur` berat pada canvas loop yang membebani GPU/CPU.
   - Menghapus efek `backdrop-filter: blur()` berlebih yang menyebabkan drop frame pada perangkat HP dan laptop hemat daya.
   - Partikel percikan disederhanakan dan dibatasi agar rendering stabil pada **60–120 FPS**.

---

## 📁 Struktur Direktori & File Modular

```text
TrainingMemory/
├── index.html              # Struktur semantic HTML utama
├── README.md               # Dokumentasi lengkap proyek
├── css/
│   ├── variables.css       # Token desain, palet warna, tipografi, dan radius
│   ├── style.css           # Reset dasar, layout container, dan widescreen desktop
│   ├── components.css      # Komponen tombol, kartu, modal, dan dedicated visual slider
│   └── screens.css         # Styling tiap layar (Loader, Menu, Game HUD, Hasil)
└── js/
    ├── config.js           # Konfigurasi ronde, toleransi garis, dan generator angka
    ├── sound.js            # Engine audio prosedural mandiri (Web Audio API)
    ├── particles.js        # Sistem partikel ringan & hemat memori
    ├── game.js             # Engine inti game Numoria (fisika garis gelombang, slider instan, skor)
    └── main.js             # Entry point inisialisasi aplikasi
```

---

## 🌊 Struktur Ronde & Durasi Gelombang

Game terdiri dari **4 Ronde** dengan tingkat kesulitan bertahap (total **22 gelombang garis**):
* **Ronde 1**: 4 Gelombang Garis (~3.2 detik/gelombang, ritme pemanasan)
* **Ronde 2**: 5 Gelombang Garis (~3.0 detik/gelombang, ritme sedang)
* **Ronde 3**: 6 Gelombang Garis (~2.8 detik/gelombang, kompleksitas tinggi)
* **Ronde 4**: 7 Gelombang Garis (~2.6 detik/gelombang, tingkat ahli)

### Aturan Angka Pop-up
* Angka yang muncul berada dalam rentang **-10 hingga 10** (mengecualikan angka 0):
  $$\{-10, -9, \dots, -1, +1, \dots, +10\}$$
* Setiap angka pop-up muncul di tengah layar selama **maksimal 1 detik** dengan bar timer visual dan penanda suara sintetis.
* Gelombang yang gagal di-*trace* tetap akan memunculkan angka di sela gelombang berikutnya tanpa menghentikan ronde.

---

## 📱 Kontrol Pengguna & Dedicated Slider

| Mode | Arah Alur Gelombang | Letak Slider Khusus | Arah Slider & Slider Thumb | Kontrol Keyboard Alternatif |
| :--- | :--- | :--- | :--- | :--- |
| **HP (Vertikal)** | Atas ➔ Bawah | **Di bawah canvas** | Geser horizontal (Kiri ⇄ Kanan) 1:1 instan | <kbd>A</kbd> / <kbd>D</kbd> atau Panah Kiri/Kanan |
| **Desktop (Horizontal)** | Kiri ➔ Kanan | **Di samping kanan canvas** | Geser vertikal (Atas ⇄ Bawah) 1:1 instan | <kbd>W</kbd> / <kbd>S</kbd> atau Panah Atas/Bawah |

---

## 🏆 Sistem Penilaian (Skala Ribuan)

Skor total dikonversi ke skala **0 hingga 10.000 Poin**:
1. **Skor Visuomotor Tracking (Maks 5.000 Pts)**:
   $$\text{Skor Gelombang} = \left( \frac{\text{Total Gelombang Berhasil}}{\text{Total Gelombang (22)}} \right) \times 5.000$$
   *Sebuah gelombang dinyatakan **Berhasil** jika pemain mampu menjaga sinkronisasi posisi di garis gelombang $\ge 58\%$ dari durasi aktif gelombang.*
2. **Skor Mental Math & Memori (Maks 5.000 Pts)**:
   $$\text{Skor Aritmatika} = \left( \frac{\text{Total Ronde Benar}}{4} \right) \times 5.000$$
3. **Total Skor Akhir**:
   Kedua acuan nilai (`Total Berhasil/Total Gelombang` dan `Total Ronde Benar/Jumlah Ronde`) beserta poin ribuan dan evaluasi Grade Kognitif (Grade S, A, B, atau C) ditampilkan secara transparan di layar evaluasi akhir.

---

## 🚀 Panduan Hosting di GitHub Pages

1. **Push repositori ini ke GitHub**:
   ```bash
   git add .
   git commit -m "feat: revisi 3 dedicated slider, clean wave line, desktop widescreen & performance"
   git branch -M main
   git push -u origin main
   ```
2. **Buka pengaturan repositori di browser GitHub**:
   * Masuk ke tab **Settings** repositori Anda di GitHub.
   * Pada menu bilah kiri, klik **Pages** (di bawah *Code and automation*).
   * Pada bagian **Build and deployment**:
     * **Source**: Pilih `Deploy from a branch`.
     * **Branch**: Pilih `main`, folder `/ (root)`.
     * Klik tombol **Save**.
3. **Selesai!** Dalam 1–2 menit, web game Anda akan aktif di URL:
   `https://<username>.github.io/<nama-repo>/`
