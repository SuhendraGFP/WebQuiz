// ============================================================
//  config.js
//  Satu file untuk semua KONFIGURASI dan KONSTANTA.
//  Diimport oleh semua file lain — kalau mau ubah sesuatu,
//  cukup ubah di sini.
//
//  CARA SETUP FIREBASE:
//  1. Buka https://console.firebase.google.com
//  2. Buat project baru
//  3. Klik "Add app" → pilih Web (</>)
//  4. Copy firebaseConfig yang muncul ke bagian bawah ini
//  5. Di sidebar Firebase, aktifkan "Realtime Database"
//  6. Set rules sementara (untuk testing):
//     { "rules": { ".read": true, ".write": true } }
// ============================================================

// ── FIREBASE CONFIG ──────────────────────────────────────────
// Ganti semua nilai di bawah dengan config project Firebase kamu
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAuwKcaz_lJwN_-3fu8rX1NPPLSqyHKGMQ",
  authDomain: "webquiz-e977e.firebaseapp.com",
  projectId: "webquiz-e977e",
  storageBucket: "webquiz-e977e.firebasestorage.app",
  messagingSenderId: "844064507296",
  appId: "1:844064507296:web:e8f281c5187188cc0410c5",
  measurementId: "G-GJLE451LZP"
};

// ── ROOM ID ───────────────────────────────────────────────────
// Semua peserta dan host harus pakai ROOM_ID yang sama.
// Bisa diganti tiap sesi baru supaya data tidak nyampur.
export const ROOM_ID = 'quiz-001';

// ── STUN SERVERS ─────────────────────────────────────────────
// STUN server dipakai WebRTC untuk tau alamat IP publik kita.
// Pakai server Google yang gratis, bisa juga tambah lebih banyak.
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ── SOAL QUIZ ─────────────────────────────────────────────────
// Tambah atau ubah soal di sini. Format: array of object.
// Setiap soal punya id unik dan teks soal.
export const QUESTIONS = [
  {
    id: 'q1',
    nomor: 1,
    soal: 'Pasanganmu tiba-tiba bilang "terserah" saat kamu tanya mau makan di mana. Apa yang kamu lakukan?',
    emoji: '🤔',
  },
  {
    id: 'q2',
    nomor: 2,
    soal: 'Dia bilang "gak papa" dengan nada datar dan wajah tidak enak. Apa artinya dan bagaimana responmu?',
    emoji: '😶',
  },
  {
    id: 'q3',
    nomor: 3,
    soal: 'Kamu lupa tanggal anniversary kalian. Dia tau. Dia diam. Apa yang kamu lakukan sekarang?',
    emoji: '😬',
  },
  {
    id: 'q4',
    nomor: 4,
    soal: 'Dia bilang "gak usah beliin aku apa-apa ya buat ulang tahun". Apa interpretasimu dan apa yang kamu lakukan?',
    emoji: '🎁',
  },
  {
    id: 'q5',
    nomor: 5,
    soal: 'Tiba-tiba dia nangis tapi bilang "gak ada apa-apa, gak usah dipeduliin". Apa yang kamu lakukan?',
    emoji: '😢',
  },
  {
    id: 'q6',
    nomor: 6,
    soal: 'Kamu lagi seru main game, dia tiba-tiba minta diperhatiin. Bagaimana kamu menanganinya?',
    emoji: '🎮',
  },
  {
    id: 'q7',
    nomor: 7,
    soal: 'Dia keliatan marah tapi kalau ditanya "kenapa?" dia jawab "gak ada apa-apa". Strategi kamu?',
    emoji: '😤',
  },
  {
    id: 'q8',
    nomor: 8,
    soal: 'Menurutmu, apa satu hal terpenting yang diinginkan wanita dari pasangannya? Jelaskan alasanmu.',
    emoji: '💬',
  },
];
