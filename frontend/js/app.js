// ============================================================
//  js/app.js  –  Shared utilities used across all pages
//
//  ⚙️  PRODUCTION: change BACKEND_URL below to your server URL
//     e.g. 'https://your-backend.onrender.com'
// ============================================================

const BACKEND_URL = 'http://localhost:5000';          // ← change for production
const API         = `${BACKEND_URL}/api`;

/* ── Token helpers ─────────────────────────────────────────── */
const getToken  = ()         => localStorage.getItem('token');
const getUser   = ()         => JSON.parse(localStorage.getItem('user') || 'null');
const saveAuth  = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user',  JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
const isLoggedIn = () => !!getToken();

/* ── Redirect guards ────────────────────────────────────────── */
// Call on protected pages  –  redirects to login if not authenticated
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'index.html';
  }
}
// Call on auth pages  –  redirects to feed if already authenticated
function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    window.location.href = 'feed.html';
  }
}

/* ── Fetch wrapper with auth header ─────────────────────────── */
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // If body is FormData, remove Content-Type so browser sets multipart boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(API + endpoint, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = 'index.html';
    return;
  }

  return res;
}

/* ── Toast notification ─────────────────────────────────────── */
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/* ── Dark mode ──────────────────────────────────────────────── */
function initDarkMode() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  return saved;
}

function toggleDarkMode() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  const btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

/* ── Time formatter ──────────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const s = Math.floor(diff / 1000);
  if (s < 60)          return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)          return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)          return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)           return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ── Avatar helper (initials fallback) ───────────────────────── */
function avatarHTML(user, size = '') {
  const sizeClass = size ? `avatar-${size}` : '';
  // profile_pic is either a /uploads/... path or "default.png"
  if (user.profile_pic && user.profile_pic !== 'default.png') {
    return `<img src="${BACKEND_URL}${user.profile_pic}"
                 class="avatar ${sizeClass}"
                 alt="${user.username}">`;
  }
  // Initials placeholder
  const initials = (user.username || '?')[0].toUpperCase();
  return `<div class="avatar-placeholder ${sizeClass}">${initials}</div>`;
}

/* ── Build navbar HTML ───────────────────────────────────────── */
function renderNavbar() {
  const user = getUser();
  const nav  = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `
    <span class="brand">📘 Connecto</span>
    <div class="nav-search" style="position:relative">
      <span>🔍</span>
      <input type="text" id="nav-search-input" placeholder="Search users…">
      <div class="search-results" id="search-dropdown"></div>
    </div>
    <div class="nav-links">
      <a href="feed.html">🏠 Feed</a>
      ${user ? `<a href="profile.html?u=${user.username}">👤 Profile</a>` : ''}
      <button class="notif-btn" onclick="window.location.href='notifications.html'" title="Notifications">
        🔔 <span class="notif-badge hidden" id="notif-count"></span>
      </button>
      <button id="dark-toggle" class="dark-toggle" onclick="toggleDarkMode()" title="Toggle dark mode">🌙</button>
      ${user
        ? `<button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>`
        : `<a class="btn btn-primary btn-sm" href="index.html">Login</a>`
      }
    </div>
  `;

  // Set dark mode icon correctly
  const theme = localStorage.getItem('theme') || 'light';
  const btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';

  // Search functionality
  const searchInput = document.getElementById('nav-search-input');
  const dropdown    = document.getElementById('search-dropdown');
  let searchTimer;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (!q) { dropdown.classList.remove('open'); return; }
    searchTimer = setTimeout(() => searchUsers(q, dropdown), 300);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search')) dropdown.classList.remove('open');
  });

  // Notification count
  if (user) loadNotifCount();
}

async function searchUsers(q, dropdown) {
  try {
    const res  = await apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
    const users = await res.json();
    dropdown.innerHTML = users.length
      ? users.map(u => `
          <div class="search-result-item"
               onclick="window.location.href='profile.html?u=${u.username}'">
            ${avatarHTML(u)}
            <div>
              <div style="font-weight:700;font-size:.9rem">${u.username}</div>
              <div style="font-size:.78rem;color:var(--text-muted)">${u.bio || ''}</div>
            </div>
          </div>`).join('')
      : '<div style="padding:14px;color:var(--text-muted);font-size:.9rem">No users found</div>';
    dropdown.classList.add('open');
  } catch (e) { /* silently fail */ }
}

async function loadNotifCount() {
  try {
    const res  = await apiFetch('/notifications/count');
    const data = await res.json();
    const badge = document.getElementById('notif-count');
    if (badge && data.count > 0) {
      badge.textContent = data.count;
      badge.classList.remove('hidden');
    }
  } catch (e) { /* silently fail */ }
}

function logout() {
  clearAuth();
  showToast('Logged out. See you soon! 👋', 'success');
  setTimeout(() => window.location.href = 'index.html', 600);
}

/* ── Auto-init on every page ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  renderNavbar();
});
