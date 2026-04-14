import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { timeAgo, escapeHtml } from '../api/api';
import Avatar from './Avatar';
import CommentSection from './CommentSection';
import { backendUrl } from '../config';  // ← single config, no hardcoded URLs

export default function PostCard({ post: initialPost, onDelete }) {
  const { user }      = useAuth();
  const { showToast } = useToast();

  const [post,         setPost]         = useState(initialPost);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [liking,       setLiking]       = useState(false);

  const isOwner = post.user_id === user?.id;
  const liked   = post.liked_by_me > 0;

  async function toggleLike() {
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await api.post(`/likes/${post.id}`);
      setPost((p) => ({ ...p, liked_by_me: data.liked ? 1 : 0, like_count: data.like_count }));
    } catch { showToast('Could not like post.', 'error'); }
    finally { setLiking(false); }
  }

  async function deletePost() {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      showToast('Post deleted.', 'success');
      onDelete?.(post.id);
    } catch { showToast('Could not delete post.', 'error'); }
  }

  return (
    <div className="post-card animate-slide-up">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Link
          to={`/profile/${post.username}`}
          className="flex items-center gap-3 flex-1 min-w-0 no-underline group"
        >
          <Avatar user={post} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100
                            group-hover:text-blue-600 dark:group-hover:text-blue-400
                            transition-colors truncate flex items-center gap-1">
              {post.username}
              {!!post.is_verified
                ? <span title="Verified account" className="text-blue-500 text-xs">🔵</span>
                : null}
            </div>
            <div className="text-xs text-slate-500">⏱ {timeAgo(post.created_at)}</div>
          </div>
        </Link>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center
                         text-slate-400 dark:text-slate-500
                         hover:bg-slate-100 dark:hover:bg-slate-700/60
                         hover:text-slate-700 dark:hover:text-slate-300
                         transition-all duration-200"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 w-40 glass rounded-xl overflow-hidden
                              shadow-lg animate-slide-up z-20">
                <button
                  onClick={() => { setMenuOpen(false); deletePost(); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm
                             text-red-500 dark:text-red-400
                             hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  🗑 Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div
        className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200
                   leading-relaxed whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{ __html: escapeHtml(post.content) }}
      />

      {/* ── Image ── */}
      {post.image_url && (
        <div className="px-4 pb-3">
          <img
            src={backendUrl(post.image_url)}
            alt="Post"
            onError={(e) => { e.target.style.display = 'none'; }}
            className="w-full max-h-[480px] object-cover rounded-xl
                       border border-slate-200 dark:border-slate-700/50"
          />
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-1 px-2 py-1 border-t border-slate-200 dark:border-slate-700/50">
        <button
          onClick={toggleLike}
          disabled={liking}
          className={`action-btn transition-transform active:scale-90 ${liked ? 'liked' : ''}`}
        >
          <span className={`text-base transition-transform duration-200 ${liked ? 'scale-125' : ''}`}>
            {liked ? '❤️' : '🤍'}
          </span>
          <span className="text-xs">{post.like_count} Likes</span>
        </button>

        <button
          onClick={() => setCommentsOpen((v) => !v)}
          className={`action-btn ${commentsOpen
            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-700/40 hover:text-blue-600 dark:hover:text-blue-400'
            : ''}`}
        >
          <span className="text-base">💬</span>
          <span className="text-xs">{post.comment_count} Comments</span>
        </button>
      </div>

      {/* ── Comments ── */}
      <CommentSection postId={post.id} open={commentsOpen} />
    </div>
  );
}
