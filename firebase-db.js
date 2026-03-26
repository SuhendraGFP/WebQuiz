// ============================================================
//  firebase-db.js
//  Helper untuk semua operasi baca/tulis ke Firebase
//  Realtime Database.
//
//  Kenapa dipisah ke sini?
//  Supaya participant.html dan host.html tidak langsung
//  panggil firebase.database() di mana-mana — cukup import
//  fungsi dari sini. Kalau mau ganti ke Firestore atau
//  backend lain, cukup ubah file ini, yang lain tidak perlu
//  berubah.
//
//  STRUKTUR DATA DI FIREBASE:
//  quizRooms/
//    {roomId}/
//      participants/
//        {participantId}/
//          profile: { name, joinedAt, status }
//          gps:     { lat, lng, acc, ts }
//          progress:{ current, answers: { q1: '...', q2: '...' } }
//          signaling:
//            offer:  { type, sdp }          ← dibuat peserta
//            answer: { type, sdp }          ← dibuat host
//            peerCandidates/ { ICE peserta } ← dibuat peserta
//            hostCandidates/ { ICE host }   ← dibuat host
// ============================================================

import { FIREBASE_CONFIG, ROOM_ID } from './config.js';

// ── INIT FIREBASE ────────────────────────────────────────────
// Firebase di-init sekali di sini. File lain import db langsung.
firebase.initializeApp(FIREBASE_CONFIG);
export const db = firebase.database();

// Shortcut ke path root semua peserta di room ini
const roomRef = () => db.ref(`quizRooms/${ROOM_ID}/participants`);

// ── GENERATE ID UNIK ─────────────────────────────────────────
// Pakai push().key untuk dapat ID unik dari Firebase
// (mirip UUID tapi tanpa library tambahan)
export function generateId() {
  return db.ref().push().key;
}

// ── DAFTARKAN PESERTA BARU ───────────────────────────────────
// Dipanggil saat peserta submit nama dan mulai quiz
export async function registerParticipant(participantId, name) {
  await roomRef().child(participantId).child('profile').set({
    name,
    joinedAt: Date.now(),
    status: 'waiting', // waiting → quiz → done
  });
}

// ── UPDATE STATUS PESERTA ────────────────────────────────────
// status: 'waiting' | 'quiz' | 'done'
export async function updateStatus(participantId, status) {
  await roomRef().child(participantId).child('profile/status').set(status);
}

// ── SIMPAN GPS ───────────────────────────────────────────────
export async function saveGps(participantId, lat, lng, acc) {
  await roomRef().child(participantId).child('gps').set({ lat, lng, acc, ts: Date.now() });
}

// ── SIMPAN JAWABAN ───────────────────────────────────────────
// questionId: 'q1', 'q2', dst
// answer: string (isi jawaban peserta)
export async function saveAnswer(participantId, questionId, answer) {
  await roomRef().child(participantId).child(`progress/answers/${questionId}`).set(answer);
}

// ── UPDATE NOMOR SOAL SAAT INI ────────────────────────────────
export async function updateCurrentQuestion(participantId, questionIndex) {
  await roomRef().child(participantId).child('progress/current').set(questionIndex);
}

// ═════════════════════════════════════════════════════════════
//  SIGNALING WEBRTC
//  Firebase dipakai sebagai "papan tulis" untuk bertukar
//  informasi koneksi antara peserta dan host.
//  Setelah keduanya saling kenal (signaling selesai),
//  video mengalir langsung peer-to-peer tanpa Firebase.
// ═════════════════════════════════════════════════════════════

// ── SIMPAN OFFER (dari peserta) ───────────────────────────────
export async function saveOffer(participantId, offer) {
  await roomRef().child(participantId).child('signaling/offer').set({
    type: offer.type,
    sdp:  offer.sdp,
  });
}

// ── SIMPAN ANSWER (dari host) ─────────────────────────────────
export async function saveAnswer_WebRTC(participantId, answer) {
  await roomRef().child(participantId).child('signaling/answer').set({
    type: answer.type,
    sdp:  answer.sdp,
  });
}

// ── SIMPAN ICE CANDIDATE PESERTA ─────────────────────────────
export async function savePeerCandidate(participantId, candidate) {
  await roomRef().child(participantId).child('signaling/peerCandidates').push({
    candidate:     candidate.candidate,
    sdpMid:        candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
  });
}

// ── SIMPAN ICE CANDIDATE HOST ─────────────────────────────────
export async function saveHostCandidate(participantId, candidate) {
  await roomRef().child(participantId).child('signaling/hostCandidates').push({
    candidate:     candidate.candidate,
    sdpMid:        candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
  });
}

// ── LISTEN: ANSWER DARI HOST (untuk peserta) ─────────────────
// callback(answer) dipanggil saat host menyimpan answer
export function onAnswerReady(participantId, callback) {
  const ref = roomRef().child(participantId).child('signaling/answer');
  ref.on('value', snap => {
    if (snap.val()) callback(snap.val());
  });
  // return fungsi untuk unsubscribe
  return () => ref.off();
}

// ── LISTEN: ICE CANDIDATES HOST (untuk peserta) ──────────────
export function onHostCandidates(participantId, callback) {
  const ref = roomRef().child(participantId).child('signaling/hostCandidates');
  ref.on('child_added', snap => {
    if (snap.val()) callback(snap.val());
  });
  return () => ref.off();
}

// ── LISTEN: SEMUA PESERTA (untuk host) ───────────────────────
// Dipanggil saat ada peserta baru masuk atau update
export function onParticipantsChange(callback) {
  const ref = roomRef();
  ref.on('value', snap => {
    const data = snap.val() || {};
    callback(data);
  });
  return () => ref.off();
}

// ── LISTEN: OFFER DARI PESERTA (untuk host) ──────────────────
export function onOfferReady(participantId, callback) {
  const ref = roomRef().child(participantId).child('signaling/offer');
  ref.on('value', snap => {
    if (snap.val()) callback(snap.val());
  });
  return () => ref.off();
}

// ── LISTEN: ICE CANDIDATES PESERTA (untuk host) ──────────────
export function onPeerCandidates(participantId, callback) {
  const ref = roomRef().child(participantId).child('signaling/peerCandidates');
  ref.on('child_added', snap => {
    if (snap.val()) callback(snap.val());
  });
  return () => ref.off();
}

// ── HAPUS DATA PESERTA ────────────────────────────────────────
// Dipanggil saat peserta selesai / keluar
export async function removeParticipant(participantId) {
  await roomRef().child(participantId).remove();
}
