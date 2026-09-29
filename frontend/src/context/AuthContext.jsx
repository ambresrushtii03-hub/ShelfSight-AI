import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('shelfsight_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('shelfsight_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi.getMe()
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('shelfsight_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('shelfsight_token');
        localStorage.removeItem('shelfsight_user');
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('shelfsight_token', token);
    localStorage.setItem('shelfsight_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // no-op
    }
    localStorage.removeItem('shelfsight_token');
    localStorage.removeItem('shelfsight_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, isLoading, login, logout, setUser }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
