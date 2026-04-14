import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api, { timeAgo } from '../api/api';
import Spinner from '../components/Spinner';

const ICONS = { like: '❤️', comment: '💬', follow: '👤' };
const typeBg = {
  like:    'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30',
  comment: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30',
  follow:  'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30',
};
const MSG = {
  like:    (u) => <><span className="font-semibold text-slate-800 dark:text-slate-100">{u}</span>{' '}<span className="text-slate-500">liked your post</span></>,
  comment: (u) => <><span className="font-semibold text-slate-800 dark:text-slate-100">{u}</span>{' '}<span className="text-slate-500">commented on your post</span></>,
  follow:  (u) => <><span className="font-semibold text-slate-800 dark:text-slate-100">{u}</span>{' '}<span className="text-slate-500">started following you</span></>,
};

export default function NotificationsPage() {
  const { showToast } = useToast();
  const navigate      = useNavigate();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []); // eslint-disable-line

  async function loadNotifications() {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data);
      await api.put('/notifications/read');
    } catch { showToast('Could not load notifications.', 'error'); }
    finally { setLoading(false); }
  }

  async function markAllRead() {
    try {
      await api.put('/notifications/read');
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      showToast('All notifications marked as read.', 'success');
    } catch { showToast('Failed.', 'error'); }
  }

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-slide-up">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-gradient-brand text-white text-xs font-bold
                             px-2.5 py-0.5 rounded-full shadow-glow animate-pulse-slow">
              {unreadCount} new
            </span>
          )}
        </div>
        <button onClick={markAllRead} className="btn-ghost text-xs px-3 py-1.5">
          ✓ Mark all read
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : notifs.length === 0 ? (
        <div className="glass py-20 text-center animate-fade-in">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">All caught up!</h3>
          <p className="text-sm text-slate-500">No new notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n, i) => (
            <div key={n.id}
              onClick={() => n.post_id ? navigate('/feed') : navigate(`/profile/${n.from_username}`)}
              className={`
                glass p-4 flex items-center gap-4 cursor-pointer animate-slide-up
                transition-all duration-200
                hover:border-slate-300 dark:hover:border-slate-600/70
                ${!n.is_read
                  ? 'border-blue-300 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5'
                  : ''}
              `}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Icon badge */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                              border ${typeBg[n.type]}`}>
                <span className="text-lg">{ICONS[n.type]}</span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">{MSG[n.type]?.(n.from_username)}</p>
                <span className="text-xs text-slate-400 mt-0.5 block">{timeAgo(n.created_at)}</span>
              </div>

              {/* Unread dot */}
              {!n.is_read && (
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 animate-pulse-slow" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
