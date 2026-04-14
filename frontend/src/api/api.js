import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT token to every request ────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // If data is FormData, let browser set the Content-Type (multipart boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// ── Auto-logout on 401 ────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Helpers ───────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('token');
export const getUser  = () => {
  try {
    const raw = localStorage.getItem('user');
    // Treat missing, literal "undefined", or empty string as no user
    if (!raw || raw === 'undefined') return null;
    return JSON.parse(raw);
  } catch {
    // Corrupt value — clear it so the app doesn't crash on every reload
    localStorage.removeItem('user');
    return null;
  }
};
export const saveAuth = (token, user) => {
  localStorage.setItem('token', token ?? '');
  // Only store user if it's a real object — never store undefined/null as string
  if (user != null) localStorage.setItem('user', JSON.stringify(user));
  else              localStorage.removeItem('user');
};
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
export const isLoggedIn = () => !!getToken();

// ── Time formatter ─────────────────────────────────────────────
export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const s = Math.floor(diff / 1000);
  if (s < 60)  return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── HTML escape ────────────────────────────────────────────────
export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
