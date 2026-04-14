// ============================================================
//  src/config.js  –  Central app configuration
//
//  HOW TO CHANGE FOR PRODUCTION:
//  Edit frontend/.env and set:
//    VITE_API_BASE_URL=https://your-backend.onrender.com
//
//  All components import from here — never hardcode URLs.
// ============================================================

/** Base URL of the backend server (no trailing slash) */
export const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Build a full URL for a backend-served file (upload, image, etc.)
 * @param {string|null} path  - e.g. "/uploads/photo.jpg" or a full http URL
 * @returns {string|null}
 */
export function backendUrl(path) {
  if (!path || path === 'default.png') return null;
  if (path.startsWith('http'))         return path;   // already absolute (e.g. Google photo)
  return `${BACKEND_URL}${path}`;
}

/** URL of the verified blue-tick badge image */
export const BLUETICK_URL = `${BACKEND_URL}/uploads/bluetick.png`;
