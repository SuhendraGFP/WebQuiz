// ============================================================
//  webrtc.js
//  Helper untuk setup WebRTC peer connection.
//
//  CARA KERJA WEBRTC (simpelnya):
//  1. Peserta buat "offer" (deskripsi koneksi) → simpan ke Firebase
//  2. Host baca offer → buat "answer" → simpan ke Firebase
//  3. Keduanya saling tukar "ICE candidates" (alamat jaringan)
//     juga lewat Firebase
//  4. Setelah proses ini (disebut "signaling") selesai,
//     video/audio mengalir LANGSUNG antar browser (P2P)
//     tanpa lewat server lagi.
//
//  Firebase = papan tulis signaling (hanya dipakai untuk setup)
//  WebRTC   = jalur video sesungguhnya (peer-to-peer)
// ============================================================

import { ICE_SERVERS } from './config.js';
import {
  saveOffer, saveAnswer_WebRTC,
  savePeerCandidate, saveHostCandidate,
  onAnswerReady, onHostCandidates,
  onOfferReady, onPeerCandidates,
} from './firebase-db.js';

// ── SISI PESERTA: BUAT KONEKSI KE HOST ───────────────────────
// localStream: MediaStream kamera peserta
// participantId: ID unik peserta di Firebase
// onRemoteStream: callback saat stream host masuk (opsional)
// return: { pc: RTCPeerConnection, cleanup: Function }
export async function createParticipantConnection(localStream, participantId, onRemoteStream) {

  // 1. Buat RTCPeerConnection dengan STUN server
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // 2. Tambahkan semua track (video) dari kamera ke koneksi
  //    Track ini yang nanti diterima oleh host
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  // 3. Saat ICE candidate baru ditemukan → simpan ke Firebase
  //    ICE candidate = cara browser kasih tau "ini lho alamat saya"
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      savePeerCandidate(participantId, event.candidate);
    }
  };

  // 4. Saat koneksi berhasil → log status
  pc.onconnectionstatechange = () => {
    console.log('[WebRTC] Participant state:', pc.connectionState);
  };

  // 5. Kalau host juga kirim stream (opsional, untuk two-way video)
  if (onRemoteStream) {
    pc.ontrack = (event) => {
      onRemoteStream(event.streams[0]);
    };
  }

  // 6. Buat offer → set sebagai local description → simpan ke Firebase
  //    Offer = "hei host, ini spesifikasi koneksi yang saya support"
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await saveOffer(participantId, offer);

  // 7. Tunggu answer dari host lewat Firebase
  //    Setelah host set remote description (offer kita), mereka buat answer
  const unsubAnswer = onAnswerReady(participantId, async (answer) => {
    // Kalau sudah ada remote description, jangan set lagi
    if (!pc.remoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  });

  // 8. Terima ICE candidates dari host lewat Firebase
  const unsubCandidates = onHostCandidates(participantId, async (candidateData) => {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidateData));
    } catch (e) {
      console.warn('[WebRTC] Gagal tambah host ICE candidate:', e);
    }
  });

  // return cleanup function supaya bisa disconnect dengan rapi
  const cleanup = () => {
    unsubAnswer();
    unsubCandidates();
    pc.close();
  };

  return { pc, cleanup };
}

// ── SISI HOST: TERIMA KONEKSI DARI PESERTA ───────────────────
// participantId: ID peserta yang mau dikoneksi
// onRemoteStream: callback saat dapat video dari peserta
// return: { pc: RTCPeerConnection, cleanup: Function }
export async function createHostConnection(participantId, onRemoteStream) {

  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // Saat dapat video track dari peserta → kirim ke callback
  //   event.streams[0] = MediaStream video peserta
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      onRemoteStream(event.streams[0]);
    }
  };

  // ICE candidate host → simpan ke Firebase untuk diambil peserta
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      saveHostCandidate(participantId, event.candidate);
    }
  };

  pc.onconnectionstatechange = () => {
    console.log(`[WebRTC] Host-${participantId} state:`, pc.connectionState);
  };

  // Tunggu offer dari peserta lewat Firebase
  const unsubOffer = onOfferReady(participantId, async (offer) => {
    // Cek apakah sudah pernah diproses (kalau Firebase trigger ulang)
    if (pc.remoteDescription) return;

    // Set offer peserta sebagai remote description
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Buat answer → set sebagai local description → simpan ke Firebase
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await saveAnswer_WebRTC(participantId, answer);
  });

  // Terima ICE candidates dari peserta
  const unsubCandidates = onPeerCandidates(participantId, async (candidateData) => {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidateData));
    } catch (e) {
      console.warn('[WebRTC] Gagal tambah peer ICE candidate:', e);
    }
  });

  const cleanup = () => {
    unsubOffer();
    unsubCandidates();
    pc.close();
  };

  return { pc, cleanup };
}
