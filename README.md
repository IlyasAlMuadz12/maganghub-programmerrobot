# Misi Coder-Bot (React + Vite)
    npm install
    npm run dev -- --host
    npm run build

Database Laragon (opsional): salin folder `coderbot-api` ke `C:\laragon\www\coderbot-api`, Start All di Laragon,
ganti ADMIN_PASS & SECRET di config.php. Admin: /#/admin. Tanpa API, game memakai localStorage.

Catatan config: salin `coderbot-api/config.sample.php` menjadi `config.php` (sekali saja). File `config.php` tidak ikut di zip,
sehingga password admin dan SECRET milikmu tidak akan tertimpa saat update.

Cara cepat database: jalankan `install-laragon.bat` (Start All di Laragon dulu), lalu buka http://localhost/coderbot-api/setup.php


## Akun admin (lebih dari satu)
Admin disimpan di tabel `admins` (database coderbot). Admin PERTAMA dibuat otomatis dari `ADMIN_USER`/`ADMIN_PASS` di `config.php`
saat pertama kali dipakai. Setelah itu tambah/hapus admin dan ganti password lewat Dashboard Admin > tab "Admin" (atau langsung di tabel `admins`
lewat HeidiSQL; kolom `pass_hash` harus berupa hash PHP `password_hash`, jadi lebih mudah lewat dashboard).
Login admin dan PIN siswa dibatasi: salah 5 kali = dikunci 5 menit.


## Dibuka dari HP / komputer lain
Jalankan `npm run dev` (sudah otomatis bisa diakses dari jaringan), lalu buka `http://IP-LAPTOP:5173` di HP (IP dari `ipconfig`).
Permintaan ke `/coderbot-api` diteruskan oleh Vite ke Apache Laragon di laptop (lihat `vite.config.js`), jadi cukup port 5173 yang perlu terbuka di firewall.
Laragon harus Start All. Proxy mengikuti `.env`: jika `VITE_API_URL` berisi alamat localhost (mis. server PHP port 8081), HP ikut memakainya; jika tidak ada `.env`, diteruskan ke Apache Laragon (`http://127.0.0.1/coderbot-api/api.php`).


## Revisi terbaru (papan 6×6, tutorial, kartu baru, timer)
- **Papan 6×6** di semua 15 level. ❌ disebar lebih banyak (8–13 per level, tersebar di seluruh papan).
- **Tutorial "video"** (`src/Tutorial.jsx`): 12 slide animasi + suara narasi bahasa Indonesia (bila perangkat punya suara id-ID). Muncul otomatis sebelum level pertama, bisa dibuka lagi lewat tombol **🎬 Cara Main** di kartu profil atau tombol **❓** di dalam level.
- **Kartu perintah**: ⬆️ Maju, ⬇️ Mundur, ↩️ Belok Kanan, ↪️ Belok Kiri, 🔄 Balik Arah, ✋ Ambil, 🔁 Ulangi. Kartu baru muncul bertahap: Balik Arah (level 3), Mundur (4), Ulangi (5), Ambil + 🔑 kunci + 🚪 pintu (6).
- **🔑 Kunci, 🚪 Pintu, 🏁 Finish**: pintu terkunci sampai robot berdiri di kotak kunci dan memakai kartu ✋ Ambil. Level 5 membatasi 8 kartu supaya anak belajar memakai 🔁 Ulangi.
- **⏱️ Timer**: mulai saat level dibuka, berhenti saat robot sampai finish (juga berhenti sementara saat panduan dibuka). Waktu tercepat per level tampil di peta level dan popup. Rekor disimpan di **database Laragon** (kolom `progress.best_secs`; waktu tiap permainan menang di `plays.secs`), jadi ikut ke perangkat mana pun siswa login. Tanpa server, rekor disimpan di localStorage.
- Cek level: `npm run check` (memastikan semua level bisa diselesaikan dan finish tak bisa dicapai tanpa kunci).
- Catatan: ganti jumlah level/ukuran papan sebelumnya berarti bintang lama dari level versi lama tetap tersimpan menurut nomor level.


## Rekor waktu di database (update)
- Tabel `progress` mendapat kolom `best_secs` (waktu tercepat per siswa per level) dan `plays` mendapat kolom `secs` (waktu tiap permainan yang menang). Kolom dibuat **otomatis** pada akses API berikutnya (`schema.php`), data lama tidak hilang. Tidak perlu menjalankan SQL manual.
- Rekor lama yang sempat tersimpan di localStorage perangkat siswa dipindahkan otomatis ke database saat siswa itu membuka game (hanya jika lebih cepat dari yang ada di database), lalu dihapus dari perangkat.
- Dashboard Admin: tab Ringkasan menampilkan waktu tercepat (beserta nama pemegang rekor) dan rata-rata waktu menang per level; tab Siswa menampilkan total rekor + rincian per level (tombol ▼); tab Riwayat menampilkan waktu tiap permainan; CSV ikut memuat kolom waktu.
- Endpoint API baru/berubah: `play` (menerima `secs`), `sync_times` (baru), `me`/`login` (mengembalikan `times`), `admin_data` (memuat data waktu).


## Suara narasi tutorial (suara laki-laki)
- Narasi tutorial memakai **suara laki-laki**. Urutan pemakaian: (1) rekaman di `public/voice/01` ... `12` (satu file per slide; mp3/m4a/mp4/ogg/wav, voice note WhatsApp boleh), (2) kalau tidak ada, suara Indonesia bawaan perangkat dengan prioritas suara laki-laki (mis. Microsoft Andika di Edge/Windows), nada diturunkan.
- Naskah tiap slide ada di `NASKAH-SUARA.txt`. Rekam sesuai naskah, simpan dengan nama 01 sampai 12, lalu taruh di `public/voice/`. Tidak perlu mengubah kode.
- Slide lanjut otomatis setelah rekaman selesai diputar.

- **Rekaman suara asli sudah terpasang** di `public/voice/01.mp3` sampai `12.mp3` (dipotong per slide dari rekaman utuh, volume diratakan, noise dikurangi). Ingin ganti satu slide: rekam ulang, simpan dengan nama yang sama (boleh mp3/m4a/mp4), timpa filenya. Durasi slide mengikuti panjang rekaman di `Tutorial.jsx` (`dur`).
