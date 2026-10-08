# Misi Coder-Bot (React + Vite)
Game Unplugged Coding untuk SD Fase C: 15 level, akun siswa (nama + PIN), bintang, papan peringkat.

    npm install
    npm run dev       # jalankan di localhost
    npm run build     # hasil di folder dist/ (siap di-hosting)

Struktur: `src/game.js` (logika & level), `src/storage.js` (penyimpanan), `src/App.jsx` (tampilan React).
Skor kini di localStorage (per perangkat). Untuk skor satu kelas, ganti isi `storage.js` dengan Supabase/Firebase.
