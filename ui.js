// ============================================================
//  ui.js
//  Semua fungsi untuk update TAMPILAN (DOM).
//
//  Prinsip: logika ada di quiz.js / firebase-db.js,
//  tampilan diurus di sini. Modul lain tidak perlu tau
//  cara update DOM — cukup panggil fungsi dari ui.js.
// ============================================================

// ── SHOW / HIDE SCREEN ────────────────────────────────────────
// Setiap "halaman" di participant.html punya id screen-xxx
// Fungsi ini hide semua, lalu show yang diminta
export function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(el => {
    el.style.display = 'none';
  });
  const target = document.getElementById(screenId);
  if (target) target.style.display = 'flex';
}

// ── UPDATE PROGRESS BAR ───────────────────────────────────────
// pct: 0-100
export function updateProgressBar(current, total) {
  const pct = Math.round((current / total) * 100);
  const bar = document.getElementById('progress-bar');
  const label = document.getElementById('progress-label');
  if (bar)   bar.style.width = pct + '%';
  if (label) label.textContent = `${current} / ${total}`;
}

// ── TAMPILKAN SOAL ────────────────────────────────────────────
export function renderQuestion(question) {
  const el = document.getElementById('question-text');
  const em = document.getElementById('question-emoji');
  const nm = document.getElementById('question-number');
  const ta = document.getElementById('answer-input');

  if (el)  el.textContent  = question.soal;
  if (em)  em.textContent  = question.emoji || '❓';
  if (nm)  nm.textContent  = `Soal ${question.nomor}`;
  if (ta)  ta.value        = ''; // kosongkan input
  if (ta)  ta.focus();
}

// ── TAMPILKAN STATUS IZIN ─────────────────────────────────────
// status: 'loading' | 'granted' | 'denied'
export function setPermissionStatus(type, status) {
  // type: 'camera' atau 'gps'
  const el = document.getElementById(`perm-${type}`);
  if (!el) return;

  const icons = { loading: '⏳', granted: '✅', denied: '❌' };
  const icon  = el.querySelector('.perm-icon');
  if (icon) icon.textContent = icons[status] || '⏳';
  el.className = `perm-item perm-${status}`;
}

// ── MINI CAMERA PREVIEW ───────────────────────────────────────
// Tampilkan stream kamera ke elemen <video> dengan id tertentu
export function attachStream(videoId, stream) {
  const video = document.getElementById(videoId);
  if (!video) return;
  video.srcObject = stream;
  video.play().catch(() => {});
}

// ── TOAST NOTIFICATION ───────────────────────────────────────
// Tampilkan pesan kecil sementara di bawah layar
export function showToast(message, type = 'info', duration = 3000) {
  // hapus toast yang ada
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // animasi masuk
  requestAnimationFrame(() => toast.classList.add('show'));

  // hilangkan setelah `duration` ms
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── DISABLE / ENABLE TOMBOL ───────────────────────────────────
export function setButtonLoading(btnId, loading, text) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = text || btn.textContent;
}
