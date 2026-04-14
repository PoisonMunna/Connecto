import { createContext, useContext, useState, useEffect } from 'react';
import { saveAuth, clearAuth, getToken, getUser } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => getUser());
  const [token, setToken] = useState(() => getToken());

  // Keep state in sync with localStorage on mount
  useEffect(() => {
    setUser(getUser());
    setToken(getToken());
  }, []);

  const login = (tkn, usr) => {
    saveAuth(tkn, usr);
    setToken(tkn);
    setUser(usr);
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
