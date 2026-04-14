import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { signInWithGoogle } from '../firebase';
import api from '../api/api';

// ── Reusable Google button ────────────────────────────────────
function GoogleBtn({ onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl
                 bg-white dark:bg-slate-800
                 border border-slate-200 dark:border-slate-600
                 text-slate-700 dark:text-slate-200 text-sm font-semibold
                 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700
                 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
                 disabled:opacity-50 disabled:cursor-not-allowed">
      {/* Google SVG logo */}
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continue with Google
    </button>
  );
}

function GoogleDivider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
      <span className="text-xs text-slate-400 font-medium">or</span>
      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
    </div>
  );
}

function InlineSpinner() {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      Please wait…
    </span>
  );
}

export default function AuthPage() {
  const { login }             = useAuth();
  const { showToast }         = useToast();
  const { dark, toggleTheme } = useTheme();
  const navigate              = useNavigate();

  const [tab,     setTab]     = useState('login');
  const [loading, setLoading] = useState(false);

  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBio,      setRegBio]      = useState('');

  const [adminEmail,    setAdminEmail]    = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // ── Regular Login ─────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      login(data.token, data.user);
      showToast('Welcome back! 👋', 'success');
      navigate('/feed');
    } catch (err) {
      showToast(err.response?.data?.error || 'Login failed', 'error');
    } finally { setLoading(false); }
  }

  // ── Register ──────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', {
        username: regUsername, email: regEmail, password: regPassword, bio: regBio,
      });
      login(data.token, data.user);
      showToast('Account created! Welcome 🎉', 'success');
      navigate('/feed');
    } catch (err) {
      showToast(err.response?.data?.error || 'Registration failed', 'error');
    } finally { setLoading(false); }
  }

  // ── Admin Login ───────────────────────────────────────────
  async function handleAdminLogin(e) {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: adminEmail, password: adminPassword });
      if (!data.user?.is_admin) {
        showToast('❌ This account does not have admin privileges.', 'error');
        return;
      }
      login(data.token, data.user);
      showToast('Welcome, Admin! 🛡️', 'success');
      navigate('/admin');
    } catch (err) {
      showToast(err.response?.data?.error || 'Admin login failed', 'error');
    } finally { setLoading(false); }
  }

  // ── Google Sign-In (popup-based) ──────────────────────────
  // signInWithGoogle() opens a Google popup and returns { idToken, ... }
  // directly — no redirect, no page reload needed.
  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const googleResult = await signInWithGoogle();
      const { data }     = await api.post('/auth/google', { idToken: googleResult.idToken });
      login(data.token, data.user);
      showToast('Signed in with Google! 🚀', 'success');
      navigate(data.user?.is_admin ? '/admin' : '/feed');
    } catch (err) {
      // Silently ignore if user just closed the popup
      const code = err?.code || '';
      if (!code.includes('popup-closed-by-user') && !code.includes('cancelled-popup-request')) {
        showToast(err.response?.data?.error || 'Google sign-in failed. Try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  const features = ['🌐 Global Feed', '💬 Real-time Comments', '🔔 Notifications', '👥 Follow Anyone'];
  const TABS = [
    { key: 'login',    icon: '🔑', label: 'Login' },
    { key: 'register', icon: '✨', label: 'Register' },
    { key: 'admin',    icon: '🛡️', label: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex relative">

      {/* Theme toggle */}
      <button onClick={toggleTheme}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center
                   bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                   text-slate-600 dark:text-slate-300 shadow-sm
                   hover:scale-110 active:scale-95 transition-all duration-200">
        {dark ? '☀️' : '🌙'}
      </button>

      {/* ── Left Hero (desktop) ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center
                      bg-gradient-to-br from-slate-200 via-blue-100/60 to-purple-100/40
                      dark:from-slate-900 dark:via-blue-950/40 dark:to-purple-950/30
                      p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-brand rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-lg">
            <span className="text-white text-4xl font-black">C</span>
          </div>
          <h1 className="text-5xl font-black text-slate-800 dark:text-white mb-4 leading-tight">
            Connec<span className="text-transparent bg-clip-text bg-gradient-brand">to</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-10">
            Connect with people you love, share your stories, and discover what's happening.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {features.map((f) => (
              <div key={f} className="inline-flex items-center gap-1.5 px-4 py-2
                                      bg-white/70 dark:bg-slate-800/60
                                      border border-slate-300/60 dark:border-slate-700/50
                                      rounded-full text-sm text-slate-700 dark:text-slate-300 shadow-sm">
                {f}
              </div>
            ))}
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2
                          bg-amber-50 dark:bg-amber-500/10
                          border border-amber-200 dark:border-amber-500/30
                          rounded-xl text-xs text-amber-700 dark:text-amber-400">
            🛡️ Admins — use the <b>Admin</b> tab to log in
          </div>
        </div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-glow">
              <span className="text-white text-2xl font-black">S</span>
            </div>
          </div>

          <div className="glass p-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              {tab === 'login'    && 'Welcome back 👋'}
              {tab === 'register' && 'Create an account ✨'}
              {tab === 'admin'    && 'Admin Login 🛡️'}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {tab === 'login'    && 'Sign in to your account to continue.'}
              {tab === 'register' && 'Join Connecto and connect with the world.'}
              {tab === 'admin'    && 'Authorized admin accounts only.'}
            </p>

            {/* Tab switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-900/60
                            border border-slate-200 dark:border-slate-700/50
                            rounded-xl p-1 mb-6 gap-1">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg
                              transition-all duration-200 flex items-center justify-center gap-1
                              ${tab === t.key
                                ? t.key === 'admin'
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                                  : 'bg-gradient-brand text-white shadow-glow'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* ══════════════ LOGIN TAB ══════════════ */}
            {tab === 'login' && (
              <div className="animate-fade-in">
                <GoogleBtn onClick={handleGoogleLogin} disabled={loading} />
                <GoogleDivider />

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Email address</label>
                    <input className="input" type="email" placeholder="you@example.com" required
                      value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
                    <input className="input" type="password" placeholder="••••••••" required
                      value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                  </div>
                  <button type="submit" disabled={loading} className="btn-brand w-full mt-2 disabled:opacity-60">
                    {loading ? <InlineSpinner /> : '🔑 Login'}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-3">
                    No account?{' '}
                    <button type="button" onClick={() => setTab('register')}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Register here</button>
                  </p>
                </form>
              </div>
            )}

            {/* ══════════════ REGISTER TAB ══════════════ */}
            {tab === 'register' && (
              <div className="animate-fade-in">
                <GoogleBtn onClick={handleGoogleLogin} disabled={loading} />
                <GoogleDivider />

                <form onSubmit={handleRegister} className="space-y-4">
                  {[
                    { label: 'Username',      type: 'text',     val: regUsername, set: setRegUsername, ph: 'cooluser123',       min: 3, max: 50 },
                    { label: 'Email address', type: 'email',    val: regEmail,    set: setRegEmail,    ph: 'you@example.com' },
                    { label: 'Password',      type: 'password', val: regPassword, set: setRegPassword, ph: 'min. 6 characters', min: 6 },
                  ].map(({ label, type, val, set, ph, min, max }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
                      <input className="input" type={type} placeholder={ph} required
                        minLength={min} maxLength={max}
                        value={val} onChange={(e) => set(e.target.value)} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      Bio <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input className="input" type="text" placeholder="Tell us about yourself…" maxLength={200}
                      value={regBio} onChange={(e) => setRegBio(e.target.value)} />
                  </div>
                  <button type="submit" disabled={loading} className="btn-brand w-full mt-2 disabled:opacity-60">
                    {loading ? <InlineSpinner /> : '✨ Create Account'}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-3">
                    Already have an account?{' '}
                    <button type="button" onClick={() => setTab('login')}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Login</button>
                  </p>
                </form>
              </div>
            )}

            {/* ══════════════ ADMIN TAB ══════════════ */}
            {tab === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4 animate-fade-in">
                {/* Admin notice */}
                <div className="flex items-center gap-2 p-3 rounded-xl
                                bg-amber-50 dark:bg-amber-500/10
                                border border-amber-200 dark:border-amber-500/30">
                  <span className="text-xl">🛡️</span>
                  <div>
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-400">Admin Access Only</div>
                    <div className="text-xs text-amber-600 dark:text-amber-500">Only authorized admin accounts can sign in here.</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Admin Email</label>
                  <input className="input" type="email" placeholder="admin@example.com" required
                    value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Admin Password</label>
                  <input className="input" type="password" placeholder="••••••••" required
                    value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-white
                             bg-gradient-to-r from-amber-500 to-orange-500
                             hover:from-amber-600 hover:to-orange-600
                             shadow-md transition-all duration-200 disabled:opacity-60">
                  {loading ? <InlineSpinner /> : '🛡️ Admin Login'}
                </button>
                <p className="text-center text-xs text-slate-400">
                  Not an admin?{' '}
                  <button type="button" onClick={() => setTab('login')}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Login here</button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
