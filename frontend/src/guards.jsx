import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export function ProtectedLayout() {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
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
  if (isLoggedIn) return <Navigate to="/feed" replace />;
  return children;
}

export function AdminOnly({ children }) {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (!user?.is_admin) return <Navigate to="/feed" replace />;
  return children;
}
