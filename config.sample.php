<?php
// SALIN file ini menjadi config.php (jangan diubah namanya di zip), lalu isi password dan SECRET milikmu.
// config.php tidak ada di dalam zip, jadi tidak akan tertimpa saat kamu update.
// Laragon default: user root, tanpa password. Sesuaikan jika berbeda.
const DB_HOST='127.0.0.1', DB_USER='root', DB_PASS='', DB_NAME='programmer dan robot';
// Admin PERTAMA. Hanya dipakai sekali untuk membuat akun admin pertama di database (tabel admins).
// Setelah itu, kelola admin lewat Dashboard Admin (tab Admin) atau tabel `admins` di HeidiSQL; mengubah nilai ini tidak mengganti password yang sudah ada.
// GANTI sebelum dipakai di sekolah!
const ADMIN_USER='admin', ADMIN_PASS='admin123';
const SECRET='ganti-teks-acak-panjang-ini-0123456789';
// Kode pemulihan untuk fitur "Lupa password?" di halaman login admin (minimal 8 karakter). Simpan baik-baik, jangan dibagikan ke siswa.
// Fitur tidak aktif selama baris ini kosong/tidak ada. Hapus tanda // di depannya dan ganti isinya:
// const RECOVERY_CODE='ganti-dengan-kode-rahasia-kamu';
