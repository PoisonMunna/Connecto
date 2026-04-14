import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend,
         ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api, { timeAgo } from '../api/api';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import { useToast } from '../context/ToastContext';

const COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

// Blue tick image served by backend
const BLUETICK = 'http://localhost:5000/uploads/bluetick.png';

// ── Shared components ─────────────────────────────────────────

function StatBadge({ icon, value, label, color }) {
  return (
    <div className={`flex flex-col items-center p-3 rounded-xl border ${color}`}>
      <span className="text-xl mb-1">{icon}</span>
      <span className="text-lg font-black text-slate-800 dark:text-slate-100">{Number(value).toLocaleString()}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-wide text-center">{label}</span>
    </div>
  );
}

function ConfirmModal({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[200]
                    flex items-center justify-center p-4 animate-fade-in"
         onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="glass w-full max-w-sm p-6 animate-slide-up rounded-2xl">
        <div className="text-4xl text-center mb-3">{title.includes('Delete') ? '🗑️' : '✅'}</div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center mb-2">{title}</h3>
        <p className="text-sm text-slate-500 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></div>
      ))}
    </div>
  );
};

// ── User Dashboard Modal ──────────────────────────────────────
function UserDashboardModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/users/${userId}/dashboard`)
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-slate-900/70 dark:bg-slate-950/90 backdrop-blur-sm z-[150]
                    flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass w-full max-w-2xl rounded-2xl animate-slide-up my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            {data && <Avatar user={data.user} />}
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                {data?.user?.username || 'Loading…'}
                {!!data?.user?.is_verified ? <img src={BLUETICK} alt="verified" className="w-4 h-4" /> : null}
                {!!data?.user?.is_admin   ? <span className="text-amber-500 text-sm">👑</span> : null}
              </div>
              <div className="text-xs text-slate-400">{data?.user?.email}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? <Spinner /> : data && (
            <div className="space-y-5">

              {/* Stat grid */}
              <div className="grid grid-cols-4 gap-3">
                <StatBadge icon="📝" value={data.counts.total_posts}          label="Posts"         color="border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10" />
                <StatBadge icon="❤️" value={data.counts.total_likes_received}  label="Likes received" color="border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10" />
                <StatBadge icon="💬" value={data.counts.total_comments}        label="Comments"      color="border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10" />
                <StatBadge icon="👥" value={data.counts.followers}             label="Followers"     color="border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatBadge icon="➕" value={data.counts.following}             label="Following"     color="border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10" />
                <StatBadge icon="👍" value={data.counts.total_likes_given}     label="Likes given"   color="border-pink-200 dark:border-pink-500/30 bg-pink-50 dark:bg-pink-500/10" />
                <StatBadge icon="📨" value={data.counts.messages_sent}         label="Messages sent" color="border-cyan-200 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10" />
              </div>

              {/* Charts */}
              {data.postTrend.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">📈 Posts (last 30 days)</h4>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={data.postTrend}>
                      <defs>
                        <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2}/>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false}/>
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false}/>
                      <Tooltip content={<CustomTooltip />}/>
                      <Area type="monotone" dataKey="count" name="Posts" stroke="#6366f1" fill="url(#gP)" strokeWidth={2}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {data.likeTrend.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">❤️ Likes received (last 30 days)</h4>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={data.likeTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2}/>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false}/>
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false}/>
                      <Tooltip content={<CustomTooltip />}/>
                      <Bar dataKey="count" name="Likes" fill="#ef4444" radius={[4,4,0,0]} opacity={0.8}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent posts */}
              {data.recentPosts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">📋 Recent Posts</h4>
                  <div className="space-y-2">
                    {data.recentPosts.map((p) => (
                      <div key={p.id}
                           className="flex gap-3 p-3 rounded-xl
                                      bg-slate-50 dark:bg-slate-800/50
                                      border border-slate-200 dark:border-slate-700/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{p.content}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-slate-400">{timeAgo(p.created_at)}</span>
                            <span className="text-[10px] text-red-400">❤️ {p.like_count}</span>
                            <span className="text-[10px] text-blue-400">💬 {p.comment_count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.postTrend.length === 0 && data.recentPosts.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  📭 This user hasn't posted anything yet.
                </div>
              )}

              <p className="text-xs text-slate-400 text-center">
                Member since {new Date(data.user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── User Card ─────────────────────────────────────────────────
function UserCard({ u, onDashboard, onPromote, onDelete }) {
  return (
    <div className="glass p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4
                    hover:border-slate-300 dark:hover:border-slate-600/70
                    transition-all duration-200 animate-slide-up">

      {/* Avatar + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar user={u} />
        <div className="min-w-0">
          <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
            <span className="truncate">{u.username}</span>
            {!!u.is_verified ? <img src={BLUETICK} alt="verified" title="Verified" className="w-4 h-4 flex-shrink-0" /> : null}
            {!!u.is_admin    ? <span title="Admin" className="text-amber-500 text-sm flex-shrink-0">👑</span> : null}
          </div>
          <div className="text-xs text-slate-400 truncate">{u.email}</div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-violet-600 dark:text-violet-400">📝 {u.post_count} posts</span>
            <span className="text-xs text-red-500">❤️ {u.like_count} likes</span>
            <span className="text-xs text-blue-500">👥 {u.followers_count} followers</span>
            <span className="text-xs text-slate-400">Joined {new Date(u.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* 3 Action buttons */}
      <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
        <button
          onClick={() => onDashboard(u)}
          className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold
                     bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300
                     hover:bg-blue-200 dark:hover:bg-blue-500/30
                     border border-blue-200 dark:border-blue-500/40
                     transition-all duration-200 hover:scale-105 active:scale-95">
          📊 Dashboard
        </button>
        <button
          onClick={() => onPromote(u)}
          disabled={u.is_admin}
          title={u.is_admin ? 'Admins cannot be toggled' : u.is_verified ? 'Remove blue tick' : 'Grant blue tick'}
          className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold
                      border transition-all duration-200 hover:scale-105 active:scale-95
                      ${u.is_admin
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-700 text-slate-500 border-slate-200 dark:border-slate-600'
                        : u.is_verified
                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/40 hover:bg-blue-200 dark:hover:bg-blue-500/30'
                          : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'}`}
        >
          {!!u.is_verified
            ? <span className="flex items-center gap-1">
                <img src={BLUETICK} alt="verified" className="w-3.5 h-3.5" /> Revoke
              </span>
            : '✅ Promote'}
        </button>
        <button
          onClick={() => onDelete(u)}
          disabled={u.is_admin}
          title={u.is_admin ? 'Cannot delete admin' : 'Delete permanently'}
          className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold
                      border transition-all duration-200 hover:scale-105 active:scale-95
                      ${u.is_admin
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-700 text-slate-500 border-slate-200 dark:border-slate-600'
                        : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/40 hover:bg-red-200 dark:hover:bg-red-500/30'}`}
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

// ── App-wide analytics ─────────────────────────────────────────
function AnalyticsDashboard() {
  const { showToast } = useToast();
  const [period,    setPeriod]    = useState('week');
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/analytics?period=${period}`)
      .then(({ data }) => setAnalytics(data))
      .catch(() => showToast('Could not load analytics.', 'error'))
      .finally(() => setLoading(false));
  }, [period]); // eslint-disable-line

  const pieData = analytics ? [
    { name: 'Posts',    value: Number(analytics.summary.total_posts) },
    { name: 'Likes',    value: Number(analytics.summary.total_likes) },
    { name: 'Comments', value: Number(analytics.summary.total_comments) },
    { name: 'Follows',  value: Number(analytics.summary.total_follows) },
  ] : [];

  const mergedTrend = (() => {
    if (!analytics) return [];
    const map = {};
    analytics.postTrend.forEach((r)    => { map[r.date] = { date: r.date, Posts: r.count }; });
    analytics.likeTrend.forEach((r)    => { map[r.date] = { ...(map[r.date] || { date: r.date }), Likes: r.count }; });
    analytics.commentTrend.forEach((r) => { map[r.date] = { ...(map[r.date] || { date: r.date }), Comments: r.count }; });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  })();

  return (
    <div className="space-y-5">
      {/* Period */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Period:</span>
        <div className="flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 gap-1">
          {['day','week','month','year'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 capitalize
                          ${period === p ? 'bg-gradient-brand text-white shadow-glow' : 'text-slate-500 dark:text-slate-400'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : analytics && (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { icon:'👥', label:'Users',    value: analytics.summary.total_users,    c:'border-l-blue-500' },
              { icon:'📝', label:'Posts',    value: analytics.summary.total_posts,    c:'border-l-violet-500' },
              { icon:'❤️', label:'Likes',    value: analytics.summary.total_likes,    c:'border-l-red-500' },
              { icon:'💬', label:'Comments', value: analytics.summary.total_comments, c:'border-l-emerald-500' },
              { icon:'➕', label:'Follows',  value: analytics.summary.total_follows,  c:'border-l-amber-500' },
            ].map((s) => (
              <div key={s.label} className={`glass p-4 flex items-center gap-3 border-l-4 ${s.c}`}>
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <div className="text-xl font-black text-slate-800 dark:text-slate-100">{Number(s.value).toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* User growth */}
          <div className="glass p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">📈 User Growth</h3>
            {analytics.userGrowth.length === 0
              ? <p className="text-center text-slate-400 text-sm py-6">No data in this period</p>
              : <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analytics.userGrowth}>
                    <defs>
                      <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2}/>
                    <XAxis dataKey="date" tick={{ fontSize:10, fill:'#94a3b8' }} tickLine={false}/>
                    <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} tickLine={false} axisLine={false}/>
                    <Tooltip content={<CustomTooltip />}/>
                    <Area type="monotone" dataKey="count" name="New Users" stroke="#6366f1" fill="url(#gU)" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>}
          </div>

          {/* Activity */}
          <div className="glass p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">🔥 Activity Trends</h3>
            {mergedTrend.length === 0
              ? <p className="text-center text-slate-400 text-sm py-6">No data in this period</p>
              : <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={mergedTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2}/>
                    <XAxis dataKey="date" tick={{ fontSize:10, fill:'#94a3b8' }} tickLine={false}/>
                    <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} tickLine={false} axisLine={false}/>
                    <Tooltip content={<CustomTooltip />}/>
                    <Legend wrapperStyle={{ fontSize:11 }}/>
                    <Line type="monotone" dataKey="Posts"    stroke="#6366f1" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="Likes"    stroke="#ef4444" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="Comments" stroke="#10b981" strokeWidth={2} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>}
          </div>

          {/* Pie */}
          <div className="glass p-5 grid md:grid-cols-2 gap-5 items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">🥧 Content Mix</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]}/>)}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString()}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }}/>
                  <span className="text-sm text-slate-500">{d.name}</span>
                  <span className="ml-auto font-bold text-slate-700 dark:text-slate-200">{d.value?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main AdminPage ────────────────────────────────────────────
export default function AdminPage() {
  const { showToast } = useToast();

  const [tab,        setTab]       = useState('users');
  const [users,      setUsers]     = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [search,     setSearch]    = useState('');
  const [dashUserId, setDashUserId] = useState(null);   // user whose dashboard is open
  const [modal,      setModal]     = useState({ open: false, type: null, user: null });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/admin/users'); setUsers(data); }
    catch { showToast('Could not load users.', 'error'); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function promote(u) {
    try {
      const { data } = await api.post(`/admin/users/${u.id}/promote`);
      showToast(data.message, 'success');
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_verified: !x.is_verified } : x));
    } catch (err) { showToast(err.response?.data?.error || 'Failed.', 'error'); }
    setModal({ open: false });
  }

  async function deleteUser(u) {
    try {
      await api.delete(`/admin/users/${u.id}`);
      showToast(`${u.username} deleted.`, 'success');
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) { showToast(err.response?.data?.error || 'Failed.', 'error'); }
    setModal({ open: false });
  }

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-slide-up">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            🛡️ Admin Panel
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} total users • Full control centre</p>
        </div>
        <div className="flex gap-2">
          {[{ key:'users', label:'👥 Users' }, { key:'analytics', label:'📊 Analytics' }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                          ${tab === t.key ? 'bg-gradient-brand text-white shadow-glow' : 'btn-ghost'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div className="space-y-3">
          <input className="input max-w-sm" placeholder="🔍  Search by username or email…"
            value={search} onChange={(e) => setSearch(e.target.value)} />

          {loading ? <Spinner /> : filtered.length === 0
            ? <div className="glass py-16 text-center text-slate-400">No users found.</div>
            : filtered.map((u) => (
                <UserCard key={u.id} u={u}
                  onDashboard={(u) => setDashUserId(u.id)}
                  onPromote={(u)   => setModal({ open: true, type: 'promote', user: u })}
                  onDelete={(u)    => setModal({ open: true, type: 'delete',  user: u })}
                />
              ))
          }
          <p className="text-xs text-slate-400 text-center pt-2">
            Showing {filtered.length} of {users.length} users
          </p>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === 'analytics' && <AnalyticsDashboard />}

      {/* ── User Dashboard Modal ── */}
      {dashUserId && (
        <UserDashboardModal userId={dashUserId} onClose={() => setDashUserId(null)} />
      )}

      {/* ── Confirm: Promote ── */}
      <ConfirmModal
        open={modal.open && modal.type === 'promote'}
        title={modal.user?.is_verified ? 'Remove Verification' : 'Grant Blue Tick'}
        message={modal.user?.is_verified
          ? `Remove the verified badge from @${modal.user?.username}?`
          : `Grant the 🔵 verified blue tick to @${modal.user?.username}? They will appear as verified across the app.`}
        confirmLabel={modal.user?.is_verified ? '🔵 Revoke' : '✅ Confirm Promote'}
        confirmClass="bg-emerald-500 hover:bg-emerald-600"
        onConfirm={() => promote(modal.user)}
        onCancel={() => setModal({ open: false })}
      />

      {/* ── Confirm: Delete ── */}
      <ConfirmModal
        open={modal.open && modal.type === 'delete'}
        title="Delete User"
        message={`Permanently delete @${modal.user?.username}? All their posts, likes, and comments will also be deleted. This cannot be undone.`}
        confirmLabel="🗑 Delete Permanently"
        confirmClass="bg-red-500 hover:bg-red-600"
        onConfirm={() => deleteUser(modal.user)}
        onCancel={() => setModal({ open: false })}
      />
    </div>
  );
}
