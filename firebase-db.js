// ============================================================
// firebase-db.js (MODULAR v9 - FIXED REGION)
// ============================================================

import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  onChildAdded,
  off,
  remove
} from "firebase/database";

import { FIREBASE_CONFIG, ROOM_ID } from "./config.js";

// ── INIT FIREBASE (ANTI DOUBLE INIT) ─────────────────────────
const app = initializeApp(FIREBASE_CONFIG);
export const db = getDatabase(app);

// ROOT PATH
const basePath = `quizRooms/${ROOM_ID}/participants`;
const roomRef = () => ref(db, basePath);

// ── GENERATE ID ──────────────────────────────────────────────
export function generateId() {
  return push(ref(db)).key;
}

// ── REGISTER PESERTA ─────────────────────────────────────────
export async function registerParticipant(participantId, name) {
  await set(ref(db, `${basePath}/${participantId}/profile`), {
    name,
    joinedAt: Date.now(),
    status: "waiting",
  });
}

// ── UPDATE STATUS ────────────────────────────────────────────
export async function updateStatus(participantId, status) {
  await set(ref(db, `${basePath}/${participantId}/profile/status`), status);
}

// ── SIMPAN GPS ───────────────────────────────────────────────
export async function saveGps(participantId, lat, lng, acc) {
  await set(ref(db, `${basePath}/${participantId}/gps`), {
    lat,
    lng,
    acc,
    ts: Date.now(),
  });
}

// ── SIMPAN JAWABAN QUIZ ──────────────────────────────────────
export async function saveAnswer(participantId, questionId, answer) {
  await set(
    ref(db, `${basePath}/${participantId}/progress/answers/${questionId}`),
    answer
  );
}

// ── UPDATE SOAL SAAT INI ─────────────────────────────────────
export async function updateCurrentQuestion(participantId, index) {
  await set(
    ref(db, `${basePath}/${participantId}/progress/current`),
    index
  );
}

// ═════════════════════════════════════════════════════════════
// WEBRTC SIGNALING
// ═════════════════════════════════════════════════════════════

// ── OFFER (peserta → host) ───────────────────────────────────
export async function saveOffer(participantId, offer) {
  await set(ref(db, `${basePath}/${participantId}/signaling/offer`), {
    type: offer.type,
    sdp: offer.sdp,
  });
}

// ── ANSWER (host → peserta) ──────────────────────────────────
export async function saveAnswer_WebRTC(participantId, answer) {
  await set(ref(db, `${basePath}/${participantId}/signaling/answer`), {
    type: answer.type,
    sdp: answer.sdp,
  });
}

// ── ICE CANDIDATE PESERTA ────────────────────────────────────
export async function savePeerCandidate(participantId, candidate) {
  await push(
    ref(db, `${basePath}/${participantId}/signaling/peerCandidates`),
    {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
    }
  );
}

// ── ICE CANDIDATE HOST ───────────────────────────────────────
export async function saveHostCandidate(participantId, candidate) {
  await push(
    ref(db, `${basePath}/${participantId}/signaling/hostCandidates`),
    {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
    }
  );
}

// ── LISTEN: ANSWER (peserta) ─────────────────────────────────
export function onAnswerReady(participantId, callback) {
  const r = ref(db, `${basePath}/${participantId}/signaling/answer`);
  const unsub = onValue(r, (snap) => {
    if (snap.exists()) callback(snap.val());
  });
  return () => off(r);
}

// ── LISTEN: ICE HOST (peserta) ───────────────────────────────
export function onHostCandidates(participantId, callback) {
  const r = ref(db, `${basePath}/${participantId}/signaling/hostCandidates`);
  const unsub = onChildAdded(r, (snap) => {
    if (snap.exists()) callback(snap.val());
  });
  return () => off(r);
}

// ── LISTEN: SEMUA PESERTA (host) ─────────────────────────────
export function onParticipantsChange(callback) {
  const r = roomRef();
  onValue(r, (snap) => {
    callback(snap.val() || {});
  });
  return () => off(r);
}

// ── LISTEN: OFFER (host) ─────────────────────────────────────
export function onOfferReady(participantId, callback) {
  const r = ref(db, `${basePath}/${participantId}/signaling/offer`);
  onValue(r, (snap) => {
    if (snap.exists()) callback(snap.val());
  });
  return () => off(r);
}

// ── LISTEN: ICE PESERTA (host) ───────────────────────────────
export function onPeerCandidates(participantId, callback) {
  const r = ref(db, `${basePath}/${participantId}/signaling/peerCandidates`);
  onChildAdded(r, (snap) => {
    if (snap.exists()) callback(snap.val());
  });
  return () => off(r);
}

// ── HAPUS PESERTA ────────────────────────────────────────────
export async function removeParticipant(participantId) {
  await remove(ref(db, `${basePath}/${participantId}`));
}
