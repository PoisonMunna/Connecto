import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { escapeHtml } from '../api/api';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import Spinner from '../components/Spinner';

const BACKEND = 'http://localhost:5000';

function imgSrc(path) {
  if (!path || path === 'default.png') return null;
  if (path.startsWith('http')) return path;
  return `${BACKEND}${path}`;
}

export default function ProfilePage() {
  const { username }  = useParams();
  const { user: me, login, token } = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('posts');
  const [followers,  setFollowers]  = useState([]);
  const [following,  setFollowing]  = useState([]);
  const [listLoad,   setListLoad]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editBio,    setEditBio]    = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [picFile,    setPicFile]    = useState(null);
  const [coverFile,  setCoverFile]  = useState(null);
  const [picPreview, setPicPreview] = useState(null);
  const [covPreview, setCovPreview] = useState(null);

  const picRef  = useRef(null);
  const covRef  = useRef(null);

  useEffect(() => { loadProfile(); setActiveTab('posts'); }, [username]); // eslint-disable-line

  async function loadProfile() {
    setLoading(true);
    try { const { data } = await api.get(`/users/${username}`); setProfile(data); }
    catch { setProfile(null); }
    finally { setLoading(false); }
  }

  async function toggleFollow() {
    if (!profile) return;
    try {
      const { data } = await api.post(`/follow/${profile.id}`);
      setProfile((p) => ({ ...p, is_following: data.following, followers_count: p.followers_count + (data.following ? 1 : -1) }));
      showToast(data.message, 'success');
    } catch { showToast('Could not update follow.', 'error'); }
  }

  async function switchTab(tab) {
    setActiveTab(tab);
    if (tab === 'followers' && followers.length === 0) {
      setListLoad(true);
      try { const { data } = await api.get(`/follow/${profile.id}/followers`); setFollowers(data); }
      finally { setListLoad(false); }
    }
    if (tab === 'following' && following.length === 0) {
      setListLoad(true);
      try { const { data } = await api.get(`/follow/${profile.id}/following`); setFollowing(data); }
      finally { setListLoad(false); }
    }
  }

  function onPickPic(e) {
    const f = e.target.files[0]; if (!f) return;
    setPicFile(f);
    setPicPreview(URL.createObjectURL(f));
  }

  function onPickCover(e) {
    const f = e.target.files[0]; if (!f) return;
    setCoverFile(f);
    setCovPreview(URL.createObjectURL(f));
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData();
    form.append('bio',      editBio);
    form.append('username', editUsername.trim());
    if (picFile)   form.append('profile_pic', picFile);
    if (coverFile) form.append('cover_pic',   coverFile);
    try {
      const { data } = await api.put('/users/update', form);
      showToast('Profile updated! ✅', 'success');
      setModalOpen(false);
      setPicFile(null); setCoverFile(null);
      setPicPreview(null); setCovPreview(null);
      // If username changed, navigate to new URL
      if (data.user?.username && data.user.username !== username) {
        navigate(`/profile/${data.user.username}`, { replace: true });
      } else {
        loadProfile();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Update failed.', 'error');
    } finally { setSaving(false); }
  }

  async function removeProfilePic() {
    try {
      await api.delete('/users/remove-profile-pic');
      showToast('Profile picture removed.', 'success');
      loadProfile();
    } catch { showToast('Could not remove.', 'error'); }
  }

  async function removeCoverPic() {
    try {
      await api.delete('/users/remove-cover-pic');
      showToast('Cover photo removed.', 'success');
      loadProfile();
    } catch { showToast('Could not remove.', 'error'); }
  }

  function UserList({ users }) {
    if (listLoad) return <Spinner />;
    if (!users.length) return (
      <div className="glass py-16 text-center animate-fade-in">
        <div className="text-4xl mb-3">👤</div>
        <p className="text-slate-500 text-sm">Nobody here yet.</p>
      </div>
    );
    return (
      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="glass p-4 flex items-center gap-4 animate-slide-up
                                     hover:border-slate-300 dark:hover:border-slate-600/70 transition-all">
            <Avatar user={u} />
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${u.username}`}
                className="font-semibold text-slate-800 dark:text-slate-100
                           hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline block truncate">
                {escapeHtml(u.username)}
              </Link>
              <div className="text-xs text-slate-500 truncate">{escapeHtml(u.bio || 'No bio yet')}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><Spinner size="lg" /></div>;
  if (!profile) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">👤</div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">User not found</h2>
      <p className="text-slate-500">The profile you're looking for doesn't exist.</p>
    </div>
  );

  const isOwn       = profile.id === me?.id;
  const isFollowing = profile.is_following;
  const coverSrc    = imgSrc(profile.cover_pic);
  const avatarSrc   = imgSrc(profile.profile_pic);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

      {/* ── Profile Card ── */}
      <div className="glass overflow-hidden animate-slide-up">

        {/* ── Cover Photo area ── */}
        <div className="relative h-44 sm:h-52 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 overflow-hidden group">

          {/* Cover image */}
          {coverSrc
            ? <img src={coverSrc} alt="Cover" className="w-full h-full object-cover" />
            : <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700" />
          }
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />

          {/* Cover edit controls (owner only) */}
          {isOwn && (
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => covRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                           bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
                           text-slate-700 dark:text-slate-200 shadow-md
                           hover:bg-white dark:hover:bg-slate-700 transition-colors">
                📷 {coverSrc ? 'Change Cover' : 'Add Cover'}
              </button>
              {coverSrc && (
                <button onClick={removeCoverPic}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold
                             bg-red-500/80 backdrop-blur-sm text-white shadow-md
                             hover:bg-red-500 transition-colors">
                  🗑 Remove
                </button>
              )}
              <input ref={covRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files[0]; if (!f) return;
                // Immediately upload cover on selection
                const form = new FormData();
                form.append('bio', profile.bio || '');
                form.append('cover_pic', f);
                api.put('/users/update', form)
                  .then(() => { showToast('Cover photo updated!', 'success'); loadProfile(); })
                  .catch(() => showToast('Upload failed.', 'error'));
              }} />
            </div>
          )}
        </div>

        {/* ── Below cover: avatar overlaps ── */}
        <div className="px-5 pb-6">
          {/* Avatar row — sits AT the top of this div, overlapping the cover */}
          <div className="flex items-end justify-between flex-wrap gap-3 -mt-14 mb-4">

            {/* Avatar with camera overlay */}
            <div className="relative flex-shrink-0 group/avatar">
              <div className="ring-4 ring-white dark:ring-slate-900 rounded-full overflow-hidden
                              w-24 h-24 sm:w-28 sm:h-28">
                {avatarSrc
                  ? <img src={avatarSrc} alt={profile.username} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-brand flex items-center justify-center">
                      <span className="text-white text-4xl font-black select-none">
                        {profile.username[0].toUpperCase()}
                      </span>
                    </div>
                }
              </div>

              {/* Camera overlay — owner only */}
              {isOwn && (
                <div className="absolute inset-0 rounded-full bg-slate-900/50 flex flex-col items-center justify-center
                                opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 cursor-pointer"
                     onClick={() => picRef.current?.click()}>
                  <span className="text-white text-lg">📷</span>
                  <span className="text-white text-[9px] font-semibold">Change</span>
                </div>
              )}

              {/* Remove profile pic button */}
              {isOwn && avatarSrc && (
                <button onClick={removeProfilePic}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full
                             bg-red-500 text-white flex items-center justify-center text-[10px]
                             shadow-md opacity-0 group-hover/avatar:opacity-100
                             transition-opacity duration-200 hover:bg-red-600"
                  title="Remove profile picture">
                  ✕
                </button>
              )}

              <input ref={picRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files[0]; if (!f) return;
                const form = new FormData();
                form.append('bio', profile.bio || '');
                form.append('profile_pic', f);
                api.put('/users/update', form)
                  .then(() => { showToast('Profile picture updated!', 'success'); loadProfile(); })
                  .catch(() => showToast('Upload failed.', 'error'));
              }} />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {isOwn ? (
                <button onClick={() => { setEditBio(profile.bio || ''); setEditUsername(profile.username || ''); setModalOpen(true); }}
                  className="btn-ghost text-sm px-4 py-2">✏️ Edit Bio</button>
              ) : (
                <>
                  {isFollowing && profile.follows_me && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold
                                    bg-emerald-50 dark:bg-emerald-500/10
                                    border border-emerald-200 dark:border-emerald-500/30
                                    text-emerald-700 dark:text-emerald-400">
                      🤝 Mutual
                    </span>
                  )}
                  <button onClick={toggleFollow}
                    className={isFollowing ? 'btn-ghost text-sm px-4 py-2' : 'btn-brand text-sm px-4 py-2'}>
                    {isFollowing ? '✓ Following' : '+ Follow'}
                  </button>
                  {(isFollowing || profile.follows_me) && (
                    <button onClick={() => navigate(`/messages/${profile.username}`)}
                      className="btn-ghost text-sm px-4 py-2">💬 Message</button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Username + bio */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {escapeHtml(profile.username)}
            {!!profile.is_verified ? <span title="Verified" className="text-blue-500 text-xl">🔵</span> : null}
          </h1>
          <p className="text-sm text-slate-500 mt-1 mb-4">{escapeHtml(profile.bio || 'No bio yet.')}</p>

          {/* Stats */}
          <div className="flex gap-6">
            {[
              { label: 'Posts',     value: profile.posts.length,    tab: 'posts' },
              { label: 'Followers', value: profile.followers_count, tab: 'followers' },
              { label: 'Following', value: profile.following_count, tab: 'following' },
            ].map(({ label, value, tab }) => (
              <button key={label} onClick={() => switchTab(tab)}
                className="text-center hover:opacity-80 transition-opacity group">
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100
                                group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {value}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="glass-sm flex gap-1 p-1">
        {[
          { key: 'posts',     label: '📝 Posts' },
          { key: 'followers', label: '👥 Followers' },
          { key: 'following', label: '➕ Following' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => switchTab(key)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                        ${activeTab === key
                          ? 'bg-gradient-brand text-white shadow-glow'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'posts' && (
        profile.posts.length === 0
          ? <div className="glass py-16 text-center animate-fade-in">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-slate-500 text-sm">No posts yet.</p>
            </div>
          : profile.posts.map((p) => (
              <PostCard key={p.id}
                post={{ ...p, username: profile.username, profile_pic: profile.profile_pic, is_verified: profile.is_verified }}
                onDelete={(id) => setProfile((prev) => ({ ...prev, posts: prev.posts.filter((x) => x.id !== id) }))}
              />
            ))
      )}
      {activeTab === 'followers' && <UserList users={followers} />}
      {activeTab === 'following' && <UserList users={following} />}

      {/* ── Edit Bio Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50
                        flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="glass w-full max-w-md p-6 rounded-2xl animate-slide-up">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-5">Edit Profile</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                  <input className="input pl-7" type="text" placeholder="your_username"
                    minLength={3} maxLength={50} required
                    pattern="[a-zA-Z0-9_]+"
                    title="Only letters, numbers, and underscores allowed"
                    value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Letters, numbers, underscores only. Changing this updates your profile URL.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Bio</label>
                <textarea className="input resize-none" rows={4}
                  placeholder="Tell the world about yourself…"
                  value={editBio} onChange={(e) => setEditBio(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-brand flex-1 disabled:opacity-60">
                  {saving
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving…
                      </span>
                    : '✅ Save Changes'}
                </button>
                <button type="button" className="btn-ghost flex-1" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
