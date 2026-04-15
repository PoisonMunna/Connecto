import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { timeAgo, escapeHtml } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import Spinner from './Spinner';

export default function CommentSection({ postId, open }) {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);

  useEffect(() => {
    if (open) loadComments();
  }, [open]); // eslint-disable-line

  async function loadComments() {
    setLoading(true);
    try {
      const { data } = await api.get(`/comments/${postId}`);
      setComments(data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }

  async function submit() {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      await api.post(`/comments/${postId}`, { content });
      setText('');
      await loadComments();
    } catch { showToast('Could not post comment.', 'error'); }
    finally { setSending(false); }
  }

  async function removeComment(commentId) {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter(c => c.id !== commentId));
      showToast('Comment deleted.', 'success');
    } catch { showToast('Could not delete comment.', 'error'); }
  }

  if (!open) return null;

  return (
    <div className="border-t border-slate-200 dark:border-slate-700/50 px-4 py-3 animate-fade-in">
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <div className="space-y-3 mb-3">
          {comments.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">No comments yet. Be first!</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 animate-fade-in group">
              <Avatar user={c} size="sm" />
              <div className="flex-1 bg-slate-100 dark:bg-slate-800/60
                              border border-slate-200 dark:border-transparent
                              rounded-xl px-3 py-2 relative">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/profile/${c.username}`}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400
                               hover:text-blue-700 dark:hover:text-blue-300 no-underline"
                  >
                    {c.username}
                  </Link>
                  {(c.user_id === user?.id || user?.is_admin) && (
                    <button
                      onClick={() => removeComment(c.id)}
                      className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400
                                 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="Delete comment"
                    >
                      🗑
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5"
                   dangerouslySetInnerHTML={{ __html: escapeHtml(c.content) }} />
                <span className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 block">
                  {timeAgo(c.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 mt-2">
        <Avatar user={user} size="sm" />
        <div className="flex-1 flex items-center gap-2
                        bg-slate-100 dark:bg-slate-800/60
                        border border-slate-200 dark:border-slate-700/50
                        rounded-xl px-3 py-1.5
                        focus-within:border-blue-400 dark:focus-within:border-blue-500/60
                        focus-within:ring-2 focus-within:ring-blue-500/20
                        transition-all duration-200">
          <input
            className="flex-1 bg-transparent text-sm
                       text-slate-800 dark:text-slate-200
                       placeholder-slate-400 dark:placeholder-slate-500 outline-none"
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button
            onClick={submit}
            disabled={sending || !text.trim()}
            className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center
                       text-white text-xs transition-all duration-200
                       hover:shadow-glow disabled:opacity-40 active:scale-90"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
