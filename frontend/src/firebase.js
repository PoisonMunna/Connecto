// ============================================================
//  src/firebase.js  –  Firebase configuration
// ============================================================
import { initializeApp }                               from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getAnalytics, isSupported }                   from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            "AIzaSyAHYNHRuRKcpRtksRqx6OId-ODBGtyjVwI",
  authDomain:        "login-9e6a3.firebaseapp.com",
  projectId:         "login-9e6a3",
  storageBucket:     "login-9e6a3.firebasestorage.app",
  messagingSenderId: "976105222256",
  appId:             "1:976105222256:web:8b217080e4ad367fec04b5",
  measurementId:     "G-PY1MNJFPS4",
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

// Force Google account picker every time — user can switch accounts
provider.setCustomParameters({ prompt: 'select_account' });

// Initialize Analytics only if the browser supports it (safe fallback)
isSupported().then((yes) => { if (yes) getAnalytics(app); });

export { auth, provider };

// ── Google Sign-In (popup-based) ──────────────────────────────
// Opens a Google account picker popup. Returns { idToken, displayName,
// email, photoURL } on success, or throws on error/cancel.
export async function signInWithGoogle() {
  const result  = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return {
    idToken,
    displayName: result.user.displayName,
    email:       result.user.email,
    photoURL:    result.user.photoURL,
  };
}
