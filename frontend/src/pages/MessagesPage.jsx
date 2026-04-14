import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { timeAgo } from '../api/api';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';

// ── Helpers ──────────────────────────────────────────────────
function MessageBubble({ msg, isMe, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`flex items-end gap-2 mb-3 group/msg ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Delete button — own messages only, appears on hover */}
      {isMe && (
        <button
          onClick={() => onDelete(msg.id)}
          title="Delete message"
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                      bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400
                      hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400
                      transition-all duration-150 text-xs
                      ${hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
        >
          🗑
        </button>
      )}

      <div className={`
        max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
        ${isMe
          ? 'bg-gradient-brand text-white rounded-br-sm'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-slate-600'}
      `}>
        {msg.content}
        <div className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
          {timeAgo(msg.created_at)}
          {isMe && (
            <span className="ml-1">{msg.is_read ? ' ✓✓' : ' ✓'}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Conversation list item ────────────────────────────────────
function ConvItem({ conv, active, onClick }) {
  const isActive = active?.id === conv.id;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left
                  transition-all duration-200 rounded-xl mb-1
                  ${isActive
                    ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar user={conv} size="sm" />
        {conv.unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white
                           text-[9px] font-bold rounded-full flex items-center justify-center">
            {conv.unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm font-semibold truncate
                           ${isActive
                             ? 'text-blue-600 dark:text-blue-400'
                             : 'text-slate-800 dark:text-slate-100'}`}>
            {conv.username}
          </span>
          <span className="text-[10px] text-slate-400 flex-shrink-0">
            {timeAgo(conv.last_at)}
          </span>
        </div>
        <p className={`text-xs truncate mt-0.5
                      ${conv.unread > 0
                        ? 'text-slate-700 dark:text-slate-300 font-medium'
                        : 'text-slate-400'}`}>
          {conv.last_sender_id === conv.id ? '' : 'You: '}
          {conv.last_message}
        </p>
      </div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function MessagesPage() {
  const { user: me }  = useAuth();
  const { showToast } = useToast();
  const { userId }    = useParams();          // optional: open chat directly
  const navigate      = useNavigate();

  const [convs,       setConvs]       = useState([]);
  const [activeUser,  setActiveUser]  = useState(null);  // { id, username, profile_pic }
  const [thread,      setThread]      = useState([]);
  const [text,        setText]        = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg,  setLoadingMsg]  = useState(false);
  const [sending,     setSending]     = useState(false);
  const [newChatUser, setNewChatUser] = useState(null);  // searched user to start chat
  const [searchQ,     setSearchQ]     = useState('');
  const [searchRes,   setSearchRes]   = useState([]);
  const [showSearch,  setShowSearch]  = useState(false);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const pollRef    = useRef(null);

  // ── Load conversations ────────────────────────────────────
  const loadConvs = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConvs(data);
    } catch { /* silently fail */ }
    finally { setLoadingConv(false); }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  // If URL has :userId → auto-open that conversation
  useEffect(() => {
    if (userId) {
      api.get(`/users/${userId}`).then(({ data }) => {
        if (data) openChat(data);
      }).catch(() => {});
    }
  }, [userId]); // eslint-disable-line

  // ── Open chat with user ───────────────────────────────────
  async function openChat(u) {
    setActiveUser(u);
    setThread([]);
    setLoadingMsg(true);
    clearInterval(pollRef.current);
    try {
      const { data } = await api.get(`/messages/${u.id}`);
      setThread(data);
      await api.put(`/messages/${u.id}/read`);
      // Update unread badge in conv list
      setConvs((prev) => prev.map((c) => c.id === u.id ? { ...c, unread: 0 } : c));
    } catch { showToast('Could not load messages.', 'error'); }
    finally { setLoadingMsg(false); }

    // Poll for new messages every 3s
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/messages/${u.id}`);
        setThread(data);
        await api.put(`/messages/${u.id}/read`);
      } catch { /* silently fail */ }
    }, 3000);
  }

  useEffect(() => () => clearInterval(pollRef.current), []);

  // ── Auto-scroll ───────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  // ── Send message ──────────────────────────────────────────
  async function send() {
    const content = text.trim();
    if (!content || !activeUser) return;
    setSending(true);
    setText('');
    try {
      const { data: msg } = await api.post(`/messages/${activeUser.id}`, { content });
      setThread((prev) => [...prev, msg]);
      // Refresh conv list
      loadConvs();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Could not send.';
      showToast(errMsg, 'error');
      setText(content); // restore
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  // ── Delete message ───────────────────────────────────────
  async function deleteMsg(msgId) {
    try {
      await api.delete(`/messages/msg/${msgId}`);
      setThread((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not delete.', 'error');
    }
  }

  // ── User search (new conversation) ───────────────────────
  useEffect(() => {
    if (!searchQ.trim()) { setSearchRes([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(searchQ)}`);
        setSearchRes(data.filter((u) => u.id !== me?.id));
      } catch { /* silently fail */ }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ, me]);

  const isMobileChat = window.innerWidth < 768;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-130px)]">
      <div className="glass h-full flex overflow-hidden rounded-2xl">

        {/* ── LEFT: Conversations Panel ── */}
        <div className={`
          flex flex-col border-r border-slate-200 dark:border-slate-700/50
          ${activeUser && isMobileChat ? 'hidden' : 'flex'}
          w-full md:w-80 flex-shrink-0
        `}>
          {/* Header */}
          <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Messages</h2>
            <button
              onClick={() => setShowSearch((v) => !v)}
              className="w-8 h-8 rounded-xl flex items-center justify-center
                         bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300
                         hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400
                         transition-all duration-200"
              title="New conversation"
            >
              ✏️
            </button>
          </div>

          {/* New chat search */}
          {showSearch && (
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/50 relative">
              <input
                className="input text-sm py-2"
                placeholder="Search users to message…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                autoFocus
              />
              {searchRes.length > 0 && (
                <div className="absolute left-3 right-3 top-full mt-1 glass rounded-xl
                                overflow-hidden shadow-lg z-20 animate-slide-up">
                  {searchRes.map((u) => (
                    <button key={u.id}
                      onClick={() => { openChat(u); setShowSearch(false); setSearchQ(''); setSearchRes([]); navigate(`/messages/${u.username}`); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left
                                 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                      <Avatar user={u} size="sm" />
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{u.username}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[160px]">{u.bio || 'No bio'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {loadingConv ? (
              <Spinner size="sm" />
            ) : convs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm text-slate-500">No conversations yet.</p>
                <p className="text-xs text-slate-400 mt-1">Click ✏️ to start chatting!</p>
              </div>
            ) : (
              convs.map((c) => (
                <ConvItem
                  key={c.id}
                  conv={c}
                  active={activeUser}
                  onClick={() => { openChat(c); navigate(`/messages/${c.username}`); }}
                />
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Chat Thread ── */}
        <div className={`
          flex flex-col flex-1 min-w-0
          ${!activeUser && isMobileChat ? 'hidden' : 'flex'}
        `}>
          {activeUser ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700/50
                              flex items-center gap-3 flex-shrink-0">
                {isMobileChat && (
                  <button onClick={() => setActiveUser(null)}
                    className="text-blue-500 text-sm font-semibold mr-1">← Back</button>
                )}
                <Link to={`/profile/${activeUser.username}`}
                  className="flex items-center gap-3 flex-1 no-underline group">
                  <Avatar user={activeUser} size="sm" />
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100
                                    group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {activeUser.username}
                    </div>
                    <div className="text-xs text-slate-400">Tap to view profile</div>
                  </div>
                </Link>
                <Link to={`/profile/${activeUser.username}`} className="no-underline">
                  <button className="btn-ghost text-xs px-3 py-1.5">👤 Profile</button>
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {loadingMsg ? (
                  <Spinner />
                ) : thread.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3">👋</div>
                    <p className="text-sm text-slate-500">No messages yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Say hi to {activeUser.username}!</p>
                  </div>
                ) : (
                  <>
                    {thread.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isMe={msg.sender_id === me?.id}
                        onDelete={deleteMsg}
                      />
                    ))}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2
                                  bg-slate-100 dark:bg-slate-800
                                  border border-slate-200 dark:border-slate-700
                                  rounded-2xl px-4 py-2
                                  focus-within:border-blue-400 dark:focus-within:border-blue-500
                                  focus-within:ring-2 focus-within:ring-blue-500/20
                                  transition-all duration-200">
                    <input
                      ref={inputRef}
                      className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200
                                 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                      placeholder={`Message ${activeUser.username}…`}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                      maxLength={1000}
                    />
                  </div>
                  <button
                    onClick={send}
                    disabled={sending || !text.trim()}
                    className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center
                               text-white shadow-glow transition-all duration-200
                               hover:shadow-glow-lg hover:scale-105 active:scale-95
                               disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {sending
                      ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : '➤'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Press Enter to send · Only mutual followers can message
                </p>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center
                              shadow-glow-lg mb-6 animate-bounce-soft">
                <span className="text-4xl">💬</span>
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
                Your Messages
              </h3>
              <p className="text-slate-500 text-sm max-w-xs">
                Select a conversation or click ✏️ to start a new one.
                You can message anyone you follow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
