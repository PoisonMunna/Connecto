import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/api';
import Avatar from './Avatar';

const navItems = [
  { to: '/feed',          icon: '🏠', label: 'Feed' },
  { to: '/messages',      icon: '💬', label: 'Messages',      msgBadge: true },
  { to: '/notifications', icon: '🔔', label: 'Notifications', badge: true },
];

export default function Navbar() {
  const { user, logout }    = useAuth();
  const { showToast }       = useToast();
  const { dark, toggleTheme } = useTheme();
  const navigate            = useNavigate();
  const location            = useLocation();

  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount,   setMsgCount]   = useState(0);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications/count').then(({ data }) => setNotifCount(data.count || 0)).catch(() => {});
    api.get('/messages/unread/count').then(({ data }) => setMsgCount(data.count || 0)).catch(() => {});
    const interval = setInterval(() => {
      api.get('/messages/unread/count').then(({ data }) => setMsgCount(data.count || 0)).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setDropOpen(false); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        setResults(data); setDropOpen(true);
      } catch { /* silently fail */ }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    const fn = (e) => { if (!e.target.closest('.search-wrap')) setDropOpen(false); };
    document.addEventListener('click', fn);
    return () => document.removeEventListener('click', fn);
  }, []);

  const handleLogout = () => {
    logout();
    showToast('Logged out. See you soon! 👋', 'success');
    navigate('/');
  };

  const isActive = (to) => location.pathname === to;

  return (
    <header className={`
      sticky top-0 z-50
      bg-white/90 dark:bg-slate-950/80
      backdrop-blur-xl
      border-b border-slate-200 dark:border-slate-800/60
      transition-all duration-300
      ${scrolled ? 'shadow-md dark:shadow-[0_4px_30px_rgba(0,0,0,.5)]' : ''}
    `}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link to="/feed" className="flex items-center gap-2.5 shrink-0 group no-underline">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center
                          shadow-glow transition-transform duration-300 group-hover:scale-110">
            <span className="text-white font-black text-base">C</span>
          </div>
          <span className="hidden sm:block text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Connec<span className="text-transparent bg-clip-text bg-gradient-brand">to</span>
          </span>
        </Link>

        {/* Search */}
        <div className="search-wrap relative flex-1 max-w-sm">
          <div className="flex items-center gap-2
                          bg-slate-100 border border-slate-200 dark:bg-slate-800/70 dark:border-slate-700/60
                          rounded-xl px-3 py-2
                          focus-within:border-blue-500/70 focus-within:ring-2 focus-within:ring-blue-500/20
                          transition-all duration-200">
            <span className="text-slate-400 dark:text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search users…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent flex-1 text-sm text-slate-900 dark:text-slate-100
                         placeholder-slate-400 dark:placeholder-slate-500 outline-none"
            />
          </div>

          {dropOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden
                            shadow-lg animate-slide-up z-50">
              {results.length > 0
                ? results.map((u) => (
                    <button key={u.id}
                      onClick={() => { navigate(`/profile/${u.username}`); setDropOpen(false); setQuery(''); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left
                                 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                      <Avatar user={u} size="sm" />
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{u.username}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[180px]">{u.bio || 'No bio'}</div>
                      </div>
                    </button>
                  ))
                : <div className="px-4 py-4 text-sm text-slate-500 text-center">No users found</div>
              }
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                          transition-all duration-200 no-underline
                          ${isActive(item.to)
                            ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              <span>{item.icon}</span><span>{item.label}</span>
              {item.badge && notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] px-1 h-[18px]
                                 bg-red-500 text-white text-[10px] font-bold rounded-full
                                 flex items-center justify-center animate-pulse-slow">
                  {notifCount}
                </span>
              )}
              {item.msgBadge && msgCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] px-1 h-[18px]
                                 bg-blue-500 text-white text-[10px] font-bold rounded-full
                                 flex items-center justify-center animate-pulse-slow">
                  {msgCount}
                </span>
              )}
            </Link>
          ))}
          {user && (
            <Link to={`/profile/${user.username}`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                          transition-all duration-200 no-underline
                          ${location.pathname.startsWith('/profile')
                            ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              👤 Profile
            </Link>
          )}
          {/* Admin link — only visible to admins */}
          {!!user?.is_admin ? (
            <Link to="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                          transition-all duration-200 no-underline
                          ${isActive('/admin')
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              🛡️ Admin
            </Link>
          ) : null}
        </nav>

        {/* Theme toggle + user menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 🌙 / ☀️ Toggle */}
          <button
            onClick={toggleTheme}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base
                       bg-slate-100 dark:bg-slate-800
                       border border-slate-200 dark:border-slate-700
                       text-slate-600 dark:text-slate-300
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       transition-all duration-200 hover:scale-110 active:scale-95"
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl
                           hover:bg-slate-100 dark:hover:bg-slate-800
                           transition-all duration-200 group"
              >
                <Avatar user={user} size="sm" />
                <span className="hidden sm:block text-sm font-medium
                                 text-slate-700 dark:text-slate-300
                                 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                  {user.username}
                </span>
                <span className="text-slate-400 text-xs"
                      style={{ display: 'inline-block', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl overflow-hidden
                                shadow-lg animate-slide-up z-50">
                  <Link to={`/profile/${user.username}`} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm
                               text-slate-700 dark:text-slate-300
                               hover:bg-slate-100 dark:hover:bg-slate-700/60
                               hover:text-slate-900 dark:hover:text-slate-100
                               transition-colors no-underline">
                    👤 My Profile
                  </Link>
                  <Link to="/notifications" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm
                               text-slate-700 dark:text-slate-300
                               hover:bg-slate-100 dark:hover:bg-slate-700/60
                               hover:text-slate-900 dark:hover:text-slate-100
                               transition-colors no-underline">
                    🔔 Notifications
                    {notifCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {notifCount}
                      </span>
                    )}
                  </Link>
                  <div className="border-t border-slate-200 dark:border-slate-700/50 my-1" />
                  {!!user?.is_admin ? (
                    <Link to="/admin" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm
                                 text-amber-600 dark:text-amber-400
                                 hover:bg-amber-50 dark:hover:bg-amber-500/10
                                 transition-colors no-underline">
                      🛡️ Admin Panel
                    </Link>
                  ) : null}
                  <div className="border-t border-slate-200 dark:border-slate-700/50 my-1" />
                  <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="flex items-center gap-2 px-4 py-3 w-full text-sm text-red-500 dark:text-red-400
                               hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/" className="btn-brand text-sm px-4 py-2 no-underline">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
