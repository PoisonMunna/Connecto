import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedLayout, GuestOnly, AdminOnly } from './guards';

import AuthPage          from './pages/AuthPage';
import FeedPage          from './pages/FeedPage';
import ProfilePage       from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage      from './pages/MessagesPage';
import AdminPage         from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* ── Guest-only ── */}
            <Route path="/" element={<GuestOnly><AuthPage /></GuestOnly>} />

            {/* ── Protected (logged-in users) ── */}
            <Route element={<ProtectedLayout />}>
              <Route path="/feed"              element={<FeedPage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/notifications"     element={<NotificationsPage />} />
              <Route path="/messages"          element={<MessagesPage />} />
              <Route path="/messages/:userId"  element={<MessagesPage />} />

              {/* ── Admin-only ── */}
              <Route path="/admin" element={<AdminOnly><AdminPage /></AdminOnly>} />
            </Route>

            <Route path="*" element={<GuestOnly><AuthPage /></GuestOnly>} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
