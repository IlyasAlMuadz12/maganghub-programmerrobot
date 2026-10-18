<div align="center">

# 🤖 Misi Coder-Bot

**Game belajar berpikir logis dan dasar pemrograman untuk anak SD**
Susun kartu perintah, jalankan robot, hindari bug, dan capai finish!

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-MySQL-777BB4?logo=php&logoColor=white)

Dibuat oleh **[MRikoKuswoyo](https://github.com/MRikoKuswoyo)**

</div>

---

## ✨ Fitur

- **15 level** pada papan **6×6**, makin sulit secara bertahap.
- **Kartu perintah**: ⬆️ Maju, ⬇️ Mundur, ↩️ Belok Kanan, ↪️ Belok Kiri, 🔄 Balik Arah, ✋ Ambil, 🔁 Ulangi. Kartu baru muncul bertahap: Balik Arah (level 3), Mundur (4), Ulangi (5), Ambil + 🔑 kunci + 🚪 pintu (6).
- **Kunci, pintu, dan finish**: pintu terkunci sampai robot berdiri di kotak kunci dan memakai kartu ✋ Ambil. Level 5 membatasi 8 kartu supaya anak belajar memakai 🔁 Ulangi.
- **⏱️ Timer dan rekor waktu** per level, tampil di peta level dan popup.
- **⭐ Bintang dan papan peringkat** antar siswa.
- **🎬 Tutorial animasi** 12 slide dengan narasi suara bahasa Indonesia.
- **Dashboard Admin** (`/#/admin`): ringkasan, daftar siswa, riwayat main, ekspor CSV, kelola akun admin dan reset PIN siswa.
- **Dua mode penyimpanan**: database (PHP + MySQL) bila server tersedia, jika tidak otomatis memakai `localStorage`.

## 🚀 Menjalankan

```bash
npm install
npm run dev        # mode pengembangan (bisa dibuka dari HP lewat IP laptop)
npm run build      # hasil build ada di folder dist
npm run check      # memastikan semua level bisa diselesaikan
```

Tanpa server PHP, game tetap jalan dan skor tersimpan di browser (`localStorage`).

## 🗄️ Database dan Admin (Laragon)

1. Salin folder project ini ke `C:\laragon\www\programmer dan robot`.
2. Buka Laragon lalu klik **Start All** (Apache dan MySQL harus hijau).
3. Salin `config.sample.php` menjadi `config.php`, lalu isi:
   - `DB_NAME` (bawaan: `programmer dan robot`)
   - `ADMIN_USER` dan `ADMIN_PASS` (**wajib diganti**)
   - `SECRET` (teks acak panjang, **wajib diganti**)
   - `RECOVERY_CODE` (opsional, untuk fitur "Lupa password?")
4. Buka sekali: `http://localhost/programmer%20dan%20robot/setup.php`. Database dan tabel dibuat otomatis.
5. Tes API: `http://localhost/programmer%20dan%20robot/api.php?a=ping` harus menampilkan `{"ok":true}`.
6. Jalankan `npm run dev`, lalu masuk admin di `http://localhost:5173/#/admin`.

Game memanggil `/coderbot-api/api.php`. Saat `npm run dev`, Vite meneruskannya ke Apache Laragon (lihat `vite.config.js`), jadi cukup port 5173 yang perlu terbuka di firewall.

**Dibuka dari HP atau komputer lain:** jalankan `npm run dev`, lalu buka `http://IP-LAPTOP:5173` (IP dari `ipconfig`). Laragon harus tetap Start All.

**Keamanan:** login admin dan PIN siswa dibatasi, salah 5 kali dikunci 5 menit. Jangan membagikan `config.php` (berisi `SECRET` dan password admin).

## 🔊 Suara narasi tutorial

Rekaman ada di `public/voice/01.mp3` sampai `12.mp3` (satu file per slide). Naskahnya ada di `NASKAH-SUARA.txt`. Untuk mengganti satu slide, rekam ulang, simpan dengan nama yang sama, lalu timpa filenya. Tanpa rekaman, tutorial memakai suara Indonesia bawaan perangkat.

## 🗂️ Struktur project

```
src/            kode game (React): game.js, Board, Tutorial, Admin, storage
public/voice/   rekaman narasi tutorial
scripts/        pembuat dan pemeriksa level
api.php         API (PHP + MySQL)
schema.php      pembuat tabel otomatis
setup.php       pengecek dan pembuat database
config.sample.php  contoh konfigurasi
```

## 🌐 Deploy

Frontend bisa di-deploy ke Vercel (Framework: Vite, Build: `npm run build`, Output: `dist`). Vercel tidak menjalankan PHP, jadi di sana game memakai `localStorage`. Untuk database dan admin online, gunakan hosting PHP + MySQL terpisah dan arahkan frontend lewat `VITE_API_URL`.

## 👤 Pembuat

Dibuat oleh **MRikoKuswoyo** ([github.com/MRikoKuswoyo](https://github.com/MRikoKuswoyo)).

## ©️ Hak Cipta

Copyright © 2026 **MRikoKuswoyo**. Hak cipta dilindungi.

Seluruh kode, desain, tampilan, level, dan rekaman suara dalam repositori ini adalah karya MRikoKuswoyo. Dilarang menyalin, memperbanyak, memodifikasi, menjual, atau mendistribusikan ulang sebagian maupun seluruhnya tanpa izin tertulis dari pembuat. Penggunaan untuk pembelajaran pribadi di kelas diperbolehkan selama mencantumkan nama pembuat.
