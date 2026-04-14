import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import Spinner from '../components/Spinner';

export default function FeedPage() {
  const { user }      = useAuth();
  const { showToast } = useToast();

  const [tab,       setTab]       = useState('all');
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [suggested, setSuggested] = useState([]);
  const [content,   setContent]   = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [posting,   setPosting]   = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadPosts(); }, [tab]); // eslint-disable-line
  useEffect(() => { loadSuggested(); }, []); // eslint-disable-line

  async function loadPosts() {
    setLoading(true);
    try {
      const { data } = await api.get(tab === 'my' ? '/posts/myfeed' : '/posts/feed');
      setPosts(data);
    } catch { showToast('Failed to load posts.', 'error'); }
    finally { setLoading(false); }
  }

  async function loadSuggested() {
    try {
      const { data } = await api.get('/users/search?q=');
      setSuggested(data.filter((u) => u.id !== user?.id).slice(0, 6));
    } catch { /* silently fail */ }
  }

  function handleImageChange(e) {
    const file = e.target.files[0]; if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null); setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function createPost() {
    if (!content.trim()) { showToast('Please write something first!', 'error'); return; }
    setPosting(true);
    try {
      const form = new FormData();
      form.append('content', content);
      if (imageFile) form.append('image', imageFile);
      const res = await api.post('/posts', form)
        .catch((err) => ({ data: err.response?.data, status: err.response?.status }));
      if (res.status !== 201) { showToast(res.data?.error || 'Failed to post', 'error'); return; }
      setContent(''); removeImage();
      showToast('Post shared! 🎉', 'success');
      loadPosts();
    } catch { showToast('Network error.', 'error'); }
    finally { setPosting(false); }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* ── Left: Feed ── */}
        <div className="min-w-0">

          {/* Composer */}
          <div className="glass mb-5 p-4 animate-slide-up">
            <div className="flex gap-3">
              <Avatar user={user} />
              <div className="flex-1">
                <textarea
                  className="w-full bg-slate-100 dark:bg-slate-800/60
                             border border-slate-200 dark:border-slate-700/50
                             rounded-xl px-3 py-2.5 text-sm
                             text-slate-800 dark:text-slate-200
                             placeholder-slate-400 dark:placeholder-slate-500
                             outline-none resize-none
                             focus:border-blue-400 dark:focus:border-blue-500/60
                             focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder={`What's on your mind, ${user?.username}?`}
                  rows={3} maxLength={1000}
                  value={content} onChange={(e) => setContent(e.target.value)}
                />

                {preview && (
                  <div className="relative mt-2 inline-block">
                    <img src={preview} alt="Preview"
                      className="max-h-32 rounded-xl border border-slate-200 dark:border-slate-700/50 object-cover" />
                    <button onClick={removeImage}
                      className="absolute top-1.5 right-1.5 w-6 h-6
                                 bg-slate-900/80 dark:bg-slate-900/80
                                 rounded-full flex items-center justify-center
                                 text-xs text-white hover:bg-red-600 transition-colors">✕</button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                                    text-slate-500 dark:text-slate-400
                                    hover:bg-slate-100 dark:hover:bg-slate-700/60
                                    hover:text-slate-700 dark:hover:text-slate-200
                                    cursor-pointer transition-all duration-200">
                    📷 <span>Photo</span>
                    <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={handleImageChange} />
                  </label>
                  <button onClick={createPost} disabled={posting || !content.trim()}
                    className="btn-brand text-sm px-5 py-2 disabled:opacity-50">
                    {posting
                      ? <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Posting…
                        </span>
                      : '✦ Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="glass-sm flex gap-1 p-1 mb-5">
            {[{ key: 'all', label: '🌐 All Posts' }, { key: 'my', label: '👥 Following' }].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                            ${tab === key
                              ? 'bg-gradient-brand text-white shadow-glow'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Posts */}
          {loading ? (
            <Spinner />
          ) : posts.length === 0 ? (
            <div className="glass py-16 text-center animate-fade-in">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-slate-500 text-sm">
                {tab === 'my' ? 'No posts from people you follow yet.' : 'No posts yet. Be the first to post!'}
              </p>
            </div>
          ) : (
            posts.map((p) => (
              <PostCard key={p.id} post={p}
                onDelete={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />
            ))
          )}
        </div>

        {/* ── Right: Sidebar ── */}
        <aside className="hidden lg:block space-y-4">

          {/* Profile card */}
          {user && (
            <div className="glass p-4 animate-slide-right">
              <div className="flex items-center gap-3 mb-3">
                <Avatar user={user} />
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user.username}</div>
                  <Link to={`/profile/${user.username}`}
                    className="text-xs text-blue-600 dark:text-blue-400
                               hover:text-blue-700 dark:hover:text-blue-300 no-underline transition-colors">
                    View profile →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Suggested users */}
          <div className="glass p-4 animate-slide-right" style={{ animationDelay: '.1s' }}>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Suggested Users
            </h3>
            {suggested.length === 0
              ? <p className="text-xs text-slate-400">No suggestions right now.</p>
              : (
                <div className="space-y-3">
                  {suggested.map((u) => (
                    <Link key={u.id} to={`/profile/${u.username}`}
                      className="flex items-center gap-3 group no-underline">
                      <Avatar user={u} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold
                                        text-slate-700 dark:text-slate-200
                                        group-hover:text-blue-600 dark:group-hover:text-blue-400
                                        transition-colors truncate">
                          {u.username}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{u.bio || 'No bio yet'}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            }
          </div>

          {/* Trending */}
          <div className="glass p-4 animate-slide-right" style={{ animationDelay: '.2s' }}>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Trending</h3>
            {['#React', '#TailwindCSS', '#WebDev', '#OpenSource', '#Design'].map((tag, i) => (
              <div key={tag} className="flex items-center justify-between py-1.5 group cursor-pointer">
                <span className="text-sm font-medium
                                 text-blue-600 dark:text-blue-400
                                 group-hover:text-blue-700 dark:group-hover:text-blue-300
                                 transition-colors">{tag}</span>
                <span className="text-xs text-slate-400">
                  {[345, 892, 1243, 567, 2100][i]} posts
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
