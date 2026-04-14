import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getToken, getUser } from './api/api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// ── helpers — read localStorage directly (synchronous, always up-to-date)
const hasToken    = () => !!getToken();
const hasAdminKey = () => !!getUser()?.is_admin;

export function ProtectedLayout() {
  const { isLoggedIn } = useAuth();
  // Check React state OR localStorage — whichever is current
  if (!isLoggedIn && !hasToken()) return <Navigate to="/" replace />;
  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function GuestOnly({ children }) {
  const { isLoggedIn } = useAuth();
  // If either React state or localStorage has a token → already logged in
  if (isLoggedIn || hasToken()) return <Navigate to="/feed" replace />;
  return children;
}

export function AdminOnly({ children }) {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn && !hasToken()) return <Navigate to="/" replace />;
  // Check React state user OR localStorage user for admin flag
  const isAdmin = user?.is_admin || hasAdminKey();
  if (!isAdmin) return <Navigate to="/feed" replace />;
  return children;
}

