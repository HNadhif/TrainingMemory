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