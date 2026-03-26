// ============================================================
//  quiz.js
//  Logic untuk:
//  - Minta izin kamera dan GPS
//  - State management quiz (soal mana yang aktif, jawaban, dll)
//  - Simpan jawaban ke Firebase
// ============================================================

import { QUESTIONS }                         from './config.js';
import { saveAnswer, updateCurrentQuestion, saveGps } from './firebase-db.js';

// ── MINTA IZIN KAMERA ─────────────────────────────────────────
// Mengembalikan MediaStream jika berhasil, throw error jika ditolak
// constraints: opsi kamera (default: video HD, no audio)
export async function requestCamera(constraints = {}) {
  const defaultConstraints = {
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
    audio: false,
    ...constraints,
  };

  // getUserMedia() akan munculkan popup izin ke user
  // Kalau user klik "Block" → throw error dengan name 'NotAllowedError'
  const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
  return stream;
}

// ── MINTA IZIN GPS ────────────────────────────────────────────
// Mengembalikan { lat, lng, acc } jika berhasil
// Kalau ditolak atau tidak support → throw error
export function requestGps() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS tidak didukung di browser ini'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: Math.round(pos.coords.accuracy),
        });
      },
      (err) => {
        reject(new Error('GPS ditolak: ' + err.message));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

// ── WATCH GPS (update otomatis) ───────────────────────────────
// Terus pantau GPS dan simpan ke Firebase setiap ada update
// participantId: untuk tahu ke mana data disimpan
// onUpdate(gps): callback setiap ada update
export function watchGps(participantId, onUpdate) {
  if (!navigator.geolocation) return () => {};

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const gps = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        acc: Math.round(pos.coords.accuracy),
      };
      saveGps(participantId, gps.lat, gps.lng, gps.acc);
      onUpdate(gps);
    },
    (err) => console.warn('[GPS] Error:', err.message),
    { enableHighAccuracy: true, maximumAge: 30000 }
  );

  // return fungsi untuk stop watching
  return () => navigator.geolocation.clearWatch(watchId);
}

// ── STATE QUIZ ────────────────────────────────────────────────
// Satu objek state untuk semua data quiz peserta
export const quizState = {
  participantId: null,
  name:          null,
  currentIndex:  0,          // index soal saat ini (0-based)
  answers:       {},         // { q1: 'jawaban...', q2: 'jawaban...' }
  gps:           null,
  cameraStream:  null,
};

// ── AMBIL SOAL SAAT INI ───────────────────────────────────────
export function getCurrentQuestion() {
  return QUESTIONS[quizState.currentIndex] || null;
}

// ── SIMPAN JAWABAN DAN LANJUT ─────────────────────────────────
// Simpan jawaban ke state lokal + Firebase,
// lalu geser ke soal berikutnya.
// Return: true kalau masih ada soal berikutnya, false kalau selesai
export async function submitAnswer(answerText) {
  const q = getCurrentQuestion();
  if (!q) return false;

  // simpan di state lokal
  quizState.answers[q.id] = answerText;

  // simpan ke Firebase
  await saveAnswer(quizState.participantId, q.id, answerText);

  // geser ke soal berikutnya
  quizState.currentIndex++;
  await updateCurrentQuestion(quizState.participantId, quizState.currentIndex);

  // return apakah masih ada soal
  return quizState.currentIndex < QUESTIONS.length;
}

// ── HITUNG PROGRES ────────────────────────────────────────────
export function getProgress() {
  return {
    current: quizState.currentIndex,
    total:   QUESTIONS.length,
    pct:     Math.round((quizState.currentIndex / QUESTIONS.length) * 100),
  };
}
